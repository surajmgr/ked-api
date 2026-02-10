import { jsonContentRaw, jsonContentBase } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, NOT_FOUND_RESPONSE, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { cursorPaginationQuerySchema, idParamsSchema } from '@/schema/req.schema';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Notifications'];

export const list = createRoute({
  path: '',
  method: 'get',
  tags,
  request: {
    query: cursorPaginationQuerySchema.extend({
      unreadOnly: z.coerce.boolean().optional().default(false),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'List notifications for current user',
      schema: z.object({
        success: z.boolean(),
        message: z.string().optional(),
        data: z.object({
          result: z.array(
            z.object({
              id: z.string(),
              type: z.string(),
              title: z.string(),
              message: z.string().nullable(),
              referenceId: z.string().nullable(),
              referenceType: z.string().nullable(),
              isRead: z.boolean(),
              createdAt: z.date(),
            }),
          ),
          pagination: z.object({
            next: z.object({
              cursor: z.string().optional(),
              more: z.boolean(),
            }),
            prev: z.object({
              cursor: z.string().optional(),
              more: z.boolean(),
            }),
          }),
        }),
      }),
    }),
  },
});
export type List = typeof list;

export const markRead = createRoute({
  path: '/{id}/read',
  method: 'post',
  tags,
  request: {
    params: idParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentBase({
      description: 'Notification marked as read',
    }),
  },
});
export type MarkRead = typeof markRead;

export const markAllRead = createRoute({
  path: '/read-all',
  method: 'post',
  tags,
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentBase({
      description: 'All notifications marked as read',
    }),
  },
});
export type MarkAllRead = typeof markAllRead;

