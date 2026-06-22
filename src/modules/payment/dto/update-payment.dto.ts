import { createZodDto } from 'nestjs-zod';
import { PaymentValidation } from '../payment.validation';

export class UpdatePaymentRequest extends createZodDto(
  PaymentValidation.UPDATE,
) {}
