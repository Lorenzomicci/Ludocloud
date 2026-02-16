/**
 * File: apps\frontend\src\app\guards\auth.guard.ts
 *   
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../core/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se non c'e sessione valida, redirect a login.
  return authService.ensureSession().pipe(
    map((isAuthenticated) =>
      isAuthenticated ? true : router.createUrlTree(['/login']),
    ),
  );
};
