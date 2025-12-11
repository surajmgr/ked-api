import type { DrizzleClient } from '@/db';
import { reviewTasks, books, topics, notes, subtopics } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { ILogger } from '../providers/interfaces';
import type { GamificationService } from './gamification.service';

export interface ModerationService {
  /**
   * Create a review task for pending content
   */
  createReviewTask(params: {
    contentId: string;
    contentType: 'book' | 'topic' | 'subtopic' | 'note';
    authorId: string;
    priority?: number;
  }): Promise<{
    taskId: string;
    status: string;
  }>;

  /**
   * Get pending review tasks
   */
  getPendingTasks(params: { limit?: number; cursor?: string }): Promise<
    Array<{
      taskId: string;
      contentId: string;
      contentType: string;
      title: string;
      author: {
        id: string;
        cp: number;
        xp: number;
      };
      submittedAt: Date | null;
      priority: number;
    }>
  >;

  /**
   * Approve content
   */
  approveContent(params: { taskId: string; reviewedBy: string; feedback?: string }): Promise<{
    contentId: string;
    newStatus: string;
    cpAwarded: number;
    xpAwarded: number;
  }>;

  /**
   * Reject content
   */
  rejectContent(params: { taskId: string; reviewedBy: string; reason: string; suggestions?: string[] }): Promise<{
    contentId: string;
    newStatus: string;
    cpDeducted: number;
  }>;
}

export function createModerationService(
  db: DrizzleClient,
  gamificationService: GamificationService,
  logger: ILogger,
): ModerationService {
  return {
    async createReviewTask({ contentId, contentType, authorId, priority = 0 }) {
      const [task] = await db
        .insert(reviewTasks)
        .values({
          contentId,
          contentType,
          authorId,
          priority,
          status: 'PENDING',
        })
        .returning();

      logger.info('Review task created', { taskId: task.id, contentId, contentType });

      return {
        taskId: task.id,
        status: task.status,
      };
    },

    async getPendingTasks({ limit = 20 }) {
      // Get pending tasks with content details
      const tasks = await db
        .select({
          taskId: reviewTasks.id,
          contentId: reviewTasks.contentId,
          contentType: reviewTasks.contentType,
          authorId: reviewTasks.authorId,
          submittedAt: reviewTasks.createdAt,
          priority: reviewTasks.priority,
        })
        .from(reviewTasks)
        .where(eq(reviewTasks.status, 'PENDING'))
        .orderBy(sql`${reviewTasks.priority} DESC, ${reviewTasks.createdAt} ASC`)
        .limit(limit);

      // Fetch content titles and author CP/XP
      const enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
          // Get content title based on type
          let title = 'Unknown';
          const contentTable =
            task.contentType === 'book'
              ? books
              : task.contentType === 'topic'
                ? topics
                : task.contentType === 'subtopic'
                  ? subtopics
                  : notes;

          const [content] = await db
            .select({ title: contentTable.title })
            .from(contentTable)
            .where(eq(contentTable.id, task.contentId))
            .limit(1);

          if (content) {
            title = content.title;
          }

          // Get author CP/XP
          const authorPoints = await gamificationService.getUserPoints(task.authorId);

          return {
            taskId: task.taskId,
            contentId: task.contentId,
            contentType: task.contentType,
            title,
            author: {
              id: task.authorId,
              cp: authorPoints.cp,
              xp: authorPoints.xp,
            },
            submittedAt: task.submittedAt,
            priority: task.priority,
          };
        }),
      );

      return enrichedTasks;
    },

    async approveContent({ taskId, reviewedBy, feedback }) {
      // Get task details
      const [task] = await db.select().from(reviewTasks).where(eq(reviewTasks.id, taskId)).limit(1);

      if (!task) {
        throw new Error('Review task not found');
      }

      if (task.status !== 'PENDING') {
        throw new Error('Task is not pending');
      }

      // Update task status
      await db
        .update(reviewTasks)
        .set({
          status: 'APPROVED',
          reviewedBy,
          reviewedAt: new Date(),
        })
        .where(eq(reviewTasks.id, taskId));

      // Update content status to PUBLISHED
      const contentTable =
        task.contentType === 'book'
          ? books
          : task.contentType === 'topic'
            ? topics
            : task.contentType === 'subtopic'
              ? subtopics
              : notes;

      await db.update(contentTable).set({ status: 'PUBLISHED' }).where(eq(contentTable.id, task.contentId));

      // Award CP/XP for approved content
      const action =
        task.contentType === 'book'
          ? 'CREATE_BOOK'
          : task.contentType === 'topic'
            ? 'CREATE_TOPIC'
            : task.contentType === 'subtopic'
              ? 'CREATE_SUBTOPIC'
              : 'CREATE_NOTE';

      const result = await gamificationService.awardPoints({
        userId: task.authorId,
        action,
        referenceId: task.contentId,
        referenceType: task.contentType,
        metadata: { approvedBy: reviewedBy, feedback },
      });

      // Also award for content approval
      await gamificationService.awardPoints({
        userId: task.authorId,
        action: 'CONTENT_APPROVED',
        referenceId: task.contentId,
        referenceType: task.contentType,
      });

      logger.info('Content approved', {
        taskId,
        contentId: task.contentId,
        cpAwarded: result.cpDelta,
      });

      // TODO: Send notification to author

      return {
        contentId: task.contentId,
        newStatus: 'PUBLISHED',
        cpAwarded: result.cpDelta,
        xpAwarded: result.xpDelta,
      };
    },

    async rejectContent({ taskId, reviewedBy, reason, suggestions }) {
      // Get task details
      const [task] = await db.select().from(reviewTasks).where(eq(reviewTasks.id, taskId)).limit(1);

      if (!task) {
        throw new Error('Review task not found');
      }

      if (task.status !== 'PENDING') {
        throw new Error('Task is not pending');
      }

      // Update task status
      await db
        .update(reviewTasks)
        .set({
          status: 'REJECTED',
          reviewedBy,
          reviewedAt: new Date(),
          rejectionReason: reason,
        })
        .where(eq(reviewTasks.id, taskId));

      // Update content status to REJECTED
      const contentTable =
        task.contentType === 'book'
          ? books
          : task.contentType === 'topic'
            ? topics
            : task.contentType === 'subtopic'
              ? subtopics
              : notes;

      await db.update(contentTable).set({ status: 'REJECTED' }).where(eq(contentTable.id, task.contentId));

      // Deduct CP for rejected content
      const result = await gamificationService.awardPoints({
        userId: task.authorId,
        action: 'CONTENT_REJECTED',
        referenceId: task.contentId,
        referenceType: task.contentType,
        metadata: { rejectedBy: reviewedBy, reason, suggestions },
      });

      logger.info('Content rejected', {
        taskId,
        contentId: task.contentId,
        cpDeducted: Math.abs(result.cpDelta),
      });

      // TODO: Send notification to author with feedback

      return {
        contentId: task.contentId,
        newStatus: 'REJECTED',
        cpDeducted: Math.abs(result.cpDelta),
      };
    },
  };
}
