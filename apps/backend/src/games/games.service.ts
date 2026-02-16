/**
 * File: apps\backend\src\games\games.service.ts
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

/**
 * Service di dominio per la gestione del catalogo giochi (`BoardGame` su PostgreSQL).
 * Implementa listing con filtri (titolo contiene, categoria) e sorting alfabetico.
 * Applica regole di visibilita: i MEMBER vedono solo giochi `isActive=true`.
 * Espone operazioni staff/admin per creare e aggiornare giochi.
 * Valida coerenza stock: `stockAvailable` non puo superare `stockTotal`.
 * Usa `PrismaService` per tutte le query (no SQL manuale, query parametrizzate via ORM).
 * Registra audit di creazione/aggiornamento tramite `AuditService`.
 * Lancia eccezioni HTTP (`BadRequest`, `NotFound`) per error handling coerente.
 * Non gestisce autorizzazione direttamente: e responsabilita di controller + `RolesGuard`.
 * Riferimenti: `prisma/schema.prisma` (model BoardGame) e `games.controller.ts`.
 */
@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Elenco giochi con filtri testuali/categoria.
   * I membri vedono solo giochi attivi.
   */
  async list(user: AuthUser, query: { search?: string; category?: string }) {
    const onlyActive = user.role === UserRole.MEMBER;

    return this.prisma.boardGame.findMany({
      where: {
        isActive: onlyActive ? true : undefined,
        category: query.category || undefined,
        title: query.search
          ? { contains: query.search, mode: 'insensitive' }
          : undefined,
      },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Crea gioco con controllo coerenza stock.
   */
  async create(user: AuthUser, dto: CreateGameDto) {
    if (dto.stockAvailable > dto.stockTotal) {
      throw new BadRequestException(
        'stockAvailable non puo superare stockTotal',
      );
    }

    const game = await this.prisma.boardGame.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.record(
      user.userId,
      'GAME_CREATE',
      'BOARD_GAME',
      game.id,
      {
        title: game.title,
      },
    );

    return game;
  }

  /**
   * Aggiorna gioco esistente con controllo coerenza stock.
   */
  async update(user: AuthUser, id: string, dto: UpdateGameDto) {
    const existing = await this.prisma.boardGame.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Gioco non trovato');
    }

    const stockTotal = dto.stockTotal ?? existing.stockTotal;
    const stockAvailable = dto.stockAvailable ?? existing.stockAvailable;
    if (stockAvailable > stockTotal) {
      throw new BadRequestException(
        'stockAvailable non puo superare stockTotal',
      );
    }

    const game = await this.prisma.boardGame.update({
      where: { id },
      data: dto,
    });

    await this.auditService.record(
      user.userId,
      'GAME_UPDATE',
      'BOARD_GAME',
      game.id,
      dto as unknown as Prisma.InputJsonValue,
    );

    return game;
  }
}
