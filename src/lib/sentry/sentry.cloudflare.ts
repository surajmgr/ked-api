import * as Sentry from '@sentry/cloudflare';
import type { ILogger } from '../providers/interfaces';

let isInitialized = false;

export function initSentryCloudflare(dsn?: string, release?: string): void {
  if (isInitialized || !dsn) return;

  Sentry.withSentry(
    env => ({
      dsn,
      tracesSampleRate: 1.0,
      integrations: [
        Sentry.consoleLoggingIntegration({
          levels: ['error'],
        })
      ],
      sendDefaultPii: true,
      release,
      enableLogs: true,
    }), {
    async fetch(request, env, ctx) {
      return new Response('Hello World!');
    },
  });

  isInitialized = true;
}

export const cloudflareSentryLogger: ILogger = {
  info(message: string, data?: Record<string, unknown>): void {
    if (data) {
      Sentry.logger.info(message, data);
    }
  },

  error(message: string, data?: Record<string, unknown>): void {
    if (data) {
      Sentry.logger.error(message, data);
    }
  },
};
