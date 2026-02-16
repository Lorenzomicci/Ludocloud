/**
 * File: apps\frontend\src\app\core\models.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

export type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  memberId: string | null;
  membershipCode: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Game {
  id: string;
  title: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  durationMin: number;
  stockTotal: number;
  stockAvailable: number;
  isActive: boolean;
}

export interface TableModel {
  id: string;
  code: string;
  capacity: number;
  zone: string;
  isActive: boolean;
  available?: boolean;
}

export interface MemberModel {
  id: string;
  membershipCode: string;
  joinedAt: string;
  notes?: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    status: 'ACTIVE' | 'SUSPENDED';
  };
  _count?: {
    bookings: number;
  };
}

export interface BookingGameSelection {
  gameId: string;
  quantity: number;
}

export interface BookingModel {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startAt: string;
  endAt: string;
  peopleCount: number;
  notes?: string;
  createdAt: string;
  table: {
    id: string;
    code: string;
    zone: string;
  };
  member: {
    id: string;
    fullName: string;
    email: string;
    membershipCode: string;
  };
  games: Array<{
    gameId: string;
    title: string;
    quantity: number;
  }>;
}