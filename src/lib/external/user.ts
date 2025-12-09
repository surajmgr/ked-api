import { StandardResponse } from "@/schema/common.schema";
import { MinimalProfileResponseSchema, minimalProfileResponseSchema } from "@/schema/user.schema";
import { env } from "cloudflare:workers";

const AUTH_API_URL = env.AUTH_API_URL;

export const getMinimalProfileById = async (id: string) => {
  try {
    const res = await fetch(`${AUTH_API_URL}/api/profile/minimal?id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = (await res.json()) as StandardResponse<MinimalProfileResponseSchema>;
    if (!res.ok || !response.success) return null;

    const parsed = minimalProfileResponseSchema.safeParse(response.data);

    return parsed.success ? parsed.data : null;
  } catch {
    return null
  }
};
