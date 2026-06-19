import { Request } from 'express';
import { User } from 'src/generated/prisma/client';

export const PRODUCT_TYPE_OPTIONS = [
  'REGULAR',
  'DAILY_BAKE',
  'CUSTOM',
] as const;

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type ProductType = (typeof PRODUCT_TYPE_OPTIONS)[number];

export type CustomRequest = Request & {
  user?: User;
};

export type LogLayer =
  | 'CONTROLLER'
  | 'SERVICE'
  | 'MIDDLEWARE'
  | 'STRATEGY'
  | 'GUARD'
  | 'HELPER'
  | 'EXCEPTION-FILTER';