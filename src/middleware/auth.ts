import type { Context, Next } from 'hono';
import type { AuthSessionResponseSchema } from '@/schema/auth.schema';
import { authenticateToken } from '@/lib/utils/auth';
import { hasRouteAccess, HYBRID_ROUTES, PUBLIC_ROUTES, hasRoleAccess } from './route.level';
import type { Role } from '@/schema/common.schema';
import { HttpStatusPhrases } from '@/lib/utils/status.phrases';
import { HttpStatusCodes } from '@/lib/utils/status.codes';

/**
 * Auth middleware with role-based access control
 */
export async function authMiddleware(c: Context, next: Next) {
  const path = c.req.path;

  console.log(path);

  // ---------------------
  // Public routes: bypass auth
  // ---------------------
  if (hasRouteAccess(path, PUBLIC_ROUTES)) return next();

  let session: AuthSessionResponseSchema = null;

  try {
    // Attempt to authenticate if token is provided
    session = await authenticateToken(c);
    c.set('auth', session);

    // ---------------------
    // Hybrid routes: session optional
    // ---------------------
    if (hasRouteAccess(path, HYBRID_ROUTES)) return next();

    // ---------------------
    // Protected routes: session required
    // ---------------------
    if (!session) {
      return c.json({ success: false, message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
    }

    // ---------------------
    // Role-level access control
    // ---------------------
    const userRole = session.user.role as Role;
    if (!hasRoleAccess(path, userRole)) {
      return c.json({ success: false, message: HttpStatusPhrases.FORBIDDEN }, HttpStatusCodes.FORBIDDEN);
    }

    // ---------------------
    // Access granted
    // ---------------------
    return next();
  } catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }
}
