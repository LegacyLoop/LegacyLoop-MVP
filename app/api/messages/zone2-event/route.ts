import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const { action, conversationId, isMobile } = await req.json();
    await prisma.userEvent.create({
      data: {
        userId: user.id,
        eventType: "ZONE2_TOGGLE",
        metadata: JSON.stringify({ action, conversationId, isMobile }),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
