import { config } from 'dotenv';

config();

export const getDevDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set hel');
  }
  return process.env.DATABASE_URL;
};
