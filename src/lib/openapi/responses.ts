import { z } from 'zod';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { jsonContentBase, jsonContentRaw } from './helper';

export const GLOBAL_RESPONSES = {};

export const VALIDATION_ERROR_RESPONSE = {
  [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContentRaw({
    description: 'Validation failed',
    schema: z
      .object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          errors: z.array(z.string()),
        }),
      })
      .openapi({ example: { success: false, message: 'Validation failed', data: { errors: ['error1', 'error2'] } } }),
  }),
};

export const NOT_FOUND_RESPONSE = {
  [HttpStatusCodes.NOT_FOUND]: jsonContentRaw({
    description: 'Not found',
    schema: z
      .object({
        success: z.boolean(),
        message: z.string(),
      })
      .openapi({ example: { success: false, message: 'Not found' } }),
  }),
};

export const COMMON_RESPONSES = {
  OK: {
    [HttpStatusCodes.OK]: jsonContentBase({
      description: 'Success',
    }),
  },
};
