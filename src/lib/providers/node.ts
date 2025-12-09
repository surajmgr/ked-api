import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Redis, { type RedisOptions } from 'ioredis';
import * as schema from '@/db/schema';
import type { ICacheProvider, IDatabaseProvider, IProvider, DrizzleClient, IStack } from './interfaces';

const defaultRedisOptions: RedisOptions = {
  keyPrefix: 'ked:',
};

export class NodeDatabaseProvider implements IDatabaseProvider {
  constructor(private connectionString: string) {}

  getClient(): DrizzleClient {
    const client = postgres(this.connectionString, {
      max: 10, // Default pool size for Node
    });
    return drizzle({ client, schema });
  }
}

export class NodeCacheProvider implements ICacheProvider {
  private redis: Redis;

  constructor(redisUrl: string) {
    const url = new URL(redisUrl);
    const params = Object.fromEntries(url.searchParams.entries());
    const tlsEnabled = params.tls === 'true' || params.tls === '1';
    const sni = params.sni || undefined;

    // Prepare ioredis options
    const options: RedisOptions = {
      port: Number(url.port) || 6379,
      host: url.hostname,
      username: url.username || undefined,
      password: url.password || undefined,
      ...defaultRedisOptions,
    };

    if (tlsEnabled) {
      options.tls = {
        servername: sni || url.hostname,
      };
    }

    this.redis = new Redis(options);
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.redis.get(key);
    if (!result) return null;
    try {
      return JSON.parse(result) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.set(key, serialized, 'EX', ttl);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

export class NodeProvider implements IProvider {
  db: IDatabaseProvider;
  cache: ICacheProvider;
  stack: IStack;

  constructor(databaseUrl: string, redisUrl: string) {
    this.db = new NodeDatabaseProvider(databaseUrl);
    this.cache = new NodeCacheProvider(redisUrl);
    this.stack = 'node';
  }
}
