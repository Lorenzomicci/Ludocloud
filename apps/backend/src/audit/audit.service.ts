/**
 * File: apps\backend\src\audit\audit.service.ts
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service per il tracciamento degli eventi applicativi.
 * Incapsula la scrittura in tabella `audit_logs` tramite Prisma.
 * Usato dai service di dominio per registrare azioni sensibili (auth, booking, CRUD admin).
 * Consente di correlare un attore (`actorUserId`) a un'azione e a una entita (`entityType`/`entityId`).
 * Accetta un payload JSON opzionale per salvare dettagli utili (es. campi modificati o input DTO).
 * Centralizzare qui l'audit evita duplicazioni e standardizza formato e naming delle azioni.
 * In ottica cloud-native, l'audit e utile per osservabilita e troubleshooting oltre ai log runtime.
 * Non implementa autorizzazione: si fida dei service chiamanti che hanno gia applicato guard/ruoli.
 * Dipende solo da `PrismaService` (data layer) ed e quindi facilmente testabile o moccabile.
 * Riferimenti: `prisma/schema.prisma` (model AuditLog) e i vari `*.service.ts` che invocano `record()`.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra eventi applicativi rilevanti (auth, booking, CRUD admin).
   */
  async record(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId?: string,
    payload?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        payload,
      },
    });
  }
}
