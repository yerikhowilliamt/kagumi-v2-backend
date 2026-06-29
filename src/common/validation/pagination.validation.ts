import { z } from 'zod';

export class PaginationValidation {
  static readonly QUERY = z.object({
    page: z.preprocess(
      (val) => (val ? Number(val) : 1),
      z.number().int().min(1).optional().default(1),
    ),
    size: z.preprocess(
      (val) => (val ? Number(val) : 10),
      z.number().int().min(1).max(100).optional().default(10),
    ),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  });
}
