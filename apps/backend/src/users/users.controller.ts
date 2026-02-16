/**
 * File: apps\backend\src\users\users.controller.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AuthService } from '../auth/auth.service';

/**
 * Controller che espone un alias compatto per recuperare il profilo dell'utente corrente.
 * Route: `GET /api/v1/me` (prefisso globale `api/v1` + controller `me`).
 * E' protetto dai guard globali: richiede access token JWT valido e, se presenti, vincoli RBAC.
 * Usa il decorator `@CurrentUser()` per ottenere `request.user` popolato dalla `JwtStrategy`.
 * Delega a `AuthService.getMe()` per comporre la risposta (utente + info member + permessi).
 * Utile lato frontend per bootstrap sessione e rendering UI basata su ruolo.
 * Evita di duplicare logica: reusa l'implementazione dell'endpoint `GET /api/v1/auth/me`.
 * Dimostra come in NestJS si possa creare un endpoint "facade" sopra un service esistente.
 * Mantiene un controller estremamente sottile: nessuna query diretta a DB.
 * Riferimenti: `auth.service.ts#getMe` e `common/decorators/current-user.decorator.ts`.
 */
@Controller('me')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Alias endpoint profilo corrente.
   */
  @Get()
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.userId);
  }
}
