/**
 * File: apps\backend\src\audit\audit.module.ts
 */

import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Modulo NestJS globale che espone `AuditService` a tutta l'applicazione.
 * Marcato `@Global()` per evitare import ripetuti in ogni modulo di dominio.
 * Registra `AuditService` come provider e lo esporta per Dependency Injection.
 * Consente ai service di dominio di registrare eventi senza dipendenze circolari.
 * Mantiene separata la preoccupazione "audit/logging" dalla logica di business.
 * Il formato dei log e persistito su DB (tabella `audit_logs`) tramite Prisma.
 * In CI e deploy, l'audit aiuta a validare flussi (es. login/booking) e a fare troubleshooting.
 * Tipicamente viene affiancato a log strutturati su stdout (non gestiti).
 * Non contiene controller: e un modulo di supporto e non un'API pubblica.
 * Riferimenti: `audit.service.ts` e `app.module.ts` (import globale dei moduli).
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
