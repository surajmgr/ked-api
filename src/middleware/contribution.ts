import type { MiddlewareHandler } from 'hono';
import type { AppBindings } from '@/lib/types/init';
import { CONTRIBUTION_CONFIG } from '@/lib/config/contribution.config';
import type { GamificationService } from '@/lib/services/gamification.service';
import type { ICacheProvider } from '@/lib/providers/interfaces';
import { getCurrentSession } from '@/lib/utils/auth';

/**
 * Contribution Middleware
 * Attaches user contribution data to request context
 * Determines if user is trusted based on CP
 */
export function contributionMiddleware(gamificationService: GamificationService): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const session = await getCurrentSession(c, false);

    if (!session) {
      // No user authenticated, skip
      await next();
      return;
    }

    const userId = session.user.id;

    try {
      // Try to get from cache first
      const cache = c.var.provider.cache;
      const cacheKey = `user:contribution:${userId}`;

      let contributionData: { cp: number; xp: number; isTrusted: boolean } | null = null;

      if (cache) {
        contributionData = await cache.get<{ cp: number; xp: number; isTrusted: boolean }>(cacheKey);
      }

      // If not in cache, fetch from database
      if (!contributionData) {
        contributionData = await gamificationService.getUserPoints(userId);

        // Cache for future requests
        if (cache) {
          await cache.set(cacheKey, contributionData, CONTRIBUTION_CONFIG.CACHE_TTL);
        }
      }

      // Attach to context
      c.set('contribution', {
        cp: contributionData.cp,
        xp: contributionData.xp,
        isTrusted: contributionData.isTrusted,
      });
    } catch (error) {
      // Log error but don't block request
      c.var.provider.logger.error('Failed to fetch contribution data', { userId, error });

      // Set defaults
      c.set('contribution', {
        cp: 0,
        xp: 0,
        isTrusted: false,
      });
    }

    await next();
  };
}

/**
 * Helper to invalidate user contribution cache
 */
export async function invalidateContributionCache(cache: ICacheProvider, userId: string): Promise<void> {
  const cacheKey = `user:contribution:${userId}`;
  await cache.delete(cacheKey);
}
