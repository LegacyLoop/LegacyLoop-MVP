// lib/sylvia/dispatcher/auth.ts
//
// CMD-SYLVIA-TRUTH-GATE-DISPATCHER V19 · R24 P0 · 2026-05-08
//
// SYLVIA_API_INTERNAL_SECRET verification for /api/sylvia/* route handlers.
// Clones lib/auth/cron-auth.ts canonical pattern verbatim (R23 P2 1752e3e)
// per BINDING #16 DOC-DELEGATE-TO-CANONICAL.
//
// Triple-source secret resolution:
//   1. Authorization: Bearer <secret>
//   2. x-sylvia-internal-secret: <secret>
//   3. ?secret=<secret>
//
// Constant-time compare via crypto.timingSafeEqual + length guard +
// Buffer.from(utf8). Banks DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE
// 4/5 → 5/5 BINDING ratification candidate.

import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export type SylviaAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; reason: string };

const SECRET_HEADER_BEARER = "authorization";
const SECRET_HEADER_X = "x-sylvia-internal-secret";
const SECRET_QUERY = "secret";

function resolveProvidedSecret(req: NextRequest): string {
  const authHeader = req.headers.get(SECRET_HEADER_BEARER);
  if (authHeader) {
    const stripped = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (stripped) return stripped;
  }
  const xHeader = req.headers.get(SECRET_HEADER_X);
  if (xHeader) return xHeader.trim();
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
 * Verify SYLVIA_API_INTERNAL_SECRET · clone of cron-auth pattern.
 * Fail-closed: missing env returns 500 (production misconfig is safer
 * than open endpoint).
 */
export function verifySylviaInternalSecret(req: NextRequest): SylviaAuthResult {
  const expected = process.env.SYLVIA_API_INTERNAL_SECRET;
  if (!expected) {
    console.error("[sylvia-auth] SYLVIA_API_INTERNAL_SECRET not configured");
    return { ok: false, status: 500, reason: "Server misconfigured" };
  }
  const provided = resolveProvidedSecret(req);
  if (!provided || !constantTimeEquals(provided, expected)) {
    return { ok: false, status: 401, reason: "Unauthorized" };
  }
  return { ok: true };
}
