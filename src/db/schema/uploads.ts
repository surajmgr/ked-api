import { pgTable, text, integer, index } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestampMs } from './utils';

// ==================== User Uploads Table ====================
// Tracks file uploads for rate limiting and history
export const userUploads = pgTable(
  'user_uploads',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(), // References Auth MS user
    fileSize: integer('file_size').notNull(), // Size in bytes
    mimeType: text('mime_type').notNull(),
    uploadType: text('upload_type').notNull(), // 'profile', 'content', 'message', 'other'
    providerPublicId: text('provider_public_id'), // Cloudinary public_id
    url: text('url').notNull(),
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    index('idx_user_uploads_user').on(table.userId),
    index('idx_user_uploads_type').on(table.uploadType),
    index('idx_user_uploads_created').on(table.createdAt),
  ],
);

export const selectUserUploadSchema = createSelectSchema(userUploads);
export const insertUserUploadSchema = createInsertSchema(userUploads, {
  fileSize: (s) => s.int().min(0),
}).omit({ id: true, createdAt: true });
