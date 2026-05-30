// CMD-W25-META-L2 · Graph Send API (Messenger + Instagram) outbound.
//
// Posts a text message to a Meta-platform recipient (PSID/IGSID). Respects the
// standard 24-hour messaging window via messaging_type=RESPONSE; for messages
// outside the window, opts callers can pass humanAgent=true to use the
// HUMAN_AGENT message tag (requires App Review approval).
// Reference: Messenger Platform Send API + Instagram Messaging Send.
// NOT an AI call — direct platform messaging — BINDING #10 not applicable.

import type { MetaPlatform } from "./types";

const GRAPH_BASE = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com/v21.0";

export interface MetaSendOptions {
  platform: MetaPlatform;
  recipientId: string; // PSID (Messenger) or IGSID (Instagram)
  text: string;
  humanAgent?: boolean;
}

export interface MetaSendResult {
  ok: boolean;
  status: number;
  mid?: string;
  errorMessage?: string;
}

function endpoint(platform: MetaPlatform): string {
  if (platform === "instagram") {
    const igId = process.env.IG_USER_ID;
    if (!igId) throw new Error("IG_USER_ID env not configured");
    return `${GRAPH_BASE}/${igId}/messages`;
  }
  return `${GRAPH_BASE}/me/messages`;
}

function accessToken(platform: MetaPlatform): string {
  const token =
    platform === "instagram"
      ? process.env.IG_PAGE_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN
      : process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error(`Missing access token for ${platform}`);
  return token;
}

export async function sendMetaMessage(opts: MetaSendOptions): Promise<MetaSendResult> {
  const token = accessToken(opts.platform);
  const url = `${endpoint(opts.platform)}?access_token=${encodeURIComponent(token)}`;

  const body: Record<string, unknown> = {
    recipient: { id: opts.recipientId },
    message: { text: opts.text },
    messaging_type: opts.humanAgent ? "MESSAGE_TAG" : "RESPONSE",
  };
  if (opts.humanAgent) body.tag = "HUMAN_AGENT";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json = (await res.json().catch(() => ({}))) as {
      message_id?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        errorMessage: json.error?.message ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, status: res.status, mid: json.message_id };
  } catch (e: unknown) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: 0,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}
