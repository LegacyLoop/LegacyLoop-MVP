import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

const BOT_DEFS = [
  { id: "analyzebot", name: "AnalyzeBot", icon: "🔍", desc: "48+ attribute identification from photos — the foundation that feeds all other bots", route: "/bots/analyzebot" },
  { id: "megabot", name: "MegaBot", icon: "🤖", desc: "4-AI consensus engine — runs OpenAI, Claude, Gemini, and Grok in parallel per bot", route: "/bots/megabot" },
  { id: "pricebot", name: "PriceBot", icon: "💰", desc: "Deep pricing intelligence with local vs national market data from 42 platforms", route: "/bots/pricebot" },
  { id: "photobot", name: "PhotoBot", icon: "📷", desc: "AI photo assessment, scoring, enhancement, background removal, and professional imagery", route: "/bots/photobot" },
  { id: "listbot", name: "ListBot", icon: "📝", desc: "Listing optimization for 13 marketplace platforms with SEO and copy", route: "/bots/listbot" },
  { id: "buyerbot", name: "BuyerBot", icon: "🎯", desc: "Buyer acquisition specialist — finds real buyers across social platforms", route: "/bots/buyerbot" },
  { id: "reconbot", name: "ReconBot", icon: "🛰️", desc: "Competitor intelligence — monitors listings, prices, and market position in real-time", route: "/bots/reconbot" },
  { id: "antiquebot", name: "AntiqueBot", icon: "🏺", desc: "Antique authentication, provenance research, and auction valuation", route: "/bots/antiquebot" },
  { id: "collectiblesbot", name: "CollectiblesBot", icon: "🃏", desc: "Collectible grading, PSA/BGS assessment, and specialty marketplace pricing", route: "/bots/collectiblesbot" },
  { id: "carbot", name: "CarBot", icon: "🚗", desc: "Vehicle evaluation with NHTSA data, VIN decoding, and market pricing", route: "/bots/carbot" },
  { id: "videobot", name: "VideoBot", icon: "🎬", desc: "AI video ads for TikTok, Reels, Shorts — narration, music, trending hooks", route: "/bots/videobot" },
];

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const analyzedCount = await prisma.aiResult.count({
      where: { item: { userId: user.id } },
    });

    const bots = BOT_DEFS.map((b) => ({
      ...b,
      status: analyzedCount > 0 ? "active" : "demo",
      itemsAnalyzed: analyzedCount,
    }));

    return NextResponse.json({ bots });
  } catch (e) {
    console.error("[bots/status] error:", e);
    return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 });
  }
}
