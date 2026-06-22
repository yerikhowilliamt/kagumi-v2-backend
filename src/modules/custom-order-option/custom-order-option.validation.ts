import { z } from 'zod/v3';

export class CustomOrderOptionValidation {
  static readonly CREATE = z.object({
    productId: z.coerce
      .number({
        required_error: 'Product ID is required.',
        invalid_type_error: 'Product ID must be a number.',
      })
      .int()
      .positive({ message: 'Product ID must be a positive integer.' }),
    label: z.string({
      required_error: 'Label is required.',
    }).min(1, { message: 'Label cannot be empty.' }).max(255),
    placeholder: z.string().max(255).optional().nullable(),
    required: z.coerce.boolean().optional().default(false),
  });

  static readonly UPDATE = z.object({
    productId: z.coerce
      .number()
      .int()
      .positive({ message: 'Product ID must be a positive integer.' })
      .optional(),
    label: z.string().min(1, { message: 'Label cannot be empty.' }).max(255).optional(),
    placeholder: z.string().max(255).optional().nullable(),
    required: z.coerce.boolean().optional(),
  });
}
