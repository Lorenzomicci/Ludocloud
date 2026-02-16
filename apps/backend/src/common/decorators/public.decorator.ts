/**
 * File: apps\backend\src\common\decorators\public.decorator.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
