/**
 * File: apps\backend\src\app.service.ts
 */

import { Injectable } from '@nestjs/common';

/**
 * Service minimale associato ad `AppController`.
 * Esempio base di provider NestJS annotato con `@Injectable()` e risolto tramite DI.
 * Espone una funzione `getHello()` usata come endpoint di prova (starter NestJS).
 * Non contiene logica di dominio: la logica reale e nei service dei moduli (`auth`, `bookings`, ecc.).
 * Dimostra separazione responsabilita: controller -> service -> risposta.
 * Non accede al database e non richiede dipendenze esterne.
 * Utile come smoke test dell'API (con prefisso globale `/api/v1`).
 * In una versione produzione puo essere rimosso o sostituito da endpoint informativi.
 * Viene coperto da unit test in `app.controller.spec.ts` (mock di dipendenza).
 * Riferimenti: `app.controller.ts` e `main.ts`.
 */
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
