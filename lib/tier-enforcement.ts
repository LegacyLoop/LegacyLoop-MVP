/**
 * Tier enforcement utility — server-side only.
 * Call from API routes and server actions to gate features by user tier.
 */

import { prisma } from "@/lib/db";
import { DIGITAL_TIERS, TIER_NUMBER_TO_KEY } from "@/lib/pricing/constants";
import {
  TIER,
  TIER_NAMES,
  TIER_LIMITS,
  BOT_ACCESS,
  canUseBotOnTier,
  isDemoMode,
  type BotName,
} from "@/lib/constants/pricing";

export interface TierCheckResult {
  allowed: boolean;
  message?: string;
  upgradeUrl?: string;
  alternativeAction?: string;
  reason?: string;
}

/** Get the tier key ("FREE" | "STARTER" | "PLUS" | "PRO") for a user */
async function getUserTierKey(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });
  return TIER_NUMBER_TO_KEY[user?.tier ?? 1] ?? "FREE";
}

/** Get tier number for a user */
async function getUserTierNumber(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });
  return user?.tier ?? 1;
}

/** Check if a user is allowed to perform an action given their tier limits */
export async function checkTierLimit(
  userId: string,
  action:
    | "CREATE_ITEM"
    | "UPLOAD_PHOTO"
    | "USE_MEGABOT"
    | "USE_BOT"
    | "CREATE_PROJECT"
    | "ACCESS_ANALYTICS"
    | "ACCESS_BUYER_FINDER"
    | "ACCESS_STOREFRONT"
    | "ACCESS_STORYTELLING",
  resourceId?: string,
  botName?: BotName
): Promise<TierCheckResult> {
  // Admin / demo bypass — never locked out during testing
  if (isDemoMode()) {
    return { allowed: true, reason: "demo_bypass" };
  }

  const tierNum = await getUserTierNumber(userId);
  const tierKey = await getUserTierKey(userId);
  const tier = DIGITAL_TIERS[tierKey];
  if (!tier) return { allowed: false, message: "Unknown tier." };

  const limits = TIER_LIMITS[tierNum] ?? TIER_LIMITS[TIER.FREE];
  const tierName = TIER_NAMES[tierNum] ?? "Free";
  const upgradeUrl = "/pricing?upgrade=true";

  switch (action) {
    case "CREATE_ITEM": {
      if (limits.maxActiveItems === null) break; // unlimited
      const itemCount = await prisma.item.count({ where: { userId } });
      if (itemCount >= limits.maxActiveItems) {
        return {
          allowed: false,
          message: `You've reached your ${limits.maxActiveItems}-item limit on the ${tierName} plan. Upgrade to add more!`,
          upgradeUrl,
        };
      }
      break;
    }

    case "UPLOAD_PHOTO": {
      if (!resourceId) break;
      const photoCount = await prisma.itemPhoto.count({
        where: { itemId: resourceId },
      });
      if (photoCount >= limits.maxPhotosPerItem) {
        return {
          allowed: false,
          message: `Maximum ${limits.maxPhotosPerItem} photo${limits.maxPhotosPerItem === 1 ? "" : "s"} per item on ${tierName}. Upgrade for more!`,
          upgradeUrl,
        };
      }
      break;
    }

    case "USE_BOT": {
      if (botName && !canUseBotOnTier(tierNum, botName)) {
        return {
          allowed: false,
          message: `${botName} is not available on the ${tierName} plan. Upgrade to unlock!`,
          upgradeUrl,
          alternativeAction: "BUY_CREDITS",
        };
      }
      break;
    }

    case "USE_MEGABOT": {
      if (!canUseBotOnTier(tierNum, "megaBot")) {
        return {
          allowed: false,
          message: `MegaBot is not available on the ${tierName} plan. Upgrade to DIY Seller or higher!`,
          upgradeUrl,
          alternativeAction: "BUY_CREDITS",
        };
      }
      // MegaBot is now credit-based (no monthly limit) — credit check handled separately
      break;
    }

    case "CREATE_PROJECT": {
      if (limits.maxProjects === null) break; // unlimited
      if (limits.maxProjects === 0) {
        return {
          allowed: false,
          message: `Projects are not available on the ${tierName} plan. Upgrade to DIY Seller or higher!`,
          upgradeUrl,
        };
      }
      const projectCount = await prisma.project.count({ where: { userId } });
      if (projectCount >= limits.maxProjects) {
        return {
          allowed: false,
          message: `You've reached your ${limits.maxProjects}-project limit. Upgrade for more!`,
          upgradeUrl,
        };
      }
      break;
    }

    case "ACCESS_ANALYTICS": {
      if (!limits.hasAnalytics) {
        return {
          allowed: false,
          message: `Analytics are available on ${TIER_NAMES[TIER.POWER_SELLER]} and higher plans.`,
          upgradeUrl,
        };
      }
      break;
    }

    case "ACCESS_BUYER_FINDER": {
      if (!limits.hasBuyerFinder) {
        return {
          allowed: false,
          message: `Buyer Finder is available on ${TIER_NAMES[TIER.DIY_SELLER]} and higher plans.`,
          upgradeUrl,
        };
      }
      break;
    }

    case "ACCESS_STOREFRONT": {
      if (!limits.hasStorefront) {
        return {
          allowed: false,
          message: `Custom storefront is available on the ${TIER_NAMES[TIER.ESTATE_MANAGER]} plan.`,
          upgradeUrl,
        };
      }
      break;
    }

    case "ACCESS_STORYTELLING": {
      if (!limits.hasStoryTelling) {
        return {
          allowed: false,
          message: `Storytelling tools are available on ${TIER_NAMES[TIER.POWER_SELLER]} and higher plans.`,
          upgradeUrl,
        };
      }
      break;
    }
  }

  return { allowed: true };
}

/** Quick synchronous check without DB (use when you already have tier number) */
export function checkTierLimitSync(
  userTierNumber: number,
  action: string,
  currentCount: number
): TierCheckResult {
  // Demo bypass
  if (isDemoMode()) {
    return { allowed: true, reason: "demo_bypass" };
  }

  const limits = TIER_LIMITS[userTierNumber] ?? TIER_LIMITS[TIER.FREE];
  const tierName = TIER_NAMES[userTierNumber] ?? "Free";
  const upgradeUrl = "/pricing?upgrade=true";

  const limitMap: Record<string, number | null> = {
    items: limits.maxActiveItems,
    photos: limits.maxPhotosPerItem,
    projects: limits.maxProjects,
    megabot: limits.megaBotMonthly,
  };

  const limit = limitMap[action];
  if (limit !== undefined && limit !== null && currentCount >= limit) {
    return {
      allowed: false,
      message: `Limit reached (${limit}) on ${tierName}. Upgrade to continue!`,
      upgradeUrl,
    };
  }

  return { allowed: true };
}

/** Check if a specific bot is available for a user's tier */
export function canUserUseBotSync(
  userTierNumber: number,
  botName: BotName
): TierCheckResult {
  if (isDemoMode()) {
    return { allowed: true, reason: "demo_bypass" };
  }

  if (canUseBotOnTier(userTierNumber, botName)) {
    return { allowed: true };
  }

  const tierName = TIER_NAMES[userTierNumber] ?? "Free";
  return {
    allowed: false,
    message: `${botName} is not available on the ${tierName} plan. Upgrade to unlock!`,
    upgradeUrl: "/pricing?upgrade=true",
  };
}
