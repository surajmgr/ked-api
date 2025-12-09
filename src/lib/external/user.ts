import type { StandardResponse } from '@/schema/common.schema';
import { type MinimalProfileResponseSchema, minimalProfileResponseSchema } from '@/schema/user.schema';

export const getMinimalProfileById = async (id: string, authApiUrl: string) => {
  try {
    const res = await fetch(`${authApiUrl}/api/profile/minimal?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = (await res.json()) as StandardResponse<MinimalProfileResponseSchema>;
    if (!res.ok || !response.success) return null;

    const parsed = minimalProfileResponseSchema.safeParse(response.data);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};
