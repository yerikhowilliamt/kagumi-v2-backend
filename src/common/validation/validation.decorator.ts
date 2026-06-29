import { Body, Query, SetMetadata } from '@nestjs/common';
import { ZodType } from 'zod';
import { ValidationPipe } from './validation.pipe';

export const ZodBody = (schema: any) =>
  Body(new ValidationPipe(schema));
export const ZodQuery = (schema: any) =>
  Query(new ValidationPipe(schema));
