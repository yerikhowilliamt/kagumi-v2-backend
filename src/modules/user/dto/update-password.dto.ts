import { createZodDto } from 'nestjs-zod';
import { UserValidation } from '../user.validation';

export class UpdatePasswordRequest extends createZodDto(
  UserValidation.PASSWORD,
) {}
