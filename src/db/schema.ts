import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { cuid2 } from 'drizzle-cuid2/postgres';

export function nowMs() {
  const d = new Date();
  d.setUTCMilliseconds(Math.floor(d.getUTCMilliseconds())); // ensure 3ms precision
  return d;
}

export function timestampMs(name: string, update = false) {
  if (update) return timestamp(name, { mode: 'date' })
    .notNull()
    .default(nowMs())
    .$onUpdate(() => nowMs());
  return timestamp(name, { mode: 'date' })
    .notNull()
    .default(nowMs())
}

export const example = pgTable('example', {
  id: cuid2('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestampMs('createdAt'), // NOTE: this must be used for proper cursor pagination
});

export const selectExampleSchema = createSelectSchema(example);
export const insertExampleSchema = createInsertSchema(example, {
  name: (s) => s.min(3).max(50),
}).omit({ id: true });
export const updateExampleSchema = insertExampleSchema.partial();
