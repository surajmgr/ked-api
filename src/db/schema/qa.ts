import { pgTable, text, timestamp, boolean, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { voteTypeEnum } from './enums';
import { topics, subtopics } from './content';

// ==================== Question Table ====================
export const questions = pgTable(
  'questions',
  {
    id: cuid2('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    topicId: text('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    subtopicId: text('subtopic_id').references(() => subtopics.id, {
      onDelete: 'cascade',
    }),
    authorId: text('author_id').notNull(),
    isSolved: boolean('is_solved').notNull().default(false),
    viewsCount: integer('views_count').notNull().default(0),
    votesCount: integer('votes_count').notNull().default(0),
    answersCount: integer('answers_count').notNull().default(0),
    tags: text('tags').array(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_question_slug').on(table.slug),
    index('idx_question_topic').on(table.topicId),
    index('idx_question_subtopic').on(table.subtopicId),
    index('idx_question_author').on(table.authorId),
    index('idx_question_solved').on(table.isSolved),
    index('idx_question_votes').on(table.votesCount),
    index('idx_question_views').on(table.viewsCount),
    index('idx_question_created').on(table.createdAt),
    index('idx_question_tags').using('gin', table.tags),
  ],
);

export const selectQuestionSchema = createSelectSchema(questions);
export const insertQuestionSchema = createInsertSchema(questions, {
  title: (s) => s.min(5).max(255),
  slug: (s) => s.min(1).max(255),
  content: (s) => s.min(10),
  tags: z.array(z.string()).max(10).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateQuestionSchema = insertQuestionSchema.partial();

// ==================== Answer Table ====================
export const answers = pgTable(
  'answers',
  {
    id: cuid2('id').primaryKey(),
    content: text('content').notNull(),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    authorId: text('author_id').notNull(),
    isAccepted: boolean('is_accepted').notNull().default(false),
    votesCount: integer('votes_count').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_answer_question').on(table.questionId),
    index('idx_answer_author').on(table.authorId),
    index('idx_answer_accepted').on(table.isAccepted),
    index('idx_answer_votes').on(table.votesCount),
    index('idx_answer_created').on(table.createdAt),
  ],
);

export const selectAnswerSchema = createSelectSchema(answers);
export const insertAnswerSchema = createInsertSchema(answers, {
  content: (s) => s.min(10),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateAnswerSchema = insertAnswerSchema.partial();

// ==================== Vote Table ====================
export const votes = pgTable(
  'votes',
  {
    id: cuid2('id').primaryKey(),
    userId: text('user_id').notNull(),
    questionId: text('question_id').references(() => questions.id, {
      onDelete: 'cascade',
    }),
    answerId: text('answer_id').references(() => answers.id, {
      onDelete: 'cascade',
    }),
    voteType: voteTypeEnum('vote_type').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_vote_user_question').on(table.userId, table.questionId),
    uniqueIndex('idx_vote_user_answer').on(table.userId, table.answerId),
    index('idx_vote_user').on(table.userId),
    index('idx_vote_question').on(table.questionId),
    index('idx_vote_answer').on(table.answerId),
  ],
);

export const selectVoteSchema = createSelectSchema(votes);
export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});
export const updateVoteSchema = insertVoteSchema.partial();

// ==================== Comment Table ====================
export const comments = pgTable(
  'comments',
  {
    id: cuid2('id').primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    authorId: text('author_id').notNull(),
    content: text('content').notNull(),
    parentCommentId: text('parent_comment_id'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_comment_note').on(table.noteId),
    index('idx_comment_author').on(table.authorId),
    index('idx_comment_parent').on(table.parentCommentId),
    index('idx_comment_created').on(table.createdAt),
  ],
);

export const selectCommentSchema = createSelectSchema(comments);
export const insertCommentSchema = createInsertSchema(comments, {
  content: (s) => s.min(1).max(2000),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateCommentSchema = insertCommentSchema.partial();
