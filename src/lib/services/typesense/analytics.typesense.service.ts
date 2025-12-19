import {
	contentTypeSchema,
	type NoHitQueriesDocument,
	noHitQueriesSchema,
	popularQueriesSchema,
	type SuggestionDocument,
} from '@/lib/typesense/schema';
import type { Client } from '../typesense.service';
import { multisearch, multisearchEntry, sendEvent } from 'typesense-ts';
import type { GeneralSuggestionParamsSchema } from '@/lib/typesense/schema/analytics.schema';
import type { ContentTypeSchema } from '@/lib/typesense/schema/content.schema';

abstract class CollectionService<_T> {
	constructor(
		protected client: Client,
		protected currentCollectionName: string,
	) { }
	protected handleError(context: string, error: unknown) {
		console.error(`Typesense Error [${context}]:`, error);
	}
}

export class NoHitQueriesService extends CollectionService<NoHitQueriesDocument> {
	public collectionSchema = noHitQueriesSchema;
	constructor(client: Client) {
		super(client, noHitQueriesSchema.schema.name);
	}
}

export class PopularQueriesService extends CollectionService<SuggestionDocument> {
	public collectionSchema = popularQueriesSchema;
	private collectionName = this.collectionSchema.schema.name;

	constructor(client: Client) {
		super(client, popularQueriesSchema.schema.name);
	}

	async getSuggestions(params: GeneralSuggestionParamsSchema) {
		try {
			const filterBy: string | undefined =
				params.type === 'all' ? undefined : params.type === 'content' ? 'type:!=question' : `type:=${params.type}`;
			const searchRequest = multisearchEntry({
				collection: this.collectionName,
				q: params.prefix,
				query_by: ['q'],
				filter_by: filterBy,
				sort_by: 'count:desc',
				page: 1,
				per_page: params.limit,
				prefix: true,
			});

			const { results } = await multisearch({ searches: [searchRequest] });
			const result = results[0];

			return {
				founded: result.found,
				hits: result.hits.map((h) => {
					const queryArray = h.document.q.split(': ');
					const queryType = queryArray[0];
					let type: ContentTypeSchema | 'question';
					if (queryType === "question" || contentTypeSchema.safeParse(queryType).success) {
						type = queryType as ContentTypeSchema;
					} else {
						type = 'content' as ContentTypeSchema;
					}
					const q = queryArray.length > 1 ? queryArray.slice(1).join(': ') : queryArray[0];
					return {
						document: {
							q,
							type,
							count: h.document.count,
						},
						score: h.text_match,
					};
				}),
				page: result.page,
				facet_counts: result.facet_counts,
			};
		} catch (error) {
			this.handleError('getSuggestions', error);
			return {
				founded: 0,
				hits: [],
				page: 0,
				facet_counts: [],
			};
		}
	}

	async sendPopularQueryEvents({ query, userId, type }: { query: string; userId: string; type: string }) {
		try {
			const collection = type === 'question' ? 'ked_questions' : 'ked_content';
			await sendEvent({
				// @ts-expect-error
				type: 'search',
				// @ts-expect-error
				name: 'popular_search_event',
				collection,
				// @ts-expect-error
				data: {
					q: `${type}: ${query}`,
					collection,
					user_id: userId,
				},
			});
		} catch (error) {
			this.handleError('sendPopularQueryEvents', error);
		}
	}
}
