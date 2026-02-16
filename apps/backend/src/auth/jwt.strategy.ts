/**
 * File: apps\backend\src\auth\jwt.strategy.ts
 *   
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthUser } from '../common/interfaces/auth-user.interface';

/**
 * Passport strategy per validare access token JWT (Bearer).
 * Viene invocata automaticamente da `AuthGuard('jwt')` dentro `JwtAuthGuard`.
 * Estrae il token dall'header `Authorization` e rifiuta token scaduti (`ignoreExpiration: false`).
 * Usa `JWT_ACCESS_SECRET` da variabili ambiente (via `ConfigService`) come chiave di verifica.
 * Il payload atteso e tipizzato da `JwtPayload` (sub/email/role).
 * Il metodo `validate()` converte il payload in un oggetto `AuthUser` minimale.
 * L'oggetto risultante viene assegnato a `request.user` e consumato da `@CurrentUser()` nei controller.
 * Non legge il database: si limita a validare il token e a propagare le info necessarie.
 * La revoca/rotazione dei refresh token e gestita in `AuthService`, non qui.
 * Riferimenti: `auth.service.ts` (emissione token) e `common/decorators/current-user.decorator.ts`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    // Strategia di validazione token bearer usata dal JwtAuthGuard.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ??
        'dev_access_secret_change_me',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    // Mappa payload JWT in utente applicativo disponibile su request.user.
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
