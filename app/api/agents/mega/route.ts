import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { runMegaAnalysis } from "@/lib/agents/runner";
import type { BotType } from "@/lib/agents/runner";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId, botType } = await req.json();
    if (!itemId || !botType) {
      return NextResponse.json({ error: "itemId and botType required" }, { status: 400 });
    }

    const validTypes: BotType[] = ["analyze", "pricing", "listing", "shipping", "style", "antique", "vehicle"];
    if (!validTypes.includes(botType)) {
      return NextResponse.json({ error: "Invalid botType" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true, valuation: true },
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    const name = ai?.item_name || item.title || "Unknown Item";
    const category = ai?.category || "General";
    const priceMid = item.valuation
      ? Math.round((item.valuation.low + item.valuation.high) / 2)
      : (ai?.estimated_value_mid || 55);

    const run = runMegaAnalysis(itemId, botType as BotType, { name, category, priceMid });

    return NextResponse.json(run);
  } catch (e) {
    console.error("[agents/mega] error:", e);
    return NextResponse.json({ error: "Failed to run mega analysis" }, { status: 500 });
  }
}
