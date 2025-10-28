import { cors } from 'hono/cors';
import { env } from 'cloudflare:workers';

const TRUSTED_ORIGINS = (env.TRUSTED_ORIGINS || '').split(',');

const CORS_ROOT_DOMAINS = TRUSTED_ORIGINS.map((origin) => origin.trim())
  .filter((o) => o.startsWith('http://') || o.startsWith('https://') || /^[\w.*-]+$/.test(o))
  .map((o) => {
    try {
      const url = new URL(o);
      return url.hostname.toLowerCase();
    } catch {
      return o.toLowerCase();
    }
  });

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    return CORS_ROOT_DOMAINS.some((domain) => {
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
  origin: (origin) => {
    if (!origin) return '';
    return isAllowedOrigin(origin) ? origin : '';
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
