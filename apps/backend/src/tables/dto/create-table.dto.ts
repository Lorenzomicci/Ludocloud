/**
 * File: apps\backend\src\tables\dto\create-table.dto.ts
 *   
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
 * DTO per la creazione di un tavolo (endpoint `POST /api/v1/tables`).
 * Usato solo da ADMIN per configurare i tavoli della ludoteca.
 * La validazione e eseguita dal `ValidationPipe` globale.
 * `code`: identificativo breve del tavolo (univoco) mostrato in UI e nei booking.
 * `zone`: area/sala del tavolo, utile per organizzazione e filtro.
 * `capacity`: numero massimo di persone consentite (vincolo 1..20).
 * `isActive` opzionale: se false il tavolo non e prenotabile dai membri.
 * Il service imposta di default `isActive=true` se non specificato.
 * Le operazioni vengono tracciate tramite audit (`TABLE_CREATE`).
 * Riferimenti: `tables.controller.ts` (binding) e `tables.service.ts#create`.
 */
export class CreateTableDto {
  @IsString()
  code!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  capacity!: number;

  @IsString()
  zone!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
