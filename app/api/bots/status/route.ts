import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

const BOT_DEFS = [
  { id: "megabot", name: "MegaBot", icon: "🤖", desc: "Comprehensive AI analysis combining all bot outputs into one master report", route: "/bots/megabot" },
  { id: "pricebot", name: "PriceBot", icon: "💰", desc: "Deep pricing intelligence with local vs national comparisons", route: "/bots/pricebot" },
  { id: "listbot", name: "ListBot", icon: "📝", desc: "Listing optimization assistant for marketplace titles and descriptions", route: "/bots/listbot" },
  { id: "shipbot", name: "ShipBot", icon: "📦", desc: "Shipping intelligence with carrier comparisons and packaging tips", route: "/bots/shipbot" },
  { id: "photobot", name: "PhotoBot", icon: "📷", desc: "AI photo editor — background removal, enhancement, and professional storefront imagery", route: "/bots/photobot" },
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
