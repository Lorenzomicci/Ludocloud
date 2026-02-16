/**
 * File: apps\backend\src\games\games.controller.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GamesService } from './games.service';

/**
 * Controller REST per la risorsa "giochi da tavolo" (`/api/v1/games`).
 * Espone un endpoint di listing accessibile agli utenti autenticati (membro/staff/admin).
 * Supporta filtri via query string (`search`, `category`) per ricerca nel catalogo.
 * Le operazioni di scrittura (create/update) sono protette con RBAC tramite `@Roles`.
 * Usa `@CurrentUser()` per passare al service il contesto utente (ruolo) senza rileggere dal DB.
 * Delega tutta la logica a `GamesService` (thin controller).
 * La visibilita dei record (solo attivi per MEMBER) e implementata nel service.
 * Le validazioni input sono affidate ai DTO e al `ValidationPipe` globale.
 * I guard globali (throttling + JWT + roles) sono configurati in `AppModule`.
 * Riferimenti: `games.service.ts`, `common/decorators/roles.decorator.ts`, `main.ts` (prefix).
 */
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  /**
   * Lista giochi filtrabile.
   */
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.gamesService.list(user, { search, category });
  }

  /**
   * Creazione gioco (solo staff/admin).
   */
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGameDto) {
    return this.gamesService.create(user, dto);
  }

  /**
   * Aggiornamento gioco (solo staff/admin).
   */
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.update(user, id, dto);
  }
}
