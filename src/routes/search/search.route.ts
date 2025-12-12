import { createRoute, z } from '@hono/zod-openapi';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { jsonContentRaw } from '@/lib/openapi/helper';
import { generalQuestionParamsSchema, GeneralQuestionSearchResult, generalQuestionSearchResultSchema } from '@/lib/typesense/schema/question.schema';
import { generalContentParamsSchema, generalContentSearchResultSchema } from '@/lib/typesense/schema/content.schema';
import { generalSuggestionParamsSchema, GeneralSuggestionSearchResult, generalSuggestionSearchResultSchema } from '@/lib/typesense/schema/analytics.schema';

const tags = ['Search'];

export const searchContentFunc = createRoute({
    path: '/content',
    method: 'get',
    tags,
    request: {
        query: generalContentParamsSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContentRaw({
            schema: z.object({
                success: z.boolean(),
                data: generalContentSearchResultSchema,
            }),
            description: 'Content search results'
        }),
    },
});

export const searchQuestionFunc = createRoute({
    path: '/question',
    method: 'get',
    tags,
    request: {
        query: generalQuestionParamsSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContentRaw({
            schema: z.object({
                success: z.boolean(),
                data: generalQuestionSearchResultSchema,
            }),
            description: 'Question search results'
        }),
    },
});

export const searchSuggestionsFunc = createRoute({
    path: '/suggestions',
    method: 'get',
    tags,
    request: {
        query: generalSuggestionParamsSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContentRaw({
            schema: z.object({
                success: z.boolean(),
                data: generalSuggestionSearchResultSchema,
            }),
            description: 'Suggestions search results'
        }),
    },
});

export type SearchContent = typeof searchContentFunc;
export type SearchQuestion = typeof searchQuestionFunc;
export type SearchSuggestions = typeof searchSuggestionsFunc;
