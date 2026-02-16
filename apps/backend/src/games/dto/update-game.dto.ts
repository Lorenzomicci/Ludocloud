/**
 * File: apps\backend\src\games\dto\update-game.dto.ts
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
 * DTO per aggiornare un gioco esistente (endpoint `PATCH /api/v1/games/:id`).
 * Tutti i campi sono opzionali per supportare update parziale.
 * La validazione avviene automaticamente tramite `ValidationPipe` globale.
 * Permette modifica di titolo/categoria e metadati (player range, eta, durata).
 * Permette gestione inventario: aggiornamento di `stockTotal` e/o `stockAvailable`.
 * Il service combina input e stato attuale per validare coerenza (available <= total).
 * `isActive` consente di nascondere giochi ai membri mantenendo storico e audit.
 * Usato solo da staff/admin: accesso controllato da `@Roles` nel controller.
 * In caso di id inesistente, il service risponde con `404 NotFound`.
 * Riferimenti: `games.service.ts#update` e `prisma/schema.prisma` (model BoardGame).
 */
export class UpdateGameDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(120)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  durationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockAvailable?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
