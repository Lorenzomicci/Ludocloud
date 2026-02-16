/**
 * File: apps\backend\src\auth\auth.controller.ts
 * Controller NestJS responsabile degli endpoint di autenticazione (`/api/v1/auth/*`).
 * Espone operazioni pubbliche (register/login/refresh) e operazioni protette (logout/me).
 * Applica rate limiting tramite `ThrottlerGuard` e decorator `@Throttle` per ridurre brute-force/abusi.
 * Non contiene logica di dominio: delega tutto ad `AuthService` (thin controller).
 * Usa `@Public()` per bypassare il `JwtAuthGuard` globale sugli endpoint che non richiedono token.
 * Usa `@Res({ passthrough: true })` per consentire al service di impostare cookie HttpOnly (refresh token).
 * Integra `@CurrentUser()` per leggere l'utente autenticato dalla request (popolata da Passport JWT).
 * Il contratto di input e definito dai DTO (`LoginDto`, `RegisterDto`) con validazione automatica.
 * Le risposte ritornano dati minimi per la UI (access token + profilo) evitando leak di informazioni sensibili.
 * Collegamenti utili: `auth.service.ts` (business logic) e `common/guards/*` (auth + ruoli).
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint pubblico di registrazione.
   */
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.register(body, response);
  }

  /**
   * Endpoint pubblico di login.
   */
  @Public()
  @HttpCode(200)
  @Post('login')
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(body, response);
  }

  /**
   * Endpoint pubblico di refresh basato su cookie HttpOnly.
   */
  @Public()
  @HttpCode(200)
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request, response);
  }

  /**
   * Logout dell'utente autenticato:
   * revoca i refresh token attivi e rimuove il cookie HttpOnly.
   */
  @HttpCode(200)
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(user.userId, response);
  }

  /**
   * Restituisce il profilo corrente dell'utente autenticato.
   */
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.userId);
  }
}
