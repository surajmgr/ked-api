import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import app from './index';

// Load environment variables from .env file
config();

const port = Number(process.env.PORT) || 3000;

console.info(`Server is running on port ${port}`);

serve({
  // biome-ignore lint/suspicious/noExplicitAny: compatible signature for node-server
  fetch: (request: Request, env: any, ctx: any) => {
    // Pass process.env as the environment object to Hono
    // biome-ignore lint/suspicious/noExplicitAny: merging process.env requires broad cast
    return app.fetch(request, { ...process.env, ...env } as any, ctx);
  },
  port,
});
