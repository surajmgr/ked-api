import { pgTable, text, timestamp, boolean, real, smallint, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { notificationTypeEnum } from './enums';
import { books, topics, subtopics, notes } from './content';

// ==================== Follow Table ====================
export const follows = pgTable(
  'follows',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    followerId: text('follower_id').notNull(),
    followingId: text('following_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_follow_unique').on(table.followerId, table.followingId),
    index('idx_follow_follower').on(table.followerId),
    index('idx_follow_following').on(table.followingId),
    index('idx_follow_created').on(table.createdAt),
  ],
);

export const selectFollowSchema = createSelectSchema(follows);
export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});
export const updateFollowSchema = insertFollowSchema.partial();

// ==================== ContentFollow Table ====================
export const contentFollows = pgTable(
  'content_follows',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    bookId: text('book_id').references(() => books.id, { onDelete: 'cascade' }),
    topicId: text('topic_id').references(() => topics.id, {
      onDelete: 'cascade',
    }),
    subtopicId: text('subtopic_id').references(() => subtopics.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_content_follow_user').on(table.userId),
    index('idx_content_follow_book').on(table.bookId),
    index('idx_content_follow_topic').on(table.topicId),
    index('idx_content_follow_subtopic').on(table.subtopicId),
    index('idx_content_follow_created').on(table.createdAt),
  ],
);

export const selectContentFollowSchema = createSelectSchema(contentFollows);
export const insertContentFollowSchema = createInsertSchema(contentFollows).omit({ id: true, createdAt: true });
export const updateContentFollowSchema = insertContentFollowSchema.partial();

// ==================== Notification Table ====================
export const notifications = pgTable(
  'notifications',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message'),
    referenceId: text('reference_id'),
    referenceType: text('reference_type'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_notification_user').on(table.userId),
    index('idx_notification_type').on(table.type),
    index('idx_notification_read').on(table.isRead),
    index('idx_notification_user_read').on(table.userId, table.isRead),
    index('idx_notification_created').on(table.createdAt),
    index('idx_notification_reference').on(table.referenceType, table.referenceId),
  ],
);

export const selectNotificationSchema = createSelectSchema(notifications);
export const insertNotificationSchema = createInsertSchema(notifications, {
  title: (s) => s.min(1).max(255),
  message: (s) => s.max(1000).optional(),
}).omit({ id: true, createdAt: true });
export const updateNotificationSchema = insertNotificationSchema.partial();

// ==================== NotePurchase Table ====================
export const notePurchases = pgTable(
  'note_purchases',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    buyerId: text('buyer_id').notNull(),
    purchasePrice: real('purchase_price').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_note_purchase_unique').on(table.noteId, table.buyerId),
    index('idx_note_purchase_note').on(table.noteId),
    index('idx_note_purchase_buyer').on(table.buyerId),
    index('idx_note_purchase_created').on(table.createdAt),
  ],
);

export const selectNotePurchaseSchema = createSelectSchema(notePurchases);
export const insertNotePurchaseSchema = createInsertSchema(notePurchases, {
  purchasePrice: (s) => s.min(0),
}).omit({ id: true, createdAt: true });
export const updateNotePurchaseSchema = insertNotePurchaseSchema.partial();

// ==================== NoteRating Table ====================
export const noteRatings = pgTable(
  'note_ratings',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    rating: smallint('rating').notNull(),
    review: text('review'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('idx_note_rating_unique').on(table.noteId, table.userId),
    index('idx_note_rating_note').on(table.noteId),
    index('idx_note_rating_user').on(table.userId),
    index('idx_note_rating_value').on(table.rating),
    index('idx_note_rating_created').on(table.createdAt),
  ],
);

export const selectNoteRatingSchema = createSelectSchema(noteRatings);
export const insertNoteRatingSchema = createInsertSchema(noteRatings, {
  rating: (s) => s.min(1).max(5),
  review: (s) => s.max(2000).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateNoteRatingSchema = insertNoteRatingSchema.partial();
