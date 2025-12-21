import { UserStatus } from 'src/shared/contants/auth.constant';
import { z } from 'zod';

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

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
  phoneNumber: true,
})
  .extend({
    confirmPassword: z.string().min(8).max(100),
  })
  .strict()
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
});

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;
