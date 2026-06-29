import { z } from 'zod/v3';

export class ReviewValidation {
  static readonly CREATE = z.object({
    productId: z.number().int().positive({ message: 'Product ID must be a positive integer.' }),
    orderId: z.number().int().positive().optional().nullable(),
    rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5.' }),
    comment: z.string().max(1000).optional().nullable(),
  });
}
