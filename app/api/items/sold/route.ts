import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";
import { logSoldPrice } from "@/lib/data/sold-price-log";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body?.itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const soldPrice = Number(body.soldPrice);
    if (!soldPrice || soldPrice <= 0) return NextResponse.json({ error: "Sold price must be greater than 0" }, { status: 400 });

    const soldVia = body.soldVia || "direct";

    const item = await prisma.item.findUnique({
      where: { id: body.itemId },
      include: { aiResult: true, valuation: true },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id && !isDemoMode()) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 });
    }

    // Get AI estimated value
    let estimatedValue: number | null = null;
    if (item.valuation) {
      estimatedValue = Math.round((item.valuation.low + item.valuation.high) / 2);
    } else if (item.aiResult?.rawJson) {
      try {
        const ai = JSON.parse(item.aiResult.rawJson);
        estimatedValue = ai.estimated_value_mid ?? ai.estimated_value ?? null;
      } catch { /* ignore */ }
    }

    const priceDelta = estimatedValue != null ? Math.round((soldPrice - estimatedValue) * 100) / 100 : null;
    const soldAt = new Date();

    // Update item with sold price in a transaction
    const [updated] = await prisma.$transaction([
      prisma.item.update({
        where: { id: body.itemId },
        data: {
          soldPrice: Math.round(soldPrice),
          soldAt,
          status: "SOLD",
        },
      }),
      prisma.eventLog.create({
        data: {
          itemId: body.itemId,
          eventType: "SOLD_PRICE_CAPTURED",
          payload: JSON.stringify({
            soldPrice,
            estimatedValue,
            priceDelta,
            soldVia,
            soldAt: soldAt.toISOString(),
            offerId: body.offerId || null,
            category: null,
            condition: null,
          }),
        },
      }),
    ]);

    // Write to sold price log (async, non-blocking)
    let category: string | null = null;
    let condition: string | null = null;
    if (item.aiResult?.rawJson) {
      try {
        const ai = JSON.parse(item.aiResult.rawJson);
        category = ai.category || null;
        condition = ai.condition_guess || null;
      } catch { /* ignore */ }
    }

    logSoldPrice({
      itemId: body.itemId,
      userId: user.id,
      soldPrice,
      estimatedValue,
      priceDelta,
      soldVia,
      category,
      condition,
      soldAt,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      soldPrice,
      estimatedValue,
      priceDelta,
      soldVia,
      soldAt: soldAt.toISOString(),
    });
  } catch (err: any) {
    console.error("[items/sold]", err);
    return NextResponse.json({ error: "Failed to record sold price" }, { status: 500 });
  }
}
