import type { Context } from 'hono';
import type { AuthSessionResponseSchema } from '@/schema/auth.schema';
import { getCookie } from 'hono/cookie';
import { authSessionResponseSchema } from '@/schema/auth.schema';
import type { AppBindings } from '../types/init';
import { ApiError } from './error';
import { HttpStatusCodes } from './status.codes';
import { hasRouteAccess, PUBLIC_ROUTES } from '@/middleware/route.level';

const SECURE_AUTH_COOKIE_KEY = 'auth.session_token';
const AUTH_COOKIE_KEY = 'auth.session_token';
const STATE_COOKIE_KEY = 'better-auth.state';

export async function sessionAuthenticate({
  token,
  state,
  authApiUrl,
}: {
  token: string;
  state?: string;
  authApiUrl: string;
}) {
  const isSecure = authApiUrl.startsWith('https://');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSecure) {
    headers.Cookie = `${SECURE_AUTH_COOKIE_KEY}=${encodeURIComponent(token)}`;
  } else {
    headers.Cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(token)}`;
  }

  if (state) {
    headers.Cookie += `; ${STATE_COOKIE_KEY}=${encodeURIComponent(state)}`;
  }

  const response = await fetch(`${authApiUrl}/api/auth/get-session`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function authenticateToken(c: Context<AppBindings>): Promise<AuthSessionResponseSchema> {
  try {
    const secureCookie = getCookie(c, SECURE_AUTH_COOKIE_KEY);
    const regularCookie = getCookie(c, AUTH_COOKIE_KEY);
    const stateCookie = getCookie(c, STATE_COOKIE_KEY);
    const headerToken = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') || null;

    const token = secureCookie || regularCookie || headerToken;
    console;
    if (!token) return null;

    const authApiUrl = c.env.AUTH_API_URL;
    const data = await sessionAuthenticate({
      token,
      state: stateCookie,
      authApiUrl,
    });

    if (!data) return null;

    const parsed = authSessionResponseSchema.safeParse(data);
    if (!parsed.success) return null;

    return parsed.data;
  } catch (error) {
    console.error('[Auth] Unexpected error during authentication:', error);
    return null;
  }
}

export async function getCurrentSession<T extends boolean>(c: Context<AppBindings>, authIsRequired: T) {
  let session = c.var.auth;
  const path = c.req.path;

  if (hasRouteAccess(path, PUBLIC_ROUTES)) {
    session = await authenticateToken(c);
    c.set('auth', session);
  }

  if (!session && authIsRequired) {
    throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);
  }

  return session as T extends true ? NonNullable<AppBindings['Variables']['auth']> : AppBindings['Variables']['auth'];
}
