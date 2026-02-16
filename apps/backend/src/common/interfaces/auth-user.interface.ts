/**
 * File: apps\backend\src\common\interfaces\auth-user.interface.ts
 */

import { UserRole } from '@prisma/client';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}
