import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { books } from '../content';

export const gradeSchema = z.object({ id: z.string(), name: z.string() });
export type GradeSchema = z.infer<typeof gradeSchema>;

export const selectBookSchema = createSelectSchema(books);

export const selectBookSchemaWithGradeBook = selectBookSchema.extend({
  grades: z.array(gradeSchema).nullable().optional(),
});
export type SelectBookSchemaWithGradeBook = z.infer<typeof selectBookSchemaWithGradeBook>;

export const insertBookSchema = createInsertSchema(books, {
  title: (s) => s.min(1).max(255),
  description: (s) => s.max(2000).optional(),
  author: (s) => s.max(255).optional(),
  isbn: (s) => s.max(20).optional(),
  difficultyLevel: (s) => s.optional(),
  category: (s) => s.max(100).optional(),
})
  .omit({ id: true, createdAt: true, updatedAt: true, slug: true })
  .extend({
    gradeId: z.string().optional(),
  });

export const updateBookSchema = insertBookSchema.partial();
