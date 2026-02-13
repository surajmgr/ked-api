import { uploadTypes } from '@/db/schema';
import { jsonContent, multipartContent } from '@/lib/openapi/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Upload'];

const uploadSchema = z.object({
  file: z
    .any()
    .refine((v) => v instanceof File, 'Expected File')
    .openapi({
      type: 'string',
      format: 'binary',
    }),
  type: z.enum(uploadTypes).default('OTHER'),
});

export const upload = createRoute({
  path: '',
  method: 'post',
  tags,
  description: 'Upload a file to Cloudinary with rate limiting based on user contribution points.',
  request: {
    body: multipartContent({
      description: 'Upload a file',
      schema: uploadSchema,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      description: 'File uploaded successfully',
      schema: z.object({
        url: z.string(),
        publicId: z.string(),
        limits: z
          .object({
            remaining: z.number(),
            total: z.number(),
          })
          .optional(),
      }),
    }),
    [HttpStatusCodes.UNAUTHORIZED]: {
      description: 'Unauthorized',
    },
    [HttpStatusCodes.TOO_MANY_REQUESTS]: {
      description: 'Rate limit exceeded',
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      description: 'Invalid input',
    },
  },
});
export type Upload = typeof upload;
