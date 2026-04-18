import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";
import { computePricingAccuracy } from "@/lib/pricing/feedback-loop";

/**
 * POST /api/admin/compute-accuracy/[itemId]
 *
 * Admin-only trigger for the pricing feedback-loop. Computes accuracy
 * records + summary for a SOLD item by comparing each historical
 * consensus snapshot's source predictions against the actual sold price.
 *
 * Query params:
 *   ?force=1 — recompute even if a cached summary exists.
 *
 * CMD-PRICING-FEEDBACK-LOOP-V1a
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: "Forbidden — admin only" },
        { status: 403 },
      );
    }

    const { itemId } = await ctx.params;
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    const result = await computePricingAccuracy(itemId, { force });
    return NextResponse.json(result, {
      status: result.status === "error" ? 500 : 200,
    });
  } catch (error) {
    console.error("[/api/admin/compute-accuracy]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
