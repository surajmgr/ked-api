import { z } from 'zod';
import { IsoDateString, roleSchema } from '@/schema/common.schema';

export const minimalProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string().optional(),
})

export type MinimalProfileResponseSchema = z.infer<typeof minimalProfileResponseSchema>;
