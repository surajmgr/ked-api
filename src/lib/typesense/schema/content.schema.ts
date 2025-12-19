import z from 'zod';
import { contentDocumentSchema, contentTypeSchema } from '../schema';

export const generalContentParamsSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortBy: z.enum(['relevance', 'newest', 'popular', 'views']).optional().default('relevance'),
  isSponsored: z.coerce.boolean().optional(),
  type: contentTypeSchema.optional(),
});

export const generalContentSearchResultSchema = z.object({
  founded: z.number(),
  hits: z.array(
    z.object({
      document: contentDocumentSchema,
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

export type ContentTypeSchema = z.infer<typeof contentTypeSchema>;
export type GeneralContentParamsSchema = z.infer<typeof generalContentParamsSchema>;
export type GeneralContentSearchResult = z.infer<typeof generalContentSearchResultSchema>;
