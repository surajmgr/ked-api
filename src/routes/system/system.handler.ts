import type { DBHealthRoute, HealthRoute, LoginRoute } from './system.route';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { sql } from 'drizzle-orm';
import { getClient } from '@/db';
import type { AppRouteHandler } from '@/lib/types/helper';
import { ApiError } from '@/lib/utils/error';
import { authenticateToken, getCurrentSession } from '@/lib/utils/auth';
import { getLoginHtml } from '@/client/login/html';

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
  const { HYPERDRIVE } = c.env;
  const client = await getClient({ HYPERDRIVE });

  await client.execute(sql`SELECT 1`);

  return c.json({
    success: true,
    message: 'Healthy',
  });
};

export const loginHandler: AppRouteHandler<LoginRoute> = async (c) => {
  const session = await getCurrentSession(c, false);

  const html = getLoginHtml(session);
  return c.html(html);
};
