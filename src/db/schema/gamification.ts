import { pgTable, text, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { criteriaTypeEnum, categoryTypeEnum, activityTypeEnum } from './enums';

// ==================== Rank Table ====================
export const ranks = pgTable(
  'ranks',
  {
    id: cuid2('id').primaryKey(),
    name: text('name').notNull().unique(),
    minReputation: integer('min_reputation').notNull(),
    maxReputation: integer('max_reputation'),
    description: text('description'),
    color: text('color').notNull().default('#808080'),
    icon: text('icon'),
    privileges: text('privileges').array(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_rank_name').on(table.name),
    index('idx_rank_reputation').on(table.minReputation, table.maxReputation),
  ],
);

export const selectRankSchema = createSelectSchema(ranks);
export const insertRankSchema = createInsertSchema(ranks, {
  name: (s) => s.min(1).max(100),
  minReputation: (s) => s.min(0),
  maxReputation: (s) => s.min(0).optional(),
  color: (s) => s.regex(/^#[0-9A-F]{6}$/i),
  privileges: z.array(z.string()).optional(),
}).omit({ id: true, createdAt: true });
export const updateRankSchema = insertRankSchema.partial();

// ==================== Achievement Table ====================
export const achievements = pgTable(
  'achievements',
  {
    id: cuid2('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    badgeIcon: text('badge_icon'),
    badgeColor: text('badge_color').notNull().default('#FFD700'),
    criteriaType: criteriaTypeEnum('criteria_type').notNull(),
    criteriaValue: integer('criteria_value').notNull(),
    category: categoryTypeEnum('category').notNull().default('GENERAL'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_achievement_criteria').on(table.criteriaType),
    index('idx_achievement_category').on(table.category),
  ],
);

export const selectAchievementSchema = createSelectSchema(achievements);
export const insertAchievementSchema = createInsertSchema(achievements, {
  name: (s) => s.min(1).max(100),
  description: (s) => s.max(500).optional(),
  badgeColor: (s) => s.regex(/^#[0-9A-F]{6}$/i),
  criteriaValue: (s) => s.min(1),
}).omit({ id: true, createdAt: true });
export const updateAchievementSchema = insertAchievementSchema.partial();

// ==================== UserAchievement Table ====================
export const userAchievements = pgTable(
  'user_achievements',
  {
    id: cuid2('id').primaryKey(),
    userId: text('user_id').notNull(),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_user_achievement_unique').on(table.userId, table.achievementId),
    index('idx_user_achievement_user').on(table.userId),
    index('idx_user_achievement_achievement').on(table.achievementId),
    index('idx_user_achievement_earned').on(table.earnedAt),
  ],
);

export const selectUserAchievementSchema = createSelectSchema(userAchievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true });
export const updateUserAchievementSchema = insertUserAchievementSchema.partial();

// ==================== UserActivity Table ====================
export const userActivities = pgTable(
  'user_activities',
  {
    id: cuid2('id').primaryKey(),
    userId: text('user_id').notNull(),
    activityType: activityTypeEnum('activity_type').notNull(),
    pointsEarned: integer('points_earned').notNull().default(0),
    referenceId: text('reference_id'),
    referenceType: text('reference_type'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_user_activity_user').on(table.userId),
    index('idx_user_activity_type').on(table.activityType),
    index('idx_user_activity_created').on(table.createdAt),
    index('idx_user_activity_reference').on(table.referenceType, table.referenceId),
  ],
);

export const selectUserActivitySchema = createSelectSchema(userActivities);
export const insertUserActivitySchema = createInsertSchema(userActivities, {
  pointsEarned: (s) => s.min(0),
}).omit({ id: true, createdAt: true });
export const updateUserActivitySchema = insertUserActivitySchema.partial();
