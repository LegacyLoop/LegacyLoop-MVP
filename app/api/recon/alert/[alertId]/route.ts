import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

type Params = Promise<{ alertId: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { alertId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action } = body; // "view" | "dismiss" | "taken"

  // Verify ownership via bot
  const alert = await prisma.reconAlert.findUnique({
    where: { id: alertId },
    include: { reconBot: true },
  });
  if (!alert || alert.reconBot.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const data: Record<string, unknown> = {};

  if (action === "view") {
    data.viewed = true;
    data.viewedAt = now;
  } else if (action === "dismiss") {
    data.viewed = true;
    data.viewedAt = now;
    data.dismissed = true;
    data.dismissedAt = now;
  } else if (action === "taken") {
    data.viewed = true;
    data.viewedAt = now;
    data.dismissed = true;
    data.dismissedAt = now;
    data.actionTaken = body.actionTaken ?? "accepted";
  }

  const updated = await prisma.reconAlert.update({ where: { id: alertId }, data });
  return NextResponse.json({ ok: true, alert: updated });
}
