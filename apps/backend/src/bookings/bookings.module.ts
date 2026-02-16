/**
 * File: apps\backend\src\bookings\bookings.module.ts
 */

import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

/**
 * Modulo NestJS dedicato alle prenotazioni.
 * Registra `BookingsController` e `BookingsService`.
 * Dipende da `PrismaService` (modulo globale) per operazioni su booking, tavoli, membri e giochi.
 * Contiene la logica piu critica del progetto: applicazione business rule e gestione concorrenza.
 * Espone endpoint usati da MEMBER (creazione e storico) e da STAFF/ADMIN (listing globale e cancellazione).
 * Le policy per ruolo sono gestite da guard globali e da branch nel service (`resolveMemberId`).
 * Integra audit trail per tracciare eventi di creazione/cancellazione.
 * Lavora insieme ai moduli `tables` e `games` (risorse collegate a una prenotazione).
 * Rotte versionate con prefisso `/api/v1` impostato in `main.ts`.
 * Riferimenti: `bookings.service.ts`, `tables.service.ts`, `games.service.ts`, `docs/GUIDA_ORALE_FUNZIONI.md`.
 */
@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
