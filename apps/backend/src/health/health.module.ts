/**
 * File: apps\backend\src\health\health.module.ts
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Modulo che raggruppa gli endpoint di health check.
 * Registra `HealthController` e `HealthService`.
 * Usa `PrismaService` (via `PrismaModule` globale) per la readiness sul database.
 * Gli endpoint sono pubblici e pensati per probe Kubernetes e monitoraggio.
 * Separare health in un modulo dedicato evita di mischiarlo con logica di dominio.
 * Favorisce chiarezza architetturale: e un cross-cutting module infrastrutturale.
 * Utile anche in CI e smoke test post-deploy per validare lo stack.
 * Non richiede DTO o payload: solo richieste GET.
 * Le rotte reali sono versionate da `main.ts` (`/api/v1/health/...`).
 * Riferimenti: `health.controller.ts`, `health.service.ts`, `infra/k8s/*`.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
