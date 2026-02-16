/**
 * File: apps\backend\src\prisma\prisma.module.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Modulo globale che rende disponibile `PrismaService` in tutta l'app NestJS.
 * Marcato `@Global()` per evitare di importarlo manualmente in ogni modulo di dominio.
 * Registra `PrismaService` come provider singleton (una sola istanza di PrismaClient).
 * Esporta il provider cosi controller/service possono iniettarlo tramite costruttore.
 * Il data layer e usato da tutti i moduli (auth, bookings, games, members, tables, audit, health).
 * Supporta pattern "service per dominio" con accesso DB centralizzato e testabile.
 * In produzione, la connessione e gestita con lifecycle hook (connect/disconnect) nel service.
 * In CI, migrazioni e seed usano la stessa configurazione (`DATABASE_URL`).
 * Non espone endpoint: e un modulo infrastrutturale.
 * Riferimenti: `prisma.service.ts` e `app.module.ts` (import dei moduli root).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
