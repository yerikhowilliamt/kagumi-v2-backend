import { createZodDto } from 'nestjs-zod';
import { UserValidation } from '../user.validation';

export class UpdateProfileRequest extends createZodDto(
  UserValidation.PROFILE,
) {}
