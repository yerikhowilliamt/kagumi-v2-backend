import { z } from 'zod';

export class CartValidation {
  static readonly ADD_ITEM = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  });

  static readonly UPDATE_ITEM = z.object({
    quantity: z.number().int().positive(),
  });

  static readonly SYNC_CART = z.object({
    items: z.array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    ),
  });
}
