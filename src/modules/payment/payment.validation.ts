import { z } from 'zod/v3';

export class PaymentValidation {
  static readonly CREATE = z.object({
    orderId: z.number().int().positive({ message: 'Order ID must be a positive integer.' }),
    transactionId: z.string().min(1, { message: 'Transaction ID is required.' }),
    amount: z.union([z.number(), z.string()]).refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Amount must be a positive number.' },
    ),
    paymentMethod: z.enum(['TRANSFER', 'E_WALLET'], {
      errorMap: () => ({ message: "Payment method must be 'TRANSFER' or 'E_WALLET'." }),
    }),
    status: z.enum(['PENDING', 'SETTLEMENT', 'FAILED', 'CANCELED', 'REFUNDED'], {
      errorMap: () => ({ message: 'Invalid payment status.' }),
    }).optional(),
    paymentProof: z.string().url({ message: 'Payment proof must be a valid URL.' }).optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
  });

  static readonly UPDATE = z.object({
    orderId: z.number().int().positive({ message: 'Order ID must be a positive integer.' }).optional(),
    transactionId: z.string().min(1, { message: 'Transaction ID is required.' }).optional(),
    amount: z.union([z.number(), z.string()]).refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Amount must be a positive number.' },
    ).optional(),
    paymentMethod: z.enum(['TRANSFER', 'E_WALLET'], {
      errorMap: () => ({ message: "Payment method must be 'TRANSFER' or 'E_WALLET'." }),
    }).optional(),
    status: z.enum(['PENDING', 'SETTLEMENT', 'FAILED', 'CANCELED', 'REFUNDED'], {
      errorMap: () => ({ message: 'Invalid payment status.' }),
    }).optional(),
    paymentProof: z.string().url({ message: 'Payment proof must be a valid URL.' }).optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
    failureReason: z.string().max(255).optional().nullable(),
    refundAmount: z.union([z.number(), z.string()]).refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Refund amount must be a non-negative number.' },
    ).optional().nullable(),
    refundedAt: z.string().datetime({ message: 'Refunded at must be a valid ISO datetime string.' }).optional().nullable(),
  });
}
