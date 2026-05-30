// CMD-W25-META-L2 · Meta Messenger + Instagram webhook endpoint.
//
// GET  /api/webhooks/messenger?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
//      → returns hub.challenge plain-text when verify_token matches META_VERIFY_TOKEN.
//
// POST /api/webhooks/messenger
//      → verifies x-hub-signature-256 (HMAC-SHA256 over raw body using META_APP_SECRET),
//        parses Messenger/IG envelope, persists to Conversation/Message idempotently.
//        Returns 200 within 20s window (Meta retry rule). 200 = ack only · errors logged.
//
// Reference:
//   https://developers.facebook.com/docs/messenger-platform/webhooks
//   https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/webhooks

import { ingestMetaWebhook } from "@/lib/messaging/meta/ingest";
import type { MetaWebhookEnvelope } from "@/lib/messaging/meta/types";
import { verifyMetaSignature } from "@/lib/messaging/meta/verify-signature";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && expected && verifyToken === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(req: Request): Promise<Response> {
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
  if (!appSecret) {
    console.error("[meta-webhook] No META_APP_SECRET or FACEBOOK_CLIENT_SECRET");
    return new Response("not configured", { status: 503 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, sig, appSecret)) {
    return new Response("invalid signature", { status: 401 });
  }

  let envelope: MetaWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody) as MetaWebhookEnvelope;
  } catch {
    return new Response("bad json", { status: 400 });
  }

  if (envelope.object !== "page" && envelope.object !== "instagram") {
    // Ack non-handled object types so Meta does not retry
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  try {
    const result = await ingestMetaWebhook(envelope);
    console.log(
      `[meta-webhook] object=${envelope.object} accepted=${result.accepted} duplicates=${result.duplicates} skipped=${result.skipped} errors=${result.errors}`,
    );
  } catch (e: unknown) {
    console.error("[meta-webhook] ingest error:", e instanceof Error ? e.message : String(e));
  }

  // Meta requires 200 within 20s · do not let ingest errors break the contract
  return new Response("EVENT_RECEIVED", { status: 200 });
}
