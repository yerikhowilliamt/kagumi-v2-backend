import { createZodDto } from 'nestjs-zod';
import { ProductValidation } from '../product.validation';

export class CreateProductRequest extends createZodDto(
  ProductValidation.CREATE,
) {}
