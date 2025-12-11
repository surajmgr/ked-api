import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';
import type { GetPendingTasks, GetTaskDetails, ApproveContent, RejectContent } from './moderation.route';
import { reviewTasks, books, topics, notes, subtopics, type Note } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export const getPendingTasks: AppRouteHandler<GetPendingTasks> = async (c) => {
  const moderationService = c.var.moderationService;
  if (!moderationService) {
    throw new ApiError('Moderation system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const { limit, cursor } = c.req.valid('query');

  const tasks = await moderationService.getPendingTasks({ limit, cursor });

  return c.json(
    {
      success: true,
      data: tasks,
    },
    HttpStatusCodes.OK,
  );
};

export const getTaskDetails: AppRouteHandler<GetTaskDetails> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { taskId } = c.req.valid('param');

  const gamificationService = c.var.gamificationService;
  if (!gamificationService) {
    throw new ApiError('Gamification system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Get task
  const [task] = await client.select().from(reviewTasks).where(eq(reviewTasks.id, taskId)).limit(1);

  if (!task) {
    throw new ApiError('Review task not found', HttpStatusCodes.NOT_FOUND);
  }

  // Get content based on type
  const contentTable =
    task.contentType === 'book'
      ? books
      : task.contentType === 'topic'
        ? topics
        : task.contentType === 'subtopic'
          ? subtopics
          : notes;

  const [content] = await client.select().from(contentTable).where(eq(contentTable.id, task.contentId)).limit(1);

  if (!content) {
    throw new ApiError('Content not found', HttpStatusCodes.NOT_FOUND);
  }

  // Get author stats
  const authorPoints = await gamificationService.getUserPoints(task.authorId);

  // Get author contribution history
  const [publishedCount] = await client
    .select({ count: count() })
    .from(notes)
    .where(and(eq(notes.authorId, task.authorId), eq(notes.status, 'PUBLISHED')));

  const [rejectedCount] = await client
    .select({ count: count() })
    .from(notes)
    .where(and(eq(notes.authorId, task.authorId), eq(notes.status, 'REJECTED')));

  // Get context (book/topic/subtopic hierarchy)
  const context: {
    book?: string;
    topic?: string;
    subtopic?: string;
  } = {};
  if (task.contentType === 'note') {
    const note = content as Note;
    const [topic] = await client.select().from(topics).where(eq(topics.id, note.topicId)).limit(1);
    if (topic) {
      context.topic = topic.title;
      const [book] = await client.select().from(books).where(eq(books.id, topic.bookId)).limit(1);
      if (book) {
        context.book = book.title;
      }
    }
    if (note.subtopicId) {
      const [subtopic] = await client.select().from(subtopics).where(eq(subtopics.id, note.subtopicId)).limit(1);
      if (subtopic) {
        context.subtopic = subtopic.title;
      }
    }
  }

  return c.json(
    {
      success: true,
      data: {
        taskId: task.id,
        content: {
          id: content.id,
          type: task.contentType,
          title: content.title,
          content: (content as { content: string }).content,
          metadata: {},
        },
        author: {
          id: task.authorId,
          cp: authorPoints.cp,
          xp: authorPoints.xp,
          contributionHistory: {
            published: publishedCount.count,
            rejected: rejectedCount.count,
          },
        },
        context,
        submittedAt: task.createdAt,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const approveContent: AppRouteHandler<ApproveContent> = async (c) => {
  const { user } = await getCurrentSession(c, true);
  const { taskId } = c.req.valid('param');
  const { feedback } = c.req.valid('json');

  const moderationService = c.var.moderationService;
  if (!moderationService) {
    throw new ApiError('Moderation system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const result = await moderationService.approveContent({
    taskId,
    reviewedBy: user.id,
    feedback,
  });

  return c.json(
    {
      success: true,
      message: 'Content approved successfully',
      data: {
        taskId,
        contentId: result.contentId,
        newStatus: result.newStatus,
        reviewedAt: new Date(),
      },
      authorNotification: {
        sent: true, // TODO: Implement actual notification
        cpAwarded: result.cpAwarded,
        xpAwarded: result.xpAwarded,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const rejectContent: AppRouteHandler<RejectContent> = async (c) => {
  const { user } = await getCurrentSession(c, true);
  const { taskId } = c.req.valid('param');
  const { reason, suggestions } = c.req.valid('json');

  const moderationService = c.var.moderationService;
  if (!moderationService) {
    throw new ApiError('Moderation system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const result = await moderationService.rejectContent({
    taskId,
    reviewedBy: user.id,
    reason,
    suggestions,
  });

  return c.json(
    {
      success: true,
      message: 'Content rejected successfully',
      data: {
        taskId,
        contentId: result.contentId,
        newStatus: result.newStatus,
        reviewedAt: new Date(),
      },
      authorNotification: {
        sent: true, // TODO: Implement actual notification
        cpDeducted: result.cpDeducted,
      },
    },
    HttpStatusCodes.OK,
  );
};
