import type { CacheOptions } from '../types/helper';

// NOTE: Time Format: d * h * m * s
export const CACHE_DEFAULTS: Record<string, CacheOptions> = {
  BOOK_INFO: {
    ttl: 30 * 24 * 60 * 60,
    cacheControlOptions: {
      maxAge: 24 * 60 * 60,
      staleWhileRevalidate: 60 * 60,
    },
  },
  BOOK_LIST: {
    ttl: 24 * 60 * 60,
    cacheControlOptions: {
      maxAge: 24 * 60 * 60,
      staleWhileRevalidate: 10 * 60,
    },
  },
  TOPICS: {
    ttl: 6 * 60 * 60,
    cacheControlOptions: {
      maxAge: 6 * 60 * 60,
      staleWhileRevalidate: 60,
    },
  },
  NOTES: {
    ttl: 24 * 60 * 60,
    cacheControlOptions: {
      maxAge: 24 * 60 * 60,
      staleWhileRevalidate: 60 * 60,
    },
  },
};
