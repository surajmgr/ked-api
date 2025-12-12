import { collection } from 'typesense-ts';
import z from 'zod';

export const contentSchema = collection({
  name: 'ked_content',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'slug', type: 'string' },
    { name: 'type', type: 'string', facet: true },

    { name: 'status', type: 'string', facet: true },

    { name: 'title', type: 'string' },
    { name: 'description', type: 'string', optional: true },
    { name: 'content', type: 'string', optional: true },

    { name: 'bookId', type: 'string', facet: true, optional: true },
    { name: 'topicId', type: 'string', facet: true, optional: true },

    { name: 'grades', type: 'string[]', facet: true, optional: true },

    { name: 'popularityScore', type: 'int32', sort: true },
    { name: 'createdAt', type: 'int64', sort: true },
    { name: 'coverImage', type: 'string', optional: true },
  ],
  default_sorting_field: 'popularityScore',
});

export const questionSchema = collection({
  name: 'ked_questions',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'slug', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'topicId', type: 'string', facet: true },
    { name: 'isSolved', type: 'bool' },

    { name: 'tags', type: 'string[]', facet: true },

    { name: 'popularityScore', type: 'int32', sort: true },

    { name: 'createdAt', type: 'int64', sort: true },
  ],
  default_sorting_field: 'popularityScore',
});

export const contentTypeSchema = z.enum(['book', 'topic', 'subtopic', 'note']);
export const contentDocumentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: contentTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']),
  bookId: z.string().optional(),
  topicId: z.string().optional(),

  grades: z.array(z.string()).optional(),

  popularityScore: z.number().default(0),
  createdAt: z.number(),
});
export type ContentDocument = z.infer<typeof contentDocumentSchema>;

export const questionDocumentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  isSolved: z.boolean(),

  topicId: z.string(),
  tags: z.array(z.string()).optional(),

  popularityScore: z.number().default(0),
  createdAt: z.number(),
});
export type QuestionDocument = z.infer<typeof questionDocumentSchema>;

export const noHitQueriesSchema = collection({
  name: 'ked_no_hit_queries',
  fields: [
    { name: 'q', type: 'string' },
    { name: 'count', type: 'int32' },
  ],
});

export const popularQueriesSchema = collection({
  name: 'ked_popular_queries',
  fields: [
    { name: 'q', type: 'string' },
    { name: 'count', type: 'int32' },
    { name: 'type', type: 'string', facet: true },
  ],
});

export const suggestionDocumentSchema = z.object({
  q: z.string(),
  count: z.number(),
  type: contentTypeSchema.or(z.enum(['question', 'all'])),
});
export type SuggestionDocument = z.infer<typeof suggestionDocumentSchema>;

export const noHitQueriesDocumentSchema = z.object({
  q: z.string(),
  count: z.number(),
});
export type NoHitQueriesDocument = z.infer<typeof noHitQueriesDocumentSchema>;

declare module 'typesense-ts' {
  interface Collections {
    ked_content: typeof contentSchema.schema;
    ked_questions: typeof questionSchema.schema;
    ked_no_hit_queries: typeof noHitQueriesSchema.schema;
    ked_popular_queries: typeof popularQueriesSchema.schema;
  }
}
