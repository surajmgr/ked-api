import { jsonContentRaw, jsonReqContentRequired } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, NOT_FOUND_RESPONSE, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { buildParams } from '@/schema/req.schema';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Moderation'];

// Get Pending Review Tasks
export const getPendingTasks = createRoute({
  path: '/pending',
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
      description: 'List of pending review tasks',
      schema: z.object({
        success: z.boolean(),
        data: z.array(
          z.object({
            taskId: z.string(),
            contentId: z.string(),
            contentType: z.string(),
            title: z.string(),
            author: z.object({
              id: z.string(),
              cp: z.number(),
              xp: z.number(),
            }),
            submittedAt: z.date().nullable(),
            priority: z.number(),
          }),
        ),
      }),
    }),
  },
});
export type GetPendingTasks = typeof getPendingTasks;

// Get Review Task Details
export const getTaskDetails = createRoute({
  path: '/{taskId}',
  method: 'get',
  tags,
  request: {
    params: buildParams({
      taskId: z.cuid2(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Review task details',
      schema: z.object({
        success: z.boolean(),
        data: z.object({
          taskId: z.string(),
          content: z.object({
            id: z.string(),
            type: z.string(),
            title: z.string(),
            content: z.string().optional(),
            metadata: z.record(z.string(), z.unknown()).optional(),
          }),
          author: z.object({
            id: z.string(),
            cp: z.number(),
            xp: z.number(),
            contributionHistory: z.object({
              published: z.number(),
              rejected: z.number(),
            }),
          }),
          context: z.object({
            book: z.string().optional(),
            topic: z.string().optional(),
            subtopic: z.string().optional(),
          }),
          submittedAt: z.date().nullable(),
        }),
      }),
    }),
  },
});
export type GetTaskDetails = typeof getTaskDetails;

// Approve Content
export const approveContent = createRoute({
  path: '/{taskId}/approve',
  method: 'post',
  tags,
  request: {
    params: buildParams({
      taskId: z.cuid2(),
    }),
    body: jsonReqContentRequired({
      description: 'Approval feedback',
      schema: z.object({
        feedback: z.string().max(1000).optional(),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Content approved successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          taskId: z.string(),
          contentId: z.string(),
          newStatus: z.string(),
          reviewedAt: z.date(),
        }),
        authorNotification: z.object({
          sent: z.boolean(),
          cpAwarded: z.number(),
          xpAwarded: z.number(),
        }),
      }),
    }),
  },
});
export type ApproveContent = typeof approveContent;

// Reject Content
export const rejectContent = createRoute({
  path: '/{taskId}/reject',
  method: 'post',
  tags,
  request: {
    params: buildParams({
      taskId: z.cuid2(),
    }),
    body: jsonReqContentRequired({
      description: 'Rejection reason and suggestions',
      schema: z.object({
        reason: z.string().min(10).max(1000),
        suggestions: z.array(z.string()).max(10).optional(),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Content rejected successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          taskId: z.string(),
          contentId: z.string(),
          newStatus: z.string(),
          reviewedAt: z.date(),
        }),
        authorNotification: z.object({
          sent: z.boolean(),
          cpDeducted: z.number(),
        }),
      }),
    }),
  },
});
export type RejectContent = typeof rejectContent;
