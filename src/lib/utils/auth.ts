import type { Context } from 'hono';
import type { AuthSessionResponseSchema } from '@/schema/auth.schema';
import { getCookie } from 'hono/cookie';
import { authSessionResponseSchema } from '@/schema/auth.schema';
import { env } from 'cloudflare:workers';

const SECURE_AUTH_COOKIE_KEY = '__Secure-better-auth.session_token';
const AUTH_COOKIE_KEY = 'better-auth.session_token';

export async function sessionAuthenticate(token: string) {
  const AUTH_API_URL = env.AUTH_API_URL;
  const isSecure = AUTH_API_URL.startsWith('https://');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSecure) {
    headers.Cookie = `${SECURE_AUTH_COOKIE_KEY}=${encodeURIComponent(token)}`;
  } else {
    headers.Cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(token)}`;
  }

  const response = await fetch(`${AUTH_API_URL}/api/auth/get-session`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function authenticateToken(c: Context): Promise<AuthSessionResponseSchema> {
  try {
    const secureCookie = getCookie(c, SECURE_AUTH_COOKIE_KEY);
    const regularCookie = getCookie(c, AUTH_COOKIE_KEY);
    const headerToken = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') || null;

    const token = secureCookie || regularCookie || headerToken;
    if (!token) return null;

    const data = await sessionAuthenticate(token);

    if (!data) return null;

    const parsed = authSessionResponseSchema.safeParse(data);
    if (!parsed.success) return null;

    return parsed.data;
  } catch (error) {
    console.error('[Auth] Unexpected error during authentication:', error);
    return null;
  }
}
