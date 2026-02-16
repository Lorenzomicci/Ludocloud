/**
 * File: apps\backend\src\members\members.service.ts
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';

/**
 * Service di dominio per la gestione degli iscritti (Member + User associato).
 * `list()` restituisce membri con dati utente e conteggio prenotazioni, utile per dashboard gestionale.
 * `create()` crea un nuovo account membro: verifica unicita email, hash password (Argon2) e crea record Member+User.
 * Genera un `membershipCode` (codice tessera) per identificare l'iscritto.
 * `updateStatus()` aggiorna lo stato dell'utente (ACTIVE/SUSPENDED) per abilitare o bloccare login.
 * Tutte le operazioni passano da Prisma (query ORM parametrizzate) riducendo rischio injection.
 * Registra audit per creazione e cambio stato, associando l'attore (staff/admin) all'azione.
 * Gestisce errori con eccezioni HTTP coerenti (`BadRequest`, `NotFound`).
 * L'autorizzazione e gestita a livello controller/guard e non duplicata nel service.
 * Riferimenti: `auth.service.ts#login` (controllo status) e `prisma/schema.prisma` (models User/Member).
 */
@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lista iscritti con dati utente e numero prenotazioni aggregate.
   */
  async list() {
    return this.prisma.member.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  /**
   * Crea un nuovo membro (staff/admin) con account associato.
   */
  async create(actor: AuthUser, dto: CreateMemberDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email gia registrata');
    }

    const passwordHash = await argon2.hash(dto.password);

    const member = await this.prisma.member.create({
      data: {
        membershipCode: this.generateMembershipCode(),
        notes: dto.notes,
        user: {
          create: {
            email: dto.email.toLowerCase(),
            passwordHash,
            fullName: dto.fullName,
            phone: dto.phone,
            role: UserRole.MEMBER,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    await this.auditService.record(
      actor.userId,
      'MEMBER_CREATE',
      'MEMBER',
      member.id,
      {
        email: member.user.email,
      },
    );

    return member;
  }

  /**
   * Aggiorna lo stato logico del membro (ACTIVE/SUSPENDED).
   */
  async updateStatus(
    actor: AuthUser,
    memberId: string,
    dto: UpdateMemberStatusDto,
  ) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Iscritto non trovato');
    }

    const updated = await this.prisma.user.update({
      where: { id: member.userId },
      data: { status: dto.status },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
      },
    });

    await this.auditService.record(
      actor.userId,
      'MEMBER_STATUS_UPDATE',
      'MEMBER',
      memberId,
      {
        status: dto.status,
      },
    );

    return updated;
  }

  /**
   * Genera codice tessera per iscritti creati da staff/admin.
   */
  private generateMembershipCode(): string {
    const random = Math.floor(Math.random() * 90000 + 10000);
    return `MEM-${random}`;
  }
}
