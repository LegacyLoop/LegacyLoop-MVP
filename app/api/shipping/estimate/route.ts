import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { getShippingRates } from "@/lib/shipping/shippo";

type CarrierEstimate = {
  carrier: string;
  service: string;
  price: number;
  days: string;
};

function estimateWeight(category: string): number {
  const weights: Record<string, number> = {
    electronics: 3, furniture: 45, clothing: 1.5, jewelry: 0.5, art: 8,
    toys: 2, books: 3, antiques: 10, tools: 12, sports: 6,
    instruments: 15, collectibles: 2, kitchenware: 5, appliances: 25,
    vehicles: 0, // LTL
  };
  const key = Object.keys(weights).find((k) => category.toLowerCase().includes(k));
  return key ? weights[key] : 5;
}

function estimateBox(weight: number): { length: number; width: number; height: number; label: string } {
  if (weight <= 2) return { length: 12, width: 9, height: 4, label: 'Small box (12"×9"×4")' };
  if (weight <= 10) return { length: 18, width: 14, height: 8, label: 'Medium box (18"×14"×8")' };
  if (weight <= 30) return { length: 24, width: 18, height: 12, label: 'Large box (24"×18"×12")' };
  return { length: 36, width: 24, height: 18, label: 'Extra large box (36"×24"×18")' };
}

function getCarrierEstimates(weight: number): CarrierEstimate[] {
  if (weight >= 40) {
    // LTL freight
    return [
      { carrier: "FedEx Freight", service: "LTL Economy", price: Math.round(89 + weight * 0.6), days: "5-10" },
      { carrier: "UPS Freight", service: "LTL Standard", price: Math.round(95 + weight * 0.55), days: "5-8" },
      { carrier: "USPS", service: "Not available", price: 0, days: "N/A" },
    ];
  }
  const base = 4 + weight * 0.65;
  return [
    { carrier: "USPS", service: "Priority Mail", price: Math.round((base * 0.9) * 100) / 100, days: "2-3" },
    { carrier: "USPS", service: "Ground Advantage", price: Math.round((base * 0.7) * 100) / 100, days: "4-7" },
    { carrier: "UPS", service: "Ground", price: Math.round((base * 1.1) * 100) / 100, days: "3-5" },
    { carrier: "FedEx", service: "Home Delivery", price: Math.round((base * 1.05) * 100) / 100, days: "3-5" },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId, destZip } = await req.json();
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true },
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const aiData = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    const category = aiData?.category || (item as any).category || "general";

    // Use item's actual dimensions → AI fallback → category estimate
    const itemWeight = (item as any).shippingWeight;
    const itemLength = (item as any).shippingLength;
    const itemWidth = (item as any).shippingWidth;
    const itemHeight = (item as any).shippingHeight;

    const aiShip = aiData?.shipping_profile ?? aiData?.dimensions_estimate;
    const aiWeight = aiShip?.weight ?? aiShip?.estimated_weight;
    const aiLength = aiShip?.length ?? aiShip?.estimated_length;
    const aiWidth = aiShip?.width ?? aiShip?.estimated_width;
    const aiHeight = aiShip?.height ?? aiShip?.estimated_height;

    const weight = itemWeight ?? aiWeight ?? estimateWeight(category);
    const hasRealDims = (itemLength && itemWidth && itemHeight) || (aiLength && aiWidth && aiHeight);

    const box = hasRealDims
      ? {
          length: itemLength ?? aiLength,
          width: itemWidth ?? aiWidth,
          height: itemHeight ?? aiHeight,
          label: `${itemLength ?? aiLength}\u00D7${itemWidth ?? aiWidth}\u00D7${itemHeight ?? aiHeight} in`,
        }
      : estimateBox(weight);

    const isLTL = weight >= 40;
    const isFragile = (item as any).isFragile || /glass|ceramic|porcelain|crystal|china|mirror|antique/i.test(category + " " + (item.title || ""));
    const fromZip = item.saleZip || "04101";
    const toZip = destZip || "10001"; // default to NYC (best market)

    // Try real Shippo rates first, fall back to estimates
    let carriers: CarrierEstimate[];
    let isLiveRates = false;
    try {
      const shippoResult = await getShippingRates(
        { zip: fromZip },
        { zip: toZip },
        { length: box.length, width: box.width, height: box.height, weight },
      );
      if (shippoResult.rates.length > 0) {
        carriers = shippoResult.rates.slice(0, 6).map((r) => ({
          carrier: r.carrier,
          service: r.service,
          price: r.rate,
          days: r.estimatedDays ? `${r.estimatedDays}` : "3-7",
        }));
        isLiveRates = !shippoResult.isDemo;
      } else {
        carriers = getCarrierEstimates(weight);
      }
    } catch {
      carriers = getCarrierEstimates(weight);
    }

    const packagingTips: string[] = [];
    if (isFragile) packagingTips.push("Wrap in bubble wrap \u2014 double layer for antiques and glass items");
    if (weight > 20) packagingTips.push("Use double-walled corrugated box for heavy items");
    packagingTips.push("Fill all empty space with packing peanuts or crumpled paper");
    if (isLTL) packagingTips.push("Palletize for LTL freight \u2014 must be strapped and shrink-wrapped");

    // Persist quote to EventLog for history
    const cheapest = carriers.filter(c => c.price > 0).sort((a, b) => a.price - b.price)[0] ?? null;
    await prisma.eventLog.create({
      data: {
        itemId,
        userId: user.id,
        eventType: "SHIPPING_QUOTED",
        payload: JSON.stringify({
          carriers: carriers.slice(0, 4),
          cheapest,
          weight, box, isFragile, isLTL,
          fromZip, toZip,
          quotedAt: new Date().toISOString(),
          isLiveRates,
        }),
      },
    }).catch(() => null);

    return NextResponse.json({
      itemId,
      weight,
      box,
      carriers,
      isLTL,
      isFragile,
      isLiveRates,
      packagingTips,
      fromZip,
      toZip,
    });
  } catch (e) {
    console.error("[shipping/estimate] error:", e);
    return NextResponse.json({ error: "Failed to estimate shipping" }, { status: 500 });
  }
}
