/**
 * File: apps\frontend\src\app\core\auth.interceptor.ts
 */

import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Intercetta solo API backend applicative.
  const isApiRequest = req.url.includes('/api/v1');
  const token = authService.getAccessToken();

  let cloned = req;
  if (isApiRequest) {
    // Allega bearer token e abilita cookie per refresh token HttpOnly.
    cloned = req.clone({
      withCredentials: true,
      setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  return next(cloned).pipe(
    catchError((error: unknown) => {
      const httpError = error as HttpErrorResponse;
      const isUnauthorized = httpError.status === 401;
      const isAuthEndpoint =
        cloned.url.includes('/auth/login') ||
        cloned.url.includes('/auth/register') ||
        cloned.url.includes('/auth/refresh');
      const alreadyRetried = cloned.headers.has('x-retry-auth');

      // Strategia anti-loop: un solo retry dopo refresh.
      if (isApiRequest && isUnauthorized && !isAuthEndpoint && !alreadyRetried) {
        return authService.tryRefreshAndRetry(() =>
          next(
            cloned.clone({
              setHeaders: {
                Authorization: `Bearer ${authService.getAccessToken() ?? ''}`,
                'x-retry-auth': '1',
              },
              withCredentials: true,
            }),
          ),
        );
      }

      return throwError(() => error);
    }),
  );
};
