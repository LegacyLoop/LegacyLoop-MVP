// CMD-W26-C · Unified Meta webhook receiver (Peg §10.4).
//
// Meta dashboards subscribe ONE callback URL per app. This endpoint is that URL:
//   GET  → verification handshake (hub.mode=subscribe + hub.verify_token).
//   POST → HMAC-SHA256 verify (raw body) → idempotent dedup → delegate by shape:
//            entry.messaging[]            → messages  (lib/messaging/meta/ingest)
//            entry.changes[].field=leadgen → lead ads (lib/meta/leads)
//
// Reuses W25 building blocks (BINDING #16 — no duplicated verify/ingest/fetch).
// The existing /api/webhooks/messenger and /api/webhooks/meta/leadgen routes are
// left intact (this unifies; it does not delete them).
// Returns 200 fast within Meta's retry window; slow lead Graph fetches run async.

import { verifyMetaSignature } from "@/lib/messaging/meta/verify-signature";
import { ingestMetaWebhook } from "@/lib/messaging/meta/ingest";
import { fetchAndPersistLead } from "@/lib/meta/leads";
import { isDuplicateEvent } from "@/lib/meta/webhooks/event-dedup";
import type { MetaWebhookEnvelope } from "@/lib/messaging/meta/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function verifyToken(): string | undefined {
  return process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN;
}

function appSecret(): string | undefined {
  return (
    process.env.META_BUSINESS_APP_SECRET ||
    process.env.META_APP_SECRET ||
    process.env.FACEBOOK_CLIENT_SECRET
  );
}

// ── GET · verification handshake ──────────────────────────────────────────
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = verifyToken();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }
  // Fail closed — no token configured or mismatch → 403.
  return new Response("forbidden", { status: 403 });
}

// ── leadgen payload shape (subset we read) ────────────────────────────────
interface LeadgenChange {
  field: string;
  value?: {
    leadgen_id?: string;
    form_id?: string;
    page_id?: string;
    created_time?: number;
  };
}
interface RoutableEntry {
  id: string;
  messaging?: unknown[];
  changes?: LeadgenChange[];
}

// ── POST · signed event ───────────────────────────────────────────────────
export async function POST(req: Request): Promise<Response> {
  const secret = appSecret();
  if (!secret) {
    console.error("[meta-unified] no app secret configured");
    return new Response("not configured", { status: 503 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, sig, secret)) {
    return new Response("invalid signature", { status: 401 });
  }

  let envelope: MetaWebhookEnvelope & { entry?: RoutableEntry[] };
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const entries = (envelope.entry ?? []) as RoutableEntry[];
  const hasMessaging = entries.some((e) => Array.isArray(e.messaging) && e.messaging.length > 0);
  const leadChanges = entries.flatMap((e) =>
    (e.changes ?? [])
      .filter((c) => c.field === "leadgen" && c.value?.leadgen_id)
      .map((c) => ({ value: c.value!, entryId: e.id })),
  );

  // ── Messages: ingest is DB-idempotent; await (fast). ──
  if (hasMessaging && (envelope.object === "page" || envelope.object === "instagram")) {
    try {
      const result = await ingestMetaWebhook(envelope);
      console.log(
        `[meta-unified] messages object=${envelope.object} accepted=${result.accepted} dup=${result.duplicates} skip=${result.skipped} err=${result.errors}`,
      );
    } catch (e) {
      console.error("[meta-unified] ingest error:", e instanceof Error ? e.message : String(e));
    }
  }

  // ── Leads: dedup by leadgen_id, then fire the Graph fetch async (slow). ──
  for (const { value, entryId } of leadChanges) {
    const leadgenId = value.leadgen_id!;
    if (isDuplicateEvent(leadgenId)) {
      console.log(`[meta-unified] leadgen dup skipped id=${leadgenId}`);
      continue;
    }
    void fetchAndPersistLead({
      leadgenId,
      formId: value.form_id,
      pageId: value.page_id ?? entryId,
      createdTime: value.created_time,
    }).catch((e: unknown) =>
      console.error("[meta-unified] lead fetch error:", e instanceof Error ? e.message : String(e)),
    );
  }

  // Always 200 on a signed receipt so Meta does not retry.
  return new Response("EVENT_RECEIVED", { status: 200 });
}
