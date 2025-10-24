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

// Export example schemas;
export * from './example';

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
