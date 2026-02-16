/**
 * File: apps/frontend/src/main.ts
 * Scopo: entrypoint Angular, bootstrap della SPA con la configurazione globale.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Avvia l'applicazione e logga eventuali errori fatali di bootstrap.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
