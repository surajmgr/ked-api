import { analyticsRule } from "typesense-ts";

export const noHitAnalyticsRule = analyticsRule({
	name: "ked_no_hit_queries_aggregation",
	type: "nohits_queries",
	params: {
		source: {
			collections: ["ked_content", "ked_questions"],
		},
		destination: {
			collection: "ked_no_hit_queries",
		},
		limit: 1000,
	},
});

export const popularQueriesAnalyticsRule = analyticsRule({
	name: "ked_popular_queries_aggregation",
	type: "popular_queries",
	params: {
		source: {
			collections: ["ked_content", "ked_questions"],
		},
		destination: {
			collection: "ked_popular_queries",
		},
		limit: 10000,
		expand_query: true,
		// @ts-ignore
		meta_fields: ["type"],
	},
});

export const contentEventsRule = analyticsRule({
	name: "ked_content_events_aggregation",
	type: "counter",
	params: {
		source: {
			collections: ["ked_content"],
			events: [
				{ type: "click" as const, weight: 2, name: "content_click" },
				{ type: "conversion" as const, weight: 5, name: "content_access" },
			],
		},
		destination: {
			collection: "ked_content",
			counter_field: "popularityScore",
		},
	},
});

export const questionEventsRule = analyticsRule({
	name: "ked_question_events_aggregation",
	type: "counter",
	params: {
		source: {
			collections: ["ked_questions"],
			events: [
				{ type: "click" as const, weight: 2, name: "question_click" },
				{ type: "conversion" as const, weight: 5, name: "question_answer" },
			],
		},
		destination: {
			collection: "ked_questions",
			counter_field: "popularityScore",
		},
	},
});