import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/constants/pricing";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { itemId, floorPrice, notes } = body;
    if (!itemId || floorPrice == null || Number(floorPrice) <= 0) {
      return NextResponse.json({ error: "Valid itemId and floorPrice required" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id && !isDemoMode()) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 });
    }

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "FLOOR_PRICE_SET",
        payload: JSON.stringify({ floorPrice: Number(floorPrice), notes: notes || null, userId: user.id }),
      },
    });

    return NextResponse.json({ success: true, itemId, floorPrice: Number(floorPrice) });
  } catch {
    return NextResponse.json({ error: "Failed to set floor price" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const itemId = req.nextUrl.searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id && !isDemoMode()) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 });
    }

    const log = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "FLOOR_PRICE_SET" },
      orderBy: { createdAt: "desc" },
    });
    if (!log?.payload) return NextResponse.json({ floorPrice: null });
    try {
      return NextResponse.json(JSON.parse(log.payload));
    } catch {
      return NextResponse.json({ floorPrice: null });
    }
  } catch {
    return NextResponse.json({ floorPrice: null });
  }
}
