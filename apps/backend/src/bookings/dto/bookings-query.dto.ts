/**
 * File: apps\backend\src\bookings\dto\bookings-query.dto.ts
 *   
 */

import { BookingStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO per i filtri query dell'endpoint `GET /api/v1/bookings`.
 * Permette filtrare per `status` (enum BookingStatus) e per intervallo temporale `from`/`to` (ISO8601).
 * Permette filtrare per `memberId` e `tableId` (UUID) quando usato da staff/admin.
 * Per i MEMBER, il service ignora `memberId` in input e forza lo scope sul profilo autenticato.
 * La validazione impedisce valori non compatibili (status non previsto o date non ISO).
 * I campi sono opzionali per consentire listing completo senza filtri.
 * Il service converte le stringhe in Date e costruisce un `BookingWhereInput` Prisma.
 * Utile per la UI admin che fa ricerca rapida e report (filtra per periodo).
 * Mantiene il contratto API pulito e documentabile.
 * Riferimenti: `bookings.controller.ts` (binding @Query) e `bookings.service.ts#list`.
 */
export class BookingsQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsUUID()
  tableId?: string;
}
