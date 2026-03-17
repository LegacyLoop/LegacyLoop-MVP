import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { conversationId, action, mode, draftMessage, approved, metadata, itemId } = body;
    if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

    const payload = JSON.stringify({
      userId: user.id,
      conversationId,
      mode,
      draftMessage,
      approved,
      metadata,
      timestamp: new Date().toISOString(),
    });

    if (itemId) {
      // Use EventLog when itemId is provided (links to item timeline)
      const log = await prisma.eventLog.create({
        data: {
          itemId,
          eventType: `AGENT_ACTION_${action}`,
          payload,
        },
      });
      return NextResponse.json({ success: true, actionId: log.id });
    } else {
      // Use UserEvent when no itemId (general agent actions)
      const log = await prisma.userEvent.create({
        data: {
          userId: user.id,
          eventType: `AGENT_ACTION_${action}`,
          metadata: payload,
        },
      });
      return NextResponse.json({ success: true, actionId: log.id });
    }
  } catch {
    return NextResponse.json({ error: "Failed to log action" }, { status: 500 });
  }
}
