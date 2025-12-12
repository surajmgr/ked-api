import type { Role } from '@/schema/common.schema';

export const PUBLIC_ROUTES = ['*/public/*', '/static/*', '/favicon.ico', '/doc', '/'];

export const HYBRID_ROUTES = ['*/hybrid/*'];

export const PROTECTED_ROUTES: Record<Role, string[]> = {
  user: [], // users have no restricted routes
  admin: [
    '/admin/*', // only admin and superadmin can access
  ],
  superadmin: [
    '/superadmin/*', // only superadmin can access
  ],
};

const ROLE_PRIORITY: Record<Role, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

export function hasRoleAccess(path: string, userRole: Role) {
  const userLevel = ROLE_PRIORITY[userRole];

  for (const [role, routes] of Object.entries(PROTECTED_ROUTES) as [Role, string[]][]) {
    const roleLevel = ROLE_PRIORITY[role];
    if (roleLevel > userLevel) {
      if (hasRouteAccess(path, routes)) {
        return false;
      }
    }
  }

  return true;
}

export function hasRouteAccess(currentPath: string, routes: string[]): boolean {
  const normalize = (path: string) => (path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path);

  const path = normalize(currentPath);

  return routes.some((route) => {
    const r = normalize(route);

    const pattern = `^${r.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*')}$`;
    const regex = new RegExp(pattern);

    return regex.test(path);
  });
}
