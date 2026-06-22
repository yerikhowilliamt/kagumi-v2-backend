import { createZodDto } from 'nestjs-zod';
import { OrderItemValidation } from '../order-item.validation';

export class UpdateOrderItemRequest extends createZodDto(OrderItemValidation.UPDATE) {}
