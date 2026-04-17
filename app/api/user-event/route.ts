import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await authAdapter.getSession();
    if (!session) return new Response(null, { status: 204 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body.eventType !== "string") {
      return NextResponse.json({ error: "eventType required" }, { status: 400 });
    }

    const eventType = String(body.eventType).slice(0, 64);
    const itemId = typeof body.itemId === "string" ? body.itemId.slice(0, 64) : undefined;
    const metadata = body.metadata != null ? JSON.stringify(body.metadata).slice(0, 4000) : undefined;

    prisma.userEvent.create({
      data: { userId: session.id, eventType, itemId, metadata },
    }).catch((err) => console.warn("[user-event] write failed:", err?.message));

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
