import { createZodDto } from 'nestjs-zod';
import { PaymentValidation } from '../payment.validation';

export class CreatePaymentRequest extends createZodDto(
  PaymentValidation.CREATE,
) {}
