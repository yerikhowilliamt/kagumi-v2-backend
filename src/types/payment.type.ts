import { PaymentMethod } from 'src/models/payment.model';

export const PAYMENT_METHOD_OPTIONS = [
  PaymentMethod.TRANSFER,
  PaymentMethod.E_WALLET,
] as const;

export type PaymentMethodOption = (typeof PAYMENT_METHOD_OPTIONS)[number];
