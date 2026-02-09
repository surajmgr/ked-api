import { pgTable, text, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { resourceTypeEnum } from './enums';
import { timestampMs } from './utils';

// ==================== Tags ====================
export const tags = pgTable(
  'tags',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [index('idx_tags_slug').on(table.slug), index('idx_tags_name').on(table.name)],
);

export const selectTagSchema = createSelectSchema(tags);
export const insertTagSchema = createInsertSchema(tags, {
  slug: (s) => s.min(1).max(100),
  name: (s) => s.min(1).max(100),
  description: (s) => s.max(1000).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateTagSchema = insertTagSchema.partial();

// ==================== Content Tags (Polymorphic) ====================
export const contentTags = pgTable(
  'content_tags',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    resourceType: resourceTypeEnum('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    uniqueIndex('idx_content_tags_unique').on(table.tagId, table.resourceType, table.resourceId),
    index('idx_content_tags_tag').on(table.tagId),
    index('idx_content_tags_resource').on(table.resourceType, table.resourceId),
  ],
);

export const selectContentTagSchema = createSelectSchema(contentTags);
export const insertContentTagSchema = createInsertSchema(contentTags).omit({ id: true, createdAt: true });

// Optional: allow users to follow tags later (kept for future API evolution).
export const userTagFollows = pgTable(
  'user_tag_follows',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    uniqueIndex('idx_user_tag_follows_unique').on(table.userId, table.tagId),
    index('idx_user_tag_follows_user').on(table.userId),
    index('idx_user_tag_follows_tag').on(table.tagId),
  ],
);

export const selectUserTagFollowSchema = createSelectSchema(userTagFollows);
export const insertUserTagFollowSchema = createInsertSchema(userTagFollows).omit({ id: true, createdAt: true });
