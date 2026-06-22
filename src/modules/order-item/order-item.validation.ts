import { z } from 'zod/v3';

export class OrderItemValidation {
  static readonly CREATE = z.object({
    orderId: z.coerce
      .number({
        required_error: 'Order ID is required.',
        invalid_type_error: 'Order ID must be a number.',
      })
      .int()
      .positive({ message: 'Order ID must be a positive integer.' }),
    productId: z.coerce
      .number({
        required_error: 'Product ID is required.',
        invalid_type_error: 'Product ID must be a number.',
      })
      .int()
      .positive({ message: 'Product ID must be a positive integer.' }),
    quantity: z.coerce
      .number({
        required_error: 'Quantity is required.',
        invalid_type_error: 'Quantity must be a number.',
      })
      .int()
      .min(1, { message: 'Quantity must be at least 1.' }),
    note: z.string().max(1000).optional().nullable(),
    priceEach: z.coerce
      .number({
        required_error: 'Price each is required.',
        invalid_type_error: 'Price each must be a number.',
      })
      .positive({ message: 'Price each must be a positive number.' }),
  });

  static readonly UPDATE = z.object({
    orderId: z.coerce
      .number()
      .int()
      .positive({ message: 'Order ID must be a positive integer.' })
      .optional(),
    productId: z.coerce
      .number()
      .int()
      .positive({ message: 'Product ID must be a positive integer.' })
      .optional(),
    quantity: z.coerce
      .number()
      .int()
      .min(1, { message: 'Quantity must be at least 1.' })
      .optional(),
    note: z.string().max(1000).optional().nullable(),
    priceEach: z.coerce
      .number()
      .positive({ message: 'Price each must be a positive number.' })
      .optional(),
  });
}
