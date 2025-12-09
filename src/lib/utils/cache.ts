import type { Context } from 'hono';
import type { AppBindings } from '@/lib/types/init';
import type { CacheOptions } from '../types/helper';

export function createCacheKey(c: Context<AppBindings>, customCacheKey?: string) {
  if (customCacheKey) return customCacheKey;
  const stack = c.var.provider.stack;
  const url = new URL(c.req.url);
  url.searchParams.set('m', c.req.method);
  if (stack === 'cloudflare') return `https://${url.host}${url.pathname}${url.search}`;
  return `${url.pathname}${url.search}`;
}

export async function getCachedJSON<T>(c: Context<AppBindings>, options?: CacheOptions): Promise<T | null> {
  if (options?.revalidate) return null;

  const cacheKey = createCacheKey(c, options?.key);
  const provider = c.var.provider;
  if (!provider) return null;

  return provider.cache.get<T>(cacheKey);
}

export async function cacheJSON<T>(c: Context<AppBindings>, data: T, options?: CacheOptions): Promise<void> {
  if (options?.revalidate) return;

  try {
    const cacheKey = createCacheKey(c, options?.key);
    const provider = c.var.provider;
    if (!provider) return;

    await provider.cache.set(cacheKey, data, options?.ttl);
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
