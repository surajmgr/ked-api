import type { AppOpenAPI } from '../types/init';
import { Scalar } from '@scalar/hono-api-reference';
import packageJson from '@/../package.json';

export default function configureOpenAPI(app: AppOpenAPI) {
  app.get('/test', (c) => {
    return c.text('Hello World');
  });

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      title: 'KEd API',
      version: packageJson.version,
    },
  });

  app.get(
    '/public/reference',
    Scalar({
      url: '/doc',
      layout: 'classic',
      theme: 'kepler',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
      authentication: {
        preferredSecurityScheme: 'cookieAuth',
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            name: 'auth.session_token',
            in: 'cookie',
          },
          apiKeyHeader: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
      },
    }),
  );
}
