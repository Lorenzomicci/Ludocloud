/**
 * File: apps\backend\src\common\guards\roles.guard.ts
 * Scopo: componente applicativa di LudoCloud.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithUser } from '../types/request-with-user.type';

/**
 * Guard di autorizzazione RBAC (role-based access control) per NestJS.
 * Legge i ruoli richiesti tramite decorator `@Roles(...)` applicato su controller o metodo.
 * Recupera i metadata usando `Reflector` e confronta con `request.user.role`.
 * Se non sono definiti ruoli richiesti, lascia passare (endpoint accessibile a qualunque utente autenticato).
 * Se `request.user` non e presente, fallisce con `403` (configurazione incoerente o auth mancante).
 * Se il ruolo non e tra quelli ammessi, blocca la richiesta con `403 Forbidden`.
 * E registrato come `APP_GUARD` in `app.module.ts`, quindi e applicato globalmente.
 * Permette policy dichiarative vicino agli endpoint, evitando if/else di autorizzazione nei service.
 * Lavora in combinazione con `JwtAuthGuard` che garantisce presenza di `request.user`.
 * Riferimenti: `common/decorators/roles.decorator.ts`, `auth/jwt.strategy.ts`, `app.module.ts`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Legge i ruoli richiesti da decorator @Roles sul metodo/controller.
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new ForbiddenException('Ruolo non disponibile nella richiesta');
    }

    // Se il ruolo utente non e tra quelli ammessi, blocca l'accesso.
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenException('Permessi insufficienti');
    }

    return true;
  }
}
