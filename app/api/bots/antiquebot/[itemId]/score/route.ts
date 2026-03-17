import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { computeAuthenticityScore } from "@/lib/antique-score";

type Params = Promise<{ itemId: string }>;

/**
 * POST /api/bots/antiquebot/[itemId]/score
 * Recompute and store the authenticity score after MegaBot or other analysis
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;
    const body = await req.json().catch(() => ({}));
    const { megaBotResult } = body;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true, antiqueCheck: true },
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const scoreResult = computeAuthenticityScore({
      aiResult: item.aiResult,
      antiqueCheck: item.antiqueCheck ?? undefined,
      megaBotResult: megaBotResult ?? undefined,
    });

    if (item.antiqueCheck) {
      await prisma.antiqueCheck.update({
        where: { itemId },
        data: { authenticityScore: scoreResult.score },
      });
    }

    return NextResponse.json({
      score: scoreResult.score,
      tier: scoreResult.tier,
      breakdown: scoreResult.breakdown,
    });
  } catch (e) {
    console.error("[antiquebot/score POST]", e);
    return NextResponse.json({ error: "Score computation failed" }, { status: 500 });
  }
}
