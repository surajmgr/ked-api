import type { Context } from 'hono';
import type { CacheOptions } from '../types/helper';

export function createCacheKey(c: Context, customCacheKey?: string) {
  if (customCacheKey) return customCacheKey;
  const url = new URL(c.req.url);
  url.searchParams.set('m', c.req.method);
  return `https://${url.host}${url.pathname}${url.search}`;
}

export async function getCachedJSON<T>(c: Context, options?: CacheOptions): Promise<T | null> {
  if (options?.revalidate) return null;

  const cacheKey = createCacheKey(c, options?.key);
  const cachedResponse = await caches.default.match(cacheKey);
  if (!cachedResponse) return null;

  if (options?.ttl) {
    const storedAt = cachedResponse.headers.get('x-cache-stored-at');
    if (storedAt && Date.now() - Number(storedAt) > options.ttl * 1000) {
      await caches.default.delete(cacheKey);
      return null;
    }
  }

  try {
    const text = await cachedResponse.text();
    globalCache(c, options?.cacheControlOptions);
    return JSON.parse(text) as T;
  } catch {
    await caches.default.delete(cacheKey);
    return null;
  }
}

export async function cacheJSON<T>(c: Context, data: T, options?: CacheOptions): Promise<void> {
  if (options?.revalidate) return;

  try {
    const cacheKey = createCacheKey(c, options?.key);
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'x-cache-stored-at': Date.now().toString(),
      },
    });
    await caches.default.put(cacheKey, response);
    globalCache(c, options?.cacheControlOptions);
  } catch (error) {
    console.error('Error caching JSON:', error);
  }
}

export async function globalCache(c: Context, options: CacheOptions['cacheControlOptions']) {
  if (options) {
    const { maxAge = 3600, staleWhileRevalidate = 60 } = options;
    c.res.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  }
}
