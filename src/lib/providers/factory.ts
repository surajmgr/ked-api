import { CloudflareProvider } from './cloudflare';
import { NodeProvider } from './node';
import type { IProvider } from './interfaces';

// Singleton instance for Node.js provider
let nodeProviderInstance: IProvider | null = null;

export function getEnvValue(env: CloudflareBindings | NodeJS.ProcessEnv, key: string, isRequired = true) {
  if ('HYPERDRIVE' in env && typeof (env as CloudflareBindings).HYPERDRIVE === 'object') {
    return (env as CloudflareBindings)[key as keyof CloudflareBindings] as string;
  }
  const value = (env as NodeJS.ProcessEnv)[key] || process.env[key];
  if (!value && isRequired) {
    throw new Error(`${key} is required`);
  }
  return value;
}

export function createProvider(env: CloudflareBindings | NodeJS.ProcessEnv): IProvider {
  // Check if we are in Cloudflare Workers environment
  // Cloudflare Workers usually have `HYPERDRIVE` or similar bindings in the env object
  if ('HYPERDRIVE' in env && typeof (env as CloudflareBindings).HYPERDRIVE === 'object') {
    return new CloudflareProvider(env as CloudflareBindings);
  }

  // Fallback to Node.js environment
  // Return existing instance if available
  if (nodeProviderInstance) {
    return nodeProviderInstance;
  }

  // Use process.env or the passed env object if it resembles ProcessEnv
  const databaseUrl = getEnvValue(env, 'DATABASE_URL');
  const redisUrl = getEnvValue(env, 'REDIS_URL');
  const sentryDsn = getEnvValue(env, 'SENTRY_DSN');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Node.js provider');
  }
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for Node.js provider');
  }

  nodeProviderInstance = new NodeProvider(databaseUrl, redisUrl, sentryDsn);
  return nodeProviderInstance;
}
