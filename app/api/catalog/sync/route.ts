import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";
import { mapItemToCatalog, buildBatchUpsertPayload, type CatalogSyncResult } from "@/lib/catalog/square-mapper";

export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const { itemIds, platform } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "itemIds array required" }, { status: 400 });
    }
    if (itemIds.length > 50) {
      return NextResponse.json({ error: "Max 50 items per sync" }, { status: 400 });
    }
    if (!["square", "stripe"].includes(platform)) {
      return NextResponse.json({ error: "platform must be 'square' or 'stripe'" }, { status: 400 });
    }

    const items = await prisma.item.findMany({
      where: { id: { in: itemIds }, userId: user.id },
      include: { photos: { take: 5 }, aiResult: true, valuation: true, project: true },
    });

    if (items.length === 0) {
      return NextResponse.json({ error: "No matching items found" }, { status: 404 });
    }

    const catalogItems = items.map(mapItemToCatalog);
    const payload = buildBatchUpsertPayload(items);

    const results: CatalogSyncResult[] = [];

    if (isDemoMode()) {
      // Demo mode: return mock success
      for (const item of items) {
        results.push({
          itemId: item.id,
          success: true,
          squareCatalogId: `demo_sq_${item.id.slice(0, 8)}_${Date.now()}`,
          syncedAt: new Date().toISOString(),
        });
      }

      // Log demo sync event
      await prisma.eventLog.create({
        data: {
          itemId: items[0].id,
          eventType: "CATALOG_SYNC_DEMO",
          payload: JSON.stringify({
            platform,
            itemCount: items.length,
            itemIds: items.map((i) => i.id),
            userId: user.id,
          }),
        },
      }).catch(() => null);
    } else {
      // Live mode: Square Catalog API (future)
      // TODO: CMD-POS-LIVE-1 — Wire Square Catalog batch-upsert
      for (const item of items) {
        results.push({
          itemId: item.id,
          success: false,
          error: "Live catalog sync not yet configured. Set up Square production keys.",
          syncedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      platform,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (err: unknown) {
    console.error("[catalog-sync] Error:", err);
    return NextResponse.json({ error: "Catalog sync failed" }, { status: 500 });
  }
}
