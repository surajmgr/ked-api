import z from 'zod';
import { suggestionDocumentSchema } from '../schema';

export const generalSuggestionParamsSchema = z.object({
  prefix: z.string().min(1),
  type: z.enum(['book', 'topic', 'subtopic', 'note', 'question', 'content', 'all']).optional().default('content'),
  limit: z.coerce.number().optional().default(5),
});

export const generalSuggestionSearchResultSchema = z.object({
  founded: z.number(),
  hits: z.array(
    z.object({
      document: suggestionDocumentSchema,
      score: z.number(),
    }),
  ),
  page: z.number(),
  facet_counts: z.array(
    z.object({
      field: z.string(),
      counts: z.array(
        z.object({
          value: z.string(),
          count: z.number(),
        }),
      ),
    }),
  ),
});

export type GeneralSuggestionParamsSchema = z.infer<typeof generalSuggestionParamsSchema>;
export type GeneralSuggestionSearchResult = z.infer<typeof generalSuggestionSearchResultSchema>;
