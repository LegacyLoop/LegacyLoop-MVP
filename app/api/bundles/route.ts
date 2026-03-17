import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/constants/pricing";

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's items to find bundles
    const userItems = await prisma.item.findMany({ where: { userId: user.id }, select: { id: true } });
    const itemIds = userItems.map(i => i.id);

    const logs = await prisma.eventLog.findMany({
      where: { eventType: "BUNDLE_CREATED", itemId: { in: itemIds } },
      orderBy: { createdAt: "desc" },
    });

    const bundles = logs.map(l => {
      try { return { ...JSON.parse(l.payload || "{}"), eventLogId: l.id }; } catch { return null; }
    }).filter(Boolean);

    return NextResponse.json({ bundles });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to fetch bundles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { title, description, bundleType, categoryFilter, itemIds, bundlePrice, allowOffers } = body;

    if (!title || !itemIds?.length || !bundlePrice) return NextResponse.json({ error: "title, itemIds, and bundlePrice required" }, { status: 400 });
    if (bundlePrice <= 0) return NextResponse.json({ error: "Bundle price must be > 0" }, { status: 400 });

    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, userId: true, title: true, listingPrice: true, status: true },
    });

    // Verify ownership
    if (!isDemoMode() && items.some(i => i.userId !== user.id)) {
      return NextResponse.json({ error: "You don't own all selected items" }, { status: 403 });
    }

    const individualTotal = items.reduce((s, i) => s + (i.listingPrice || 0), 0);
    const discountPercent = individualTotal > 0 ? Math.round(((individualTotal - bundlePrice) / individualTotal) * 100) : 0;
    const shareSlug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40) + "-" + Date.now().toString(36);
    const bundleId = "bndl_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const bundle = {
      id: bundleId,
      userId: user.id,
      title,
      description: description || null,
      bundleType: bundleType || "custom",
      categoryFilter: categoryFilter || null,
      itemIds,
      itemTitles: items.map(i => i.title || "Untitled"),
      individualTotal: Math.round(individualTotal * 100) / 100,
      bundlePrice: Math.round(bundlePrice * 100) / 100,
      discountPercent,
      allowOffers: allowOffers !== false,
      shareSlug,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    await prisma.eventLog.create({
      data: { itemId: itemIds[0], eventType: "BUNDLE_CREATED", payload: JSON.stringify(bundle) },
    });

    return NextResponse.json({ bundle, shareSlug, shareUrl: `/bundle/${shareSlug}` });
  } catch (err: unknown) {
    console.error("[bundles POST]", err);
    return NextResponse.json({ error: "Failed to create bundle" }, { status: 500 });
  }
}
