/**
 * File: apps\backend\src\common\decorators\roles.decorator.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
