/**
 * File: apps\backend\src\auth\auth.service.ts
 * Scopo: componente per la gestione utente.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User, UserRole, UserStatus } from '@prisma/client';
import { Request, Response } from 'express';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';

const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * Service che implementa la logica di autenticazione e sessione del backend.
 * Responsabilita principali:
 * - registrazione utente (creazione `User` + profilo `Member` su PostgreSQL via Prisma)
 * - login con verifica password (Argon2) e controllo stato account (ACTIVE/SUSPENDED)
 * - emissione token JWT: access token (breve) + refresh token (lungo) con rotazione
 * - persistenza dei refresh token in tabella `refresh_tokens` (hash + scadenza + revoca)
 * - gestione cookie HttpOnly per refresh
 * - mapping ruolo (`ADMIN`/`STAFF`/`MEMBER`) -> permessi funzionali consumati dalla UI
 * - audit trail degli eventi critici (REGISTER, LOGIN, REFRESH, LOGOUT) tramite `AuditService`
 * Il controller `auth.controller.ts` si limita a fare binding dei DTO e delegare qui la business logic.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registra un nuovo utente membro:
   * - verifica email univoca
   * - salva password hashata
   * - crea automaticamente il profilo "member"
   * - emette subito access+refresh token (login automatico)
   */
  async register(registerDto: RegisterDto, response: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email gia registrata');
    }

    const passwordHash = await argon2.hash(registerDto.password);

    const created = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        passwordHash,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        member: {
          create: {
            membershipCode: this.generateMembershipCode(),
          },
        },
      },
      include: {
        member: true,
      },
    });

    await this.auditService.record(created.id, 'REGISTER', 'USER', created.id, {
      email: created.email,
    });

    return this.loginResponse(created, response);
  }

  /**
   * Esegue login classico email/password.
   * Rifiuta utenti inesistenti o sospesi.
   */
  async login(loginDto: LoginDto, response: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
      include: { member: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Utente sospeso');
    }

    const passwordOk = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );
    if (!passwordOk) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    await this.auditService.record(user.id, 'LOGIN', 'USER', user.id);

    return this.loginResponse(user, response);
  }

  /**
   * Ruota il refresh token:
   * - legge cookie HttpOnly
   * - verifica JWT
   * - valida hash contro refresh token attivi non revocati
   * - revoca il token usato e genera nuova coppia token
   */
  async refresh(request: Request, response: Response) {
    const refreshToken = this.extractRefreshToken(request);

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token non valido');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { member: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Utente non valido');
    }

    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let matchedTokenId: string | null = null;
    for (const tokenRow of activeTokens) {
      const isMatch = await argon2.verify(tokenRow.tokenHash, refreshToken);
      if (isMatch) {
        matchedTokenId = tokenRow.id;
        break;
      }
    }

    if (!matchedTokenId) {
      throw new UnauthorizedException(
        'Refresh token revocato o non riconosciuto',
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedTokenId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record(user.id, 'REFRESH', 'TOKEN', matchedTokenId);

    return this.loginResponse(user, response);
  }

  /**
   * Logout esplicito:
   * revoca tutti i refresh token attivi dell'utente e pulisce cookie.
   */
  async logout(userId: string, response: Response) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.clearRefreshCookie(response);

    await this.auditService.record(userId, 'LOGOUT', 'USER', userId);

    return { message: 'Logout completato' };
  }

  /**
   * Restituisce il profilo "me" normalizzato per il frontend.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { member: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      memberId: user.member?.id ?? null,
      membershipCode: user.member?.membershipCode ?? null,
      permissions: this.permissionsForRole(user.role),
    };
  }

  /**
   * Metodo centralizzato di emissione token e costruzione payload risposta.
   */
  private async loginResponse(
    user: User & { member: { id: string; membershipCode: string } | null },
    response: Response,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });

    const refreshHash = await argon2.hash(refreshToken);
    const refreshExpiresAt = new Date(
      Date.now() + this.refreshExpiresDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: refreshExpiresAt,
      },
    });

    this.setRefreshCookie(response, refreshToken, refreshExpiresAt);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        memberId: user.member?.id ?? null,
        membershipCode: user.member?.membershipCode ?? null,
      },
    };
  }

  /**
   * Recupera refresh token dal cookie; fallisce se assente.
   */
  private extractRefreshToken(request: Request): string {
    const token = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('Refresh token mancante');
    }
    return token;
  }

  /**
   * Imposta il refresh token in cookie HttpOnly con path ristretto agli endpoint auth.
   */
  private setRefreshCookie(response: Response, token: string, expiresAt: Date) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    response.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/api/v1/auth',
    });
  }

  /**
   * Rimuove il cookie refresh.
   */
  private clearRefreshCookie(response: Response) {
    response.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/api/v1/auth',
    });
  }

  /**
   * Genera codice tessera semplice per i nuovi membri.
   */
  private generateMembershipCode(): string {
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `MEM-${random}`;
  }

  /**
   * Mappa ruolo -> permessi funzionali usati dalla UI.
   */
  private permissionsForRole(role: UserRole): string[] {
    if (role === UserRole.ADMIN) {
      return [
        'members:read',
        'members:write',
        'games:write',
        'tables:write',
        'bookings:all',
      ];
    }

    if (role === UserRole.STAFF) {
      return [
        'members:read',
        'members:write',
        'games:write',
        'tables:read',
        'bookings:all',
      ];
    }

    return ['games:read', 'bookings:own', 'tables:availability'];
  }

  /**
   * Secret JWT per access token.
   */
  private get accessSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ??
      'dev_access_secret_change_me'
    );
  }

  /**
   * Secret JWT per refresh token.
   */
  private get refreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'dev_refresh_secret_change_me'
    );
  }

  /**
   * Durata access token (formato compatibile libreria ms).
   */
  private get accessExpiresIn(): StringValue {
    return (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      '15m') as StringValue;
  }

  /**
   * Durata refresh token calcolata in giorni.
   */
  private get refreshExpiresIn(): StringValue {
    return `${this.refreshExpiresDays}d` as StringValue;
  }

  /**
   * Numero giorni di vita refresh token.
   */
  private get refreshExpiresDays(): number {
    return Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') ?? '7',
    );
  }
}
