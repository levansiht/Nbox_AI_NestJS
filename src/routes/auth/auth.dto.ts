import { UserStatus } from 'generated/prisma/enums';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phoneNumber: z.string().min(10).max(15).optional(),
  avatar: z.string().nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BANNED]),
  roleId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const RegisterBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    name: z.string().min(2).max(100),
    confirmPassword: z.string().min(8).max(100),
    phoneNumber: z.string().min(10).max(15).optional(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}

export const RegisterResData = z.object({
  statusCode: z.number(),
  data: UserSchema,
});

export class RegisterResDTO extends createZodDto(RegisterResData) {}
