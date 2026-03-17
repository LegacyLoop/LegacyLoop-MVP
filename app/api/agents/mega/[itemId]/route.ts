import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { runMegaAnalysis } from "@/lib/agents/runner";
import type { BotType } from "@/lib/agents/runner";

type Params = Promise<{ itemId: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true, valuation: true, antiqueCheck: true },
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

    const itemData = { name, category, priceMid };

    // Generate mega runs for all applicable bot types
    const botTypes: BotType[] = ["analyze", "pricing", "listing", "shipping", "style"];

    // Add vehicle if applicable
    const VEHICLE_KEYWORDS = ["car", "truck", "vehicle", "automobile", "suv", "van", "motorcycle", "atv", "boat", "tractor", "trailer", "rv", "camper"];
    if (VEHICLE_KEYWORDS.some((kw) => category.toLowerCase().includes(kw))) {
      botTypes.push("vehicle");
    }

    // Add antique if applicable
    if (item.antiqueCheck?.isAntique) {
      botTypes.push("antique");
    }

    const runs: Record<string, any> = {};
    for (const bt of botTypes) {
      runs[bt] = runMegaAnalysis(itemId, bt, itemData);
    }

    return NextResponse.json({ itemId, runs });
  } catch (e) {
    console.error("[agents/mega/itemId] error:", e);
    return NextResponse.json({ error: "Failed to fetch mega runs" }, { status: 500 });
  }
}
