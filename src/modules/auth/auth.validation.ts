import { z } from "zod/v3";

export class AuthValidation {
  static readonly REGISTER = z.object({
    name: z.string().min(1, { message: 'Name is required.' }),
    email: z.string().email({ message: 'Invalid email format.' }),
    password: z
      .string()
      .min(8, {
        message: 'Password is required. It must be at least 8 characters long.',
      })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/\d/, {
        message: 'Password must contain at least one number.',
      }),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{8,14}$/, { message: 'Invalid phone number format' })
      .min(10, { message: 'Phone number must have at least 10 characters' })
      .max(20, { message: 'Phone number must not exceed 20 characters' }),
    address: z.string().min(1, { message: 'Address is required.' }),
  });

  static readonly VALIDATEUSER = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    image: z.string().min(1),
    emailVerified: z.boolean().nullable().optional(),
    provider: z.string().min(1),
    providerAccountId: z.string().min(1),
    accessToken: z.string().min(1),
    refreshToken: z.string().optional(),
  });

  static readonly LOGIN = z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, {
        message: 'Password is required. It must be at least 8 characters long.',
      })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/[0-9]/, {
        message: 'Password must contain at least one number.',
      }),
  });
}
