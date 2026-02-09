import { pgTable, text, integer, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { collaboratorRoleEnum, reactionTypeEnum, resourceTypeEnum } from './enums';
import { notes } from './content';
import { nullableTimestampMs, timestampMs } from './utils';

// ==================== Note Documents ====================
// Source-of-truth collaborative document per note (store JSON from your editor: Lexical/ProseMirror/etc).
export const noteDocuments = pgTable(
  'note_documents',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    contentJson: jsonb('content_json').$type<Record<string, unknown>>().notNull(),
    contentText: text('content_text'),
    version: integer('version').notNull().default(1),
    updatedBy: text('updated_by'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    uniqueIndex('idx_note_documents_note_unique').on(table.noteId),
    index('idx_note_documents_version').on(table.noteId, table.version),
  ],
);

export const selectNoteDocumentSchema = createSelectSchema(noteDocuments);
export const insertNoteDocumentSchema = createInsertSchema(noteDocuments, {
  contentJson: () => z.record(z.string(), z.unknown()),
  version: (s) => s.int().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateNoteDocumentSchema = insertNoteDocumentSchema.partial();

// ==================== Note Revisions ====================
// Append-only snapshots (useful for audit, rollback, diffing).
export const noteRevisions = pgTable(
  'note_revisions',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    contentJson: jsonb('content_json').$type<Record<string, unknown>>().notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    uniqueIndex('idx_note_revisions_unique').on(table.noteId, table.version),
    index('idx_note_revisions_note').on(table.noteId),
    index('idx_note_revisions_created_by').on(table.createdBy),
    index('idx_note_revisions_created').on(table.createdAt),
  ],
);

export const selectNoteRevisionSchema = createSelectSchema(noteRevisions);
export const insertNoteRevisionSchema = createInsertSchema(noteRevisions, {
  version: (s) => s.int().min(1),
  contentJson: () => z.record(z.string(), z.unknown()),
}).omit({ id: true, createdAt: true });

// ==================== Note Collaborators ====================
export const noteCollaborators = pgTable(
  'note_collaborators',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: collaboratorRoleEnum('role').notNull().default('VIEWER'),
    addedBy: text('added_by').notNull(),
    addedAt: timestampMs('added_at'),
    removedAt: nullableTimestampMs('removed_at'),
  },
  (table) => [
    uniqueIndex('idx_note_collaborators_unique').on(table.noteId, table.userId),
    index('idx_note_collaborators_note').on(table.noteId),
    index('idx_note_collaborators_user').on(table.userId),
    index('idx_note_collaborators_role').on(table.role),
  ],
);

export const selectNoteCollaboratorSchema = createSelectSchema(noteCollaborators);
export const insertNoteCollaboratorSchema = createInsertSchema(noteCollaborators).omit({
  id: true,
  addedAt: true,
  removedAt: true,
});
export const updateNoteCollaboratorSchema = insertNoteCollaboratorSchema.partial();

// ==================== Content Comments (Polymorphic) ====================
// Works for notes/questions/answers/etc, and supports threading + note anchoring via anchorJson.
export const contentComments = pgTable(
  'content_comments',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    resourceType: resourceTypeEnum('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    authorId: text('author_id').notNull(),
    body: text('body').notNull(),
    parentId: text('parent_id'),
    anchorJson: jsonb('anchor_json').$type<Record<string, unknown>>(),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_content_comments_resource').on(table.resourceType, table.resourceId),
    index('idx_content_comments_author').on(table.authorId),
    index('idx_content_comments_parent').on(table.parentId),
    index('idx_content_comments_created').on(table.createdAt),
  ],
);

export const selectContentCommentSchema = createSelectSchema(contentComments);
export const insertContentCommentSchema = createInsertSchema(contentComments, {
  body: (s) => s.min(1).max(10000),
  anchorJson: () => z.record(z.string(), z.unknown()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateContentCommentSchema = insertContentCommentSchema.partial();

// ==================== Content Reactions (Polymorphic) ====================
export const contentReactions = pgTable(
  'content_reactions',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    resourceType: resourceTypeEnum('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    userId: text('user_id').notNull(),
    reaction: reactionTypeEnum('reaction').notNull(),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    uniqueIndex('idx_content_reactions_unique').on(table.resourceType, table.resourceId, table.userId, table.reaction),
    index('idx_content_reactions_resource').on(table.resourceType, table.resourceId),
    index('idx_content_reactions_user').on(table.userId),
  ],
);

export const selectContentReactionSchema = createSelectSchema(contentReactions);
export const insertContentReactionSchema = createInsertSchema(contentReactions).omit({ id: true, createdAt: true });
