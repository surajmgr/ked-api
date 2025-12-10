import { createProvider } from '@/lib/providers/factory';
import type { MiddlewareHandler } from 'hono';

export const providerMiddleware: MiddlewareHandler = async (c, next) => {
  if (!c.env || Object.keys(c.env).length === 0) {
    // biome-ignore lint/suspicious/noExplicitAny: fallback for Node.js
    c.env = process.env as any;
  }

  const provider = createProvider(c.env);
  c.set('provider', provider);
  await next();
};
