import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@/db/schema';

export type DrizzleClient = PostgresJsDatabase<typeof schema>;

export interface IDatabaseProvider {
  getClient(): Promise<DrizzleClient> | DrizzleClient;
}

export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ILogger {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export type IStack = 'cloudflare' | 'node';

export interface IProvider {
  db: IDatabaseProvider;
  cache: ICacheProvider;
  logger: ILogger;
  stack: IStack;
}
