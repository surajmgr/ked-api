/**
 * Contribution System Configuration
 * Central configuration for CP/XP rewards and thresholds
 */

export const CONTRIBUTION_CONFIG = {
  // Trust threshold - CP required to become a trusted contributor
  TRUST_THRESHOLD: 100,

  // Daily caps to prevent abuse
  CP_DAILY_CAP: 500,
  XP_DAILY_CAP: 1000,

  // CP/XP rewards for different actions
  REWARDS: {
    // Content creation
    CREATE_BOOK: { cp: 10, xp: 15 },
    CREATE_TOPIC: { cp: 5, xp: 8 },
    CREATE_SUBTOPIC: { cp: 3, xp: 5 },
    CREATE_NOTE: { cp: 5, xp: 10 },
    READ_NOTE: { cp: 1, xp: 2 },

    // Q&A
    ANSWER_QUESTION: { cp: 2, xp: 5 },
    QUESTION_ASKED: { cp: 1, xp: 2 },
    ANSWER_ACCEPTED: { cp: 5, xp: 10 }, // When your answer is accepted

    // Engagement
    UPVOTE_RECEIVED: { cp: 1, xp: 1 },
    DOWNVOTE_RECEIVED: { cp: -1, xp: 0 }, // Penalty for downvotes

    // Moderation
    CONTENT_APPROVED: { cp: 5, xp: 10 }, // When your content is approved
    CONTENT_REJECTED: { cp: -2, xp: 0 }, // Penalty for rejected content
    MODERATE_CONTENT: { cp: 1, xp: 2 }, // For moderators reviewing content
  },

  // Cache TTL (in seconds)
  CACHE_TTL: 3600, // 1 hour
} as const;

export type ContributionAction = keyof typeof CONTRIBUTION_CONFIG.REWARDS;
