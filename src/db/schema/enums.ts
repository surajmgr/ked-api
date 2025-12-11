import { pgEnum } from 'drizzle-orm/pg-core';

// Auth related enums
export const authRoleEnum = pgEnum('auth_role', ['USER', 'ADMIN', 'SUPERADMIN']);

// Content related enums
export const difficultyLevelEnum = pgEnum('difficulty_level', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const contentTypeEnum = pgEnum('content_type', ['MARKDOWN', 'HTML', 'TEXT']);

// Interaction enums
export const voteTypeEnum = pgEnum('vote_type', ['UPVOTE', 'DOWNVOTE']);

// Notification enums
export const notificationTypeEnum = pgEnum('notification_type', [
  'FOLLOW',
  'NEW_QUESTION',
  'NEW_ANSWER',
  'NEW_NOTE',
  'VOTE',
  'ACHIEVEMENT',
  'MENTION',
]);

// Activity and gamification enums
export const activityTypeEnum = pgEnum('activity_type', [
  'QUESTION_ASKED',
  'ANSWER_GIVEN',
  'NOTE_SHARED',
  'VOTE_CAST',
  'COMMENT_MADE',
  'CONTENT_FOLLOWED',
]);

export const criteriaTypeEnum = pgEnum('criteria_type', [
  'CONTRIBUTION_COUNT',
  'REPUTATION',
  'STREAK',
  'QUESTION_COUNT',
  'ANSWER_COUNT',
  'NOTE_COUNT',
  'UPVOTE_COUNT',
]);

export const categoryTypeEnum = pgEnum('category_type', [
  'GENERAL',
  'ENGAGEMENT',
  'CONTRIBUTION',
  'CONTENT_CREATION',
  'COMMUNITY_SUPPORT',
  'LEARNING',
  'MILESTONE',
  'GAMIFICATION',
  'SOCIAL',
]);

// Content status enum
export const contentStatusEnum = pgEnum('content_status', ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']);

// Review action enum
export const reviewActionEnum = pgEnum('review_action', ['APPROVE', 'REJECT']);

// Contribution action enum
export const contributionActionEnum = pgEnum('contribution_action', [
  'CREATE_NOTE',
  'CREATE_BOOK',
  'CREATE_TOPIC',
  'CREATE_SUBTOPIC',
  'READ_NOTE',
  'ANSWER_QUESTION',
  'UPVOTE_RECEIVED',
  'DOWNVOTE_RECEIVED',
  'CONTENT_APPROVED',
  'CONTENT_REJECTED',
  'QUESTION_ASKED',
  'ANSWER_ACCEPTED',
  'MODERATE_CONTENT',
]);

// Progress status enum
export const progressStatusEnum = pgEnum('progress_status', ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);

// Review task status enum
export const reviewStatusEnum = pgEnum('review_status', ['PENDING', 'APPROVED', 'REJECTED']);
