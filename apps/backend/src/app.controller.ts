/**
 * File: apps\backend\src\app.controller.ts
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controller "starter" del progetto NestJS (endpoint minimale di prova).
 * Serve come smoke test rapido per verificare che il backend e avviato e risponde.
 * Con il prefisso globale impostato in `src/main.ts`, la rotta effettiva e `GET /api/v1`.
 * La logica e volutamente banale e delegata ad `AppService` per mostrare Dependency Injection.
 * Non fa parte della logica di dominio (che vive nei moduli `auth`, `bookings`, `games`, ...).
 * In un contesto reale puo essere rimosso o sostituito da endpoint di health dedicati.
 * Il progetto include gia un modulo `health` con readiness/liveness per deploy cloud-native.
 * E utile anche per esempi di test unit (`app.controller.spec.ts`) e debugging iniziale.
 * Mantenerlo semplice evita di mischiare logica infrastrutturale con logica applicativa.
 * Riferimenti: `src/main.ts` (bootstrap) e `src/app.module.ts` (registrazione moduli/guard globali).
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
