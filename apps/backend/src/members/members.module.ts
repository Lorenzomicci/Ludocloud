/**
 * File: apps\backend\src\members\members.module.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

/**
 * Modulo NestJS dedicato alla gestione iscritti (area staff/admin).
 * Registra `MembersController` e `MembersService`.
 * Dipende da `PrismaService` (modulo globale) per operazioni su `users` e `members`.
 * Espone endpoint gestionali: listing, creazione membro e cambio stato account.
 * Il controllo accessi e dichiarativo tramite `@Roles` e guard globali (JWT + RolesGuard).
 * Le password sono gestite in modo sicuro nel service (hash Argon2), non in controller.
 * Integra audit trail per le azioni gestionali (chi ha creato/sospeso un membro e quando).
 * E separato dal modulo `auth` per distinguere self-service (register) da gestione backoffice.
 * Rotte versionate con prefisso `/api/v1` impostato in `main.ts`.
 * Riferimenti: `members.controller.ts`, `members.service.ts`, `app.module.ts`.
 */
@Module({
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
