import process from 'node:process';

export const getDevDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL_PROD) {
      throw new Error('DATABASE_URL_PROD is not set');
    }
    return process.env.DATABASE_URL_PROD;
  } else {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    return process.env.DATABASE_URL;
  }
};
