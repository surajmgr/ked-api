import { createSelectSchema } from 'drizzle-zod';
import { subtopics } from '../content';
import z from 'zod';

export const selectSubtopicSchema = createSelectSchema(subtopics);
export const selectTopicSubtopicsSchema = selectSubtopicSchema
  .pick({
    id: true,
    title: true,
    description: true,
    slug: true,
    orderIndex: true,
  })
  .extend({
    _count: z.object({
      notes: z.number(),
      questions: z.number(),
    }),
  })
  .array();

export type SelectTopicSubtopicsSchema = z.infer<typeof selectTopicSubtopicsSchema>;
