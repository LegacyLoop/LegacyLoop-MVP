import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { backfillItemIntelligence, backfillAllItems } from "@/lib/data/backfill";
import { updateAllProjectRollups } from "@/lib/data/project-rollup";
import { isAdmin } from "@/lib/constants/admin";

/**
 * GET /api/admin/backfill
 * Returns counts of items with vs without structured intelligence fields.
 */
export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const [
      total,
      withCategory,
      withBrand,
      withEra,
      withMaterial,
      withMaker,
      withConditionGrade,
      withSoldPrice,
      priceSnapshots,
    ] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { category: { not: null } } }),
      prisma.item.count({ where: { brand: { not: null } } }),
      prisma.item.count({ where: { era: { not: null } } }),
      prisma.item.count({ where: { material: { not: null } } }),
      prisma.item.count({ where: { maker: { not: null } } }),
      prisma.item.count({ where: { conditionGrade: { not: null } } }),
      prisma.item.count({ where: { soldPrice: { not: null } } }),
      prisma.priceSnapshot.count(),
    ]);

    return Response.json({
      total,
      withCategory,
      withBrand,
      withEra,
      withMaterial,
      withMaker,
      withConditionGrade,
      withSoldPrice,
      priceSnapshots,
    });
  } catch (err: any) {
    console.error("[admin/backfill] GET failed:", err.message || err);
    return Response.json({ error: "Failed to fetch counts" }, { status: 500 });
  }
}

/**
 * POST /api/admin/backfill
 * Backfill structured intelligence for one or all items.
 * Fire-and-forget — returns immediately.
 */
export async function POST(req: Request) {
  try {
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { itemId, target } = body as { itemId?: string; target?: string };

    // Project rollup backfill
    if (target === "projects") {
      updateAllProjectRollups().catch((err) =>
        console.error("[admin/backfill] Project rollup failed:", err)
      );
      return Response.json({ started: true, mode: "projects" });
    }

    if (itemId) {
      // Backfill single item — run inline (fast)
      await backfillItemIntelligence(itemId);
      return Response.json({ started: true, mode: "single", itemId });
    }

    // Backfill all — fire and forget
    backfillAllItems().catch((err) =>
      console.error("[admin/backfill] Background backfill failed:", err)
    );

    return Response.json({ started: true, mode: "all" });
  } catch (err: any) {
    console.error("[admin/backfill] POST failed:", err.message || err);
    return Response.json({ error: "Failed to start backfill" }, { status: 500 });
  }
}
