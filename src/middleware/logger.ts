import { AppBindings } from '@/lib/types/init';
import type { MiddlewareHandler } from 'hono';

export const requestLoggerMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const start = Date.now();
  const url = c.req.path;
  const method = c.req.method;
  const query = c.req.query();

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  const log = {
    duration,
    status,
    url,
    query,
    service: 'KED',
  };

  const provider = c.var.provider;
  const message = `KED [${method}] ${url} ${status} ${duration}ms`;

  if (status >= 400) {
    provider.logger.error(message, log);
  } else {
    provider.logger.info(message, log);
  }
};
