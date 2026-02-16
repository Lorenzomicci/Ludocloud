/**
 * File: apps\backend\src\auth\auth.module.ts
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

/**
 * Modulo di autenticazione del backend (`/api/v1/auth/*`).
 * Registra `AuthController` (endpoint register/login/refresh/logout/me) e `AuthService` (business logic).
 * Configura integrazione Passport (`PassportModule`) per abilitare strategy JWT.
 * Registra `JwtModule` in modo asincrono leggendo il secret da `ConfigService`.
 * La secret configurata qui e usata per firmare/verificare access token (Bearer).
 * Il refresh token e gestito separatamente in `AuthService` con secret dedicata e cookie HttpOnly.
 * Fornisce `JwtStrategy` che mappa il payload in `request.user` (usata da `JwtAuthGuard` globale).
 * Esporta `AuthService` per permettere ad altri moduli (es. `UsersModule`) di riusare `getMe()` e simili.
 * Centralizza policy e dipendenze auth evitando configurazioni duplicate in altri moduli.
 * Riferimenti: `auth.service.ts`, `jwt.strategy.ts`, `common/guards/jwt-auth.guard.ts`.
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_ACCESS_SECRET') ??
          'dev_access_secret_change_me',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
