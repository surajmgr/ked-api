import init from './lib/utils/init';
import configureOpenAPI from './lib/utils/openapi';
import configureRoutes from '@/routes/index.route';

const app = init();

app.use('*', async (c, next) => {
  if (!c.env || Object.keys(c.env).length === 0) {
    // biome-ignore lint/suspicious/noExplicitAny: fallback for Node.js
    c.env = process.env as any;
  }

  const { createProvider } = await import('./lib/providers/factory');
  const provider = createProvider(c.env);
  c.set('provider', provider);
  await next();
});

configureOpenAPI(app);
configureRoutes(app);

export default app;
