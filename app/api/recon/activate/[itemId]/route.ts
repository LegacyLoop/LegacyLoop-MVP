import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { activateReconBot } from "@/lib/services/recon-bot";
import { prisma } from "@/lib/db";
import { canUseBotOnTier } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";

type Params = Promise<{ itemId: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify item ownership
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id)
    return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Tier gate: Recon Bot requires Power Seller+
  if (!isDemoMode()) {
    const botUser = await prisma.user.findUnique({ where: { id: user.id }, select: { tier: true } });
    if (!canUseBotOnTier(botUser?.tier ?? 1, "reconBot")) {
      return NextResponse.json(
        { error: "Recon Bot requires Power Seller tier or higher.", upgradeUrl: "/pricing", currentTier: botUser?.tier ?? 1 },
        { status: 403 }
      );
    }
  }

  const body = await req.json().catch(() => ({}));
  const platforms: string[] = Array.isArray(body.platforms)
    ? body.platforms
    : ["facebook", "ebay", "craigslist"];

  const botId = await activateReconBot(itemId, user.id, platforms);

  const bot = await prisma.reconBot.findUnique({
    where: { id: botId },
    include: {
      alerts: {
        where: { dismissed: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ ok: true, bot });
}
