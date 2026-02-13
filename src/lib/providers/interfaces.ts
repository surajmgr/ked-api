import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@/db/schema';
import type { ENV_KEYS } from './factory';

export type DrizzleClient = PostgresJsDatabase<typeof schema>;

export interface IDatabaseProvider {
  getClient(): Promise<DrizzleClient> | DrizzleClient;
}

export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface RedisCacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  incr(key: string, value?: number): Promise<number>;
  decr(key: string, value?: number): Promise<number>;
  expire(key: string, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ILogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export type EnvKey = (typeof ENV_KEYS)[number];
export type IEnv = Record<EnvKey, string>;

export type IStack = 'cloudflare' | 'node';

export interface IProvider {
  db: IDatabaseProvider;
  cache: ICacheProvider;
  redis: RedisCacheProvider;
  logger: ILogger;
  stack: IStack;
  env: IEnv;
}
