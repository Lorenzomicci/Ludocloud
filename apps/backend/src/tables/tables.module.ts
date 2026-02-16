/**
 * File: apps\backend\src\tables\tables.module.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

/**
 * Modulo NestJS dedicato alla risorsa tavoli.
 * Registra `TablesController` e `TablesService`.
 * Consuma `PrismaService` (modulo globale) per accesso al DB.
 * Le operazioni di admin sono protette da RBAC tramite decorator `@Roles` nel controller.
 * L'endpoint `GET /tables` viene usato sia da membri (disponibilita) sia da admin (configurazione).
 * Insieme al modulo `bookings` implementa il flusso di prenotazione tavolo.
 * Integra audit delle modifiche ai tavoli per tracciabilita operativa.
 * Mantiene separata la gestione "asset" (tavoli) dalle prenotazioni (booking).
 * Le rotte sono versionate con prefisso `/api/v1` impostato in `main.ts`.
 * Riferimenti: `tables.service.ts`, `tables.controller.ts`, `app.module.ts`.
 */
@Module({
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule {}
