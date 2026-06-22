import { createZodDto } from 'nestjs-zod';
import { CustomOrderOptionValidation } from '../custom-order-option.validation';

export class CreateCustomOrderOptionDto extends createZodDto(CustomOrderOptionValidation.CREATE) {}
