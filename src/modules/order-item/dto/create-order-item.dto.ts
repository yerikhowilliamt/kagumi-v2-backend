import { createZodDto } from 'nestjs-zod';
import { OrderItemValidation } from '../order-item.validation';

export class CreateOrderItemRequest extends createZodDto(OrderItemValidation.CREATE) {}
