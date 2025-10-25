import { AuthSessionResponseSchema } from '@/schema/auth.schema';
import type { OpenAPIHono } from '@hono/zod-openapi';

export interface AppBindings {
  Bindings: Env;
  Variables: {
    auth: AuthSessionResponseSchema;
  }
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;
