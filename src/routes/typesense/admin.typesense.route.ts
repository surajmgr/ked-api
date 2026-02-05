import { createRoute, z } from '@hono/zod-openapi';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { jsonContentRaw, jsonReqContentRequired } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { analyticsRulesSchema, collectionsSchema } from '@/lib/services/typesense.service';
import { buildParams } from '@/schema/req.schema';

export const createCollectionFunc = createRoute({
  tags: ['Admin'],
  method: 'post',
  path: '/collections',
  summary: 'Create Typesense Collection',
  request: {
    body: jsonReqContentRequired({
      schema: z.object({
        name: collectionsSchema,
        force: z.boolean().default(false).optional(),
      }),
      description: 'Collection creation',
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: 'Collection created successfully',
    }),
  },
});

export const deleteCollectionFunc = createRoute({
  tags: ['Admin'],
  method: 'delete',
  path: '/collections/:name',
  summary: 'Delete Typesense Collection',
  request: {
    params: buildParams({
      name: collectionsSchema,
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: 'Collection deleted successfully',
    }),
  },
});

export const getCollectionInfoFunc = createRoute({
  tags: ['Admin'],
  method: 'get',
  path: '/collections',
  summary: 'Get Typesense Collection Info',
  request: {
    query: z.object({
      name: collectionsSchema.optional(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        data: z.record(
          z.string(),
          z.object({
            exists: z.boolean(),
            num_documents: z.number().optional(),
            name: z.string().optional(),
            created_at: z.number().optional(),
          }),
        ),
        message: z.string(),
      }),
      description: 'Collection info retrieved',
    }),
  },
});

export const createAnalyticsRuleFunc = createRoute({
  tags: ['Admin'],
  method: 'post',
  path: '/analytics/rules',
  summary: 'Create Analytics Rule',
  request: {
    body: jsonReqContentRequired({
      schema: z.object({
        name: analyticsRulesSchema,
      }),
      description: 'Rule Creation',
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: 'Rule created successfully',
    }),
  },
});

export const deleteAnalyticsRuleFunc = createRoute({
  tags: ['Admin'],
  method: 'delete',
  path: '/analytics/rules/:name',
  summary: 'Delete Analytics Rule',
  request: {
    params: buildParams({
      name: analyticsRulesSchema,
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: 'Rule deleted successfully',
    }),
  },
});

export const getAnalyticsRulesFunc = createRoute({
  tags: ['Admin'],
  method: 'get',
  path: '/analytics/rules',
  summary: 'Get Analytics Rules Info',
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        data: z.any(),
        message: z.string(),
      }),
      description: 'Rules info retrieved',
    }),
  },
});

// Seed route to do everything at once (useful for initialization)
export const seedTypesenseFunc = createRoute({
  tags: ['Admin'],
  method: 'post',
  path: '/seed',
  summary: 'Seed Typesense (Collections & Rules)',
  request: {
    body: jsonReqContentRequired({
      schema: z.object({
        force: z.boolean().default(false).optional(),
      }),
      description: 'Seed options',
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: 'Seeding completed',
    }),
  },
});

export const reindexTypesenseFunc = createRoute({
  tags: ['Admin'],
  method: 'post',
  path: '/reindex',
  summary: 'Reindex Typesense',
  request: {
    body: jsonReqContentRequired({
      schema: z.object({
        collection: collectionsSchema,
        force: z.boolean().default(false).optional(),
      }),
      description: 'Reindex options',
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: 'Reindexing completed',
    }),
  },
});

export type CreateCollection = typeof createCollectionFunc;
export type DeleteCollection = typeof deleteCollectionFunc;
export type GetCollectionInfo = typeof getCollectionInfoFunc;
export type CreateAnalyticsRule = typeof createAnalyticsRuleFunc;
export type DeleteAnalyticsRule = typeof deleteAnalyticsRuleFunc;
export type GetAnalyticsRules = typeof getAnalyticsRulesFunc;
export type SeedTypesense = typeof seedTypesenseFunc;
export type ReindexTypesense = typeof reindexTypesenseFunc;
