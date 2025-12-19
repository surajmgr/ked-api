import { type ContentDocument, contentSchema } from '@/lib/typesense/schema';
import type { Client } from '../typesense.service';
import { multisearch, multisearchEntry } from 'typesense-ts';
import type { GeneralContentParamsSchema, GeneralContentSearchResult } from '@/lib/typesense/schema/content.schema';
import type { DrizzleClient } from '@/db';
import { books, gradeBooks, grades } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
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

export class ContentCollectionService extends CollectionService<ContentDocument> {
  public collectionSchema = contentSchema;
  private searchAnalytics = new SearchAnalytics({
    fieldWeights: {
      title: 10,
      grades: 5,
      description: 1,
    },
  });
  private analytics: PopularQueriesService;
  private collectionName = this.collectionSchema.schema.name;
  private readonly sortByArray = {
    relevance: '',
    newest: 'createdAt:desc',
    popular: 'popularityScore:desc',
    default: '',
  } as const;

  private readonly queryByArray = {
    default: ['title', 'description', 'content', 'grades'],
  } as const;

  private readonly queryWeightsArray = {
    default: [5, 3, 3, 1],
  } as const;

  constructor(client: Client, analytics: PopularQueriesService) {
    super(client, contentSchema.schema.name);
    this.analytics = analytics;
  }

  private getArrayValue<T>(array: Record<string, T>, key: string): T {
    return array[key] || array.default;
  }

  async searchGeneral(params: GeneralContentParamsSchema, userId: string): Promise<GeneralContentSearchResult> {
    try {
      let filterString = '';

      filterString += 'status:=PUBLISHED';

      if (params.type) {
        filterString += ` && type:=${params.type}`;
      }

      const queryBy = this.getArrayValue(this.queryByArray, params.sortBy);
      const queryWeights = this.getArrayValue(this.queryWeightsArray, params.sortBy);
      const sortByString = this.getArrayValue(this.sortByArray, params.sortBy);
      const searchRequest = multisearchEntry({
        collection: this.collectionName,
        q: params.q || '*',
        query_by: [...queryBy],
        query_by_weights: [...queryWeights],
        filter_by: filterString,
        sort_by: sortByString || undefined,
        page: params.page,
        per_page: params.limit,
        prefix: true,
        num_typos: 2,
        prioritize_exact_match: true,
        drop_tokens_threshold: 1,
        highlight_fields: [...queryBy],
      });

      const { results } = await multisearch({ searches: [searchRequest] });
      const result = results[0];

      const { metrics, queriesToTrack } = this.searchAnalytics.safeAnalyze(params.q || '*', result);

      if (metrics.isQualityQuery && queriesToTrack.length > 0) {
        await Promise.all(
          queriesToTrack.map((item) =>
            this.analytics.sendPopularQueryEvents({
              query: item.query,
              userId: userId,
              type: item.type || params.type || 'content',
            }),
          ),
        );

        console.log('Popular queries tracked:', queriesToTrack);
      }
      return {
        founded: result.found,
        page: result.page,
        facet_counts: result.facet_counts,
        hits:
          result.hits?.map((h) => ({
            document: h.document as ContentDocument,
            score: h.text_match,
          })) || [],
      };
    } catch (error) {
      this.handleError('searchGeneral', error);
      throw error;
    }
  }

  async reindexBooks(client: DrizzleClient) {
    try {
      const bookList = await client
        .select({
          id: books.id,
          title: books.title,
          slug: books.slug,
          description: books.description,
          status: books.status,
          coverImage: books.coverImage,
          difficultyLevel: books.difficultyLevel,
          category: books.category,
          createdAt: books.createdAt,
        })
        .from(books);

      const gradeData = await client
        .select({
          bookId: gradeBooks.bookId,
          gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
        })
        .from(gradeBooks)
        .where(
          inArray(
            gradeBooks.bookId,
            bookList.map((b) => b.id),
          ),
        );

      const documents = bookList.map((book) => {
        const gradeNames = gradeData
          .filter((g) => g.bookId === book.id)
          .map((g) => g.gradeName)
          .filter(Boolean) as string[];
        const gradesArray: string[] = [];
        if (book.category) gradesArray.push(book.category);
        if (book.difficultyLevel) gradesArray.push(book.difficultyLevel);
        gradesArray.push(...gradeNames);
        return {
          id: book.id,
          title: book.title,
          slug: book.slug,
          description: book.description || undefined,
          type: 'book',
          status: book.status,
          coverImage: book.coverImage || undefined,
          grades: gradesArray,
          createdAt: book.createdAt ? new Date(book.createdAt).getTime() : Date.now(),
          popularityScore: 0,
        };
      });

      console.log(`Reindexed ${documents.length} documents`);

      await this.collectionSchema.documents.import(documents, { action: 'upsert' });
    } catch (error) {
      this.handleError('reindex', error);
      throw error;
    }
  }
}
