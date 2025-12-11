import { pgTable, text, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { progressStatusEnum } from './enums';
import { notes } from './content';
import { timestampMs } from './utils';
import type z from 'zod';
import type { SQL } from 'drizzle-orm';

// ==================== User Progress Table ====================
// Learning progress tracking
export const userProgress = pgTable(
  'user_progress',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(), // References Auth MS user
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    status: progressStatusEnum('status').notNull().default('NOT_STARTED'),
    startedAt: timestampMs('started_at'),
    completedAt: timestampMs('completed_at'),
    lastReadAt: timestampMs('last_read_at'),
    readingTimeSeconds: integer('reading_time_seconds').notNull().default(0),
    bookmarked: boolean('bookmarked').notNull().default(false),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    uniqueIndex('idx_user_progress_unique').on(table.userId, table.noteId),
    index('idx_user_progress_user').on(table.userId),
    index('idx_user_progress_note').on(table.noteId),
    index('idx_user_progress_status').on(table.status),
    index('idx_user_progress_bookmarked').on(table.bookmarked),
    index('idx_user_progress_last_read').on(table.lastReadAt),
  ],
);

export const selectUserProgressSchema = createSelectSchema(userProgress);
export const insertUserProgressSchema = createInsertSchema(userProgress, {
  readingTimeSeconds: (s) => s.min(0),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserProgressSchema = insertUserProgressSchema.partial();

export type UpdateUserProgressSchema = {
  [K in keyof z.infer<typeof updateUserProgressSchema>]: z.infer<typeof updateUserProgressSchema>[K] | SQL<unknown>;
};
