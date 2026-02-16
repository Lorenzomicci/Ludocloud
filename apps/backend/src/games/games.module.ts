/**
 * File: apps\backend\src\games\games.module.ts
 */

import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

/**
 * Modulo NestJS dedicato alla risorsa giochi.
 * Registra `GamesController` (API REST) e `GamesService` (business logic).
 * Non esporta provider: viene importato dal root `AppModule`.
 * Dipende implicitamente da `PrismaService` (via `PrismaModule` globale) per accesso DB.
 * I permessi sono gestiti con guard globali + decorator `@Roles` sui metodi controller.
 * Fornisce endpoint usati sia dall'area MEMBER (catalogo) sia dall'area STAFF/ADMIN (gestione).
 * Mantiene la logica di catalogo separata da prenotazioni (che vivono nel modulo `bookings`).
 * Le rotte sono versionate da `main.ts` e quindi diventano `/api/v1/games`.
 * L'audit delle operazioni e delegato a `AuditService` nel service di dominio.
 * Riferimenti: `games.controller.ts`, `games.service.ts`, `app.module.ts`.
 */
@Module({
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
