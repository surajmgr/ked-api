import { insertBookSchema } from '@/db/schema';
import {
  jsonContentRaw,
  jsonReqContentRequired,
  jsonContentWithPagination,
  jsonContentBase,
} from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { idParamsSchema } from '@/schema/req.schema';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Content Creation'];

const contentCreationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']),
      createdAt: z.union([z.string(), z.date()]).nullable(),
    })
    .optional(),
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

const paginationQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  category: z.string().optional(),
});

// List Books
export const listBooks = createRoute({
  path: '/public/books',
  method: 'get',
  tags,
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'List of books',
      schema: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          description: z.string().nullable(),
          coverImage: z.string().nullable(),
          author: z.string().nullable(),
          difficultyLevel: z.string(),
          category: z.string().nullable(),
          createdAt: z.union([z.string(), z.date()]).nullable(),
        }),
      ),
    }),
  },
});
export type ListBooks = typeof listBooks;

// List Topics
export const listTopics = createRoute({
  path: '/public/topics',
  method: 'get',
  tags,
  request: {
    query: paginationQuerySchema.extend({
      bookId: z.string().optional(),
      bookSlug: z.string().optional(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'List of topics',
      schema: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          description: z.string().nullable(),
          orderIndex: z.number(),
          createdAt: z.union([z.string(), z.date()]).nullable(),
        }),
      ),
    }),
  },
});
export type ListTopics = typeof listTopics;

// List Subtopics
export const listSubtopics = createRoute({
  path: '/public/subtopics',
  method: 'get',
  tags,
  request: {
    query: paginationQuerySchema.extend({
      topicId: z.string().optional(),
      topicSlug: z.string().optional(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentWithPagination({
      description: 'List of subtopics',
      schema: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          description: z.string().nullable(),
          orderIndex: z.number(),
          createdAt: z.union([z.string(), z.date()]).nullable(),
        }),
      ),
    }),
  },
});
export type ListSubtopics = typeof listSubtopics;

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
        bookId: z.cuid(),
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
        topicId: z.cuid(),
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

// Bulk Create Topics
export const createBulkTopics = createRoute({
  path: '/topics/bulk',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Create multiple topics',
      schema: z.object({
        bookId: z.string(),
        topics: z.array(
          z.object({
            title: z.string().min(1).max(255),
            slug: z.string().min(1).max(255),
            description: z.string().max(2000).optional(),
            orderIndex: z.number().int().default(0),
          }),
        ),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Topics created successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            status: z.string(),
          }),
        ),
      }),
    }),
  },
});
export type CreateBulkTopics = typeof createBulkTopics;

// Bulk Create Subtopics
export const createBulkSubtopics = createRoute({
  path: '/subtopics/bulk',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Create multiple subtopics',
      schema: z.object({
        topicId: z.string(),
        subtopics: z.array(
          z.object({
            title: z.string().min(1).max(255),
            slug: z.string().min(1).max(255),
            description: z.string().max(2000).optional(),
            orderIndex: z.number().int().default(0),
          }),
        ),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Subtopics created successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            status: z.string(),
          }),
        ),
      }),
    }),
  },
});
export type CreateBulkSubtopics = typeof createBulkSubtopics;

// Create Note
export const createNote = createRoute({
  path: '/notes',
  method: 'post',
  tags: ['Notes'],
  request: {
    body: jsonReqContentRequired({
      description: 'Create a new note',
      schema: z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        content: z.string().min(1),
        contentType: z.enum(['MARKDOWN', 'HTML', 'TEXT']).default('MARKDOWN'),
        topicId: z.string(),
        subtopicId: z.string().optional(),
        isPublic: z.boolean().default(true),
        isPremium: z.boolean().default(false),
        price: z.number().default(0),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Note created successfully',
      schema: contentCreationResponseSchema,
    }),
  },
});
export type CreateNote = typeof createNote;

// Get Note (Hybrid)
export const getNote = createRoute({
  path: '/hybrid/notes/{id}',
  method: 'get',
  tags: ['Notes'],
  request: {
    params: idParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Note details',
      schema: z.object({
        success: z.boolean(),
        data: z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          content: z.string(), // Content might be truncated if premium and not owned/paid
          contentType: z.string(),
          author: z.object({
            id: z.string(),
            name: z.string().nullable(),
          }),
          isPublic: z.boolean(),
          isPremium: z.boolean(),
          price: z.number(),
          createdAt: z.union([z.string(), z.date()]).nullable(),
          // User specific flags
          isUnlocked: z.boolean(),
          isLiked: z.boolean(),
        }),
      }),
    }),
  },
});
export type GetNote = typeof getNote;

// Delete Note
export const deleteNote = createRoute({
  path: '/notes/{id}',
  method: 'delete',
  tags: ['Notes'],
  request: {
    params: idParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentBase({
      description: 'Note deleted successfully',
    }),
  },
});
export type DeleteNote = typeof deleteNote;

// Similar Content
export const getSimilarContent = createRoute({
  path: '/public/notes/{id}/similar',
  method: 'get',
  tags: ['Recommendation'],
  request: {
    params: idParamsSchema,
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Similar content recommendations',
      schema: z.object({
        success: z.boolean(),
        data: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            slug: z.string(),
            type: z.enum(['note', 'book', 'topic']),
            similarity: z.number().optional(), // 0-1 score
          }),
        ),
      }),
    }),
  },
});
export type GetSimilarContent = typeof getSimilarContent;

// Save/Update Note Draft
export const saveNoteDraft = createRoute({
  path: '/notes/{id}',
  method: 'put',
  tags,
  request: {
    params: idParamsSchema,
    body: jsonReqContentRequired({
      description: 'Save note draft (auto-save)',
      schema: z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        content: z.string().min(1),
        contentType: z.enum(['MARKDOWN', 'HTML', 'TEXT']).default('MARKDOWN'),
        topicId: z.cuid(),
        subtopicId: z.cuid().optional(),
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
    params: idParamsSchema,
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
