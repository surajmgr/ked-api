import process from 'node:process';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { getDevDatabaseUrl } from '@/lib/utils/db';

config({
  path: '.dev.vars',
});

async function main() {
  const DATABASE_URL = getDevDatabaseUrl();

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: 'drizzle' });
  client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
