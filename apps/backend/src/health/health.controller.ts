/**
 * File: apps\backend\src\health\health.controller.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

/**
 * Controller per gli health check del backend (pattern cloud-native).
 * Espone endpoint pubblici sotto `/api/v1/health/*` per liveness e readiness.
 * `GET /health/live`: verifica che il processo Node/Nest sia in esecuzione.
 * `GET /health/ready`: verifica anche dipendenze essenziali (DB raggiungibile).
 * Marcato `@Public()` per bypassare auth JWT (deve funzionare anche senza token).
 * Usato da Kubernetes per probe e per decidere quando inviare traffico al pod.
 * Riduce falsi positivi: readiness fallisce se il DB e giu, evitando errori a cascata.
 * Mantiene la logica nel `HealthService` per testabilita e separazione controller/service.
 * In sviluppo e utile anche per smoke test manuale e per gli script di deploy.
 * Riferimenti: `health.service.ts`, `main.ts` (prefix), `infra/k8s/*` (probe e ingress).
 */
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Probe liveness: indica se il processo e vivo.
   */
  @Get('live')
  live() {
    return this.healthService.live();
  }

  /**
   * Probe readiness: verifica anche la raggiungibilita del database.
   */
  @Get('ready')
  ready() {
    return this.healthService.ready();
  }
}
