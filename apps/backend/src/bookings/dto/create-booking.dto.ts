/**
 * File: apps\backend\src\bookings\dto\create-booking.dto.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import {
  IsArray,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingGameSelectionDto } from './booking-game-selection.dto';

/**
 * DTO per creare una prenotazione (endpoint `POST /api/v1/bookings`).
 * Usato dai membri per prenotare un tavolo e, opzionalmente, associare giochi.
 * `memberId` e opzionale: i MEMBER non lo inviano (viene risolto dal token), STAFF/ADMIN possono specificarlo.
 * `tableId`: UUID del tavolo scelto.
 * `startAt`/`endAt`: timestamp ISO8601; la durata effettiva viene validata dal service (slot fisso).
 * `peopleCount`: numero partecipanti (vincolo 1..20) confrontato con la capienza del tavolo.
 * `notes` opzionale: richieste particolari o note operative.
 * `gameSelections` opzionale: lista di giochi e quantita, validata nested e usata per gestione stock.
 * La validazione e automatica tramite `ValidationPipe` globale (whitelist/transform).
 * Riferimenti: `bookings.service.ts#create` (business rule + transazione) e `booking-game-selection.dto.ts`.
 */
export class CreateBookingDto {
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsUUID()
  tableId!: string;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  peopleCount!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingGameSelectionDto)
  gameSelections?: BookingGameSelectionDto[];
}
