// CMD-W26-C · Meta Graph/Send API error-code classification (Peg §5.10).
//
// Maps the 8 error codes the messaging surface must handle to an internal
// action so callers branch on intent, not magic numbers.
// Reference: https://developers.facebook.com/docs/graph-api/guides/error-handling

export type MetaErrorAction =
  | "REAUTH" // token invalid/expired — re-run OAuth, do not retry as-is
  | "PERMISSION" // missing permission/scope or App Review approval
  | "INVALID" // malformed request/param — drop, retrying won't help
  | "BACKOFF" // rate/throttle — wait then retry
  | "POLICY_PAUSE" // policy block — pause, escalate, do not hammer
  | "UNKNOWN"; // unmapped — log + treat conservatively (no blind retry)

export interface MetaErrorClassification {
  code: number;
  action: MetaErrorAction;
  retryable: boolean;
  description: string;
}

// Canonical map (Peg §5.10 set: 190 · 200 · 100 · 4 · 17 · 32 · 613 · 368).
const CODE_MAP: Record<number, Omit<MetaErrorClassification, "code">> = {
  190: { action: "REAUTH", retryable: false, description: "Access token expired/invalid" },
  200: { action: "PERMISSION", retryable: false, description: "Permission error — missing scope/approval" },
  100: { action: "INVALID", retryable: false, description: "Invalid parameter / malformed request" },
  4: { action: "BACKOFF", retryable: true, description: "Application request limit reached" },
  17: { action: "BACKOFF", retryable: true, description: "User request limit reached" },
  32: { action: "BACKOFF", retryable: true, description: "Page request limit reached" },
  613: { action: "BACKOFF", retryable: true, description: "Custom-rate limit exceeded" },
  368: { action: "POLICY_PAUSE", retryable: true, description: "Temporarily blocked for policy violations" },
};

/**
 * Classify a Meta API error code (+ optional subcode) into an internal action.
 * Unmapped codes return UNKNOWN / non-retryable so we never blindly retry.
 */
export function classifyMetaError(code: number, subcode?: number | null): MetaErrorClassification {
  const hit = CODE_MAP[code];
  if (hit) return { code, ...hit };
  // Subcode 463/467 (token issues) can arrive under generic codes → treat as REAUTH.
  if (subcode === 463 || subcode === 467) {
    return { code, action: "REAUTH", retryable: false, description: `Token subcode ${subcode}` };
  }
  return { code, action: "UNKNOWN", retryable: false, description: "Unmapped Meta error" };
}

/** Convenience: should the caller retry this error after a wait? */
export function isRetryable(code: number, subcode?: number | null): boolean {
  return classifyMetaError(code, subcode).retryable;
}
