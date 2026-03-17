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

/** PATCH — Pause or resume a ReconBot */
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { botId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bot = await verifyOwnership(botId, user.id);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action ?? (bot.isActive ? "pause" : "resume");

  const updated = await prisma.reconBot.update({
    where: { id: botId },
    data: {
      isActive: action === "resume",
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
