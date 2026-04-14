import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { recalcGarageSalePrices } from "@/lib/pricing/garage-sale-recalc";

/**
 * POST /api/items/garage-price
 * Calculates and saves garage sale + quick sale prices for an item.
 * V2: Uses enriched recalculation with all bot data.
 * Body: { itemId }
 *
 * CMD-GARAGE-SALE-ENGINE-V2
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { itemId } = await req.json();
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    // Verify ownership
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId: user.id },
      select: { id: true },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const prices = await recalcGarageSalePrices(itemId);
    if (!prices) {
      return NextResponse.json({ error: "No market price available. Run PriceBot first." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ...prices });
  } catch (err) {
    console.error("[garage-price] Error:", err);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
