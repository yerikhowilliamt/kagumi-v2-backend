import { createZodDto } from 'nestjs-zod';
import { ImageValidation } from '../image.validation';

export class CreateImageRequest extends createZodDto(ImageValidation.CREATE) {}
