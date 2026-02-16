/**
 * File: apps\backend\src\users\users.module.ts
 *   
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';

/**
 * Modulo che raggruppa endpoint relativi al profilo utente corrente.
 * Registra `UsersController`, che espone `GET /me` come alias di `auth/me`.
 * Importa `AuthModule` per poter iniettare `AuthService` nel controller.
 * Non ha un proprio service: la logica rimane centralizzata nel modulo Auth.
 * Serve come esempio di composizione modulare: un modulo puo riusare provider esportati da un altro.
 * Utile per separare concerns "profilo" vs "autenticazione" mantenendo API pulita.
 * In un'app piu grande potrebbe includere preferenze utente, cambio password, gestione notifiche, ecc.
 * E' soggetto ai guard globali definiti in `AppModule` (throttling/auth/ruoli).
 * Rende evidente la struttura NestJS: module -> controller -> providers importati.
 * Riferimenti: `auth.module.ts` (exports `AuthService`) e `users.controller.ts`.
 */
@Module({
  imports: [AuthModule],
  controllers: [UsersController],
})
export class UsersModule {}
