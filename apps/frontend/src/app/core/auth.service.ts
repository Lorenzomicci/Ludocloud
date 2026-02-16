/**
 * File: apps\frontend\src\app\core\auth.service.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from './environment';
import { AuthResponse, AuthUser, UserRole } from './models';

const ACCESS_TOKEN_KEY = 'ludocloud_access_token';
const USER_KEY = 'ludocloud_user';

/**
 * Service client-side per autenticazione e gestione sessione nella SPA.
 * Chiama gli endpoint backend `/auth/*` usando `withCredentials: true` per includere cookie HttpOnly di refresh.
 * Mantiene in memoria reattiva (Angular signals) l'access token e il profilo utente.
 * Persiste access token e user in `localStorage` per mantenere sessione tra refresh pagina.
 * Espone computed `isAuthenticated` e utility RBAC (`hasAnyRole`) per UI e routing.
 * Implementa `ensureSession()` che tenta un refresh se non c'e sessione valida in memoria.
 * Implementa `tryRefreshAndRetry()` per recupero automatico quando una chiamata fallisce con 401.
 * Centralizza la logica di logout (server + pulizia storage + redirect).
 * Non gestisce direttamente i refresh token: sono emessi dal backend e salvati in cookie HttpOnly.
 * Riferimenti: `apps/backend/src/auth/auth.controller.ts` e `apps/backend/src/auth/auth.service.ts`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly accessTokenSignal = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly userSignal = signal<AuthUser | null>(this.readUserFromStorage());

  readonly accessToken = computed(() => this.accessTokenSignal());
  readonly user = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => Boolean(this.accessTokenSignal() && this.userSignal()));

  /**
   * Login utente e persistenza sessione lato browser.
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(tap((response) => this.setSession(response)));
  }

  /**
   * Registrazione membro e login automatico.
   */
  register(payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  /**
   * Refresh della sessione tramite cookie HttpOnly.
   */
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(tap((response) => this.setSession(response)));
  }

  /**
   * Logout server + pulizia stato locale.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearSession();
        void this.router.navigateByUrl('/login');
      }),
    );
  }

  /**
   * Verifica sessione corrente:
   * - true se token presente in memoria
   * - altrimenti tenta refresh.
   */
  ensureSession(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }

    return this.refresh().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
    );
  }

  /**
   * Rotta di destinazione principale in base al ruolo.
   */
  routeForCurrentRole(): string {
    const role = this.userSignal()?.role;
    if (role === 'ADMIN' || role === 'STAFF') {
      return '/app/admin/dashboard';
    }
    return '/app/catalogo-giochi';
  }

  /**
   * Utility RBAC client-side.
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const role = this.userSignal()?.role;
    if (!role) {
      return false;
    }
    return roles.includes(role);
  }

  /**
   * Cancella token e utente da signal + localStorage.
   */
  clearSession() {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Salva sessione in memoria reattiva e storage locale.
   */
  setSession(response: AuthResponse) {
    this.accessTokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  /**
   * Espone access token corrente per interceptor.
   */
  getAccessToken() {
    return this.accessTokenSignal();
  }

  /**
   * Pipeline di recovery su 401:
   * refresh e ritenta chiamata originale.
   */
  tryRefreshAndRetry<T>(callback: () => Observable<T>): Observable<T> {
    return this.refresh().pipe(
      switchMap(() => callback()),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  /**
   * Ripristina utente da localStorage a bootstrap app.
   */
  private readUserFromStorage(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
