import z from 'zod';
import { UserStatus } from '../contants/auth.constant';

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password: z.string(),
  name: z.string().min(2).max(500),
  phoneNumber: z.string().nullable(),
  totpSecret: z.string().nullable(),
  avatar: z.string().nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BANNED]),
  roleId: z.number(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserType = z.infer<typeof UserSchema>;
