import { CloudflareProvider } from './cloudflare';
import { NodeProvider } from './node';
import type { IEnv, IProvider } from './interfaces';

// Singleton instance for Node.js provider
let nodeProviderInstance: IProvider | null = null;

export const ENV_KEYS = [
  'DATABASE_URL',
  'REDIS_URL',
  'AUTH_API_URL',
  'TRUSTED_ORIGINS',
  'SENTRY_DSN',
  'TYPESENSE_URL',
  'TYPESENSE_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

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

export function getAllEnvValues(env: CloudflareBindings | NodeJS.ProcessEnv) {
  const envValues = {} as IEnv;

  for (const key of ENV_KEYS) {
    const value = getEnvValue(env, key);
    if (value) {
      envValues[key] = value;
    }
  }

  return envValues;
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

  const envValues = getAllEnvValues(env);
  console.log({
    envValues,
  });
  nodeProviderInstance = new NodeProvider(envValues);
  return nodeProviderInstance;
}
