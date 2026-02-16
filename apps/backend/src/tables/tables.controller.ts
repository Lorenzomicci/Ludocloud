/**
 * File: apps\backend\src\tables\tables.controller.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateTableDto } from './dto/create-table.dto';
import { TableAvailabilityQueryDto } from './dto/table-availability-query.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TablesService } from './tables.service';

/**
 * Controller REST per la risorsa "tavoli" (`/api/v1/tables`).
 * Fornisce due viste sullo stesso endpoint `GET /tables` in base al ruolo:
 * - MEMBER: disponibilita per uno slot (include campo `available`)
 * - STAFF/ADMIN: configurazione completa dei tavoli (code, zone, capienza, attivo).
 * Le operazioni di scrittura (create/update) sono riservate ad ADMIN tramite `@Roles`.
 * Usa `@CurrentUser()` per ottenere ruolo e applicare branching nel service.
 * Usa `TableAvailabilityQueryDto` per validare query `startAt/endAt` in formato ISO.
 * Delega tutta la logica a `TablesService` (thin controller).
 * I guard globali applicano autenticazione JWT e RBAC dove richiesto.
 * Le rotte sono versionate da `main.ts` e quindi accessibili sotto `/api/v1`.
 * Riferimenti: `tables.service.ts` (calcolo overlap) e `bookings.service.ts` (prenotazioni).
 */
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  /**
   * Lista tavoli o disponibilita slot (in base al ruolo).
   */
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: TableAvailabilityQueryDto,
  ) {
    return this.tablesService.list(user, query);
  }

  /**
   * Creazione tavolo (solo admin).
   */
  @Roles(UserRole.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTableDto) {
    return this.tablesService.create(user, dto);
  }

  /**
   * Aggiornamento tavolo (solo admin).
   */
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.update(user, id, dto);
  }
}
