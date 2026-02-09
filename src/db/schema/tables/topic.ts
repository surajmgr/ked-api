import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { topics } from '../content';
import { selectSubtopicSchema } from './subtopic';
import { selectBookSchema } from './book';
import { selectNoteSchema } from './note';

export const selectTopicSchema = createSelectSchema(topics);

export const selectTopicBySlug = selectTopicSchema
  .pick({
    id: true,
    slug: true,
    title: true,
    description: true,
  })
  .extend({
    book: selectBookSchema.pick({ id: true, title: true, slug: true }),
  });

export const selectBookTopicsSchema = selectTopicSchema
  .pick({
    id: true,
    title: true,
    slug: true,
    orderIndex: true,
  })
  .extend({
    subtopics: selectSubtopicSchema
      .pick({
        id: true,
        title: true,
        slug: true,
        orderIndex: true,
      })
      .extend({
        _count: z.object({
          notes: z.number(),
          questions: z.number(),
        }),
      })
      .array(),
    _count: z.object({
      subtopics: z.number(),
      notes: z.number(),
      questions: z.number(),
    }),
  })
  .array();
export type SelectBookTopicsSchema = z.infer<typeof selectBookTopicsSchema>;

export const getFeaturedNoteByTopicSchema = selectNoteSchema
  .pick({
    id: true,
    title: true,
    slug: true,
    content: true,
    contentType: true,
    isPremium: true,
    price: true,
    updatedAt: true,
    ratingAvg: true,
    ratingCount: true,
    downloadsCount: true,
  })
  .extend({
    author: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        username: z.string().optional(),
      })
      .nullable(),
  })
  .nullable();
