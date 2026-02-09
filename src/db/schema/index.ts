// Export all enums
export * from './enums';

// Export content schemas
export * from './content';

// Export Q&A schemas
export * from './qa';

// Export gamification schemas
export * from './gamification';

// Export social schemas
export * from './social';

// Export collaboration & taxonomy schemas
export * from './collaboration';
export * from './taxonomy';

// Export commerce schemas
export * from './commerce';

// Export example schemas;
export * from './example';

// Export contribution system schemas
export * from './user-profiles';
export * from './contribution-ledger';
export * from './review-tasks';
export * from './user-progress';

// Re-export commonly used types for convenience
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Content types
import type { grades, books, gradeBooks, topics, subtopics, notes } from './content';

export type Grade = InferSelectModel<typeof grades>;
export type InsertGrade = InferInsertModel<typeof grades>;

export type Book = InferSelectModel<typeof books>;
export type InsertBook = InferInsertModel<typeof books>;

export type GradeBook = InferSelectModel<typeof gradeBooks>;
export type InsertGradeBook = InferInsertModel<typeof gradeBooks>;

export type Topic = InferSelectModel<typeof topics>;
export type InsertTopic = InferInsertModel<typeof topics>;

export type Subtopic = InferSelectModel<typeof subtopics>;
export type InsertSubtopic = InferInsertModel<typeof subtopics>;

export type Note = InferSelectModel<typeof notes>;
export type InsertNote = InferInsertModel<typeof notes>;

// Q&A types
import type { questions, answers, votes, comments } from './qa';

export type Question = InferSelectModel<typeof questions>;
export type InsertQuestion = InferInsertModel<typeof questions>;

export type Answer = InferSelectModel<typeof answers>;
export type InsertAnswer = InferInsertModel<typeof answers>;

export type Vote = InferSelectModel<typeof votes>;
export type InsertVote = InferInsertModel<typeof votes>;

export type Comment = InferSelectModel<typeof comments>;
export type InsertComment = InferInsertModel<typeof comments>;

// Example types
import type { example } from './example';

export type Example = InferSelectModel<typeof example>;
export type InsertExample = InferInsertModel<typeof example>;

// Gamification types
import type { ranks, achievements, userAchievements, userActivities } from './gamification';

export type Rank = InferSelectModel<typeof ranks>;
export type InsertRank = InferInsertModel<typeof ranks>;

export type Achievement = InferSelectModel<typeof achievements>;
export type InsertAchievement = InferInsertModel<typeof achievements>;

export type UserAchievement = InferSelectModel<typeof userAchievements>;
export type InsertUserAchievement = InferInsertModel<typeof userAchievements>;

export type UserActivity = InferSelectModel<typeof userActivities>;
export type InsertUserActivity = InferInsertModel<typeof userActivities>;

// Social types
import type { follows, contentFollows, notifications, notePurchases, noteRatings } from './social';

export type Follow = InferSelectModel<typeof follows>;
export type InsertFollow = InferInsertModel<typeof follows>;

export type ContentFollow = InferSelectModel<typeof contentFollows>;
export type InsertContentFollow = InferInsertModel<typeof contentFollows>;

export type Notification = InferSelectModel<typeof notifications>;
export type InsertNotification = InferInsertModel<typeof notifications>;

export type NotePurchase = InferSelectModel<typeof notePurchases>;
export type InsertNotePurchase = InferInsertModel<typeof notePurchases>;

export type NoteRating = InferSelectModel<typeof noteRatings>;
export type InsertNoteRating = InferInsertModel<typeof noteRatings>;

// Collaboration & taxonomy types
import type {
  noteDocuments,
  noteRevisions,
  noteCollaborators,
  contentComments,
  contentReactions,
} from './collaboration';
import type { tags, contentTags, userTagFollows } from './taxonomy';

export type NoteDocument = InferSelectModel<typeof noteDocuments>;
export type InsertNoteDocument = InferInsertModel<typeof noteDocuments>;

export type NoteRevision = InferSelectModel<typeof noteRevisions>;
export type InsertNoteRevision = InferInsertModel<typeof noteRevisions>;

export type NoteCollaborator = InferSelectModel<typeof noteCollaborators>;
export type InsertNoteCollaborator = InferInsertModel<typeof noteCollaborators>;

export type ContentComment = InferSelectModel<typeof contentComments>;
export type InsertContentComment = InferInsertModel<typeof contentComments>;

export type ContentReaction = InferSelectModel<typeof contentReactions>;
export type InsertContentReaction = InferInsertModel<typeof contentReactions>;

export type Tag = InferSelectModel<typeof tags>;
export type InsertTag = InferInsertModel<typeof tags>;

export type ContentTag = InferSelectModel<typeof contentTags>;
export type InsertContentTag = InferInsertModel<typeof contentTags>;

export type UserTagFollow = InferSelectModel<typeof userTagFollows>;
export type InsertUserTagFollow = InferInsertModel<typeof userTagFollows>;

// Commerce types
import type {
  products,
  productPrices,
  productContentGrants,
  orders,
  orderItems,
  payments,
  refunds,
  subscriptions,
  entitlements,
} from './commerce';

export type Product = InferSelectModel<typeof products>;
export type InsertProduct = InferInsertModel<typeof products>;

export type ProductPrice = InferSelectModel<typeof productPrices>;
export type InsertProductPrice = InferInsertModel<typeof productPrices>;

export type ProductContentGrant = InferSelectModel<typeof productContentGrants>;
export type InsertProductContentGrant = InferInsertModel<typeof productContentGrants>;

export type Order = InferSelectModel<typeof orders>;
export type InsertOrder = InferInsertModel<typeof orders>;

export type OrderItem = InferSelectModel<typeof orderItems>;
export type InsertOrderItem = InferInsertModel<typeof orderItems>;

export type Payment = InferSelectModel<typeof payments>;
export type InsertPayment = InferInsertModel<typeof payments>;

export type Refund = InferSelectModel<typeof refunds>;
export type InsertRefund = InferInsertModel<typeof refunds>;

export type Subscription = InferSelectModel<typeof subscriptions>;
export type InsertSubscription = InferInsertModel<typeof subscriptions>;

export type Entitlement = InferSelectModel<typeof entitlements>;
export type InsertEntitlement = InferInsertModel<typeof entitlements>;

// Contribution system types
import type { userProfiles } from './user-profiles';
import type { contributionLedger } from './contribution-ledger';
import type { reviewTasks } from './review-tasks';
import type { userProgress } from './user-progress';

export type UserProfile = InferSelectModel<typeof userProfiles>;
export type InsertUserProfile = InferInsertModel<typeof userProfiles>;

export type ContributionLedger = InferSelectModel<typeof contributionLedger>;
export type InsertContributionLedger = InferInsertModel<typeof contributionLedger>;

export type ReviewTask = InferSelectModel<typeof reviewTasks>;
export type InsertReviewTask = InferInsertModel<typeof reviewTasks>;

export type UserProgress = InferSelectModel<typeof userProgress>;
export type InsertUserProgress = InferInsertModel<typeof userProgress>;
