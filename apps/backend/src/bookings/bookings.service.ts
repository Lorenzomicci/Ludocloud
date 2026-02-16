/**
 * File: apps\backend\src\bookings\bookings.service.ts
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsQueryDto } from './dto/bookings-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { isValidSlotDuration, isWithinOpeningHours } from './booking-rules';

/**
 * Service di dominio che implementa la logica core delle prenotazioni (Booking).
 * Fornisce `list()` con filtri e include relazioni (table, member.user, giochi associati) per la UI.
 * Applica scope per ruolo: MEMBER vede solo prenotazioni del proprio profilo; STAFF/ADMIN puo vedere tutto.
 * Implementa `create()` con tutte le business rule: slot fisso, orari apertura, data futura, capienza tavolo.
 * Applica limite massimo di prenotazioni future attive per membro (configurabile via env).
 * Gestisce selezione giochi: aggrega quantita, verifica stock disponibile e decrementa in transazione.
 * Evita conflitti tavolo: controlla sovrapposizione e usa transazione `Serializable` per garantire consistenza.
 * Implementa `cancel()` con regola "fino a N ore prima" e ripristina stock giochi associati.
 * Registra eventi in audit (BOOKING_CREATE/BOOKING_CANCEL) per tracciabilita operativa.
 * Usa `PrismaService` per le query e `AuditService` per logging; errori via eccezioni HTTP.
 * Parametri come durata slot e fascia oraria sono letti da variabili ambiente (12-factor).
 * Riferimenti: `booking-rules.ts`, `prisma/schema.prisma` (Booking/BookingGame) e `infra/k8s/configmap.yaml`.
 */
@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lista prenotazioni:
   * - membro: solo proprie
   * - staff/admin: dataset completo filtrabile.
   */
  async list(user: AuthUser, query: BookingsQueryDto) {
    const where: Prisma.BookingWhereInput = {
      status: query.status,
      tableId: query.tableId,
      memberId: query.memberId,
      startAt:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
    };

    if (user.role === UserRole.MEMBER) {
      where.member = { userId: user.userId };
      where.memberId = undefined;
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        table: true,
        member: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        bookingGames: {
          include: {
            boardGame: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return bookings.map((booking) => this.toBookingResponse(booking));
  }

  /**
   * Crea una prenotazione con tutte le business rule:
   * durata slot, orario apertura, capienza, limite prenotazioni future,
   * disponibilita tavolo e giochi.
   */
  async create(user: AuthUser, dto: CreateBookingDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Date non valide');
    }

    const slotMinutes = this.bookingSlotMinutes;
    if (!isValidSlotDuration(startAt, endAt, slotMinutes)) {
      throw new BadRequestException(
        `La prenotazione deve durare ${slotMinutes} minuti`,
      );
    }

    if (
      !isWithinOpeningHours(
        startAt,
        endAt,
        this.bookingOpenHour,
        this.bookingCloseHour,
      )
    ) {
      throw new BadRequestException(
        `Le prenotazioni sono consentite tra le ${this.bookingOpenHour}:00 e le ${this.bookingCloseHour}:00`,
      );
    }

    if (startAt <= new Date()) {
      throw new BadRequestException('La prenotazione deve essere nel futuro');
    }

    const memberId = await this.resolveMemberId(user, dto.memberId);

    const table = await this.prisma.tableEntity.findUnique({
      where: { id: dto.tableId },
    });
    if (!table || !table.isActive) {
      throw new NotFoundException('Tavolo non disponibile');
    }

    if (dto.peopleCount > table.capacity) {
      throw new BadRequestException(
        'Numero persone superiore alla capienza del tavolo',
      );
    }

    const activeFutureBookings = await this.prisma.booking.count({
      where: {
        memberId,
        startAt: { gt: new Date() },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    if (activeFutureBookings >= this.maxFutureActiveBookings) {
      throw new BadRequestException(
        `Ogni iscritto puo avere massimo ${this.maxFutureActiveBookings} prenotazioni future attive`,
      );
    }

    const selections = dto.gameSelections ?? [];
    const aggregateSelection = new Map<string, number>();
    for (const selection of selections) {
      aggregateSelection.set(
        selection.gameId,
        (aggregateSelection.get(selection.gameId) ?? 0) + selection.quantity,
      );
    }

    if (aggregateSelection.size > 0) {
      const games = await this.prisma.boardGame.findMany({
        where: { id: { in: [...aggregateSelection.keys()] }, isActive: true },
      });
      if (games.length !== aggregateSelection.size) {
        throw new BadRequestException(
          'Uno o piu giochi selezionati non sono disponibili',
        );
      }

      for (const game of games) {
        const requestedQty = aggregateSelection.get(game.id) ?? 0;
        if (requestedQty > game.stockAvailable) {
          throw new BadRequestException(
            `Disponibilita insufficiente per il gioco ${game.title}`,
          );
        }
      }
    }

    const booking = await this.prisma.$transaction(
      async (tx) => {
        const overlapCount = await tx.booking.count({
          where: {
            tableId: dto.tableId,
            status: { not: BookingStatus.CANCELLED },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        });

        if (overlapCount > 0) {
          throw new ConflictException(
            'Tavolo gia prenotato nello slot richiesto',
          );
        }

        const created = await tx.booking.create({
          data: {
            memberId,
            tableId: dto.tableId,
            startAt,
            endAt,
            peopleCount: dto.peopleCount,
            notes: dto.notes,
            status: BookingStatus.CONFIRMED,
            createdBy: user.userId,
          },
        });

        for (const [gameId, quantity] of aggregateSelection) {
          const updated = await tx.boardGame.updateMany({
            where: {
              id: gameId,
              stockAvailable: { gte: quantity },
            },
            data: {
              stockAvailable: { decrement: quantity },
            },
          });

          if (updated.count === 0) {
            throw new ConflictException(
              'Disponibilita giochi variata, riprovare',
            );
          }

          await tx.bookingGame.create({
            data: {
              bookingId: created.id,
              boardGameId: gameId,
              quantity,
            },
          });
        }

        return tx.booking.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            table: true,
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            bookingGames: {
              include: {
                boardGame: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await this.auditService.record(
      user.userId,
      'BOOKING_CREATE',
      'BOOKING',
      booking.id,
      {
        tableId: dto.tableId,
        memberId,
        peopleCount: dto.peopleCount,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      },
    );

    return this.toBookingResponse(booking);
  }

  /**
   * Cancella una prenotazione rispettando policy temporale e ownership.
   * Ripristina anche lo stock giochi associati.
   */
  async cancel(user: AuthUser, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: true,
        bookingGames: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Prenotazione non trovata');
    }

    if (user.role === UserRole.MEMBER) {
      const member = await this.prisma.member.findFirst({
        where: { id: booking.memberId, userId: user.userId },
        select: { id: true },
      });
      if (!member) {
        throw new ForbiddenException(
          'Non puoi cancellare prenotazioni di altri utenti',
        );
      }
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Prenotazione gia cancellata');
    }

    const cancellationDeadline = new Date(
      booking.startAt.getTime() - this.cancellationHours * 60 * 60 * 1000,
    );
    if (new Date() > cancellationDeadline) {
      throw new BadRequestException(
        `La cancellazione e consentita fino a ${this.cancellationHours} ore prima`,
      );
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
      });

      for (const bookedGame of booking.bookingGames) {
        await tx.boardGame.update({
          where: { id: bookedGame.boardGameId },
          data: {
            stockAvailable: {
              increment: bookedGame.quantity,
            },
          },
        });
      }

      return updated;
    });

    await this.auditService.record(
      user.userId,
      'BOOKING_CANCEL',
      'BOOKING',
      booking.id,
    );

    return {
      id: cancelled.id,
      status: cancelled.status,
      message: 'Prenotazione cancellata',
    };
  }

  /**
   * Risolve memberId a partire da ruolo e richiesta:
   * - MEMBER: deve coincidere con il proprio profilo
   * - STAFF/ADMIN: memberId obbligatorio.
   */
  private async resolveMemberId(user: AuthUser, requestedMemberId?: string) {
    if (user.role === UserRole.MEMBER) {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.userId },
        select: { id: true },
      });

      if (!member) {
        throw new ForbiddenException('Profilo iscritto non configurato');
      }

      if (requestedMemberId && requestedMemberId !== member.id) {
        throw new ForbiddenException(
          'memberId non coerente con utente autenticato',
        );
      }

      return member.id;
    }

    if (!requestedMemberId) {
      throw new BadRequestException('memberId obbligatorio per staff/admin');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: requestedMemberId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException('Iscritto non trovato');
    }

    return member.id;
  }

  /**
   * Converte il payload Prisma in shape API stabile per la UI.
   */
  private toBookingResponse(
    booking: Prisma.BookingGetPayload<{
      include: {
        table: true;
        member: {
          include: {
            user: { select: { id: true; fullName: true; email: true } };
          };
        };
        bookingGames: { include: { boardGame: true } };
      };
    }>,
  ) {
    return {
      id: booking.id,
      status: booking.status,
      startAt: booking.startAt,
      endAt: booking.endAt,
      peopleCount: booking.peopleCount,
      notes: booking.notes,
      createdAt: booking.createdAt,
      table: {
        id: booking.table.id,
        code: booking.table.code,
        zone: booking.table.zone,
      },
      member: {
        id: booking.member.id,
        fullName: booking.member.user.fullName,
        email: booking.member.user.email,
        membershipCode: booking.member.membershipCode,
      },
      games: booking.bookingGames.map((item) => ({
        gameId: item.boardGameId,
        title: item.boardGame.title,
        quantity: item.quantity,
      })),
    };
  }

  /**
   * Parametro di configurazione: durata slot in minuti.
   */
  private get bookingSlotMinutes(): number {
    return Number(process.env.BOOKING_SLOT_MINUTES ?? 90);
  }

  /**
   * Parametro di configurazione: ora apertura.
   */
  private get bookingOpenHour(): number {
    return Number(process.env.BOOKING_OPEN_HOUR ?? 15);
  }

  /**
   * Parametro di configurazione: ora chiusura.
   */
  private get bookingCloseHour(): number {
    return Number(process.env.BOOKING_CLOSE_HOUR ?? 23);
  }

  /**
   * Parametro di configurazione: max prenotazioni future attive per membro.
   */
  private get maxFutureActiveBookings(): number {
    return Number(process.env.BOOKING_MAX_FUTURE_ACTIVE ?? 3);
  }

  /**
   * Parametro di configurazione: ore minime prima dello slot per consentire cancellazione.
   */
  private get cancellationHours(): number {
    return Number(process.env.BOOKING_CANCELLATION_HOURS ?? 2);
  }
}
