/**
 * File: apps\frontend\src\app\core\api.service.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './environment';

type QueryValue = string | number | boolean;

/**
 * Service di infrastruttura per chiamare le API del backend in modo consistente.
 * Incapsula `HttpClient` e applica automaticamente il `baseUrl` configurato in `environment`.
 * Espone metodi tipizzati `get/post/patch` per ridurre ripetizione di codice nelle pagine.
 * Gestisce query params pulendo valori vuoti/undefined per evitare query string "sporche".
 * Favorisce riuso e centralizza eventuali future policy (headers comuni, logging, retry, ecc.).
 * Non gestisce autenticazione direttamente: refresh cookie e gestito dal browser, access token da `AuthService`.
 * Le chiamate sono dirette al backend NestJS versionato (prefisso `/api/v1`).
 * Ritorna `Observable<T>` per integrarsi con RxJS e il change detection Angular.
 * Viene usato in quasi tutte le pagine (catalogo, prenotazioni, area admin).
 * Riferimenti: `core/auth.service.ts` (session) e `pages/*` (uso concreto).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Wrapper GET tipizzato con pulizia automatica query params.
   */
  get<T>(
    path: string,
    params?: Record<string, QueryValue | null | undefined>,
  ): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: this.cleanParams(params ?? {}) });
  }

  /**
   * Wrapper POST tipizzato.
   */
  post<T, B = unknown>(path: string, body: B): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  /**
   * Wrapper PATCH tipizzato.
   */
  patch<T, B = unknown>(path: string, body: B): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  /**
   * Rimuove parametri vuoti/non definiti per evitare query string sporche.
   */
  private cleanParams(params: Record<string, QueryValue | null | undefined>): Record<string, QueryValue> {
    return Object.entries(params).reduce<Record<string, QueryValue>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}
