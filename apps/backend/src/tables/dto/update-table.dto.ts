/**
 * File: apps\backend\src\tables\dto\update-table.dto.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO per aggiornare un tavolo esistente (endpoint `PATCH /api/v1/tables/:id`).
 * Supporta update parziale: tutti i campi sono opzionali.
 * La validazione avviene tramite `ValidationPipe` globale.
 * Permette di cambiare `code`, `zone` e `capacity` in base a esigenze organizzative.
 * Permette attivazione/disattivazione logica con `isActive` (soft disable).
 * Usato solo da ADMIN: autorizzazione tramite `@Roles(UserRole.ADMIN)` nel controller.
 * In caso di tavolo non trovato, il service risponde con `404 NotFound`.
 * Le modifiche vengono tracciate in audit (`TABLE_UPDATE`).
 * La capacita influisce sulle regole di prenotazione in `BookingsService`.
 * Riferimenti: `tables.service.ts#update` e `bookings.service.ts#create`.
 */
export class UpdateTableDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  capacity?: number;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
