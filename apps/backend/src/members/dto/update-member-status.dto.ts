/**
 * File: apps\backend\src\members\dto\update-member-status.dto.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { UserStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

/**
 * DTO per aggiornare lo stato logico di un membro (endpoint `PATCH /api/v1/members/:id/status`).
 * Contiene un singolo campo `status` tipizzato su enum `UserStatus` (ACTIVE/SUSPENDED).
 * Usato da staff/admin per sospendere o riattivare un account.
 * La validazione `@IsEnum` impedisce valori arbitrari e mantiene contratto stabile.
 * L'aggiornamento avviene sul record `User` collegato al `Member`.
 * Effetto principale: utenti SUSPENDED non possono effettuare login (`AuthService.login`).
 * Permette gestione operativa (es. iscrizione scaduta, comportamento scorretto, ecc.).
 * Le azioni sono tracciate tramite audit nel service.
 * Accesso protetto da `@Roles(STAFF, ADMIN)` nel controller.
 * Riferimenti: `members.service.ts#updateStatus` e `auth.service.ts#login`.
 */
export class UpdateMemberStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
