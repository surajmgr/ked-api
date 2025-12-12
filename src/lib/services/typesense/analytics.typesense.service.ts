import { NoHitQueriesDocument, noHitQueriesSchema, popularQueriesSchema, SuggestionDocument } from "@/lib/typesense/schema";
import { Client } from "../typesense.service";
import { multisearch, multisearchEntry } from "typesense-ts";
import { GeneralSuggestionParamsSchema } from "@/lib/typesense/schema/analytics.schema";

abstract class CollectionService<T> {
	constructor(
		protected client: Client,
		protected currentCollectionName: string
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
			const filterBy: string | undefined = params.type === "all" ? undefined : params.type === "content" ? "type:!=question" : `type:=${params.type}`;
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

			const { results } = await multisearch({ searches: [searchRequest] }, this.client);
			const result = results[0];

			return {
				founded: result.found,
				hits: result.hits.map(h => ({
					document: h.document as SuggestionDocument,
					score: h.text_match,
				})),
				page: result.page,
				facet_counts: result.facet_counts,
			}
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
}
