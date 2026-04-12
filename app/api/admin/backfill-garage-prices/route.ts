import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateGarageSalePrices } from "@/lib/pricing/garage-sale";
import { isDemoMode } from "@/lib/bot-mode";

/**
 * POST /api/admin/backfill-garage-prices
 * Backfills garage sale prices for all items with a valuation but no garage prices.
 * No auth required in demo mode — admin-only in production.
 */
export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const items = await prisma.item.findMany({
      where: { garageSalePrice: null },
      include: { valuation: true },
    });

    const needsBackfill = items.filter((i) => i.valuation);
    let backfilled = 0;
    let skipped = 0;

    for (const item of needsBackfill) {
      try {
        const mid = (item.valuation as any)?.mid ?? Math.round((item.valuation!.low + item.valuation!.high) / 2);
        if (mid <= 0) { skipped++; continue; }

        const prices = calculateGarageSalePrices(
          mid,
          (item as any).category || "default",
          (item as any).condition || (item as any).conditionGrade || "good",
          (item as any).saleZip || undefined,
        );

        await prisma.item.update({
          where: { id: item.id },
          data: {
            garageSalePrice: prices.garageSalePrice,
            garageSalePriceHigh: prices.garageSalePriceHigh,
            quickSalePrice: prices.quickSalePrice,
            quickSalePriceHigh: prices.quickSalePriceHigh,
            garageSaleCalcAt: new Date(),
          },
        });
        backfilled++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ ok: true, total: items.length, backfilled, skipped });
  } catch (err) {
    console.error("[backfill-garage-prices] Error:", err);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
