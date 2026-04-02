import { NextResponse } from "next/server";
import { getFoundingMemberStats } from "@/lib/founding-members";

/**
 * GET /api/founding-members
 *
 * Public endpoint — returns real founding member stats from the database.
 * Used by client components that can't query Prisma directly.
 *
 * Response shape: FoundingMemberStats
 * {
 *   totalSpots: 100,
 *   claimed: 3,
 *   remaining: 97,
 *   percentClaimed: 3,
 *   isOpen: true,
 *   urgency: "plenty"
 * }
 *
 * Cached for 60 seconds to avoid hammering the DB on high-traffic pages.
 */
export async function GET() {
  try {
    const stats = await getFoundingMemberStats();

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    // Fallback: return full capacity (safe default)
    return NextResponse.json(
      {
        totalSpots: 100,
        claimed: 0,
        remaining: 100,
        percentClaimed: 0,
        isOpen: true,
        urgency: "plenty",
      },
      { status: 200 }
    );
  }
}
