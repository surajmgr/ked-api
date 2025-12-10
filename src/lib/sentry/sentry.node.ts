import * as Sentry from '@sentry/node';
import type { ILogger } from '../providers/interfaces';

let isInitialized = false;

export function initSentryNode(dsn?: string): void {
  if (isInitialized || !dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.consoleLoggingIntegration({
        levels: ['error'],
      })
    ],
    enableLogs: true,
    sendDefaultPii: true,
  });

  isInitialized = true;
}

export const nodeSentryLogger: ILogger = {
  info(message: string, data?: Record<string, unknown>): void {
    if (data) {
      Sentry.logger.info(message, data);
    }
  },

  error(message: string, data?: Record<string, unknown>): void {
    if (data) {
      Sentry.logger.error(message, data);
    } else {
      Sentry.logger.error(message);
    }
  },
};
