/**
 * File: apps\frontend\src\app\app.ts
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root component dell'app Angular (entry point UI).
 * Ospita il `RouterOutlet` e quindi rende la SPA navigabile tramite routing client-side.
 * E il primo componente montato in `index.html` tramite il selector `app-root`.
 * Non contiene logica di dominio: delega alle pagine (`pages/*`) e ai servizi (`core/*`).
 * Permette di separare shell/layout (vedi `layout/shell.component.ts`) dalla root minimale.
 * In un'architettura SPA, questo componente è il contenitore per tutte le route.
 * Mantenerlo vuoto riduce coupling e rende piu semplice testing e refactor.
 * La comunicazione col backend avviene tramite `ApiService` e `AuthService` nelle pagine.
 * Il backend e versionato sotto `/api/v1` e la base URL e gestita da `environment.apiBaseUrl`.
 * Riferimenti: `app.routes.ts` (routing) e `app.config.ts` (bootstrap providers).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
