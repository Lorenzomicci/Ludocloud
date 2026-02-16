/**
 * File: apps\backend\src\main.ts
 * Scopo: componente applicativa di LudoCloud.
 */

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tutte le API del backend sono versionate sotto /api/v1.
  app.setGlobalPrefix('api/v1');
  // Necessario per leggere/scrivere il refresh token in cookie.
  app.use(cookieParser());
  // Validation centralizzata su tutti i DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
  // CORS con credenziali abilitate per cookie HttpOnly su frontend.
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
