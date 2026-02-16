/**
 * File: apps\backend\src\tables\tables.service.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TableAvailabilityQueryDto } from './dto/table-availability-query.dto';

/**
 * Service di dominio per la gestione dei tavoli della ludoteca (`TableEntity` su DB).
 * Implementa listing differenziato per ruolo: MEMBER vede disponibilita, STAFF/ADMIN vede configurazione.
 * La disponibilita e calcolata in base a uno slot (startAt/endAt) confrontando booking sovrapposti.
 * Un tavolo e occupato se esiste una prenotazione PENDING/CONFIRMED con intervallo che va in overlap.
 * Usa `PrismaService` per leggere tavoli e prenotazioni e per creare/aggiornare tavoli.
 * Consente soft-disable via `isActive` per nascondere tavoli ai membri senza perdere storico.
 * Registra audit di creazione/aggiornamento (`TABLE_CREATE`, `TABLE_UPDATE`) tramite `AuditService`.
 * Valida input (date ISO) e segnala errori con eccezioni HTTP (`BadRequest`, `NotFound`).
 * Non applica direttamente RBAC: e il controller che usa `@Roles` e i guard globali.
 * Riferimenti: `bookings.service.ts` (regole prenotazione tavolo) e `tables.controller.ts`.
 */
@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lista tavoli:
   * - MEMBER: restituisce disponibilita (boolean available)
   * - STAFF/ADMIN: restituisce configurazione completa tavoli.
   */
  async list(user: AuthUser, query: TableAvailabilityQueryDto) {
    if (user.role === UserRole.MEMBER) {
      return this.memberAvailability(query);
    }

    return this.prisma.tableEntity.findMany({
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Crea nuovo tavolo (operazione admin).
   */
  async create(user: AuthUser, dto: CreateTableDto) {
    const table = await this.prisma.tableEntity.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.record(
      user.userId,
      'TABLE_CREATE',
      'TABLE',
      table.id,
      dto as unknown as Prisma.InputJsonValue,
    );

    return table;
  }

  /**
   * Aggiorna un tavolo esistente.
   */
  async update(user: AuthUser, id: string, dto: UpdateTableDto) {
    const existing = await this.prisma.tableEntity.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Tavolo non trovato');
    }

    const table = await this.prisma.tableEntity.update({
      where: { id },
      data: dto,
    });

    await this.auditService.record(
      user.userId,
      'TABLE_UPDATE',
      'TABLE',
      table.id,
      dto as unknown as Prisma.InputJsonValue,
    );

    return table;
  }

  /**
   * Calcola disponibilita tavoli per uno slot.
   * Un tavolo e disponibile se non esistono booking sovrapposti confermati/pending.
   */
  private async memberAvailability(query: TableAvailabilityQueryDto) {
    const tables = await this.prisma.tableEntity.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    if (!query.startAt || !query.endAt) {
      return tables.map((table) => ({
        ...table,
        available: true,
      }));
    }

    const startAt = new Date(query.startAt);
    const endAt = new Date(query.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Intervallo orario non valido');
    }

    const overlaps = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: {
        tableId: true,
      },
    });

    const busyTableIds = new Set(overlaps.map((booking) => booking.tableId));
    return tables.map((table) => ({
      ...table,
      available: !busyTableIds.has(table.id),
    }));
  }
}
