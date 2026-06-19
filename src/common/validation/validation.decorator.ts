import { Body, Query, SetMetadata } from '@nestjs/common';
import { ZodType } from 'zod/v3';
import { ValidationPipe } from './validation.pipe';

export const ZodBody = (schema: ZodType<any>) =>
  Body(new ValidationPipe(schema));
export const ZodQuery = (schema: ZodType<any>) =>
  Query(new ValidationPipe(schema));