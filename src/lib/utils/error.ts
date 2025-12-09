import { HttpStatusCodes, type HttpStatusCodesType } from '@/lib/utils/status.codes';
import { DrizzleError, DrizzleQueryError } from 'drizzle-orm';

export class ApiError extends Error {
  status: HttpStatusCodesType;

  constructor(message: string, status: HttpStatusCodesType = HttpStatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = 'ApiError';
    this.status = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Safely extract an error message without leaking sensitive info
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  // Drizzle errors
  if (error instanceof DrizzleError || error instanceof DrizzleQueryError) {
    console.error('Drizzle error:', {
      message: error.message,
      cause: error.cause,
    });

    if (error.cause instanceof Error) {
      return `Db: ${error.cause.message}`;
    }
    if (error.cause instanceof TypeError) {
      return 'Database connection error';
    }
    return 'Database query failed';
  }

  if (error instanceof TypeError) {
    return 'Type error';
  }

  // Native JS errors
  if (error instanceof Error) {
    console.error('Unexpected error:', error);
    return error.message || 'An unexpected error occurred';
  }

  // Unknown non-error types (string, number, etc.)
  console.error('Unknown error type:', error);
  return typeof error === 'string' ? error : 'An unexpected error occurred';
}
