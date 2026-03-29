import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/** POST — Save outreach status */
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { itemId, channel, status, recipientHandle, leadProfile } = body;

    if (!itemId || !channel || !status) {
      return NextResponse.json({ error: "itemId, channel, and status required" }, { status: 400 });
    }

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "OUTREACH_STATUS",
        payload: JSON.stringify({
          channel,
          status,
          recipientHandle: recipientHandle || null,
          leadProfile: leadProfile || null,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[outreach/status]", e);
    return NextResponse.json({ error: "Failed to save status" }, { status: 500 });
  }
}

/** GET — Retrieve outreach history for an item */
export async function GET(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const itemId = req.nextUrl.searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const events = await prisma.eventLog.findMany({
      where: {
        itemId,
        eventType: { in: ["OUTREACH_SENT", "OUTREACH_STATUS"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { eventType: true, payload: true, createdAt: true },
    });

    const history = events.map((e) => {
      try {
        const data = JSON.parse(e.payload || "{}");
        return { type: e.eventType, ...data, createdAt: e.createdAt };
      } catch {
        return { type: e.eventType, createdAt: e.createdAt };
      }
    });

    return NextResponse.json({ ok: true, history });
  } catch (e) {
    console.error("[outreach/status GET]", e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
