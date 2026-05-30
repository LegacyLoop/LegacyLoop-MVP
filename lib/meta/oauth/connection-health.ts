// CMD-W26-B FIX 5 · Connection-health helpers.
//
// Meta marks a token invalid via Graph error code 190 (token expired/revoked)
// or HTTP 401. Callers that exercise a Page token should:
//   isAuthFailure(result) → markConnectionBroken(...)
//
// Marking sets `settingsJson.connection_broken=true` + `broken_at` so the UI
// can render a "reconnect" prompt. We never delete the prior connection blob
// — operator may need it for audit / forensic replay (Peg §5.3 audit log).

import { prisma } from "@/lib/db";
import type { GraphResult } from "@/lib/meta/graph";

/** Token-invalidation error codes from Meta. */
export const META_AUTH_ERROR_CODES = new Set([190, 102, 463]);
/** Subcodes that specifically mean the user must reauthorize (Peg §5.2). */
export const META_AUTH_SUBCODES_REAUTH = new Set([460, 463, 467, 458]);

export function isAuthFailure(result: GraphResult<unknown>): boolean {
  if (result.ok) return false;
  const { code, subcode } = result.error;
  if (META_AUTH_ERROR_CODES.has(code)) return true;
  if (subcode !== null && META_AUTH_SUBCODES_REAUTH.has(subcode)) return true;
  return false;
}

export interface MarkBrokenInput {
  userId: string;
  platform: "facebook" | "instagram";
  reason: string;
  errorCode?: number;
  errorSubcode?: number | null;
}

/**
 * Flag a ConnectedPlatform row as broken. Idempotent — safe to call repeatedly.
 * Returns true on success, false if the row does not exist.
 */
export async function markConnectionBroken(input: MarkBrokenInput): Promise<boolean> {
  const row = await prisma.connectedPlatform.findUnique({
    where: { userId_platform: { userId: input.userId, platform: input.platform } },
    select: { settingsJson: true },
  });
  if (!row) return false;

  let base: Record<string, unknown> = {};
  if (row.settingsJson) {
    try {
      const parsed: unknown = JSON.parse(row.settingsJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        base = parsed as Record<string, unknown>;
      }
    } catch {
      base = {};
    }
  }

  const merged = {
    ...base,
    connection_broken: true,
    broken_at: new Date().toISOString(),
    broken_reason: input.reason.slice(0, 200),
    broken_error_code: input.errorCode ?? null,
    broken_error_subcode: input.errorSubcode ?? null,
  };

  await prisma.connectedPlatform.update({
    where: { userId_platform: { userId: input.userId, platform: input.platform } },
    data: {
      isActive: false,
      settingsJson: JSON.stringify(merged),
    },
  });
  return true;
}
