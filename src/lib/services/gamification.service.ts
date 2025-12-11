import type { DrizzleClient } from '@/db';
import { contributionLedger, userProfiles } from '@/db/schema';
import { CONTRIBUTION_CONFIG, type ContributionAction } from '../config/contribution.config';
import { eq, and, gte, sql } from 'drizzle-orm';
import type { ILogger } from '../providers/interfaces';

export interface GamificationService {
  /**
   * Award CP/XP for an action
   */
  awardPoints(params: {
    userId: string;
    action: ContributionAction;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    cpDelta: number;
    xpDelta: number;
    newCP: number;
    newXP: number;
    isTrusted: boolean;
  }>;

  /**
   * Get user's current CP/XP
   */
  getUserPoints(userId: string): Promise<{
    cp: number;
    xp: number;
    isTrusted: boolean;
  }>;

  /**
   * Check if user has reached daily cap
   */
  checkDailyCap(userId: string): Promise<{
    cpReachedCap: boolean;
    xpReachedCap: boolean;
    cpToday: number;
    xpToday: number;
  }>;

  /**
   * Get user's contribution history
   */
  getContributionHistory(
    userId: string,
    limit?: number,
  ): Promise<
    Array<{
      id: string;
      action: string;
      cpDelta: number;
      xpDelta: number;
      referenceId: string | null;
      referenceType: string | null;
      createdAt: Date | null;
    }>
  >;
}

export function createGamificationService(db: DrizzleClient, logger: ILogger): GamificationService {
  return {
    async awardPoints({ userId, action, referenceId, referenceType, metadata }) {
      // Get reward configuration
      const reward = CONTRIBUTION_CONFIG.REWARDS[action];
      if (!reward) {
        throw new Error(`Unknown contribution action: ${action}`);
      }

      // Check daily cap
      const dailyCap = await this.checkDailyCap(userId);
      let cpDelta: number = reward.cp;
      let xpDelta: number = reward.xp;

      // Apply daily cap
      if (dailyCap.cpReachedCap && cpDelta > 0) {
        logger.warn('User reached daily CP cap', { userId, action });
        cpDelta = 0;
      }
      if (dailyCap.xpReachedCap && xpDelta > 0) {
        logger.warn('User reached daily XP cap', { userId, action });
        xpDelta = 0;
      }

      // Create ledger entry
      await db.insert(contributionLedger).values({
        userId,
        action,
        cpDelta,
        xpDelta,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      // Update user profile
      const [updatedProfile] = await db
        .update(userProfiles)
        .set({
          contributionPoints: sql`${userProfiles.contributionPoints} + ${cpDelta}`,
          xp: sql`${userProfiles.xp} + ${xpDelta}`,
          trustedStatus: sql`${userProfiles.contributionPoints} + ${cpDelta} >= ${CONTRIBUTION_CONFIG.TRUST_THRESHOLD}`,
        })
        .where(eq(userProfiles.userId, userId))
        .returning();

      // If user doesn't have a profile yet, create one
      if (!updatedProfile) {
        const [newProfile] = await db
          .insert(userProfiles)
          .values({
            userId,
            contributionPoints: Math.max(0, cpDelta),
            xp: Math.max(0, xpDelta),
            trustedStatus: cpDelta >= CONTRIBUTION_CONFIG.TRUST_THRESHOLD,
          })
          .returning();

        return {
          cpDelta,
          xpDelta,
          newCP: newProfile.contributionPoints,
          newXP: newProfile.xp,
          isTrusted: newProfile.trustedStatus,
        };
      }

      return {
        cpDelta,
        xpDelta,
        newCP: updatedProfile.contributionPoints,
        newXP: updatedProfile.xp,
        isTrusted: updatedProfile.trustedStatus,
      };
    },

    async getUserPoints(userId: string) {
      const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

      if (!profile) {
        // Create default profile
        const [newProfile] = await db
          .insert(userProfiles)
          .values({
            userId,
            contributionPoints: 0,
            xp: 0,
            trustedStatus: false,
          })
          .returning();

        return {
          cp: newProfile.contributionPoints,
          xp: newProfile.xp,
          isTrusted: newProfile.trustedStatus,
        };
      }

      return {
        cp: profile.contributionPoints,
        xp: profile.xp,
        isTrusted: profile.trustedStatus,
      };
    },

    async checkDailyCap(userId: string) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Sum CP and XP earned today
      const [result] = await db
        .select({
          cpToday: sql<number>`COALESCE(SUM(CASE WHEN ${contributionLedger.cpDelta} > 0 THEN ${contributionLedger.cpDelta} ELSE 0 END), 0)`,
          xpToday: sql<number>`COALESCE(SUM(CASE WHEN ${contributionLedger.xpDelta} > 0 THEN ${contributionLedger.xpDelta} ELSE 0 END), 0)`,
        })
        .from(contributionLedger)
        .where(and(eq(contributionLedger.userId, userId), gte(contributionLedger.createdAt, today)));

      const cpToday = Number(result?.cpToday || 0);
      const xpToday = Number(result?.xpToday || 0);

      return {
        cpReachedCap: cpToday >= CONTRIBUTION_CONFIG.CP_DAILY_CAP,
        xpReachedCap: xpToday >= CONTRIBUTION_CONFIG.XP_DAILY_CAP,
        cpToday,
        xpToday,
      };
    },

    async getContributionHistory(userId: string, limit = 50) {
      const history = await db
        .select()
        .from(contributionLedger)
        .where(eq(contributionLedger.userId, userId))
        .orderBy(sql`${contributionLedger.createdAt} DESC`)
        .limit(limit);

      return history;
    },
  };
}
