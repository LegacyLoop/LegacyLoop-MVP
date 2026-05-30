// CMD-W25-META-L1 · Meta Lead Ads `leadgen` webhook
// GET  · Meta verify handshake (hub.mode=subscribe + hub.verify_token check)
// POST · receive leadgen event · HMAC-SHA256 signature verify (X-Hub-Signature-256)
//        → fetch lead via Graph (lib/meta/leads.ts) → upsert BuyerLead → CAPI

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { fetchAndPersistLead } from "@/lib/meta/leads";

type LeadgenChange = {
  field: string;
  value: {
    leadgen_id?: string;
    form_id?: string;
    page_id?: string;
    created_time?: number;
    ad_id?: string;
    adgroup_id?: string;
  };
};

type LeadgenEntry = {
  id: string; // page id
  time: number;
  changes: LeadgenChange[];
};

type LeadgenPayload = {
  object: "page";
  entry: LeadgenEntry[];
};

// ── GET · Meta webhook verification handshake ─────────────────────────────
// https://developers.facebook.com/docs/graph-api/webhooks/getting-started
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = process.env.META_VERIFY_TOKEN;
  if (!expected) {
    console.error("[Meta Leadgen] META_VERIFY_TOKEN not configured");
    return new NextResponse("Webhook not configured", { status: 503 });
  }

  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ── POST · receive signed leadgen event ───────────────────────────────────
export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[Meta Leadgen] META_APP_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get("x-hub-signature-256") ?? "";
  if (!verifyMetaSignature(rawBody, sigHeader, appSecret)) {
    console.error("[Meta Leadgen] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: LeadgenPayload;
  try {
    payload = JSON.parse(rawBody) as LeadgenPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.object !== "page" || !Array.isArray(payload.entry)) {
    // Acknowledge non-page payloads with 200 so Meta does not retry endlessly,
    // but log for visibility.
    console.warn("[Meta Leadgen] Unexpected payload shape:", payload.object);
    return NextResponse.json({ received: true, skipped: "non-page object" }, { status: 200 });
  }

  const results: Array<{ leadgenId: string; ok: boolean; reason?: string }> = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      const v = change.value ?? {};
      if (!v.leadgen_id) {
        results.push({ leadgenId: "(missing)", ok: false, reason: "no leadgen_id" });
        continue;
      }
      try {
        const res = await fetchAndPersistLead({
          leadgenId: v.leadgen_id,
          formId: v.form_id,
          pageId: v.page_id ?? entry.id,
          createdTime: v.created_time,
        });
        results.push({ leadgenId: v.leadgen_id, ok: res.ok, reason: res.reason });
      } catch (e) {
        results.push({
          leadgenId: v.leadgen_id,
          ok: false,
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  // Always 200 on signed receipt so Meta does not retry; per-lead status in body.
  return NextResponse.json({ received: true, results }, { status: 200 });
}

// ── HMAC-SHA256 with app secret · constant-time compare ───────────────────
function verifyMetaSignature(rawBody: string, header: string, appSecret: string): boolean {
  if (!header.startsWith("sha256=")) return false;
  const sent = header.slice("sha256=".length);
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  if (sent.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sent, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
