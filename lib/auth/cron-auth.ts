// lib/auth/cron-auth.ts
//
// CMD-CRON-SECRET-CONSTANT-TIME-MIRROR V19 · R23 P2 · 2026-05-08 AM
//
// Constant-time CRON_SECRET verification for Vercel cron route handlers.
// Mirrors R16 P0 615de06 receiver hardening (app/api/webhooks/n8n/route.ts:62)
// and R22 P0 f51ab90 internal endpoint (app/api/internal/scraper-comp-count/route.ts).
//
// Triple-source secret resolution:
//   1. Authorization: Bearer <secret>
//   2. x-cron-secret: <secret>
//   3. ?secret=<secret>
//
// Constant-time compare via crypto.timingSafeEqual + length guard +
// Buffer.from(utf8) closes timing-attack side-channel on CRON_SECRET.
// Plain `!==` short-circuits at the first byte mismatch — an attacker
// can leak per-byte secret state by timing 401 responses across many
// probe attempts. timingSafeEqual always compares full Buffer length
// regardless of mismatch position. Behavior preserved verbatim for
// legitimate callers.
//
// Banks DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE 3/5 → 4/5 (toward BINDING).

import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export type CronAuthResult = { ok: boolean; error?: string };

const SECRET_HEADER_BEARER = "authorization"; // "Bearer <secret>"
const SECRET_HEADER_X = "x-cron-secret"; // direct header
const SECRET_QUERY = "secret"; // ?secret=<secret>

function resolveProvidedSecret(req: NextRequest): string {
  const authHeader = req.headers.get(SECRET_HEADER_BEARER);
  if (authHeader) {
    // Strip "Bearer " prefix (case-insensitive) — preserves prior behavior
    const stripped = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (stripped) return stripped;
  }
  const xCron = req.headers.get(SECRET_HEADER_X);
  if (xCron) return xCron.trim();
  const queryToken = req.nextUrl.searchParams.get(SECRET_QUERY);
  if (queryToken) return queryToken.trim();
  return "";
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Verify CRON_SECRET via triple-source lookup + constant-time compare.
 * Drop-in replacement for inline authenticate() patterns in cron routes.
 *
 * @returns { ok: true } when secret matches · { ok: false, error } otherwise
 */
export function verifyCronSecret(req: NextRequest): CronAuthResult {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron-auth] CRON_SECRET not configured");
    return { ok: false, error: "Cron not configured" };
  }
  const provided = resolveProvidedSecret(req);
  if (!provided || !constantTimeEquals(provided, expected)) {
    return { ok: false, error: "Unauthorized" };
  }
  return { ok: true };
}
