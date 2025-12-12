import { ContentDocument, contentSchema } from "@/lib/typesense/schema";
import { Client } from "../typesense.service";
import { multisearch, multisearchEntry } from "typesense-ts";
import { GeneralContentParamsSchema, GeneralContentSearchResult } from "@/lib/typesense/schema/content.schema";

abstract class CollectionService<T> {
    constructor(
        protected client: Client,
        protected currentCollectionName: string
    ) { }
    protected handleError(context: string, error: unknown) {
        console.error(`Typesense Error [${context}]:`, error);
    }
}

export class ContentCollectionService extends CollectionService<ContentDocument> {
    public collectionSchema = contentSchema;
    private collectionName = this.collectionSchema.schema.name;
    private readonly sortByArray = {
        relevance: '_text_match:desc,popularityScore:desc',
        newest: 'createdAt:desc',
        popular: 'popularityScore:desc',
        views: 'viewsCount:desc',
        default: '_text_match:desc,popularityScore:desc'
    } as const;

    private readonly queryByArray = {
        default: ['title', 'slug', 'description', 'type']
    } as const;

    private readonly queryWeightsArray = {
        default: [4, 2, 1, 1]
    } as const;

    static readonly FILTER_FIELDS = {
        type: ["book", "topic", "subtopic", "note"] as const,
        isSponsored: [true] as const,
    } as const;

    constructor(client: Client) {
        super(client, contentSchema.schema.name);
    }

    private getArrayValue<T>(array: Record<string, T>, key: string): T {
        return array[key] || array.default;
    }

    async searchGeneral(params: GeneralContentParamsSchema): Promise<GeneralContentSearchResult> {
        try {
            let filterString = '';

            if (params.type && params.type !== 'all') {
                filterString += `type:=${params.type}`;
            }

            if (params.isSponsored) {
                if (filterString) filterString += ' && ';
                filterString += 'isSponsored:=true';
            }

            const sortByString = this.getArrayValue(this.sortByArray, params.sortBy || 'default');
            const queryBy = this.getArrayValue(this.queryByArray, params.sortBy || 'default');
            const queryWeights = this.getArrayValue(this.queryWeightsArray, params.sortBy || 'default');

            const searchRequest = multisearchEntry({
                collection: this.collectionName,
                q: params.q || '*',
                query_by: [...queryBy],
                query_by_weights: [...queryWeights],
                filter_by: filterString,
                sort_by: sortByString,
                page: params.page,
                per_page: params.limit,
                prefix: true,
                num_typos: 2,
                prioritize_exact_match: true,
                drop_tokens_threshold: 1
            });

            const { results } = await multisearch({ searches: [searchRequest] }, this.client);
            const result = results[0];
            return {
                founded: result.found,
                page: result.page,
                facet_counts: result.facet_counts,
                hits: result.hits?.map((h) => ({
                    document: h.document as ContentDocument,
                    score: h.text_match,
                })) || [],
            };
        } catch (error) {
            this.handleError('searchGeneral', error);
            throw error;
        }
    }
}
