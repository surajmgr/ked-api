import type { RedisCacheProvider } from './interfaces';
import Redis, { type RedisOptions } from 'ioredis';

const defaultRedisOptions: RedisOptions = {
  keyPrefix: 'ked:',
};

export class CommonRedisCacheProvider implements RedisCacheProvider {
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

  async incr(key: string, value?: number): Promise<number> {
    return await this.redis.incrby(key, value || 1);
  }

  async decr(key: string, value?: number): Promise<number> {
    return await this.redis.decrby(key, value || 1);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redis.expire(key, ttl);
  }
}
