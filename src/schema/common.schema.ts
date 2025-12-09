import { z } from 'zod';

export const IsoDateString = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: 'Invalid ISO date string',
});

export const roleSchema = z.enum(['user', 'admin', 'superadmin']);
export type Role = z.infer<typeof roleSchema>;
export type StandardResponse<T> = {
  success: boolean;
  message: string;
  data: T;
}
