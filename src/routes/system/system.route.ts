import { jsonContentBase } from '@/lib/openapi/helper';
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
