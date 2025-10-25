import { jsonContentBase, jsxContent } from '@/lib/openapi/helper';
import { GLOBAL_RESPONSES } from '@/lib/openapi/responses';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { createRoute } from '@hono/zod-openapi';

export const healthRoute = createRoute({
  path: '/health',
  method: 'get',
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentBase({
      description: 'Check health',
    }),
  },
});
export type HealthRoute = typeof healthRoute;

export const dbHealthRoute = createRoute({
  path: '/db/health',
  method: 'get',
  responses: {
    ...GLOBAL_RESPONSES,
    [HttpStatusCodes.OK]: jsonContentBase({
      description: 'Check db health',
    }),
  },
});
export type DBHealthRoute = typeof dbHealthRoute;

export const loginRoute = createRoute({
  path: '/login',
  method: 'get',
  responses: {
    [HttpStatusCodes.OK]: jsxContent({
      description: 'Login',
    }),
  },
});
export type LoginRoute = typeof loginRoute;
