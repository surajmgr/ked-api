import * as schema from './schema';
import { pgGenerate } from 'drizzle-dbml-generator';

const out = './src/db/schema.dbml';
const relational = false;

pgGenerate({ schema, out, relational });
