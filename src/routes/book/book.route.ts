import {
  insertBookSchema,
  selectBookSchema,
  selectBookSchemaWithGradeBook,
  updateBookSchema,
} from '@/db/schema/tables/book';
import { jsonContent, jsonContentWithPagination, jsonReqContentRequired } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, NOT_FOUND_RESPONSE, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { idParamsSchema, cursorPaginationQuerySchema, slugParamsSchema, getBookQuerySchema } from '@/schema/req.schema';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Book'];

export const get = createRoute({
  path: '/public/{slug}',
  method: 'get',
  tags,
  request: {
    query: getBookQuerySchema,
    params: slugParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Get Book',
      schema: selectBookSchemaWithGradeBook,
    }),
  },
});
export type Get = typeof get;

export const list = createRoute({
  path: '/public/list',
  method: 'get',
  tags,
  request: {
    query: cursorPaginationQuerySchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'Get Books',
      schema: z.array(selectBookSchemaWithGradeBook),
    }),
  },
});
export type List = typeof list;

export const create = createRoute({
  path: '',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Insert Book',
      schema: insertBookSchema,
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Create Book',
      schema: selectBookSchemaWithGradeBook,
    }),
  },
});
export type Create = typeof create;

export const bulkCreate = createRoute({
  path: '/bulk',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Bulk insert books (UX import)',
      schema: z.object({
        books: z.array(insertBookSchema).min(1).max(200),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Bulk create books',
      schema: z.array(selectBookSchemaWithGradeBook),
    }),
  },
});
export type BulkCreate = typeof bulkCreate;

export const update = createRoute({
  path: '/{id}',
  method: 'put',
  tags,
  request: {
    params: idParamsSchema,
    body: jsonReqContentRequired({
      description: 'Update Book',
      schema: updateBookSchema,
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Update Book',
      schema: selectBookSchemaWithGradeBook,
    }),
  },
});
export type Update = typeof update;

export const active = createRoute({
  path: '/{id}/active',
  method: 'post',
  tags,
  request: {
    params: idParamsSchema,
    body: jsonReqContentRequired({
      description: 'Active/Deactive Book',
      schema: z.object({ active: z.boolean() }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Update Book',
      schema: selectBookSchema,
    }),
  },
});
export type Active = typeof active;
