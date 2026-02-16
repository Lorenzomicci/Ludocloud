/**
 * File: apps\frontend\src\app\guards\role.guard.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { UserRole } from '../core/models';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as UserRole[]) ?? [];

  // Accesso consentito se non ci sono vincoli ruolo o se l'utente ha uno dei ruoli richiesti.
  if (roles.length === 0 || authService.hasAnyRole(roles)) {
    return true;
  }

  // In caso di mismatch ruolo, reindirizza alla home coerente col proprio profilo.
  return router.createUrlTree([authService.routeForCurrentRole()]);
};
