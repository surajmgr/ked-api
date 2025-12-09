import { z } from 'zod';
import { IsoDateString, roleSchema } from '@/schema/common.schema';

const sessionSchema = z.object({
  id: z.string().optional(),
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
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  emailVerified: z.boolean().optional().nullable(),
  image: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  displayUsername: z.string().optional().nullable(),
  isAnonymous: z.boolean().nullable().optional(),
  role: roleSchema,
  twoFactorEnabled: z.boolean().optional().nullable(),
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
