import { authMiddleware } from '@/middleware/auth';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppBindings } from '@/lib/types/init';
import { UNPROCESSABLE_ENTITY } from './status.codes';
import { formatZodErrors } from '../openapi/helper';
import corsMiddleware from '@/middleware/cors';

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        return c.json(
          {
            success: false,
            message: errors.length > 0 ? errors[0] : 'Bad request',
            data: {
              errors,
            },
          },
          UNPROCESSABLE_ENTITY,
        );
      }
    },
  });
}

export default function init() {
  const app = new OpenAPIHono<AppBindings>({
    strict: false,
  });

  app.use('*', authMiddleware);
  app.use('*', corsMiddleware);

  app.notFound((c) => {
    return c.json({
      success: false,
      message: 'Not found',
    });
  });

  app.onError((err, c) => {
    const currentStatus = 'status' in err ? err.status : 500;
    const statusCode = currentStatus !== 200 ? (currentStatus as ContentfulStatusCode) : 500;

    return c.json(
      {
        success: false,
        message: err.message,
      },
      statusCode,
    );
  });

  return app;
}
