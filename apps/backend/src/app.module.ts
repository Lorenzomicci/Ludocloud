/**
 * File: apps\backend\src\app.module.ts
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { GamesModule } from './games/games.module';
import { HealthModule } from './health/health.module';
import { MembersModule } from './members/members.module';
import { PrismaModule } from './prisma/prisma.module';
import { TablesModule } from './tables/tables.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

/**
 * Root module del backend NestJS.
 * Aggrega tutti i moduli di dominio (auth, bookings, games, tables, members, users, health, audit, prisma).
 * Configura `ConfigModule` globale per leggere variabili ambiente (12-factor).
 * Configura `ThrottlerModule` per rate limiting globale su tutte le route.
 * Registra `PrismaModule` (accesso DB) e `AuditModule` (tracciamento eventi) come dipendenze condivise.
 * Applica una catena di guard globali via `APP_GUARD`.
 * Ordine dei guard: throttling -> autenticazione JWT -> autorizzazione RBAC.
 * Centralizza la sicurezza e riduce codice duplicato nei controller.
 * Il prefisso `/api/v1` e impostato in `main.ts`, quindi tutte le route risultano versionate.
 */
@Module({
  imports: [
    // Configurazione 12-factor: runtime via variabili ambiente.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // Rate limiting globale (protezione base abuso endpoint).
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    MembersModule,
    GamesModule,
    TablesModule,
    BookingsModule,
    HealthModule,
  ],
  providers: [
    {
      // Primo guard globale: throttling.
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      // Secondo guard globale: autenticazione JWT.
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      // Terzo guard globale: autorizzazione per ruolo.
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
