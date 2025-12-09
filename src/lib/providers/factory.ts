import { CloudflareProvider } from './cloudflare';
import { NodeProvider } from './node';
import type { IProvider } from './interfaces';

// Singleton instance for Node.js provider
let nodeProviderInstance: IProvider | null = null;

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
  const databaseUrl = (env as NodeJS.ProcessEnv).DATABASE_URL || process.env.DATABASE_URL;
  const redisUrl = (env as NodeJS.ProcessEnv).REDIS_URL || process.env.REDIS_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Node.js provider');
  }
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for Node.js provider');
  }

  nodeProviderInstance = new NodeProvider(databaseUrl, redisUrl);
  return nodeProviderInstance;
}
