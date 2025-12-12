import z from "zod";
import { questionDocumentSchema } from "../schema";

export const generalQuestionParamsSchema = z.object({
    q: z.string().min(1),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
    sortBy: z.enum(['relevance', 'newest', 'popular', 'views']).optional().default('relevance'),
    isSolved: z.boolean().optional(),
    authorId: z.string().optional(),
});

export const generalQuestionSearchResultSchema = z.object({
    founded: z.number(),
    hits: z.array(z.object({
        document: questionDocumentSchema,
        score: z.number(),
    })),
    page: z.number(),
    facet_counts: z.array(z.object({
        field: z.string(),
        counts: z.array(z.object({
            value: z.string(),
            count: z.number(),
        })),
    })),
});

export type GeneralQuestionParams = z.infer<typeof generalQuestionParamsSchema>;
export type GeneralQuestionSearchResult = z.infer<typeof generalQuestionSearchResultSchema>;