import { jsonContentRaw, jsonReqContentRequired } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES, NOT_FOUND_RESPONSE, VALIDATION_ERROR_RESPONSE } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { createRoute, z } from '@hono/zod-openapi';

const tags = ['Q&A'];

// Ask Question
export const askQuestion = createRoute({
  path: '/questions',
  method: 'post',
  tags,
  request: {
    body: jsonReqContentRequired({
      description: 'Ask a new question',
      schema: z.object({
        title: z.string().min(10).max(255),
        content: z.string().min(20),
        topicId: z.string().cuid2(),
        subtopicId: z.string().cuid2().optional(),
        tags: z.array(z.string()).max(5).optional(),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Question created successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          id: z.string(),
          slug: z.string(),
          title: z.string(),
          createdAt: z.date().nullable(),
        }),
        contribution: z.object({
          cpEarned: z.number(),
          xpEarned: z.number(),
        }),
      }),
    }),
  },
});
export type AskQuestion = typeof askQuestion;

// Answer Question
export const answerQuestion = createRoute({
  path: '/questions/:questionId/answers',
  method: 'post',
  tags,
  request: {
    params: z.object({
      questionId: z.string().cuid2(),
    }),
    body: jsonReqContentRequired({
      description: 'Answer a question',
      schema: z.object({
        content: z.string().min(20),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.CREATED]: jsonContentRaw({
      description: 'Answer created successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          id: z.string(),
          content: z.string(),
          createdAt: z.date().nullable(),
        }),
        contribution: z.object({
          cpEarned: z.number(),
          xpEarned: z.number(),
        }),
      }),
    }),
  },
});
export type AnswerQuestion = typeof answerQuestion;

// Vote on Content
export const vote = createRoute({
  path: '/{type}/{id}/vote',
  method: 'post',
  tags,
  request: {
    params: z.object({
      type: z.enum(['questions', 'answers']),
      id: z.string().cuid2(),
    }),
    body: jsonReqContentRequired({
      description: 'Vote on question or answer',
      schema: z.object({
        voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
      }),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    ...VALIDATION_ERROR_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Vote recorded successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          id: z.string(),
          voteType: z.string(),
          votesCount: z.number(),
        }),
        authorContribution: z
          .object({
            cpChange: z.number(),
          })
          .optional(),
      }),
    }),
  },
});
export type Vote = typeof vote;

// Accept Answer
export const acceptAnswer = createRoute({
  path: '/questions/:questionId/accept/:answerId',
  method: 'post',
  tags,
  request: {
    params: z.object({
      questionId: z.string().cuid2(),
      answerId: z.string().cuid2(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Answer accepted successfully',
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.object({
          questionId: z.string(),
          answerId: z.string(),
          isSolved: z.boolean(),
        }),
        authorContribution: z.object({
          cpEarned: z.number(),
          xpEarned: z.number(),
        }),
      }),
    }),
  },
});
export type AcceptAnswer = typeof acceptAnswer;

// List Questions
export const listQuestions = createRoute({
  path: '/questions',
  method: 'get',
  tags,
  request: {
    query: z.object({
      topicId: z.string().cuid2().optional(),
      subtopicId: z.string().cuid2().optional(),
      solved: z.coerce.boolean().optional(),
      sortBy: z.enum(['recent', 'votes', 'views', 'unanswered']).default('recent'),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'List of questions',
      schema: z.object({
        success: z.boolean(),
        data: z.array(
          z.object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            content: z.string(),
            topicId: z.string(),
            subtopicId: z.string().nullable(),
            authorId: z.string(),
            isSolved: z.boolean(),
            viewsCount: z.number(),
            votesCount: z.number(),
            answersCount: z.number(),
            tags: z.array(z.string()).nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        ),
      }),
    }),
  },
});
export type ListQuestions = typeof listQuestions;

// Get Question Details
export const getQuestion = createRoute({
  path: '/questions/:questionId',
  method: 'get',
  tags,
  request: {
    params: z.object({
      questionId: z.string().cuid2(),
    }),
  },
  responses: {
    ...GLOBAL_RESPONSES,
    ...NOT_FOUND_RESPONSE,
    [HttpStatusCodes.OK]: jsonContentRaw({
      description: 'Question details with answers',
      schema: z.object({
        success: z.boolean(),
        data: z.object({
          question: z.object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            content: z.string(),
            topicId: z.string(),
            subtopicId: z.string().nullable(),
            authorId: z.string(),
            isSolved: z.boolean(),
            viewsCount: z.number(),
            votesCount: z.number(),
            answersCount: z.number(),
            tags: z.array(z.string()).nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
          answers: z.array(
            z.object({
              id: z.string(),
              questionId: z.string(),
              content: z.string(),
              authorId: z.string(),
              votesCount: z.number(),
              isAccepted: z.boolean(),
              createdAt: z.date().nullable(),
            }),
          ),
        }),
      }),
    }),
  },
});
export type GetQuestion = typeof getQuestion;
