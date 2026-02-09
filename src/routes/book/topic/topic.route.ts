import { selectTopicSubtopicsSchema } from '@/db/schema/tables/subtopic';
import { getFeaturedNoteByTopicSchema, selectBookTopicsSchema, selectTopicBySlug } from '@/db/schema/tables/topic';
import { jsonContent, jsonContentWithPagination } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, NOT_FOUND_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { idParamsSchema, cursorPaginationQuerySchema, buildParams } from '@/schema/req.schema';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Topic'];

export const list = createRoute({
  path: '/public/{bookId}/list',
  method: 'get',
  tags,
  request: {
    query: cursorPaginationQuerySchema,
    params: buildParams({
      bookId: z.cuid2(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'Get list of topics by bookId, for: /books/{slug}',
      schema: selectBookTopicsSchema,
    }),
  },
});
export type List = typeof list;

export const listByBookSlug = createRoute({
  path: '/public/book/{bookSlug}/list',
  method: 'get',
  tags,
  request: {
    query: cursorPaginationQuerySchema,
    params: buildParams({
      bookSlug: z.string().min(1),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'Get list of topics by bookSlug (slug-first UX)',
      schema: selectBookTopicsSchema,
    }),
  },
});
export type ListByBookSlug = typeof listByBookSlug;

export const listSubtopics = createRoute({
  path: '/public/{id}/subtopics',
  method: 'get',
  tags,
  request: {
    query: cursorPaginationQuerySchema,
    params: idParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'Get list of subtopics by topicId, for: /topics/{slug}',
      schema: selectTopicSubtopicsSchema,
    }),
  },
});
export type ListSubtopics = typeof listSubtopics;

export const listSubtopicsBySlug = createRoute({
  path: '/public/{slug}/subtopics',
  method: 'get',
  tags,
  request: {
    query: cursorPaginationQuerySchema,
    params: buildParams({
      slug: z.string().min(1),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'Get list of subtopics by topicSlug (slug-first UX)',
      schema: selectTopicSubtopicsSchema,
    }),
  },
});
export type ListSubtopicsBySlug = typeof listSubtopicsBySlug;

export const getFeaturedNote = createRoute({
  path: '/public/{topicId}/featured-note',
  method: 'get',
  tags,
  request: {
    params: buildParams({
      topicId: z.cuid2(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Get featured note by topicId, for: /topics/{slug}',
      schema: getFeaturedNoteByTopicSchema,
    }),
  },
});
export type GetFeaturedNote = typeof getFeaturedNote;

export const get = createRoute({
  path: '/public/{slug}',
  method: 'get',
  tags,
  request: {
    params: buildParams({
      slug: z.string(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Get topic by slug',
      schema: selectTopicBySlug,
    }),
  },
});
export type Get = typeof get;

export const getSubtopicBySlug = createRoute({
  path: '/public/subtopic/{slug}',
  method: 'get',
  tags,
  request: {
    params: buildParams({
      slug: z.string().min(1),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContent({
      description: 'Get subtopic by slug (slug-first UX)',
      schema: z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        orderIndex: z.number(),
        topic: z.object({
          id: z.string(),
          slug: z.string(),
          title: z.string(),
          book: z.object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
          }),
        }),
      }),
    }),
  },
});
export type GetSubtopicBySlug = typeof getSubtopicBySlug;
