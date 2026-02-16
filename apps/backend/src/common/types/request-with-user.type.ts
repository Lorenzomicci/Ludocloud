/**
 * File: apps\backend\src\common\types\request-with-user.type.ts
 */

import { Request } from 'express';
import { AuthUser } from '../interfaces/auth-user.interface';

export interface RequestWithUser extends Request {
  user: AuthUser;
}
