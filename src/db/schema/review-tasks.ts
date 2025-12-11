import { pgTable, text, integer, index } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { reviewStatusEnum } from './enums';
import { timestampMs } from './utils';

// ==================== Review Tasks Table ====================
// Moderation queue for pending content
export const reviewTasks = pgTable(
  'review_tasks',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    contentId: text('content_id').notNull(),
    contentType: text('content_type').notNull(), // 'book', 'note', 'topic', 'subtopic'
    authorId: text('author_id').notNull(), // References Auth MS user
    status: reviewStatusEnum('status').notNull().default('PENDING'),
    reviewedBy: text('reviewed_by'), // Moderator user ID
    reviewedAt: timestampMs('reviewed_at'),
    rejectionReason: text('rejection_reason'),
    priority: integer('priority').notNull().default(0),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_review_task_content').on(table.contentId),
    index('idx_review_task_author').on(table.authorId),
    index('idx_review_task_status').on(table.status),
    index('idx_review_task_priority').on(table.priority),
    index('idx_review_task_created').on(table.createdAt),
    index('idx_review_task_reviewer').on(table.reviewedBy),
  ],
);

export const selectReviewTaskSchema = createSelectSchema(reviewTasks);
export const insertReviewTaskSchema = createInsertSchema(reviewTasks, {
  priority: (s) => s.min(0).max(10),
  rejectionReason: (s) => s.min(10).max(1000).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateReviewTaskSchema = insertReviewTaskSchema.partial();
