import type { OpenAPIHono } from '@hono/zod-openapi';

export interface AppBindings {
  Bindings: Env;
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;
