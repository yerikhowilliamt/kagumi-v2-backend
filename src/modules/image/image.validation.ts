import { z } from 'zod/v3';

export class ImageValidation {
  static readonly CREATE = z.object({
    productId: z.coerce
      .number({
        required_error: 'Product ID is required.',
        invalid_type_error: 'Product ID must be a number.',
      })
      .int()
      .positive({ message: 'Product ID must be a positive integer.' }),
  });
}
