import { z } from 'zod/v3';

export class ProductValidation {
  static readonly CREATE = z.object({
    categoryId: z
      .number()
      .int()
      .positive({ message: 'Category ID must be a positive integer.' }),
    name: z.string().min(1, { message: 'Name is required.' }).max(255),
    description: z.string().min(1, { message: 'Description is required.' }),
    price: z.number().positive({ message: 'Price must be a positive number.' }),
    type: z.enum(['REGULAR', 'DAILY_BAKE', 'CUSTOM'], {
      errorMap: () => ({
        message: "Type must be 'REGULAR', 'DAILY_BAKE', or 'CUSTOM'.",
      }),
    }),
    stock: z
      .number()
      .int()
      .nonnegative({ message: 'Stock cannot be negative.' })
      .optional(),
  });

  static readonly UPDATE = z.object({
    categoryId: z.number().int().positive().optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    type: z.enum(['REGULAR', 'DAILY_BAKE', 'CUSTOM']).optional(),
    stock: z.number().int().nonnegative().optional(),
  });
}
