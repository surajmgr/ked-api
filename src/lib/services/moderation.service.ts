import type { DrizzleClient } from '@/db';
import { reviewTasks, books, topics, notes, subtopics, grades, gradeBooks, notifications } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { ILogger } from '../providers/interfaces';
import type { GamificationService } from './gamification.service';
import type { TypesenseService } from './typesense.service';

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
  typesenseService?: TypesenseService,
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

      // Fetch content title for notifications (cheap select)
      const [contentRow] = await db
        .select({ title: contentTable.title })
        .from(contentTable)
        .where(eq(contentTable.id, task.contentId))
        .limit(1);
      const contentTitle = contentRow?.title ?? 'Content';

      // Update Typesense with PUBLISHED status
      if (typesenseService) {
        // Fetch full content for upsert
        const [content] = await db.select().from(contentTable).where(eq(contentTable.id, task.contentId)).limit(1);

        if (content) {
          if (
            task.contentType === 'note' ||
            task.contentType === 'book' ||
            task.contentType === 'topic' ||
            task.contentType === 'subtopic'
          ) {
            // Fetch grades based on content type
            let gradesArray: string[] | undefined;
            let bookIdValue: string | undefined;
            let topicIdValue: string | undefined;

            if (task.contentType === 'book') {
              const gradeData = await db
                .select({
                  gradeName: sql`${db.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
                })
                .from(gradeBooks)
                .where(eq(gradeBooks.bookId, content.id));

              const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];
              const tempGrades: string[] = [];
              if ('category' in content && content.category) tempGrades.push(content.category as string);
              if ('difficultyLevel' in content && content.difficultyLevel)
                tempGrades.push(content.difficultyLevel as string);
              tempGrades.push(...gradeNames);
              if (tempGrades.length > 0) gradesArray = tempGrades;
            } else if (task.contentType === 'topic') {
              // biome-ignore lint/suspicious/noExplicitAny: required for type inference
              bookIdValue = (content as any).bookId;
              const parentBook = await db.query.books.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: required for type inference
                where: eq(books.id, (content as any).bookId),
                columns: { category: true, difficultyLevel: true },
              });
              const gradeData = await db
                .select({
                  gradeName: sql`${db.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
                })
                .from(gradeBooks)
                // biome-ignore lint/suspicious/noExplicitAny: required for type inference
                .where(eq(gradeBooks.bookId, (content as any).bookId));

              const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];
              const tempGrades: string[] = [];
              if (parentBook?.category) tempGrades.push(parentBook.category);
              if (parentBook?.difficultyLevel) tempGrades.push(parentBook.difficultyLevel);
              tempGrades.push(...gradeNames);
              if (tempGrades.length > 0) gradesArray = tempGrades;
            } else if (task.contentType === 'subtopic') {
              // biome-ignore lint/suspicious/noExplicitAny: required for type inference
              topicIdValue = (content as any).topicId;
              const parentTopic = await db.query.topics.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: required for type inference
                where: eq(topics.id, (content as any).topicId),
                columns: { bookId: true },
              });
              if (parentTopic) {
                const parentBook = await db.query.books.findFirst({
                  where: eq(books.id, parentTopic.bookId),
                  columns: { category: true, difficultyLevel: true },
                });
                const gradeData = await db
                  .select({
                    gradeName: sql`${db.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
                  })
                  .from(gradeBooks)
                  .where(eq(gradeBooks.bookId, parentTopic.bookId));

                const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];
                const tempGrades: string[] = [];
                if (parentBook?.category) tempGrades.push(parentBook.category);
                if (parentBook?.difficultyLevel) tempGrades.push(parentBook.difficultyLevel);
                tempGrades.push(...gradeNames);
                if (tempGrades.length > 0) gradesArray = tempGrades;
              }
            } else if (task.contentType === 'note') {
              // biome-ignore lint/suspicious/noExplicitAny: required for type inference
              topicIdValue = (content as any).topicId;
              const parentTopic = await db.query.topics.findFirst({
                // biome-ignore lint/suspicious/noExplicitAny: required for type inference
                where: eq(topics.id, (content as any).topicId),
                columns: { bookId: true },
              });
              if (parentTopic) {
                const parentBook = await db.query.books.findFirst({
                  where: eq(books.id, parentTopic.bookId),
                  columns: { category: true, difficultyLevel: true },
                });
                const gradeData = await db
                  .select({
                    gradeName: sql`${db.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
                  })
                  .from(gradeBooks)
                  .where(eq(gradeBooks.bookId, parentTopic.bookId));

                const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];
                const tempGrades: string[] = [];
                if (parentBook?.category) tempGrades.push(parentBook.category);
                if (parentBook?.difficultyLevel) tempGrades.push(parentBook.difficultyLevel);
                tempGrades.push(...gradeNames);
                if (tempGrades.length > 0) gradesArray = tempGrades;
              }
            }

            await typesenseService.upsertDocuments('content', [
              {
                id: content.id,
                title: content.title,
                slug: content.slug,
                description: 'description' in content ? content.description || undefined : undefined,
                content:
                  task.contentType === 'note' && 'content' in content && content.content
                    ? (content.content as string).substring(0, 1000)
                    : undefined,
                type: task.contentType,
                status: 'PUBLISHED',
                createdAt: content.createdAt ? new Date(content.createdAt).getTime() : Date.now(),
                bookId: bookIdValue,
                topicId: topicIdValue,
                grades: gradesArray,
                coverImage:
                  task.contentType === 'book' && 'coverImage' in content && content.coverImage
                    ? (content.coverImage as string)
                    : undefined,
                popularityScore: 0,
              },
            ]);
          }
        }
      }

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

      // Notify author (in-app notification)
      try {
        await db.insert(notifications).values({
          userId: task.authorId,
          type: 'ACHIEVEMENT',
          title: `${task.contentType.toUpperCase()} approved`,
          message:
            feedback && feedback.trim().length > 0
              ? feedback.trim()
              : `Your ${task.contentType} "${contentTitle}" was approved.`,
          referenceId: task.contentId,
          referenceType: task.contentType,
        });
      } catch (error) {
        logger.error('Failed to create approval notification', {
          taskId,
          contentId: task.contentId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

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

      // Fetch content title for notifications
      const [contentRow] = await db
        .select({ title: contentTable.title })
        .from(contentTable)
        .where(eq(contentTable.id, task.contentId))
        .limit(1);
      const contentTitle = contentRow?.title ?? 'Content';

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

      // Notify author (in-app notification)
      try {
        const suggestionText = suggestions && suggestions.length > 0 ? ` Suggestions: ${suggestions.join(' • ')}` : '';
        await db.insert(notifications).values({
          userId: task.authorId,
          type: 'ACHIEVEMENT',
          title: `${task.contentType.toUpperCase()} rejected`,
          message: `Your ${task.contentType} "${contentTitle}" was rejected. Reason: ${reason}.${suggestionText}`,
          referenceId: task.contentId,
          referenceType: task.contentType,
        });
      } catch (error) {
        logger.error('Failed to create rejection notification', {
          taskId,
          contentId: task.contentId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return {
        contentId: task.contentId,
        newStatus: 'REJECTED',
        cpDeducted: Math.abs(result.cpDelta),
      };
    },
  };
}
