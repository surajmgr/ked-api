import { HttpStatusCodes, HttpStatusCodesType } from '@/lib/utils/status.codes';

export class ApiError extends Error {
  status: HttpStatusCodesType

  constructor(message: string, status: HttpStatusCodesType = HttpStatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = 'ApiError';
    this.status = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}
