import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";
import { prisma } from "@/lib/db";
import { runPricingJury } from "@/lib/pricing/jury";
import { computePricingConsensus } from "@/lib/pricing/reconcile";

/**
 * POST /api/admin/run-jury/[itemId]
 *
 * Admin-only trigger for the pricing jury. Fetches the item, runs the
 * current consensus, and asks Claude Sonnet to adjudicate dissenting
 * source opinions. Cached 24h per item; ?force=1 bypasses cache.
 *
 * CMD-AI-JURY-V1a
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = await authAdapter.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.email)) {
      return NextResponse.json(
        { error: "Forbidden — admin only" },
        { status: 403 },
      );
    }

    const { itemId } = await ctx.params;
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        title: true,
        category: true,
        brand: true,
        condition: true,
        saleZip: true,
        // CMD-RECONCILE-SALE-METHOD-CALLSITES: thread saleMethod +
        // saleRadiusMi into consensus so LOCAL_PICKUP items get
        // v8_engine pass-through at jury-time (SSOT with page.tsx SSR).
        saleMethod: true,
        saleRadiusMi: true,
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const consensus = await computePricingConsensus(itemId, {
      category: item.category,
      brand: item.brand,
      saleMethod: item.saleMethod,
      saleRadiusMi: item.saleRadiusMi,
    });
    if (!consensus || consensus.sources.length === 0) {
      return NextResponse.json({
        status: "no_consensus",
        message: "No pricing sources available for this item",
      });
    }

    const result = await runPricingJury({
      item: {
        itemId,
        title: item.title ?? "Unknown Item",
        category: item.category,
        brand: item.brand,
        condition: item.condition,
        ageYears: null,
        locationZip: item.saleZip ?? null,
      },
      sources: consensus.sources.map(s => ({
        name: s.name,
        listPrice: s.listPrice,
        acceptPrice: s.acceptPrice,
        floorPrice: s.floorPrice,
        valueLow: s.valueLow,
        valueHigh: s.valueHigh,
        confidence: s.confidence,
        ageHours: (Date.now() - new Date(s.timestamp).getTime()) / 3_600_000,
      })),
      spread: {
        listPrice: consensus.dissents.find(d => d.field === "listPrice")?.spreadPct,
        acceptPrice: consensus.dissents.find(d => d.field === "acceptPrice")?.spreadPct,
        floorPrice: consensus.dissents.find(d => d.field === "floorPrice")?.spreadPct,
        valueRange: consensus.dissents.find(d => d.field === "valueRange")?.spreadPct,
      },
      force,
    });

    return NextResponse.json(result, {
      status: result.status === "error" ? 500 : 200,
    });
  } catch (error) {
    console.error("[/api/admin/run-jury]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
