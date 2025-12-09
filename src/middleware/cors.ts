import { cors } from 'hono/cors';
import type { AppBindings } from '@/lib/types/init';

function getAllowedDomains(env: AppBindings['Bindings']) {
  const trustedOrigins = (env.TRUSTED_ORIGINS || '').split(',');
  return trustedOrigins
    .map((origin) => origin.trim())
    .map((origin) => {
      try {
        return new URL(origin).hostname.toLowerCase();
      } catch {
        return origin.toLowerCase();
      }
    });
}

function isAllowedOrigin(origin: string | null, allowedDomains: string[]) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    if (allowedDomains.includes('*')) return true;

    return allowedDomains.some((domain) => {
      if (domain.startsWith('*.')) {
        const base = domain.slice(2);
        return hostname === base || hostname.endsWith(`.${base}`);
      }
      return hostname === domain;
    });
  } catch {
    return false;
  }
}

export default cors({
  origin: (origin, c) => {
    if (!origin) return '';
    const env = c.env as AppBindings['Bindings'];
    const allowedDomains = getAllowedDomains(env);
    return isAllowedOrigin(origin, allowedDomains) ? origin : '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'X-Captcha-Response',
  ],
  maxAge: 86400, // 1 day
  credentials: true,
});
