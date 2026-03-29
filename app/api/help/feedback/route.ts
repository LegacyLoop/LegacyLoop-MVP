import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession().catch(() => null);
    const body = await req.json();
    const { slug, helpful, view, comment } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    if (view) {
      await prisma.eventLog.create({
        data: {
          itemId: "HELP_SYSTEM",
          eventType: "HELP_VIEW",
          payload: JSON.stringify({ slug, userId: user?.id || "anonymous", timestamp: new Date().toISOString() }),
        },
      });
      return NextResponse.json({ success: true });
    }

    if (typeof helpful !== "boolean") {
      return NextResponse.json({ error: "helpful (boolean) required" }, { status: 400 });
    }

    await prisma.eventLog.create({
      data: {
        itemId: "HELP_SYSTEM",
        eventType: "HELP_FEEDBACK",
        payload: JSON.stringify({ slug, helpful, comment: comment?.slice(0, 500) || null, userId: user?.id || "anonymous", timestamp: new Date().toISOString() }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[help/feedback]", e);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
