import { pgTable, text, integer, boolean, index } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestampMs } from './utils';

// ==================== User Profile Table ====================
// KonnectEd-specific user data (separate from Auth MS)
export const userProfiles = pgTable(
  'user_profiles',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().unique(), // References Auth MS user
    displayName: text('display_name'),
    bio: text('bio'),
    avatar: text('avatar'),
    contributionPoints: integer('contribution_points').notNull().default(0),
    xp: integer('xp').notNull().default(0),
    trustedStatus: boolean('trusted_status').notNull().default(false),
    createdAt: timestampMs('created_at'),
    updatedAt: timestampMs('updated_at', true),
  },
  (table) => [
    index('idx_user_profile_user_id').on(table.userId),
    index('idx_user_profile_cp').on(table.contributionPoints),
    index('idx_user_profile_xp').on(table.xp),
    index('idx_user_profile_trusted').on(table.trustedStatus),
  ],
);

export const selectUserProfileSchema = createSelectSchema(userProfiles);
export const insertUserProfileSchema = createInsertSchema(userProfiles, {
  displayName: (s) => s.min(1).max(100).optional(),
  bio: (s) => s.max(500).optional(),
  contributionPoints: (s) => s.min(0),
  xp: (s) => s.min(0),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserProfileSchema = insertUserProfileSchema.partial();
