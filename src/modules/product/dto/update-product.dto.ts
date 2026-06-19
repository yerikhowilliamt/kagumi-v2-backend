import { createZodDto } from 'nestjs-zod';
import { ProductValidation } from '../product.validation';

export class UpdateProductRequest extends createZodDto(
  ProductValidation.UPDATE,
) {}
