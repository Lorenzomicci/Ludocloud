/**
 * File: apps\backend\src\prisma\prisma.service.ts
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wrapper NestJS attorno a `PrismaClient` (ORM) per accedere a PostgreSQL.
 * Esposto tramite Dependency Injection cosi tutti i service possono eseguire query in modo consistente.
 * Estende `PrismaClient` per mantenere l'API Prisma standard (`user.findUnique`, `booking.create`, ecc.).
 * Implementa `OnModuleInit` per aprire la connessione al DB all'avvio dell'app.
 * Implementa `OnModuleDestroy` per chiudere la connessione durante lo shutdown (graceful).
 * Usa la configurazione Prisma che legge `DATABASE_URL` da variabili ambiente (12-factor).
 * Centralizzare la connessione evita istanze multiple e riduce overhead/connessioni aperte.
 * Viene usato anche da `HealthService` per la readiness (query minima) e dai test di integrazione.
 * Riferimenti: `prisma.module.ts` (provider globale) e `prisma/schema.prisma` (modello dati).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Hook NestJS: apertura connessione DB all'avvio modulo.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Hook NestJS: chiusura connessione DB a shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
