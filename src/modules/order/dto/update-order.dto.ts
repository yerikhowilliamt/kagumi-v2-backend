import { createZodDto } from 'nestjs-zod';
import { OrderValidation } from '../order.validation';

export class UpdateOrderRequest extends createZodDto(
  OrderValidation.UPDATE,
) {}
