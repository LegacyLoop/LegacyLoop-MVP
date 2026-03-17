import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const logs = await prisma.eventLog.findMany({ where: { eventType: "BUNDLE_CREATED" }, orderBy: { createdAt: "desc" }, take: 200 });

    let bundle: Record<string, unknown> | null = null;
    for (const l of logs) {
      try {
        const b = JSON.parse(l.payload || "{}");
        if (b.shareSlug === slug) { bundle = b; break; }
      } catch {
        // skip malformed payload
      }
    }

    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    const bundleItemIds = (bundle.itemIds as string[]) || [];

    // Fetch full item details
    const items = await prisma.item.findMany({
      where: { id: { in: bundleItemIds } },
      select: { id: true, title: true, description: true, condition: true, listingPrice: true, status: true },
    });

    const itemPhotos = await prisma.itemPhoto.findMany({
      where: { itemId: { in: bundleItemIds } },
      orderBy: { order: "asc" },
    });

    const itemsWithPhotos = items.map(i => ({
      ...i,
      photos: itemPhotos.filter(p => p.itemId === i.id).slice(0, 2).map(p => ({ filePath: p.filePath })),
    }));

    // Get seller info
    const seller = bundle.userId
      ? await prisma.user.findUnique({ where: { id: bundle.userId as string }, select: { displayName: true, createdAt: true } })
      : null;

    return NextResponse.json({
      bundle,
      items: itemsWithPhotos,
      seller: { name: seller?.displayName || "LegacyLoop Seller", memberSince: seller?.createdAt },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to fetch bundle" }, { status: 500 });
  }
}
