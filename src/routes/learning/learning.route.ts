import { jsonContentRaw, jsonReqContentRequired } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, NOT_FOUND_RESPONSE, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Learning'];

// Update Progress
export const updateProgress = createRoute({
  path: '/progress/:noteId',
  method: 'post',
  tags,
  request: {
    params: z.object({
      noteId: z.string().cuid2(),
    }),
    body: jsonReqContentRequired({
      description: 'Update learning progress',
      schema: z.object({
        status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
        readingTimeSeconds: z.number().int().min(0).optional(),
        bookmarked: z.boolean().optional(),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Progress updated successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          noteId: z.string(),
          status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
          readingTimeSeconds: z.number(),
          completedAt: z.date().nullable(),
          bookmarked: z.boolean(),
        }),
      }),
    }),
  },
});
export type UpdateProgress = typeof updateProgress;

// Get Learning Dashboard
export const getLearningDashboard = createRoute({
  path: '/dashboard',
  method: 'get',
  tags,
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'User learning dashboard',
      schema: z.object({
        success: z.boolean(),
        data: z.object({
          stats: z.object({
            totalNotes: z.number(),
            completed: z.number(),
            inProgress: z.number(),
            totalReadingTime: z.number(),
            streak: z.number(),
          }),
          recentlyRead: z.array(
            z.object({
              noteId: z.string(),
              noteTitle: z.string(),
              topicTitle: z.string(),
              bookTitle: z.string(),
              lastReadAt: z.date().nullable(),
              status: z.string(),
              progress: z.number(),
            }),
          ),
          bookmarks: z.array(
            z.object({
              noteId: z.string(),
              noteTitle: z.string(),
              topicTitle: z.string(),
              bookTitle: z.string(),
              bookmarkedAt: z.date().nullable(),
            }),
          ),
          recommendations: z.array(
            z.object({
              noteId: z.string(),
              noteTitle: z.string(),
              reason: z.string(),
            }),
          ),
        }),
      }),
    }),
  },
});
export type GetLearningDashboard = typeof getLearningDashboard;

// Get Learning History
export const getLearningHistory = createRoute({
  path: '/history',
  method: 'get',
  tags,
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'User learning history',
      schema: z.object({
        success: z.boolean(),
        data: z.array(
          z.object({
            noteId: z.string(),
            noteTitle: z.string(),
            topicTitle: z.string(),
            bookTitle: z.string(),
            status: z.string(),
            startedAt: z.date().nullable(),
            completedAt: z.date().nullable(),
            readingTimeSeconds: z.number(),
          }),
        ),
      }),
    }),
  },
});
export type GetLearningHistory = typeof getLearningHistory;

// Get Note Progress
export const getNoteProgress = createRoute({
  path: '/progress/:noteId',
  method: 'get',
  tags,
  request: {
    params: z.object({
      noteId: z.string().cuid2(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Note progress details',
      schema: z.object({
        success: z.boolean(),
        data: z.object({
          noteId: z.string(),
          status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
          startedAt: z.date().nullable(),
          completedAt: z.date().nullable(),
          lastReadAt: z.date().nullable(),
          readingTimeSeconds: z.number(),
          bookmarked: z.boolean(),
        }),
      }),
    }),
  },
});
export type GetNoteProgress = typeof getNoteProgress;
