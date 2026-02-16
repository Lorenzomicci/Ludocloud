/**
 * File: apps\frontend\src\app\app.config.ts
 */

import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Gestione globale errori browser.
    provideBrowserGlobalErrorListeners(),
    // Ottimizzazione change detection.
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Routing SPA.
    provideRouter(routes),
    // Necessario per Angular Material.
    provideAnimations(),
    // HTTP client con interceptor auth.
    provideHttpClient(withInterceptors([authInterceptor])),
    // Registrazione service worker PWA in produzione.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
