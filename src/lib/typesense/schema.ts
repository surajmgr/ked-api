import { collection } from "typesense-ts";
import z from "zod";

export const contentSchema = collection({
	name: "ked_content",
	fields: [
		{ name: "id", type: "string" },
		{ name: "title", type: "string" },
		{ name: "slug", type: "string" },
		{ name: "description", type: "string", optional: true },
		{ name: "type", type: "string", facet: true },
		{ name: "createdAt", type: "int64", sort: true },
		{ name: "authorId", type: "string", facet: true, optional: true },
		{ name: "category", type: "string", facet: true, optional: true },
		{ name: "difficultyLevel", type: "string", facet: true, optional: true },
		{ name: "bookId", type: "string", facet: true, optional: true },
		{ name: "popularityScore", type: "int32", sort: true },
		{ name: "viewsCount", type: "int32", optional: true, sort: true },
		{ name: "isSponsored", type: "bool", optional: true, facet: true },
	],
});

export const questionSchema = collection({
	name: "ked_questions",
	fields: [
		{ name: "id", type: "string" },
		{ name: "title", type: "string" },
		{ name: "slug", type: "string" },
		{ name: "content", type: "string" },
		{ name: "type", type: "string", facet: true },
		{ name: "tags", type: "string[]", facet: true },
		{ name: "authorId", type: "string", facet: true },
		{ name: "isSolved", type: "bool", facet: true },
		{ name: "createdAt", type: "int64", sort: true },
		{ name: "viewsCount", type: "int32", sort: true },
		{ name: "votesCount", type: "int32", sort: true },
		{ name: "answersCount", type: "int32", sort: true },
		{ name: "popularityScore", type: "int32", sort: true },
	],
});

export const documentTypeSchema = z.enum(['book', 'topic', 'subtopic', 'note', 'question', 'all']);
export const contentDocumentSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	description: z.string().optional(),
	type: documentTypeSchema.exclude(['all', 'question']),
	createdAt: z.number(),
	authorId: z.string().optional(),
	category: z.string().optional(),
	difficultyLevel: z.string().optional(),
	bookId: z.string().optional(),
	topicId: z.string().optional(),
	subtopicId: z.string().optional(),
	popularityScore: z.number(),
	viewsCount: z.number().optional(),
	isSponsored: z.boolean().optional(),
	content: z.string().optional(),
})
export type ContentDocument = z.infer<typeof contentDocumentSchema>

export const questionDocumentSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	content: z.string(),
	tags: z.array(z.string()),
	authorId: z.string(),
	isSolved: z.boolean(),
	createdAt: z.number(),
	viewsCount: z.number(),
	votesCount: z.number(),
	answersCount: z.number(),
	popularityScore: z.number(),
	type: documentTypeSchema.exclude(['all', 'book', 'topic', 'subtopic', 'note']),
})
export type QuestionDocument = z.infer<typeof questionDocumentSchema>

export const noHitQueriesSchema = collection({
	name: "ked_no_hit_queries",
	fields: [
		{ name: "q", type: "string" },
		{ name: "count", type: "int32" },
	],
});

export const popularQueriesSchema = collection({
	name: "ked_popular_queries",
	fields: [
		{ name: "q", type: "string" },
		{ name: "count", type: "int32" },
		{ name: "type", type: "string", facet: true },
	],
});

export const suggestionDocumentSchema = z.object({
	q: z.string(),
	count: z.number(),
	type: documentTypeSchema,
})
export type SuggestionDocument = z.infer<typeof suggestionDocumentSchema>

export const noHitQueriesDocumentSchema = z.object({
	q: z.string(),
	count: z.number(),
})
export type NoHitQueriesDocument = z.infer<typeof noHitQueriesDocumentSchema>

declare module "typesense-ts" {
	interface Collections {
		ked_content: typeof contentSchema.schema;
		ked_questions: typeof questionSchema.schema;
		ked_no_hit_queries: typeof noHitQueriesSchema.schema;
		ked_popular_queries: typeof popularQueriesSchema.schema;
	}
}
