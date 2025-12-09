import type { AuthSessionResponseSchema } from '@/schema/auth.schema';
import type { OpenAPIHono } from '@hono/zod-openapi';

import type { IProvider } from '../providers/interfaces';

export interface AppBindings {
  Bindings: CloudflareBindings;
  Variables: {
    auth: AuthSessionResponseSchema;
    provider: IProvider;
  };
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;
