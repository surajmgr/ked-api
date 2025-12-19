import { type QuestionDocument, questionSchema } from '@/lib/typesense/schema';
import type { Client } from '../typesense.service';
import { multisearch, multisearchEntry } from 'typesense-ts';
import type { GeneralQuestionParams } from '@/lib/typesense/schema/question.schema';
import { SearchAnalytics } from './search.typesense.utility';
import type { PopularQueriesService } from './analytics.typesense.service';

abstract class CollectionService<_T> {
  constructor(
    protected client: Client,
    protected currentCollectionName: string,
  ) {}
  protected handleError(context: string, error: unknown) {
    console.error(`Typesense Error [${context}]:`, error);
  }
}

export class QuestionCollectionService extends CollectionService<QuestionDocument> {
  public collectionSchema = questionSchema;
  private searchAnalytics = new SearchAnalytics({
    fieldWeights: {
      title: 10,
      tags: 5,
      content: 1,
    },
  });
  private analytics: PopularQueriesService;
  private collectionName = this.collectionSchema.schema.name;
  private readonly sortByArray = {
    relevance: '_text_match:desc,popularityScore:desc',
    newest: 'createdAt:desc',
    popular: 'popularityScore:desc',
    default: '_text_match:desc,popularityScore:desc',
  } as const;

  private readonly queryByArray = {
    default: ['title', 'tags', 'content'],
  } as const;

  private readonly queryWeightsArray = {
    default: [4, 2, 1],
  } as const;

  constructor(client: Client, analytics: PopularQueriesService) {
    super(client, questionSchema.schema.name);
    this.analytics = analytics;
  }

  private getArrayValue<T>(array: Record<string, T>, key: string): T {
    return array[key] || array.default;
  }

  async searchGeneral(params: GeneralQuestionParams, userId: string) {
    try {
      let filterString = '';

      if (params.isSolved !== undefined) {
        filterString += `isSolved:=${params.isSolved}`;
      }

      if (params.topicId) {
        if (filterString) filterString += ' && ';
        filterString += `topicId:=${params.topicId}`;
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
      });

      const { results } = await multisearch({ searches: [searchRequest] }, this.client);
      const result = results[0];

      const { metrics, queriesToTrack } = this.searchAnalytics.safeAnalyze(params.q || '*', result);

      if (metrics.isQualityQuery && queriesToTrack.length > 0) {
        await Promise.all(
          queriesToTrack.map((item) =>
            this.analytics.sendPopularQueryEvents({
              query: item.query,
              userId: userId,
              type: 'question',
            }),
          ),
        );
      }

      return {
        founded: result.found,
        page: result.page,
        facet_counts: result.facet_counts,
        hits:
          result.hits?.map((h) => ({
            document: h.document as QuestionDocument,
            score: h.text_match,
          })) || [],
      };
    } catch (error) {
      this.handleError('searchGeneral', error);
      throw error;
    }
  }
}
