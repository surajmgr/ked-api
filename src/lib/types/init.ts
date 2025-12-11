import type { AuthSessionResponseSchema } from '@/schema/auth.schema';
import type { OpenAPIHono } from '@hono/zod-openapi';

import type { IProvider } from '../providers/interfaces';
import type { GamificationService } from '../services/gamification.service';
import type { ModerationService } from '../services/moderation.service';

export interface AppBindings {
  Bindings: CloudflareBindings;
  Variables: {
    auth: AuthSessionResponseSchema;
    provider: IProvider;
    contribution?: {
      cp: number;
      xp: number;
      isTrusted: boolean;
    };
    gamificationService?: GamificationService;
    moderationService?: ModerationService;
  };
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;
