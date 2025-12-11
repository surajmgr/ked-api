import { insertBookSchema } from '@/db/schema';
import { jsonContentRaw, jsonReqContentRequired } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Content Creation'];

// Response schema for content creation with contribution data
const contentCreationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']),
    createdAt: z.union([z.string(), z.date()]).nullable(),
  }).optional,
  contribution: z
    .object({
      cpEarned: z.number(),
      xpEarned: z.number(),
      newTotal: z.object({
        cp: z.number(),
        xp: z.number(),
      }),
    })
    .optional(),
});

// Create Book
export const createBook = createRoute({
  path: '/books',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Create a new book',
      schema: insertBookSchema.omit({ status: true }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Book created successfully',
      schema: contentCreationResponseSchema,
    }),
  },
});
export type CreateBook = typeof createBook;

// Create Topic
export const createTopic = createRoute({
  path: '/topics',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Create a new topic',
      schema: z.object({
        bookId: z.string().cuid2(),
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        orderIndex: z.number().int().default(0),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Topic created successfully',
      schema: contentCreationResponseSchema,
    }),
  },
});
export type CreateTopic = typeof createTopic;

// Create Subtopic
export const createSubtopic = createRoute({
  path: '/subtopics',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Create a new subtopic',
      schema: z.object({
        topicId: z.string().cuid2(),
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        orderIndex: z.number().int().default(0),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Subtopic created successfully',
      schema: contentCreationResponseSchema,
    }),
  },
});
export type CreateSubtopic = typeof createSubtopic;

// Save/Update Note Draft
export const saveNoteDraft = createRoute({
  path: '/notes/{id}',
  method: 'put',
  tags,
  request: {
    params: z.object({
      id: z.string().cuid2(),
    }),
    body: jsonReqContentRequired({
      description: 'Save note draft (auto-save)',
      schema: z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        content: z.string().min(1),
        contentType: z.enum(['MARKDOWN', 'HTML', 'TEXT']).default('MARKDOWN'),
        topicId: z.string().cuid2(),
        subtopicId: z.string().cuid2().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Draft saved successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          id: z.string(),
          title: z.string(),
          status: z.literal('DRAFT'),
          lastSavedAt: z.date().nullable(),
        }),
      }),
    }),
  },
});
export type SaveNoteDraft = typeof saveNoteDraft;

// Publish Content
export const publishContent = createRoute({
  path: '/publish/{id}',
  method: 'post',
  tags,
  request: {
    params: z.object({
      id: z.string().cuid2(),
    }),
    body: jsonReqContentRequired({
      description: 'Publish content',
      schema: z.object({
        publishNow: z.boolean().default(true),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Content published or sent for review',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          id: z.string(),
          from: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']),
          to: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']),
          publishedAt: z.union([z.string(), z.date()]).nullable().optional(),
          submittedAt: z.union([z.string(), z.date()]).nullable().optional(),
        }),
        contribution: z
          .object({
            cpEarned: z.number(),
            xpEarned: z.number(),
          })
          .optional(),
      }),
    }),
  },
});
export type PublishContent = typeof publishContent;

// Get Contribution Dashboard
export const getContributionDashboard = createRoute({
  path: '/dashboard',
  method: 'get',
  tags: ['Contribution'],
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'User contribution dashboard',
      schema: z.object({
        success: z.boolean(),
        data: z.object({
          user: z.object({
            id: z.string(),
            contributionPoints: z.number(),
            xp: z.number(),
            isTrusted: z.boolean(),
            rank: z.string(),
          }),
          stats: z.object({
            totalContributions: z.number(),
            published: z.number(),
            pending: z.number(),
            rejected: z.number(),
            drafts: z.number(),
          }),
          recentActivity: z.array(
            z.object({
              id: z.string(),
              action: z.string(),
              cpDelta: z.number(),
              xpDelta: z.number(),
              referenceId: z.string().nullable(),
              createdAt: z.date().nullable(),
            }),
          ),
          pending: z.array(
            z.object({
              id: z.string(),
              type: z.string(),
              title: z.string(),
              submittedAt: z.date().nullable(),
              status: z.string(),
            }),
          ),
          drafts: z.array(
            z.object({
              id: z.string(),
              type: z.string(),
              title: z.string(),
              lastSavedAt: z.date().nullable(),
            }),
          ),
        }),
      }),
    }),
  },
});
export type GetContributionDashboard = typeof getContributionDashboard;
