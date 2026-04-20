import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import { generateIntelligence, getCachedIntelligence } from "@/lib/intelligence/generate";
import { computePricingConsensus } from "@/lib/pricing/reconcile";
import { BOT_CREDIT_COSTS } from "@/lib/constants/pricing";

/* ═══════════════════════════════════════════════════════════════════════
   GET  — Return cached intelligence + staleness info
   POST — Generate fresh intelligence via Claude
   ═══════════════════════════════════════════════════════════════════════ */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const cached = await getCachedIntelligence(itemId);

  return NextResponse.json({
    success: !!cached.result,
    result: cached.result,
    cachedAt: cached.cachedAt,
    isStale: cached.isStale,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
    select: {
      id: true,
      status: true,
      saleZip: true,
      // CMD-RECONCILE-SALE-METHOD-CALLSITES: thread saleMethod +
      // saleRadiusMi into consensus (SSOT with page.tsx SSR + admin/
      // run-jury). Item is the canonical source — body.saleMethod may
      // be absent and should not be relied on here.
      saleMethod: true,
      saleRadiusMi: true,
      photos: { select: { id: true } },
      aiResult: { select: { id: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (!item.aiResult) {
    return NextResponse.json(
      { error: "Run AI Analysis first to generate intelligence" },
      { status: 400 }
    );
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  // Check if this is a refresh (stale cache exists) or first generation
  const existing = await getCachedIntelligence(itemId);
  const isRefresh = !!existing.result;
  const creditCost = isRefresh ? BOT_CREDIT_COSTS.intelligenceRefresh : BOT_CREDIT_COSTS.intelligenceRun;

  // Check and deduct credits
  const credits = await prisma.userCredits.findUnique({ where: { userId: user.id } });
  if (!credits || credits.balance < creditCost) {
    return NextResponse.json(
      { error: `Insufficient credits — need ${creditCost} cr (have ${credits?.balance ?? 0})` },
      { status: 402 }
    );
  }

  await prisma.$transaction([
    prisma.userCredits.update({
      where: { userId: user.id },
      data: { balance: { decrement: creditCost }, spent: { increment: creditCost } },
    }),
    prisma.creditTransaction.create({
      data: {
        userCreditsId: credits.id,
        amount: -creditCost,
        type: "spend",
        description: isRefresh ? "Intelligence refresh" : "Claude Intelligence generation",
        balance: credits.balance - creditCost,
        itemId,
      },
    }),
  ]);

  try {
    const result = await generateIntelligence(itemId, {
      status: item.status,
      listingPrice: body.listingPrice ?? null,
      saleMethod: body.saleMethod ?? null,
      photoCount: item.photos.length,
      saleZip: item.saleZip ?? null,
    });

    // CMD-PRICING-CONSENSUS-V1: enforce consensus values on pricingIntel
    // CMD-RECONCILE-SALE-METHOD-CALLSITES: pass saleMethod + saleRadiusMi
    // so LOCAL_PICKUP items receive v8_engine pass-through (SSOT).
    const consensus = await computePricingConsensus(itemId, {
      saleMethod: item.saleMethod,
      saleRadiusMi: item.saleRadiusMi,
    }).catch(() => null);
    if (consensus && result.pricingIntel) {
      result.pricingIntel.sweetSpot = consensus.consensusAcceptPrice;
      result.pricingIntel.premiumPrice = consensus.consensusListPrice;
      result.pricingIntel.quickSalePrice = consensus.consensusFloorPrice;
      result.pricingIntel.recommendedLow = consensus.consensusValueLow;
      result.pricingIntel.recommendedHigh = consensus.consensusValueHigh;
      (result.pricingIntel as any)._consensus_enforced = true;
    }

    // Cache in EventLog
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "INTELLIGENCE_RESULT",
        payload: JSON.stringify(result),
      },
    });

    return NextResponse.json({
      success: true,
      result,
      cachedAt: new Date().toISOString(),
      isStale: false,
    });
  } catch (err: any) {
    console.error("[Intelligence] Generation error:", err.message);
    return NextResponse.json(
      { error: err.message || "Intelligence generation failed" },
      { status: 500 }
    );
  }
}
