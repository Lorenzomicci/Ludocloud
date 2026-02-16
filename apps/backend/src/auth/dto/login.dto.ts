/**
 * File: apps\backend\src\auth\dto\login.dto.ts
 */

import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO usato dall'endpoint `POST /api/v1/auth/login`.
 * Modella le credenziali in ingresso per autenticare un utente gia registrato.
 * La validazione avviene a livello di framework tramite `ValidationPipe` globale.
 * `email`: deve rispettare formato email; nel service viene normalizzata a lowercase.
 * `password`: minimo 8 caratteri (coerente con la policy di registrazione).
 * Se le credenziali sono valide, il backend genera un access token JWT e un refresh token.
 * Il refresh token viene salvato in cookie HttpOnly (non accessibile da JavaScript) per ridurre rischio XSS.
 * In caso di credenziali errate o utente sospeso, il service solleva eccezioni HTTP (401/403).
 * Questo DTO rende esplicito il contratto API tra frontend e backend.
 * Riferimenti: `auth.controller.ts` (binding @Body) e `auth.service.ts#login` (verifica + emissione token).
 */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
