/**
 * File: apps\backend\src\health\health.service.ts
 */

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service che implementa la logica dei probe di salute (liveness/readiness).
 * `live()` ritorna sempre OK se il processo e vivo (nessuna dipendenza esterna).
 * `ready()` esegue una query minima su PostgreSQL tramite `PrismaService` per verificare connettivita.
 * Se la query fallisce, solleva `ServiceUnavailableException` (HTTP 503).
 * L'output include timestamp ISO per facilitare debugging e monitoraggio.
 * Questa separazione consente di testare la readiness senza avviare logica di dominio.
 * In cloud/Kubernetes, readiness e fondamentale per rollout sicuri e auto-healing.
 * In locale, e usato da smoke test e strumenti di deploy per verificare che lo stack sia pronto.
 * Non contiene business logic: e un componente infrastrutturale.
 * Riferimenti: `prisma.service.ts` (connessione DB) e `health.controller.ts` (routing).
 */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Controllo base processo.
   */
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Controllo completo: processo + query minima al DB.
   */
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('Database non disponibile');
    }
  }
}
