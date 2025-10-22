import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { cuid2 } from 'drizzle-cuid2/postgres';

export const example = pgTable('example', {
  id: cuid2('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
});

export const selectExampleSchema = createSelectSchema(example);
export const insertExampleSchema = createInsertSchema(example, {
  name: (s) => s.min(3).max(50),
}).omit({ id: true });
export const updateExampleSchema = insertExampleSchema.partial();
