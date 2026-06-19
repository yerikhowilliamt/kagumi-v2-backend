import { z } from 'zod/v3';

export class OrderValidation {
  static readonly CREATE = z.object({
    deliveryMethod: z.enum(['DELIVERY', 'COD'], {
      errorMap: () => ({
        message: "Delivery method must be 'DELIVERY' or 'COD'.",
      }),
    }),
    paymentMethod: z.enum(['TRANSFER', 'E_WALLET'], {
      errorMap: () => ({
        message: "Payment method must be 'TRANSFER' or 'E_WALLET'.",
      }),
    }),
    items: z
      .array(
        z.object({
          productId: z
            .number()
            .int()
            .positive({ message: 'Product ID must be a positive integer.' }),
          quantity: z
            .number()
            .int()
            .positive({ message: 'Quantity must be a positive integer.' }),
          note: z.string().max(255).optional().nullable(),
        }),
      )
      .min(1, { message: 'Order must contain at least one item.' }),
  });

  static readonly UPDATE = z.object({
    status: z
      .enum(
        [
          'PENDING',
          'PAID',
          'PROCESSING',
          'DELIVERING',
          'COMPLETED',
          'CANCELED',
        ],
        {
          errorMap: () => ({ message: 'Invalid order status.' }),
        },
      )
      .optional(),
    deliveryMethod: z
      .enum(['DELIVERY', 'COD'], {
        errorMap: () => ({
          message: "Delivery method must be 'DELIVERY' or 'COD'.",
        }),
      })
      .optional(),
    paymentMethod: z
      .enum(['TRANSFER', 'E_WALLET'], {
        errorMap: () => ({
          message: "Payment method must be 'TRANSFER' or 'E_WALLET'.",
        }),
      })
      .optional(),
  });
}
