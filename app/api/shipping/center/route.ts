import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all user items with shipping-relevant data
    const items = await prisma.item.findMany({
      where: { userId: user.id },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        aiResult: true,
        valuation: true,
        shipmentLabels: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const preSale: any[] = [];
    const readyToShip: any[] = [];
    const shipped: any[] = [];

    for (const item of items) {
      const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
      const label = item.shipmentLabels[0];

      const base = {
        id: item.id,
        title: item.title || ai?.item_name || `Item #${item.id.slice(0, 6)}`,
        photo: item.photos[0]?.filePath ?? null,
        status: item.status,
        weight: (item as any).shippingWeight ?? null,
        category: ai?.category ?? null,
      };

      if (label && ["SHIPPED", "COMPLETED"].includes(item.status)) {
        shipped.push({
          ...base,
          carrier: label.carrier,
          trackingNumber: label.trackingNumber,
          labelId: label.id,
          shipDate: label.createdAt.toISOString().slice(0, 10),
          estimatedDays: label.estimatedDays,
          deliveryStatus: label.status,
          deliveryMethod: label.deliveryMethod,
          rate: label.rate,
        });
      } else if (item.status === "SOLD") {
        readyToShip.push({
          ...base,
          listingPrice: (item as any).listingPrice ?? null,
          valuationMid: item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null,
        });
      } else if (["ANALYZED", "READY", "LISTED", "INTERESTED"].includes(item.status)) {
        preSale.push({
          ...base,
          valuationLow: item.valuation?.low ?? null,
          valuationHigh: item.valuation?.high ?? null,
        });
      }
    }

    return NextResponse.json({ preSale, readyToShip, shipped });
  } catch (e) {
    console.error("[shipping/center] error:", e);
    return NextResponse.json({ error: "Failed to fetch shipping data" }, { status: 500 });
  }
}
