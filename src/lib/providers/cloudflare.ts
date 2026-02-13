import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import type {
  ICacheProvider,
  IDatabaseProvider,
  IProvider,
  DrizzleClient,
  IStack,
  ILogger,
  IEnv,
  RedisCacheProvider,
} from './interfaces';
import { initSentryCloudflare, cloudflareSentryLogger } from '../sentry/sentry.cloudflare';
import { getAllEnvValues } from './factory';
import { CommonRedisCacheProvider } from './common';

export class CloudflareDatabaseProvider implements IDatabaseProvider {
  constructor(private hyperdrive: Hyperdrive) {}

  getClient(): DrizzleClient {
    const client = postgres(this.hyperdrive.connectionString, {
      max: 5,
      fetch_types: false,
    });
    return drizzle({ client, schema });
  }
}

export class CloudflareCacheProvider implements ICacheProvider {
  constructor(private cache: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const response = await this.cache.match(key);
    if (!response) return null;

    try {
      const text = await response.text();
      // Check for expiration if we stored it in headers (optional, but matching current logic needed)
      // Current logic in `cache.ts` handles TTL manually by checking `x-cache-stored-at`.
      // We might want to encapsulate that logic here or keep it.
      // For now, let's just return the parsed JSON as the interface implies 'value'.
      // If we need metadata, the interface might need to change, or we store the wrapper.
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-cache-stored-at': Date.now().toString(),
    });

    if (ttl) {
      // Cache API doesn't support explicit TTL on `put` in the same way Redis does implicitly.
      // We can use Cache-Control headers to hint cloudflare, or just rely on our manual check.
      // For strictly programmatic usage:
      headers.set('Cache-Control', `public, max-age=${ttl}`);
    }

    const response = new Response(JSON.stringify(value), { headers });
    // Use waitUntil if possible? No, we are in a class. The caller should manage context if needed.
    // But `put` is async.
    await this.cache.put(key, response);
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}

export class CloudflareProvider implements IProvider {
  db: IDatabaseProvider;
  cache: ICacheProvider;
  redis: RedisCacheProvider;
  logger: ILogger;
  stack: IStack;
  env: IEnv;

  constructor(env: CloudflareBindings) {
    this.db = new CloudflareDatabaseProvider(env.HYPERDRIVE);
    // Use `caches.default` for the standard Cloudflare cache
    this.cache = new CloudflareCacheProvider(caches.default);
    this.redis = new CommonRedisCacheProvider(env.REDIS_URL);
    this.stack = 'cloudflare';
    this.env = getAllEnvValues(env);

    // Initialize Sentry with DSN from environment and version metadata
    const sentryDsn = env.SENTRY_DSN;
    const release = env.CF_VERSION_METADATA?.id;
    initSentryCloudflare(sentryDsn, release);
    this.logger = cloudflareSentryLogger;
  }
}
