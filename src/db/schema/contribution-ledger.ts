import { pgTable, text, integer, index } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { contributionActionEnum } from './enums';
import { timestampMs } from './utils';

// ==================== Contribution Ledger Table ====================
// Immutable ledger for all CP/XP transactions
export const contributionLedger = pgTable(
  'contribution_ledger',
  {
    id: cuid2('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(), // References Auth MS user
    action: contributionActionEnum('action').notNull(),
    cpDelta: integer('cp_delta').notNull(),
    xpDelta: integer('xp_delta').notNull(),
    referenceId: text('reference_id'), // content/answer/question id
    referenceType: text('reference_type'), // 'note', 'answer', 'question', 'book', 'topic'
    metadata: text('metadata'), // JSON string for additional data
    createdAt: timestampMs('created_at'),
  },
  (table) => [
    index('idx_contribution_ledger_user').on(table.userId),
    index('idx_contribution_ledger_action').on(table.action),
    index('idx_contribution_ledger_created').on(table.createdAt),
    index('idx_contribution_ledger_reference').on(table.referenceType, table.referenceId),
  ],
);

export const selectContributionLedgerSchema = createSelectSchema(contributionLedger);
export const insertContributionLedgerSchema = createInsertSchema(contributionLedger, {
  cpDelta: (s) => s.int(),
  xpDelta: (s) => s.int(),
}).omit({ id: true, createdAt: true });
