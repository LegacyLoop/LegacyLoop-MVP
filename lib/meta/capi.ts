// CMD-W25-META-L1 · Meta Conversions API (CAPI) · lead close-loop
// Hashes PII (email/phone) with SHA-256 lowercase per Meta CAPI spec.
// Dedup id = leadgenId so server + browser pixel events collapse.

import crypto from "node:crypto";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";

type CapiInput = {
  readonly leadgenId: string;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly eventTime?: number; // unix seconds
  readonly testEventCode?: string;
};

export type CapiResult = {
  readonly ok: boolean;
  readonly status?: number;
  readonly eventsReceived?: number;
  readonly reason?: string;
};

/**
 * Send a single Lead event to Meta CAPI.
 * Returns ok=false (with reason) instead of throwing · caller must not block on this.
 */
export async function sendLeadCapiEvent(input: CapiInput): Promise<CapiResult> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { ok: false, reason: "META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not configured" };
  }

  const event = {
    event_name: "Lead",
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: input.leadgenId, // dedup id
    action_source: "system_generated",
    user_data: hashUserData(input.email ?? null, input.phone ?? null),
    custom_data: {
      lead_source: "facebook_lead_ad",
    },
  };

  const body: Record<string, unknown> = { data: [event] };
  const testCode = input.testEventCode ?? process.env.META_CAPI_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, reason: text.slice(0, 300) };
    }
    let parsed: { events_received?: number } = {};
    try { parsed = JSON.parse(text) as { events_received?: number }; } catch { /* tolerate */ }
    console.log("[Meta CAPI] Lead event sent · leadgenId=%s · status=%d · received=%d",
      input.leadgenId, res.status, parsed.events_received ?? 0);
    return { ok: true, status: res.status, eventsReceived: parsed.events_received };
  } catch (e) {
    return { ok: false, reason: `CAPI POST error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// ── PII hashing · CAPI requires SHA-256 lowercase trimmed ─────────────────
function hashUserData(email: string | null, phone: string | null): Record<string, string[]> {
  const ud: Record<string, string[]> = {};
  if (email) {
    ud.em = [sha256(email.trim().toLowerCase())];
  }
  if (phone) {
    // Strip non-digits per CAPI normalization
    const digits = phone.replace(/\D+/g, "");
    if (digits.length > 0) ud.ph = [sha256(digits)];
  }
  return ud;
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}
