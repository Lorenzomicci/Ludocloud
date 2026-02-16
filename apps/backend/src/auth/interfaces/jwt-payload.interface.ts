/**
 * File: apps\backend\src\auth\interfaces\jwt-payload.interface.ts
 */

import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
