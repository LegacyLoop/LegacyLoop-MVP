import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";

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

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const result = {
    _isDemo: true,
    suggestedCarrier: "USPS Priority Mail",
    estimatedCost: { low: 8.50, mid: 12.75, high: 18.99 },
    packageSuggestion: {
      type: "Medium Flat Rate Box",
      dimensions: "11x8.5x5.5 in",
      maxWeight: "70 lbs",
    },
    isFragile: false,
    shippingMethod: "parcel",
    carriers: [
      { name: "USPS Priority", cost: 12.75, days: "2-3 days" },
      { name: "UPS Ground", cost: 14.50, days: "3-5 days" },
      { name: "FedEx Home", cost: 16.20, days: "2-5 days" },
    ],
    localPickupRecommended: false,
    freightRequired: false,
    summary: "Standard parcel shipping recommended. USPS Priority offers the best value for this item's size and weight.",
  };

  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "SHIPBOT_RESULT",
      payload: JSON.stringify(result),
    },
  });

  return NextResponse.json({ success: true, result, isDemo: true });
}
