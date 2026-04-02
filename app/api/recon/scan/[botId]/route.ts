import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { runScan } from "@/lib/services/recon-bot";
import { prisma } from "@/lib/db";

type Params = Promise<{ botId: string }>;

async function verifyOwnership(botId: string, userId: string) {
  const bot = await prisma.reconBot.findUnique({ where: { id: botId } });
  if (!bot || bot.userId !== userId) return null;
  return bot;
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { botId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bot = await verifyOwnership(botId, user.id);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  await runScan(botId);

  const updated = await prisma.reconBot.findUnique({
    where: { id: botId },
    include: {
      alerts: {
        where: { dismissed: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return NextResponse.json({ ok: true, bot: updated });
}

/** PATCH — Pause/resume a ReconBot, or toggle autoScan */
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { botId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bot = await verifyOwnership(botId, user.id);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // ── Auto-scan toggle ──
  if (body.action === "toggleAutoScan") {
    const newVal = !bot.autoScanEnabled;

    // Tier gate: auto-scan requires Power Seller+ (tier >= 3)
    if (newVal && user.tier < 3) {
      return NextResponse.json(
        { error: "Auto-scan requires Power Seller tier or higher.", upgradeUrl: "/pricing" },
        { status: 403 }
      );
    }

    const updated = await prisma.reconBot.update({
      where: { id: botId },
      data: {
        autoScanEnabled: newVal,
        // If enabling, set nextScan to 6h from now
        ...(newVal ? { nextScan: new Date(Date.now() + 6 * 60 * 60 * 1000) } : {}),
      },
      include: {
        alerts: {
          where: { dismissed: false },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json({ ok: true, bot: updated });
  }

  // ── Pause / resume ──
  const action = body.action ?? (bot.isActive ? "pause" : "resume");

  const updated = await prisma.reconBot.update({
    where: { id: botId },
    data: {
      isActive: action === "resume",
      // If pausing, also disable auto-scan
      ...(action === "pause" ? { autoScanEnabled: false } : {}),
    },
    include: {
      alerts: {
        where: { dismissed: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return NextResponse.json({ ok: true, bot: updated });
}
