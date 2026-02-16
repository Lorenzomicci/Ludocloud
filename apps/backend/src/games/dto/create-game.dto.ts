/**
 * File: apps\backend\src\games\dto\create-game.dto.ts
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
 * DTO per la creazione di un gioco (endpoint `POST /api/v1/games`).
 * Usato da staff/admin per inserire un nuovo record `BoardGame` nel catalogo.
 * La validazione e gestita dal `ValidationPipe` globale (whitelist + transform).
 * `title`: nome del gioco (univoco su DB) usato per ricerca e visualizzazione.
 * `category`: categoria testuale per filtri (es. Strategia, Party, Cooperativo).
 * `minPlayers`/`maxPlayers`: range giocatori (vincoli 1..20) per informazione e UX.
 * `minAge` e `durationMin`: metadati utili per scelta e pianificazione sessioni.
 * `stockTotal`/`stockAvailable`: inventario; il service verifica coerenza (available <= total).
 * `isActive` opzionale: permette di disattivare giochi senza cancellarli (soft visibility).
 * Riferimenti: `games.controller.ts` (binding) e `games.service.ts#create` (regole stock + audit).
 */
export class CreateGameDto {
  @IsString()
  title!: string;

  @IsString()
  category!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  minPlayers!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  maxPlayers!: number;

  @IsInt()
  @Min(3)
  @Max(120)
  minAge!: number;

  @IsInt()
  @Min(5)
  @Max(600)
  durationMin!: number;

  @IsInt()
  @Min(0)
  stockTotal!: number;

  @IsInt()
  @Min(0)
  stockAvailable!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
