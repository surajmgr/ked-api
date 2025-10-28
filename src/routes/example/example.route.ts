import { insertExampleSchema, selectExampleSchema, updateExampleSchema } from '@/db/schema';
import { jsonContent, jsonContentWithPagination, jsonReqContentRequired } from '@/lib/openapi/helper';
import {
  COMMON_RESPONSES,
  GLOBAL_RESPONSES,
  NOT_FOUND_RESPONSE,
  VALIDATION_ERROR_RESPONSE,
} from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { idParamsSchema, cursorPaginationQuerySchema } from '@/schema/req.schema';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Example'];

export const get = createRoute({
  path: '/{id}',
  method: 'get',
  tags,
  request: {
    params: idParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Get Example',
      schema: selectExampleSchema,
    }),
  },
  hide: true,
});
export type Get = typeof get;

export const list = createRoute({
  path: '/list',
  method: 'get',
  tags,
  request: {
    query: cursorPaginationQuerySchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'Get Examples',
      schema: z.array(selectExampleSchema),
    }),
  },
  hide: true,
});
export type List = typeof list;

export const create = createRoute({
  path: '',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Insert Example',
      schema: insertExampleSchema,
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Create Example',
      schema: selectExampleSchema,
    }),
  },
  hide: true,
});
export type Create = typeof create;

export const update = createRoute({
  path: '/{id}',
  method: 'put',
  tags,
  request: {
    params: idParamsSchema,
    body: jsonReqContentRequired({
      description: 'Update Example',
      schema: updateExampleSchema,
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Update Example',
      schema: selectExampleSchema,
    }),
  },
  hide: true,
});
export type Update = typeof update;

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  tags,
  request: {
    params: idParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...COMMON_RESPONSES.OK,
  },
  hide: true,
});
export type Remove = typeof remove;
