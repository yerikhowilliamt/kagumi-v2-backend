import { createZodDto } from 'nestjs-zod';
import { OrderValidation } from '../order.validation';

export class CreateOrderRequest extends createZodDto(
  OrderValidation.CREATE,
) {}
