/**
 * File: apps\backend\src\tables\dto\table-availability-query.dto.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { IsISO8601, IsOptional } from 'class-validator';

/**
 * DTO per i query param dell'endpoint `GET /api/v1/tables`.
 * Usato principalmente dai membri per richiedere disponibilita in uno slot specifico.
 * `startAt` e `endAt` sono opzionali e devono essere in formato ISO8601.
 * Se non forniti, l'API ritorna i tavoli attivi senza calcolo overlap (tutti available=true).
 * Se forniti, il service calcola overlap con prenotazioni PENDING/CONFIRMED.
 * La validazione evita input non parseabile e riduce errori lato server.
 * Non include `tableId`: la richiesta riguarda l'intera lista tavoli.
 * Il parsing delle date avviene nel service con gestione esplicita degli errori.
 * Si integra con la UX frontend nella pagina "Prenota Tavolo" (reload disponibilita).
 * Riferimenti: `tables.service.ts#memberAvailability` e `member-booking-page.component.ts`.
 */
export class TableAvailabilityQueryDto {
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @IsOptional()
  @IsISO8601()
  endAt?: string;
}
