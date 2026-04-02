import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";
import { suggestPackage, suggestShippingMethod } from "@/lib/shipping/package-suggestions";
import { getMetroEstimates } from "@/lib/shipping/metro-estimates";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const log = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "SHIPBOT_RESULT" },
    orderBy: { createdAt: "desc" },
  });

  if (!log) {
    return NextResponse.json({ hasResult: false });
  }

  let result = null;
  try { result = log.payload ? JSON.parse(log.payload) : null; } catch { /* ignore */ }

  return NextResponse.json({ hasResult: true, result, createdAt: log.createdAt });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { aiResult: true, valuation: true, antiqueCheck: true, photos: { select: { id: true } } },
  });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let ai: Record<string, any> = {};
  if (item.aiResult?.rawJson) {
    try { ai = JSON.parse(item.aiResult.rawJson); } catch { /* use empty */ }
  }

  const category = ai.category || (item as any).category || "General";
  const material = ai.material || null;
  const dimensionsEstimate = ai.dimensions_estimate || null;
  const weightLbs = ai.weight_estimate_lbs ?? null;
  const shippingDifficulty = ai.shipping_difficulty ?? null;
  const shippingNotes = ai.shipping_notes ?? null;
  const saleZip = (item as any).saleZip || null;

  const pkg = suggestPackage(category, dimensionsEstimate, material, weightLbs, shippingNotes);
  const maxDim = Math.max(pkg.length, pkg.width, pkg.height);
  const method = suggestShippingMethod(category, pkg.weightEstimate, maxDim, (item as any).saleMethod || undefined, shippingDifficulty);
  const metroEstimates = getMetroEstimates(saleZip, pkg.weightEstimate);

  const weight = pkg.weightEstimate;
  const carriers: { name: string; cost: number; days: string; recommended: boolean }[] = [];
  if (method === "parcel") {
    carriers.push(
      { name: "USPS Priority Mail", cost: Math.round((8 + weight * 0.35) * 100) / 100, days: "2-3 days", recommended: weight <= 15 },
      { name: "UPS Ground", cost: Math.round((10 + weight * 0.45) * 100) / 100, days: "3-5 days", recommended: weight > 15 && weight <= 50 },
      { name: "FedEx Home Delivery", cost: Math.round((11 + weight * 0.42) * 100) / 100, days: "2-5 days", recommended: false },
    );
    if (weight <= 1) {
      carriers.unshift({ name: "USPS First Class", cost: Math.round((3.50 + weight * 0.5) * 100) / 100, days: "3-5 days", recommended: true });
      carriers[1].recommended = false;
    }
  } else if (method === "freight") {
    carriers.push(
      { name: "UPS Freight LTL", cost: Math.round((80 + weight * 0.8) * 100) / 100, days: "5-10 days", recommended: true },
      { name: "FedEx Freight", cost: Math.round((90 + weight * 0.75) * 100) / 100, days: "5-8 days", recommended: false },
      { name: "Local Freight Broker", cost: Math.round((60 + weight * 1.0) * 100) / 100, days: "7-14 days", recommended: false },
    );
  }

  const valuationHigh = item.valuation?.high ?? ai.estimated_value_high ?? 0;
  const valuationMid = (item.valuation as any)?.mid ?? ai.estimated_value_mid ?? 0;
  const isAntique = item.antiqueCheck?.isAntique ?? ai.is_antique ?? false;
  const isCollectible = ai.is_collectible ?? false;
  const insuranceRecommended = valuationMid > 100 || isAntique || isCollectible || pkg.isFragile;
  const insuranceCost = insuranceRecommended ? Math.round(Math.max(valuationHigh, valuationMid) * 0.01 * 100) / 100 : 0;
  const declaredValue = Math.max(valuationHigh, valuationMid);

  const cheapestCarrier = carriers.length > 0 ? carriers.reduce((a, b) => a.cost < b.cost ? a : b) : null;

  const result = {
    _isDemo: false,
    packageSuggestion: {
      type: pkg.label,
      boxSize: pkg.boxSize,
      dimensions: `${pkg.length} x ${pkg.width} x ${pkg.height} in`,
      length: pkg.length, width: pkg.width, height: pkg.height,
      maxWeight: `${Math.ceil(pkg.weightEstimate * 1.5)} lbs`,
    },
    weightEstimate: pkg.weightEstimate,
    isFragile: pkg.isFragile,
    packagingNotes: pkg.packagingNotes,
    shippingMethod: method,
    suggestedCarrier: cheapestCarrier?.name ?? "Local Pickup",
    estimatedCost: cheapestCarrier ? {
      low: Math.round(cheapestCarrier.cost * 0.85 * 100) / 100,
      mid: cheapestCarrier.cost,
      high: Math.round(cheapestCarrier.cost * 1.25 * 100) / 100,
    } : { low: 0, mid: 0, high: 0 },
    carriers,
    metroEstimates,
    insurance: {
      recommended: insuranceRecommended,
      reason: insuranceRecommended
        ? (isAntique ? "Antique item — insurance strongly recommended" :
           isCollectible ? "Collectible item — insurance recommended" :
           pkg.isFragile ? "Fragile item — insurance recommended" :
           `Item value $${Math.round(valuationMid)}+ — insurance recommended`)
        : "Item value under $100 and not fragile — insurance optional",
      estimatedCost: insuranceCost,
      declaredValue: Math.round(declaredValue),
    },
    localPickupRecommended: method === "local_only" || method === "local_recommended",
    freightRequired: method === "freight",
    summary: method === "local_only"
      ? `This ${category.toLowerCase()} is best suited for local pickup only. At ${Math.round(weight)} lbs, it's too large/heavy for standard carriers.`
      : method === "freight"
      ? `This ${category.toLowerCase()} requires freight shipping (~$${Math.round(cheapestCarrier?.cost ?? 100)}). ${pkg.isFragile ? "FRAGILE — extra padding required. " : ""}${insuranceRecommended ? `Insurance recommended ($${insuranceCost}).` : ""}`
      : `Ship via ${cheapestCarrier?.name ?? "USPS"} for ~$${cheapestCarrier?.cost ?? 12}. Package: ${pkg.label.toLowerCase()} (${pkg.length}x${pkg.width}x${pkg.height}", ~${Math.round(weight)} lbs). ${pkg.isFragile ? "FRAGILE — wrap carefully. " : ""}${insuranceRecommended ? `Add insurance ($${insuranceCost}).` : ""}`,
    _dataSource: {
      weight: weightLbs ? "AI analysis" : "category estimate",
      dimensions: dimensionsEstimate ? "AI analysis" : "category default",
      fragility: pkg.isFragile ? (material ? "material detection" : "category default") : "not fragile",
      insurance: insuranceRecommended ? "valuation-based" : "not needed",
    },
  };

  await prisma.eventLog.create({
    data: { itemId, eventType: "SHIPBOT_RESULT", payload: JSON.stringify(result) },
  });

  return NextResponse.json({ success: true, result, isDemo: false });
}
