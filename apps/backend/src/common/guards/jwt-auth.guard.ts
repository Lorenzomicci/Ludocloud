/**
 * File: apps\backend\src\common\guards\jwt-auth.guard.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard globale di autenticazione basato su Passport JWT.
 * Intercetta tutte le richieste HTTP (registrato come `APP_GUARD` in `app.module.ts`).
 * Se l'handler o il controller e marcato con `@Public()`, bypassa completamente l'autenticazione.
 * Per gli endpoint protetti, delega a `AuthGuard('jwt')` che usa la `JwtStrategy`.
 * La strategy estrae il bearer token dall'header `Authorization: Bearer <token>`.
 * In caso di token mancante, invalidato o scaduto, uniforma l'errore a `401 Unauthorized`.
 * Popola `request.user` con un `AuthUser` (id, email, role) disponibile nei controller.
 * Se combinato con `RolesGuard`, abilita la pipeline: auth -> autorizzazione per ruolo.
 * Evita check manuali nei singoli endpoint e centralizza la policy di autenticazione.
 * Riferimenti: `auth/jwt.strategy.ts`, `common/decorators/public.decorator.ts`, `app.module.ts`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Permette bypass completo per endpoint marcati come pubblici.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    // Uniforma la risposta in caso di token mancante/non valido.
    if (err || !user) {
      throw new UnauthorizedException('Autenticazione richiesta');
    }

    return user;
  }
}
