/**
 * Founding Member Stats — REAL data, not decorative.
 *
 * This is the single source of truth for all founding-member counts
 * displayed anywhere in the app. Every number a user or investor sees
 * comes from a live DB query through this module.
 *
 * A "founding member" is any user on a paid tier (tier >= 2).
 * Total capacity is defined in DISCOUNTS.preLaunch.totalSpots (100).
 */

import { prisma } from "@/lib/db";
import { DISCOUNTS } from "@/lib/constants/pricing";

export interface FoundingMemberStats {
  /** Total founding member capacity (from pricing constants) */
  totalSpots: number;
  /** How many spots have been claimed (real DB count of tier >= 2 users) */
  claimed: number;
  /** How many spots remain open */
  remaining: number;
  /** Percentage of spots claimed (0-100) */
  percentClaimed: number;
  /** Whether spots are still available */
  isOpen: boolean;
  /** Urgency tier for UI styling: "plenty" | "filling" | "scarce" | "final" | "closed" */
  urgency: "plenty" | "filling" | "scarce" | "final" | "closed";
}

/**
 * Query the database for real founding member counts.
 * Call this from server components or API routes — never from client code.
 */
export async function getFoundingMemberStats(): Promise<FoundingMemberStats> {
  const totalSpots = DISCOUNTS.preLaunch.totalSpots; // 100

  let claimed = 0;
  try {
    claimed = await prisma.user.count({
      where: { tier: { gte: 2 } },
    });
  } catch {
    // If DB is unreachable, return safe defaults (all spots open)
    claimed = 0;
  }

  const remaining = Math.max(0, totalSpots - claimed);
  const percentClaimed = Math.round((claimed / totalSpots) * 100);
  const isOpen = remaining > 0;

  let urgency: FoundingMemberStats["urgency"];
  if (!isOpen) {
    urgency = "closed";
  } else if (remaining <= 5) {
    urgency = "final";
  } else if (remaining <= 20) {
    urgency = "scarce";
  } else if (remaining <= 50) {
    urgency = "filling";
  } else {
    urgency = "plenty";
  }

  return {
    totalSpots,
    claimed,
    remaining,
    percentClaimed,
    isOpen,
    urgency,
  };
}
