import { z } from 'zod';
import { IsoDateString, roleSchema } from '@/schema/common.schema';

const sessionSchema = z.object({
  id: z.string(),
  token: z.string(),
  userId: z.string(),
  expiresAt: IsoDateString,
  createdAt: IsoDateString,
  updatedAt: IsoDateString,
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timezone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  regionCode: z.string().optional(),
  colo: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

const userSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional(),
  username: z.string().optional(),
  displayUsername: z.string().optional(),
  isAnonymous: z.boolean().nullable().optional(),
  role: roleSchema.nullable(),
  twoFactorEnabled: z.boolean().optional(),
  createdAt: IsoDateString,
  updatedAt: IsoDateString,
});

export const authSessionResponseSchema = z
  .object({
    session: sessionSchema,
    user: userSchema,
  })
  .nullable();

export type AuthSessionResponseSchema = z.infer<typeof authSessionResponseSchema>;
