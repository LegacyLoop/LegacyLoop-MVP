import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { calculateGarageSalePrices } from "@/lib/pricing/garage-sale";

/**
 * POST /api/items/garage-price
 * Calculates and saves garage sale + quick sale prices for an item.
 * Body: { itemId }
 *
 * CMD-GARAGE-SALE-PRICING-ENGINE
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { itemId } = await req.json();
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const item = await prisma.item.findFirst({
      where: { id: itemId, userId: user.id },
      include: { valuation: true },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    // Get market price from valuation mid-point
    const marketPrice = item.valuation?.mid ?? (item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null);
    if (!marketPrice || marketPrice <= 0) {
      return NextResponse.json({ error: "No market price available. Run PriceBot first." }, { status: 400 });
    }

    const prices = calculateGarageSalePrices(marketPrice, item.category, (item as any).conditionGrade || item.condition);

    await prisma.item.update({
      where: { id: itemId },
      data: {
        garageSalePrice: prices.garageSalePrice,
        garageSalePriceHigh: prices.garageSalePriceHigh,
        quickSalePrice: prices.quickSalePrice,
        quickSalePriceHigh: prices.quickSalePriceHigh,
        garageSaleCalcAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, ...prices });
  } catch (err) {
    console.error("[garage-price] Error:", err);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
