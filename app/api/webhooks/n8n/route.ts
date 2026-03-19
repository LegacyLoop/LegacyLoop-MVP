import { NextRequest, NextResponse } from "next/server";

/** GET — Health check */
export async function GET() {
  return NextResponse.json({ status: "ok", service: "n8n-webhook" });
}

/** POST — n8n callback webhook with secret validation */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, data } = await req.json().catch(() => ({ action: null, data: null }));

    console.log(`[N8N WEBHOOK] action=${action}`);

    if (action === "ping") {
      return NextResponse.json({ ok: true, message: "pong" });
    }

    return NextResponse.json({ ok: true, received: action });
  } catch (err) {
    console.error("[N8N WEBHOOK ERROR]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
