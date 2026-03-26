import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { itemId, eventType, payload } = body;
    if (!itemId || !eventType) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const item = await prisma.item.findFirst({ where: { id: itemId, userId: user.id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.eventLog.create({
      data: {
        eventType,
        itemId,
        payload: JSON.stringify(payload),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[quote-event] error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
