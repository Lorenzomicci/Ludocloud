/**
 * File: apps\backend\src\members\members.controller.ts
 */

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { MembersService } from './members.service';

/**
 * Controller REST per la gestione degli iscritti (`/api/v1/members`).
 * Tutto il controller e protetto da `@Roles(STAFF, ADMIN)` (area gestionale).
 * Espone listing completo degli iscritti con dati utente aggregati (email, nome, stato, conteggi).
 * Permette creazione di un nuovo membro da pannello staff/admin (crea anche l'account `User`).
 * Permette aggiornare lo stato logico dell'account (ACTIVE/SUSPENDED) per abilitare/disabilitare accesso.
 * Usa `@CurrentUser()` per conoscere l'attore (staff/admin) e registrare audit delle operazioni.
 * Valida input tramite DTO (`CreateMemberDto`, `UpdateMemberStatusDto`) e `ValidationPipe` globale.
 * Delega tutta la logica di persistenza e regole a `MembersService` (thin controller).
 * I guard globali applicano autenticazione JWT e rate limiting; l'RBAC e gestito da `RolesGuard`.
 * Riferimenti: `members.service.ts`, `auth.service.ts` (login blocca utenti sospesi), `prisma/schema.prisma`.
 */
@Roles(UserRole.STAFF, UserRole.ADMIN)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  /**
   * Lista iscritti con informazioni utente aggregate.
   */
  @Get()
  list() {
    return this.membersService.list();
  }

  /**
   * Crea iscritto da pannello staff/admin.
   */
  @Post()
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateMemberDto) {
    return this.membersService.create(actor, dto);
  }

  /**
   * Cambia stato logico iscritto.
   */
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    return this.membersService.updateStatus(actor, id, dto);
  }
}
