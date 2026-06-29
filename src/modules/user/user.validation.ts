import { z } from 'zod/v3';

export class UserValidation {
  static readonly PROFILE = z.object({
    name: z
      .string()
      .min(1, {
        message: 'Name cannot be empty.',
      })
      .optional(),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]\d{8,14}$/, { message: 'Invalid phone number format' })
      .min(10, { message: 'Phone number must have at least 10 characters' })
      .max(20, { message: 'Phone number must not exceed 20 characters' })
      .optional(),
    address: z.string().min(1, { message: 'Address is required.' }).optional(),
    image: z
      .any()
      .refine((file) => !file || 'originalname' in file, {
        message: 'Invalid image',
      })
      .optional(),
  });

  static readonly PASSWORD = z
    .object({
      currentPassword: z.string().min(1, {
        message: 'Current password is required.',
      }),
      password: z
        .string()
        .min(8, {
          message:
            'Password is required. It must be at least 8 characters long.',
        })
        .regex(/[A-Z]/, {
          message: 'Password must contain at least one uppercase letter.',
        })
        .regex(/\d/, {
          message: 'Password must contain at least one number.',
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match.',
    });
}
