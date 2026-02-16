/**
 * File: apps\backend\src\bookings\dto\booking-game-selection.dto.ts
 *   
 */

import { IsInt, IsUUID, Min } from 'class-validator';

/**
 * DTO che rappresenta la selezione di un singolo gioco dentro una prenotazione.
 * Usato come elemento dell'array `gameSelections` in `CreateBookingDto`.
 * `gameId`: UUID del gioco (`BoardGame.id`) da associare alla prenotazione.
 * `quantity`: numero di copie richieste (>=1).
 * Viene validato come oggetto nested grazie a `ValidateNested` e `class-transformer` nel DTO padre.
 * Il service aggrega le selezioni per evitare duplicati dello stesso gioco nel payload.
 * La quantita richiesta viene confrontata con `stockAvailable`
 * In caso di successo, il service crea righe `booking_games` e decrementa stock in transazione.
 * Questo DTO rende esplicito il contratto API tra UI "Prenota Tavolo" e backend.
 * Riferimenti: `create-booking.dto.ts`, `bookings.service.ts#create`, `prisma/schema.prisma` (BookingGame/BoardGame).
 */
export class BookingGameSelectionDto {
  @IsUUID()
  gameId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
