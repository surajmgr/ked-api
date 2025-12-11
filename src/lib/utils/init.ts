import { authMiddleware } from '@/middleware/auth';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppBindings } from '@/lib/types/init';
import { UNPROCESSABLE_ENTITY } from './status.codes';
import { formatZodErrors } from '../openapi/helper';
import corsMiddleware from '@/middleware/cors';
import { getErrorMessage } from './error';
import { secureHeaders } from 'hono/secure-headers';
import { providerMiddleware } from '@/middleware/provider';
import { requestLoggerMiddleware } from '@/middleware/logger';
import { createGamificationService } from '../services/gamification.service';
import { createModerationService } from '../services/moderation.service';
import { contributionMiddleware } from '@/middleware/contribution';

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

  app.use('*', providerMiddleware);
  app.use('*', requestLoggerMiddleware);
  app.use('*', authMiddleware);
  app.use('*', corsMiddleware);
  app.use('*', secureHeaders());

  // Service Injection Middleware
  app.use('*', async (c, next) => {
    const provider = c.var.provider;

    if (provider) {
      const logger = provider.logger;
      const client = await provider.db.getClient();
      const gamificationService = createGamificationService(client, logger);
      const moderationService = createModerationService(client, gamificationService, logger);

      c.set('gamificationService', gamificationService);
      c.set('moderationService', moderationService);

      // We need to pass the service to the middleware factory
      await contributionMiddleware(gamificationService)(c, next);
    } else {
      await next();
    }
  });

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
        message: getErrorMessage(err),
      },
      statusCode,
    );
  });

  return app;
}
