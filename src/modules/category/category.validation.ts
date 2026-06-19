import { z } from 'zod/v3';

export class CategoryValidation {
  static readonly CREATE = z.object({
    name: z.string().min(1, { message: 'Name is required.' }).max(255),
    description: z.string().min(1, { message: 'Description is required.' }),
    parentId: z.number().int().positive().optional().nullable(),
  });

  static readonly UPDATE = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().min(1).optional(),
    parentId: z.number().int().positive().optional().nullable(),
  });
}
