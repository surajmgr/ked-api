import { pgEnum } from 'drizzle-orm/pg-core';

// Auth related enums
export const authRoles = ['USER', 'ADMIN', 'SUPERADMIN'] as const;
export const authRoleEnum = pgEnum('auth_role', authRoles);

// Content related enums
export const difficultyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export const difficultyLevelEnum = pgEnum('difficulty_level', difficultyLevels);

export const contentTypes = ['MARKDOWN', 'HTML', 'TEXT'] as const;
export const contentTypeEnum = pgEnum('content_type', contentTypes);

// Cross-entity/resource enums (polymorphic tables)
export const resourceTypes = ['BOOK', 'TOPIC', 'SUBTOPIC', 'NOTE', 'QUESTION', 'ANSWER'] as const;
export const resourceTypeEnum = pgEnum('resource_type', resourceTypes);
export const uploadTypes = ['BOOK_COVER', 'PROFILE_PICTURE', 'MESSAGE', 'CONTENT', 'OTHER'] as const;
export const uploadTypeEnum = pgEnum('upload_type', uploadTypes);
export type UploadType = (typeof uploadTypes)[number];

// Visibility/access enums
export const contentVisibilities = ['PUBLIC', 'UNLISTED', 'PRIVATE'] as const;
export const contentVisibilityEnum = pgEnum('content_visibility', contentVisibilities);
export const accessLevels = ['FREE', 'PREMIUM', 'PAID'] as const;
export const accessLevelEnum = pgEnum('access_level', accessLevels);

// Interaction enums
export const voteTypes = ['UPVOTE', 'DOWNVOTE'] as const;
export const voteTypeEnum = pgEnum('vote_type', voteTypes);

// Notification enums
export const notificationTypes = [
  'FOLLOW',
  'NEW_QUESTION',
  'NEW_ANSWER',
  'NEW_NOTE',
  'VOTE',
  'ACHIEVEMENT',
  'MENTION',
] as const;
export const notificationTypeEnum = pgEnum('notification_type', notificationTypes);

// Collaboration enums
export const collaboratorRoles = ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'] as const;
export const collaboratorRoleEnum = pgEnum('collaborator_role', collaboratorRoles);
export const reactionTypes = ['LIKE', 'CLAP', 'HELPFUL', 'BOOKMARK'] as const;
export const reactionTypeEnum = pgEnum('reaction_type', reactionTypes);

// Activity and gamification enums
export const activityTypes = [
  'QUESTION_ASKED',
  'ANSWER_GIVEN',
  'NOTE_SHARED',
  'VOTE_CAST',
  'COMMENT_MADE',
  'CONTENT_FOLLOWED',
] as const;
export const activityTypeEnum = pgEnum('activity_type', activityTypes);

export const criteriaTypes = [
  'CONTRIBUTION_COUNT',
  'REPUTATION',
  'STREAK',
  'QUESTION_COUNT',
  'ANSWER_COUNT',
  'NOTE_COUNT',
  'UPVOTE_COUNT',
] as const;
export const criteriaTypeEnum = pgEnum('criteria_type', criteriaTypes);

export const categoryTypes = [
  'GENERAL',
  'ENGAGEMENT',
  'CONTRIBUTION',
  'CONTENT_CREATION',
  'COMMUNITY_SUPPORT',
  'LEARNING',
  'MILESTONE',
  'GAMIFICATION',
  'SOCIAL',
] as const;
export const categoryTypeEnum = pgEnum('category_type', categoryTypes);

// Content status enum
export const contentStatuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'] as const;
export const contentStatusEnum = pgEnum('content_status', contentStatuses);

// Review action enum
export const reviewActions = ['APPROVE', 'REJECT'] as const;
export const reviewActionEnum = pgEnum('review_action', reviewActions);

// Contribution action enum
export const contributionActions = [
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
] as const;
export const contributionActionEnum = pgEnum('contribution_action', contributionActions);

// Progress status enum
export const progressStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export const progressStatusEnum = pgEnum('progress_status', progressStatuses);

// Review task status enum
export const reviewStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const reviewStatusEnum = pgEnum('review_status', reviewStatuses);

// Commerce/billing enums
export const productTypes = ['ONE_TIME', 'SUBSCRIPTION'] as const;
export const productTypeEnum = pgEnum('product_type', productTypes);
export const billingIntervals = ['DAY', 'WEEK', 'MONTH', 'YEAR'] as const;
export const billingIntervalEnum = pgEnum('billing_interval', billingIntervals);
export const orderStatuses = ['DRAFT', 'PENDING_PAYMENT', 'PAID', 'CANCELED', 'REFUNDED'] as const;
export const orderStatusEnum = pgEnum('order_status', orderStatuses);
export const paymentProviders = ['STRIPE', 'RAZORPAY', 'PAYPAL', 'MANUAL'] as const;
export const paymentProviderEnum = pgEnum('payment_provider', paymentProviders);
export const paymentStatuses = [
  'REQUIRES_PAYMENT_METHOD',
  'REQUIRES_CONFIRMATION',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
  'REFUNDED',
] as const;
export const paymentStatusEnum = pgEnum('payment_status', paymentStatuses);
export const refundStatuses = ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED'] as const;
export const refundStatusEnum = pgEnum('refund_status', refundStatuses);
export const subscriptionStatuses = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE'] as const;
export const subscriptionStatusEnum = pgEnum('subscription_status', subscriptionStatuses);
