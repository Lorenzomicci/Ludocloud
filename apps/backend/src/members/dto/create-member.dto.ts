/**
 * File: apps\backend\src\members\dto\create-member.dto.ts
 *   
 */

import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * DTO per creare un nuovo iscritto da pannello staff/admin (endpoint `POST /api/v1/members`).
 * Simile a `RegisterDto` ma pensato per creazione "backoffice" di un account MEMBER.
 * La validazione e automatica tramite `ValidationPipe` globale.
 * `email`: deve essere valida; nel service viene normalizzata in lowercase e deve essere univoca.
 * `password`: minimo 8 caratteri e policy base (lettera + numero + carattere speciale).
 * `fullName`: nome completo dell'iscritto (mostrato in UI e nelle prenotazioni).
 * `phone` opzionale: contatto rapido in caso di necessita.
 * `notes` opzionale: note interne per staff (non necessariamente esposte al membro).
 * Il service crea sia `User` sia `Member` con `membershipCode` generato.
 * Riferimenti: `members.service.ts#create` e `auth.service.ts#register` (self-service).
 */
export class CreateMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La password deve contenere almeno una lettera, un numero e un carattere speciale',
  })
  password!: string;

  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
