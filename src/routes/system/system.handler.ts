import type { DBHealthRoute, HealthRoute, LoginRoute } from './system.route';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { sql } from 'drizzle-orm';
import type { AppRouteHandler } from '@/lib/types/helper';
import { getCurrentSession } from '@/lib/utils/auth';

export const healthHandler: AppRouteHandler<HealthRoute> = (c) => {
  return c.json(
    {
      success: true,
      message: 'OK',
    },
    HttpStatusCodes.OK,
  );
};

export const dbHealthHandler: AppRouteHandler<DBHealthRoute> = async (c) => {
  const client = await c.var.provider.db.getClient();

  await client.execute(sql`SELECT 1`);

  return c.json({
    success: true,
    message: 'Healthy',
  });
};

export const loginHandler: AppRouteHandler<LoginRoute> = async (c) => {
  const session = await getCurrentSession(c, false);
  return c.html(
    `<h1>${session?.user?.email ? 'Logged In' : 'Use the link below to login'}</h1><a href="${c.env.AUTH_API_URL}/login?callbackUrl=${c.req.url}">Login</a>`,
  );
};
