const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'is',
  'are',
  'was',
  'were',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
]);

// Fields where we strictly want to replace the user's token with the FULL FIELD VALUE (Entity Expansion)
const EXPANDABLE_FIELDS = new Set(['grades', 'grade', 'author', 'category', 'genre', 'slug', 'tags', 'id']);

const CANONICAL_FIELDS_SCANNING = new Set(['title', 'description', 'content', 'grades']);

const REGEX = {
  // Captures content inside <mark> tags: <mark>Value</mark> -> "Value"
  MARK_TAG_CONTENT: /<mark>([^<]+)<\/mark>/,
  HTML_TAGS: /<[^>]+>/g,
  TOKEN_SPLIT: /[\s\-_]+/, // Split by space, hyphen, underscore
};

export interface SearchAnalyticsOptions {
  minQueryLength?: number;
  minResultsFound?: number;
  minTokenMatchRatio?: number;
  excludePatterns?: RegExp[];
  stopWords?: Set<string>;
  fieldWeights?: Record<string, number>;
  qualityScoreWeights?: Partial<Record<'tokenRatio' | 'fieldsMatched' | 'hasResults', number>>;
}

const DEFAULT_OPTIONS: Required<SearchAnalyticsOptions> = {
  minQueryLength: 2,
  minResultsFound: 1,
  minTokenMatchRatio: 0.5,
  excludePatterns: [
    /^[^a-z0-9]+$/i, // only symbols
  ],
  stopWords: STOP_WORDS,
  fieldWeights: {
    title: 10,
    grades: 10,
    description: 2,
    default: 1,
  },
  qualityScoreWeights: {
    tokenRatio: 50,
    fieldsMatched: 10,
    hasResults: 20,
  },
};

interface TextMatchInfo {
  fields_matched: number;
  tokens_matched: number;
}

interface HighlightSnippet {
  field?: string;
  matched_tokens?: string[] | string[][];
  snippet?: string;
  snippets?: string[];
}

interface SearchHit {
  // biome-ignore lint/suspicious/noExplicitAny: the types are deep so I will use any for ease
  document: Record<string, any>;
  highlights?: HighlightSnippet[];
  text_match_info?: TextMatchInfo;
}

interface SearchResult {
  found: number;
  hits: SearchHit[];
}

export interface QueryQualityMetrics {
  originalQuery: string;
  isQualityQuery: boolean;
  qualityScore: number;
  metrics: {
    resultsFound: number;
    tokenMatchRatio: number;
    fieldsMatched: number;
  };
  failureReasons: string[];
}

// --- MAIN CLASS ---

export class SearchAnalytics {
  private options: Required<SearchAnalyticsOptions>;

  constructor(options?: SearchAnalyticsOptions) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    mergedOptions.qualityScoreWeights = {
      ...DEFAULT_OPTIONS.qualityScoreWeights,
      ...options?.qualityScoreWeights,
    } as Required<SearchAnalyticsOptions>['qualityScoreWeights'];

    this.options = mergedOptions as Required<SearchAnalyticsOptions>;

    if (options?.stopWords) {
      this.options.stopWords = new Set([...STOP_WORDS, ...options.stopWords]);
    }
  }

  /**
   * Safe wrapper to prevent crashes
   */
  public safeAnalyze(
    query: string,
    rawResult: SearchResult,
  ): {
    metrics: QueryQualityMetrics;
    queriesToTrack: { query: string; type?: string }[];
  } {
    try {
      return this.analyze(query, rawResult);
    } catch (error) {
      console.error('Search Analytics Failure:', error);
      return {
        metrics: {
          originalQuery: query,
          isQualityQuery: false,
          qualityScore: 0,
          metrics: { resultsFound: 0, tokenMatchRatio: 0, fieldsMatched: 0 },
          failureReasons: ['Internal Analytics Error'],
        },
        queriesToTrack: [{ query, type: undefined }],
      };
    }
  }

  /**
   * Core Analysis Logic
   */
  public analyze(
    query: string,
    rawResult: SearchResult,
  ): {
    metrics: QueryQualityMetrics;
    queriesToTrack: { query: string; type: string }[];
  } {
    const cleanQuery = query.trim();
    const hit = rawResult.hits?.[0];
    const info = hit?.text_match_info;
    const resultsFound = rawResult.found || 0;
    const contentType = hit?.document.type;

    // 1. Calculate Core Metrics
    const queryTokens = this.tokenize(cleanQuery);
    const totalTokens = queryTokens.length;
    const tokensMatched = info?.tokens_matched || 0;
    const tokenMatchRatio = totalTokens > 0 ? tokensMatched / totalTokens : 0;
    const fieldsMatched = info?.fields_matched || 0;

    const metrics: QueryQualityMetrics = {
      originalQuery: cleanQuery,
      isQualityQuery: true,
      qualityScore: 0,
      metrics: {
        resultsFound,
        tokenMatchRatio,
        fieldsMatched,
      },
      failureReasons: [],
    };

    // 2. Quality Gates (for isQualityQuery)
    if (cleanQuery.length < this.options.minQueryLength) this.failQuery(metrics, 'Query too short');
    if (resultsFound < this.options.minResultsFound) this.failQuery(metrics, 'No results found');
    if (tokenMatchRatio < this.options.minTokenMatchRatio)
      this.failQuery(metrics, `Low match ratio: ${Math.round(tokenMatchRatio * 100)}%`);
    if (this.options.excludePatterns.some((p) => p.test(cleanQuery))) this.failQuery(metrics, 'Excluded pattern match');

    if (metrics.isQualityQuery) {
      const weights = this.options.qualityScoreWeights;

      let score = 0;
      score += tokenMatchRatio * (weights.tokenRatio || 0);
      score += Math.min(fieldsMatched, 3) * (weights.fieldsMatched || 0);
      score += resultsFound > 0 ? weights.hasResults || 0 : 0;

      metrics.qualityScore = Math.min(100, score);
    }

    // 3. Intelligent Query Extraction
    const queriesToTrack: string[] = [];

    if (metrics.isQualityQuery && hit && hit.highlights) {
      // The document is required for typo correction (to check Title/Slug for correct words)
      const document = hit.document;

      // A. Primary Suggestion: The Repaired Query (Highest Priority)
      const repairedQuery = this.reconstructQuery(cleanQuery, hit.highlights, document);
      queriesToTrack.push(repairedQuery);

      // B. Secondary Suggestions: Isolated Entity Tags (High Priority)
      this.extractStructuredTags(hit.highlights).forEach((tag) => {
        // Check against both original and repaired query to avoid duplicates
        if (tag.toLowerCase() !== repairedQuery.toLowerCase() && tag.toLowerCase() !== cleanQuery.toLowerCase()) {
          queriesToTrack.push(tag);
        }
      });

      // C. Fallback: Original Query (Lowest Priority, only if different)
      if (repairedQuery.toLowerCase() !== cleanQuery.toLowerCase()) {
        queriesToTrack.push(cleanQuery);
      }
    } else {
      queriesToTrack.push(cleanQuery);
    }

    // Deduplicate output and enforce lowercase for suggestions
    const uniqueQueries = [...new Set(queriesToTrack)].map((q) => q.toLowerCase());

    return {
      metrics,
      queriesToTrack: uniqueQueries.map((q) => ({ query: q, type: contentType })),
    };
  }

  /**
   * CORE LOGIC: Token Replacement (Typo Correction + Entity Expansion)
   */
  private reconstructQuery(
    originalQuery: string,
    highlights: HighlightSnippet[],
    document: SearchHit['document'],
  ): string {
    const tokens = this.tokenize(originalQuery);
    const replacements = new Map<string, string>();
    const matchedTokens = new Set<string>();

    // 1. Build a Replacement Map from HIGHLIGHTS (Entity Expansion / Direct Match)
    for (const hl of highlights) {
      const snippets = hl.snippets || (hl.snippet ? [hl.snippet] : []);
      const field = hl.field || 'default';
      // Flatten matched tokens and ensure they are all strings
      const hlMatchedTokens = this.flattenMatchedTokens(hl.matched_tokens).map((t) => t.toLowerCase());

      for (const snippet of snippets) {
        const cleanValue = snippet.replace(REGEX.HTML_TAGS, '').trim();

        // Find the token from the query that triggered this snippet/highlight
        const markedTokenMatch = snippet.match(REGEX.MARK_TAG_CONTENT);
        const markedToken = markedTokenMatch ? markedTokenMatch[1].trim().toLowerCase() : null;

        // Priority: 1. Marked token (most specific). 2. Typesense matched tokens (general)
        const triggeringToken =
          markedToken || hlMatchedTokens.find((mt) => cleanValue.toLowerCase().includes(mt.toLowerCase()));

        if (triggeringToken) {
          const lookupKey = this.tokenize(triggeringToken)[0] || triggeringToken; // The token we replace
          if (lookupKey) {
            matchedTokens.add(lookupKey);

            // Avoid overwriting a more specific entity expansion with a general typo correction
            if (replacements.has(lookupKey) && !EXPANDABLE_FIELDS.has(field)) continue;

            if (EXPANDABLE_FIELDS.has(field)) {
              // Entity Expansion: '12' -> 'Grade 12 (Science)'
              replacements.set(lookupKey, cleanValue);
            } else {
              // Typo Correction from Mark Tags: 'Mat' -> 'Mathematics'
              const exactMatch = markedTokenMatch;
              replacements.set(lookupKey, exactMatch ? exactMatch[1].trim() : cleanValue);
            }
          }
        }
      }
    }

    // 2. Scan for Typo Repair using Levenshtein Distance
    const documentWords = this.getCanonicalDocumentWords(document);

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();

      // Only attempt Levenshtein correction if token was NOT highlighted and is NOT a stop word
      if (!replacements.has(lowerToken) && !this.options.stopWords.has(lowerToken)) {
        let bestCandidate = null;
        let minDistance = Infinity;

        // Set max distance: 1 edit for short words (<= 5 chars), 2 edits for longer words.
        const maxAllowedDistance = lowerToken.length > 5 ? 2 : 1;

        for (const canonicalWord of documentWords) {
          const distance = this.levenshteinDistance(lowerToken, canonicalWord);

          if (distance <= maxAllowedDistance && distance < minDistance) {
            // Prioritize the closest match
            minDistance = distance;
            bestCandidate = canonicalWord;
          }
        }

        if (bestCandidate) {
          replacements.set(lowerToken, bestCandidate);
        }
      }
    }

    // 3. Rebuild the Query String
    const reconstructed = tokens.map((token) => {
      const lowerToken = token.toLowerCase();
      return replacements.get(lowerToken) || token;
    });

    // 4. Final Cleanup: Remove adjacent duplicates
    const result: string[] = [];
    reconstructed.forEach((item, i) => {
      // Check for empty string and adjacent duplicates (case-insensitive)
      if (item && (i === 0 || item.toLowerCase() !== result[result.length - 1]?.toLowerCase())) {
        result.push(item);
      }
    });

    return result.join(' ');
  }

  /**
   * Calculates the Levenshtein distance between two strings.
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    if (m === 0) return n;
    if (n === 0) return m;

    // Use array for dynamic programming table
    const dp: number[][] = new Array(m + 1).fill(0).map(() => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // Deletion
          dp[i][j - 1] + 1, // Insertion
          dp[i - 1][j - 1] + cost, // Substitution
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Helper: Gets all clean words from key document fields (Title, Slug, Grades, etc.)
   */
  private getCanonicalDocumentWords(document: SearchHit['document']): Set<string> {
    const canonicalWords = new Set<string>();
    const fieldsToScan = CANONICAL_FIELDS_SCANNING;

    for (const field of fieldsToScan) {
      let value = document[field];
      if (Array.isArray(value)) value = value.join(' ');
      if (typeof value === 'string') {
        this.tokenize(value).forEach((word) => {
          // Only consider words that are not stop words and meet the min length
          const lowerWord = word.toLowerCase();
          if (lowerWord.length >= this.options.minQueryLength && !this.options.stopWords.has(lowerWord)) {
            canonicalWords.add(lowerWord);
          }
        });
      }
    }
    return canonicalWords;
  }

  /**
   * Helper: Extract clean values from structured fields for secondary suggestions
   */
  private extractStructuredTags(highlights: HighlightSnippet[]): string[] {
    const tags: string[] = [];
    highlights.forEach((hl) => {
      if (EXPANDABLE_FIELDS.has(hl.field || '')) {
        const snippets = hl.snippets || (hl.snippet ? [hl.snippet] : []);
        snippets.forEach((s) => {
          const clean = s.replace(REGEX.HTML_TAGS, '').trim();
          if (clean.length >= this.options.minQueryLength) {
            tags.push(clean);
          }
        });
      }
    });
    return [...new Set(tags)];
  }

  /**
   * Generic helper for tokenizing strings
   */
  private tokenize(str: string): string[] {
    return str.split(REGEX.TOKEN_SPLIT).filter((t) => t.length > 0);
  }

  /**
   * Helper to handle Typesense/Meili variation in matched_tokens response structure
   */
  private flattenMatchedTokens(tokens?: string[] | string[][]): string[] {
    if (!tokens) return [];
    // Ensure all elements are treated as strings after flattening
    return tokens.flat().filter((t) => typeof t === 'string') as string[];
  }

  /**
   * Helper to mark query as failed
   */
  private failQuery(metrics: QueryQualityMetrics, reason: string) {
    metrics.isQualityQuery = false;
    metrics.failureReasons.push(reason);
  }
}
