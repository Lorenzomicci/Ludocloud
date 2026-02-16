/**
 * File: apps\backend\src\auth\dto\register.dto.ts
 */

import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * DTO usato dall'endpoint `POST /api/v1/auth/register`.
 * Definisce il payload di registrazione per un nuovo utente con ruolo `MEMBER`.
 * La validazione e automatica grazie al `ValidationPipe` globale (configurato in `src/main.ts`).
 * I decorator di `class-validator` descrivono i vincoli e bloccano input non conforme.
 * `email`: deve essere una email valida; nel service viene normalizzata a lowercase.
 * `password`: minimo 8 caratteri e policy base (lettera + numero + carattere speciale).
 * `fullName`: nome completo mostrato in UI e salvato nella tabella `users`.
 * `phone`: opzionale; utile per contatti e gestione iscritti.
 * Il DTO contribuisce a sicurezza e robustezza (whitelist + blocco campi inattesi).
 * Riferimenti: `auth.controller.ts` (binding @Body) e `auth.service.ts#register` (Prisma + token).
 */
export class RegisterDto {
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
}
