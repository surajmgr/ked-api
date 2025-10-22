import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export async function getClient({ HYPERDRIVE }: { HYPERDRIVE: Hyperdrive }) {
  const client = postgres(HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
  });
  return drizzle({ client, schema });
}
