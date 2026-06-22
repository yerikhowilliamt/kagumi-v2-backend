import { createZodDto } from 'nestjs-zod';
import { CustomOrderOptionValidation } from '../custom-order-option.validation';

export class UpdateCustomOrderOptionDto extends createZodDto(CustomOrderOptionValidation.UPDATE) {}
