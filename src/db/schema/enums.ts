import { pgEnum } from 'drizzle-orm/pg-core';

// Auth related enums
export const authRoleEnum = pgEnum('auth_role', ['USER', 'ADMIN', 'SUPERADMIN']);

// Content related enums
export const difficultyLevelEnum = pgEnum('difficulty_level', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const contentTypeEnum = pgEnum('content_type', ['MARKDOWN', 'HTML', 'TEXT']);

// Cross-entity/resource enums (polymorphic tables)
export const resourceTypeEnum = pgEnum('resource_type', ['BOOK', 'TOPIC', 'SUBTOPIC', 'NOTE', 'QUESTION', 'ANSWER']);

// Visibility/access enums
export const contentVisibilityEnum = pgEnum('content_visibility', ['PUBLIC', 'UNLISTED', 'PRIVATE']);
export const accessLevelEnum = pgEnum('access_level', ['FREE', 'PREMIUM', 'PAID']);

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

// Collaboration enums
export const collaboratorRoleEnum = pgEnum('collaborator_role', ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER']);
export const reactionTypeEnum = pgEnum('reaction_type', ['LIKE', 'CLAP', 'HELPFUL', 'BOOKMARK']);

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

// Commerce/billing enums
export const productTypeEnum = pgEnum('product_type', ['ONE_TIME', 'SUBSCRIPTION']);
export const billingIntervalEnum = pgEnum('billing_interval', ['DAY', 'WEEK', 'MONTH', 'YEAR']);
export const orderStatusEnum = pgEnum('order_status', [
  'DRAFT',
  'PENDING_PAYMENT',
  'PAID',
  'CANCELED',
  'REFUNDED',
]);
export const paymentProviderEnum = pgEnum('payment_provider', ['STRIPE', 'RAZORPAY', 'PAYPAL', 'MANUAL']);
export const paymentStatusEnum = pgEnum('payment_status', [
  'REQUIRES_PAYMENT_METHOD',
  'REQUIRES_CONFIRMATION',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'REFUNDED',
]);
export const refundStatusEnum = pgEnum('refund_status', ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'INCOMPLETE',
]);
