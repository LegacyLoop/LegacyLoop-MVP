// CMD-W25-META-L2 · Graph Send API (Messenger + Instagram) outbound.
// CMD-W26-C harden · real 24h-window enforcement + error-code classification + rate-limit signal.
//
// Posts a text message to a Meta-platform recipient (PSID/IGSID). Enforces the
// standard 24-hour messaging window: outside it, a send is only allowed with the
// HUMAN_AGENT tag (humanAgent=true · valid up to 7 days · requires App Review).
// When the window is closed and no tag is set, we fail fast WITHOUT calling Meta
// (the call would be rejected anyway with code 10/200).
// Reference: Messenger Platform Send API + Instagram Messaging Send.
// NOT an AI call — direct platform messaging — BINDING #10 not applicable.

import type { MetaPlatform } from "./types";
import { classifyMetaError, type MetaErrorAction } from "@/lib/meta/messenger/error-codes";
import { decideBackoff } from "@/lib/meta/messenger/rate-limit";

const GRAPH_BASE = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com/v21.0";

const STANDARD_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h RESPONSE window
const HUMAN_AGENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7d HUMAN_AGENT tag window

export interface MetaSendOptions {
  platform: MetaPlatform;
  recipientId: string; // PSID (Messenger) or IGSID (Instagram)
  text: string;
  humanAgent?: boolean;
  /** Timestamp of the recipient's last inbound message; enables 24h-window enforcement. */
  lastInboundAt?: Date;
  /** Injectable clock for tests. */
  now?: Date;
}

export interface MetaSendResult {
  ok: boolean;
  status: number;
  mid?: string;
  errorMessage?: string;
  errorCode?: number;
  errorAction?: MetaErrorAction;
  /** True when blocked locally for an expired messaging window (no API call made). */
  windowClosed?: boolean;
  /** Set when Meta usage headers indicate the caller should slow down. */
  backoffMs?: number;
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

/**
 * Pure check: is a send permitted given the window + tag state?
 * Exported for unit tests (no network).
 */
export function isWindowOpen(
  lastInboundAt: Date | undefined,
  humanAgent: boolean,
  now: Date = new Date(),
): { allowed: boolean; reason: string } {
  if (!lastInboundAt) return { allowed: true, reason: "no inbound timestamp — cannot enforce, allowed" };
  const ageMs = now.getTime() - lastInboundAt.getTime();
  if (ageMs <= STANDARD_WINDOW_MS) return { allowed: true, reason: "within 24h window" };
  if (humanAgent) {
    if (ageMs <= HUMAN_AGENT_WINDOW_MS) return { allowed: true, reason: "HUMAN_AGENT tag within 7d" };
    return { allowed: false, reason: "beyond 7d HUMAN_AGENT window" };
  }
  return { allowed: false, reason: "beyond 24h window · HUMAN_AGENT tag required" };
}

export async function sendMetaMessage(opts: MetaSendOptions): Promise<MetaSendResult> {
  const humanAgent = opts.humanAgent ?? false;
  const now = opts.now ?? new Date();

  // Fail fast on a closed window — do not waste a guaranteed-rejected API call.
  const window = isWindowOpen(opts.lastInboundAt, humanAgent, now);
  if (!window.allowed) {
    return {
      ok: false,
      status: 0,
      windowClosed: true,
      errorAction: "PERMISSION",
      errorMessage: `messaging window closed: ${window.reason}`,
    };
  }

  const token = accessToken(opts.platform);
  const url = `${endpoint(opts.platform)}?access_token=${encodeURIComponent(token)}`;

  const body: Record<string, unknown> = {
    recipient: { id: opts.recipientId },
    message: { text: opts.text },
    messaging_type: humanAgent ? "MESSAGE_TAG" : "RESPONSE",
  };
  if (humanAgent) body.tag = "HUMAN_AGENT";

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
      error?: { message?: string; code?: number; error_subcode?: number };
    };

    const backoff = decideBackoff(res.headers);
    const backoffMs = backoff.backoff ? backoff.waitMs : undefined;

    if (!res.ok) {
      const code = json.error?.code;
      const classification =
        typeof code === "number" ? classifyMetaError(code, json.error?.error_subcode ?? null) : undefined;
      return {
        ok: false,
        status: res.status,
        errorMessage: json.error?.message ?? `HTTP ${res.status}`,
        errorCode: code,
        errorAction: classification?.action,
        backoffMs,
      };
    }
    return { ok: true, status: res.status, mid: json.message_id, backoffMs };
  } catch (e: unknown) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: 0,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}
