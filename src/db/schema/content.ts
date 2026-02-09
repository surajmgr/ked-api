import { pgTable, text, boolean, integer, index, uniqueIndex, real, char, jsonb } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { accessLevelEnum, contentVisibilityEnum, difficultyLevelEnum, contentStatusEnum, contentTypeEnum } from './enums';
import z from 'zod';
import { nullableTimestampMs, timestampMs } from './utils';

// ==================== Grade Table ====================
export const grades = pgTable(
  'grades',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    orderIndex: integer('order_index').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by').notNull(),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_grade_active_order').on(table.isActive, table.orderIndex),
    index('idx_grade_slug').on(table.slug),
  ],
);

export const selectGradeSchema = createSelectSchema(grades);
export const insertGradeSchema = createInsertSchema(grades, {
  name: (s) => s.min(1).max(100),
  slug: (s) => s.min(1).max(100),
  description: (s) => s.max(500).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateGradeSchema = insertGradeSchema.partial();

// ==================== Book Table ====================
export const books = pgTable(
  'books',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    author: text('author'),
    isbn: text('isbn'),
    coverImage: text('cover_image'),
    category: text('category'),
    difficultyLevel: difficultyLevelEnum('difficulty_level').notNull().default('BEGINNER'),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    visibility: contentVisibilityEnum('visibility').notNull().default('PUBLIC'),
    accessLevel: accessLevelEnum('access_level').notNull().default('FREE'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    publishedAt: nullableTimestampMs('published_at'),
    archivedAt: nullableTimestampMs('archived_at'),
    deletedAt: nullableTimestampMs('deleted_at'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_book_active').on(table.isActive),
    index('idx_book_slug').on(table.slug),
    index('idx_book_category').on(table.category),
    index('idx_book_difficulty').on(table.difficultyLevel),
    index('idx_book_status').on(table.status),
    index('idx_book_visibility').on(table.visibility),
    index('idx_book_access_level').on(table.accessLevel),
    index('idx_book_created_by').on(table.createdBy),
  ],
);

// ==================== Book Schemas ====================
export const selectBookSchema = createSelectSchema(books);
export const insertBookSchema = createInsertSchema(books, {
  title: (s) => s.min(1).max(255),
  slug: (s) => s.min(1).max(255),
  description: (s) => s.max(2000).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateBookSchema = insertBookSchema.partial();

// ==================== GradeBook Junction Table ====================
export const gradeBooks = pgTable(
  'grade_books',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    gradeId: text('grade_id')
      .notNull()
      .references(() => grades.id, { onDelete: 'cascade' }),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by').notNull(),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    uniqueIndex('idx_gradebook_unique').on(table.gradeId, table.bookId),
    index('idx_gradebook_grade').on(table.gradeId),
    index('idx_gradebook_book').on(table.bookId),
    index('idx_gradebook_active_order').on(table.isActive, table.orderIndex),
  ],
);

export const selectGradeBookSchema = createSelectSchema(gradeBooks);
export const insertGradeBookSchema = createInsertSchema(gradeBooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateGradeBookSchema = insertGradeBookSchema.partial();

// ==================== Topic Table ====================
export const topics = pgTable(
  'topics',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull().default(0),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    visibility: contentVisibilityEnum('visibility').notNull().default('PUBLIC'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    publishedAt: nullableTimestampMs('published_at'),
    archivedAt: nullableTimestampMs('archived_at'),
    deletedAt: nullableTimestampMs('deleted_at'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    uniqueIndex('idx_topic_book_order').on(table.bookId, table.orderIndex),
    index('idx_topic_book_active_order').on(table.bookId, table.isActive, table.orderIndex),
    index('idx_topic_slug').on(table.slug),
    index('idx_topic_book').on(table.bookId),
    index('idx_topic_status').on(table.status),
    index('idx_topic_visibility').on(table.visibility),
    index('idx_topic_created_by').on(table.createdBy),
  ],
);

export const selectTopicSchema = createSelectSchema(topics);
export const insertTopicSchema = createInsertSchema(topics, {
  title: (s) => s.min(1).max(255),
  slug: (s) => s.min(1).max(255),
  description: (s) => s.max(2000).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateTopicSchema = insertTopicSchema.partial();

// ==================== Subtopic Table ====================
export const subtopics = pgTable(
  'subtopics',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    topicId: text('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull().default(0),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    visibility: contentVisibilityEnum('visibility').notNull().default('PUBLIC'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    publishedAt: nullableTimestampMs('published_at'),
    archivedAt: nullableTimestampMs('archived_at'),
    deletedAt: nullableTimestampMs('deleted_at'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    uniqueIndex('idx_subtopic_topic_order').on(table.topicId, table.orderIndex),
    index('idx_subtopic_topic_active_order').on(table.topicId, table.isActive, table.orderIndex),
    index('idx_subtopic_slug').on(table.slug),
    index('idx_subtopic_topic').on(table.topicId),
    index('idx_subtopic_status').on(table.status),
    index('idx_subtopic_visibility').on(table.visibility),
  ],
);

export const selectSubtopicSchema = createSelectSchema(subtopics);
export const insertSubtopicSchema = createInsertSchema(subtopics, {
  title: (s) => s.min(1).max(255),
  slug: (s) => s.min(1).max(255),
  description: (s) => s.max(2000).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateSubtopicSchema = insertSubtopicSchema.partial();

// ==================== Note Table ====================
export const notes = pgTable(
  'notes',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    contentJson: jsonb('content_json').$type<Record<string, unknown>>(),
    summary: text('summary'),
    contentType: contentTypeEnum('content_type').notNull().default('MARKDOWN'),
    topicId: text('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    subtopicId: text('subtopic_id').references(() => subtopics.id, {
      onDelete: 'cascade',
    }),
    authorId: text('author_id').notNull(),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    visibility: contentVisibilityEnum('visibility').notNull().default('PUBLIC'),
    accessLevel: accessLevelEnum('access_level').notNull().default('FREE'),
    isPublic: boolean('is_public').notNull().default(true),
    isPremium: boolean('is_premium').notNull().default(false),
    price: real('price').notNull().default(0.0),
    currency: char('currency', { length: 3 }).notNull().default('USD'),
    priceCents: integer('price_cents').notNull().default(0),
    downloadsCount: integer('downloads_count').notNull().default(0),
    ratingAvg: real('rating_avg').notNull().default(0.0),
    ratingCount: integer('rating_count').notNull().default(0),
    fileUrl: text('file_url'),
    publishedAt: nullableTimestampMs('published_at'),
    deletedAt: nullableTimestampMs('deleted_at'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_note_slug').on(table.slug),
    index('idx_note_topic').on(table.topicId),
    index('idx_note_subtopic').on(table.subtopicId),
    index('idx_note_author').on(table.authorId),
    index('idx_note_status').on(table.status),
    index('idx_note_visibility').on(table.visibility),
    index('idx_note_access_level').on(table.accessLevel),
    index('idx_note_public_premium').on(table.isPublic, table.isPremium),
    index('idx_note_rating').on(table.ratingAvg),
    index('idx_note_downloads').on(table.downloadsCount),
  ],
);

export const selectNoteSchema = createSelectSchema(notes);
export const insertNoteSchema = createInsertSchema(notes, {
  title: (s) => s.min(1).max(255),
  slug: (s) => s.min(1).max(255),
  content: (s) => s.min(1),
  contentJson: () => z.record(z.string(), z.unknown()).optional(),
  summary: (s) => s.max(2000).optional(),
  price: (s) => s.min(0),
  priceCents: (s) => s.int().min(0),
  fileUrl: () => z.string().url().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateNoteSchema = insertNoteSchema.partial();
