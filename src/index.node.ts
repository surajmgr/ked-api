import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import app from './index';

// Load environment variables from .env file
config();

const port = Number(process.env.PORT) || 3000;

console.info(`Server is running on port ${port}`);

serve({
  fetch(request, _info) {
    return app.fetch(request, {
      ...process.env,
    });
  },
  port,
});
