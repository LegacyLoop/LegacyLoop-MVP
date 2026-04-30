"use client";

/**
 * useAutoBotRefresh · CMD-CYLINDER-6-DASHBOARD-STANDARDIZATION
 *
 * Generalized auto-fire pattern lifted from `ConfidencePill.tsx` L29-131.
 * Applies the same disciplined behavior to any bot panel that wants to
 * refresh its data automatically when the user opens a stale item:
 *
 *   - Strict-Mode-safe ref guard (prevents double-fire on dev double-render)
 *   - Per-session circuit-breaker via sessionStorage (key scoped per bot+item)
 *   - Photos-changed check (cache-bust the staleness window when photo set
 *     differs from the prior auto-fire's snapshot)
 *   - AbortController cleanup
 *   - 4 telemetry events: FIRED · COMPLETE · FAIL · SKIPPED (with reason)
 *
 * SCOPE NOTE: enabling auto-fire across many panels at once can spike
 * background `/api/...` calls when the user lands on an item dashboard
 * that has multiple stale bots. The session circuit-breaker dedups across
 * page reloads but NOT across different bots — by design (each bot has
 * its own freshness tolerance). Stagger adoption per bot to manage
 * cost / load impact, especially for cloud-routed bots.
 */

import { useEffect, useRef, useState } from "react";

export interface UseAutoBotRefreshOptions {
  /** Bot identifier · scopes the sessionStorage circuit-breaker key */
  botKey: string;

  /** Item ID · second scope for the breaker (per-bot · per-item) */
  itemId: string;

  /** Confidence value 0-100. `null` disables the auto-fire path. */
  confidence: number | null;

  /** Last analyzed timestamp (ISO string). `null` skips the stale check. */
  lastAnalyzedAt?: string | null;

  /**
   * Photos fingerprint (e.g., sorted joined photo IDs). When this differs
   * from the snapshot stored on the prior auto-fire, the stale window is
   * bypassed (photos changed → re-analyze warranted).
   */
  photosFingerprint?: string | null;

  /** Threshold below which auto-fire is eligible. Default 50. */
  lowThreshold?: number;

  /** Hours after which a result is considered stale. Default 24. */
  staleHours?: number;

  /** API endpoint to POST to when auto-firing. */
  endpoint: string;

  /**
   * Telemetry event prefix. The hook emits four event types built from
   * this prefix: `${prefix}_FIRED`, `_COMPLETE`, `_FAIL`, `_SKIPPED`.
   */
  telemetryPrefix: string;

  /** Optional callback invoked after a successful fetch (e.g., router.refresh). */
  onComplete?: () => void;
}

export interface UseAutoBotRefreshResult {
  /** True while the auto-fire fetch is in flight */
  busy: boolean;
}

const DEFAULT_LOW_THRESHOLD = 50;
const DEFAULT_STALE_HOURS = 24;

function postEvent(eventType: string, itemId: string, metadata: Record<string, unknown>) {
  return fetch("/api/user-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      itemId,
      metadata: JSON.stringify(metadata),
    }),
  }).catch(() => {});
}

export function useAutoBotRefresh(
  options: UseAutoBotRefreshOptions
): UseAutoBotRefreshResult {
  const {
    botKey,
    itemId,
    confidence,
    lastAnalyzedAt,
    photosFingerprint,
    lowThreshold = DEFAULT_LOW_THRESHOLD,
    staleHours = DEFAULT_STALE_HOURS,
    endpoint,
    telemetryPrefix,
    onComplete,
  } = options;

  const [busy, setBusy] = useState(false);
  const autoFiredRef = useRef(false);

  useEffect(() => {
    // Skip if no value yet OR confidence is high enough
    if (confidence == null || confidence >= lowThreshold) return;

    // Strict Mode + nav guard · ref flag prevents double-fire
    if (autoFiredRef.current) return;

    if (typeof window === "undefined") return;

    // Per-session circuit-breaker
    const sessionKey = `auto-${botKey}:${itemId}`;
    if (window.sessionStorage.getItem(sessionKey)) {
      postEvent(`${telemetryPrefix}_SKIPPED`, itemId, {
        reason: "session_circuit_breaker",
        confidence,
      });
      return;
    }

    // Stale check · only fire if last analyze is older than threshold
    // OR photos changed since last analyze
    const photosKey = `auto-${botKey}:photos:${itemId}`;
    const previousPhotosFingerprint = window.sessionStorage.getItem(photosKey);
    const photosChanged =
      photosFingerprint != null &&
      photosFingerprint !== previousPhotosFingerprint;

    if (lastAnalyzedAt && !photosChanged) {
      const ageMs = Date.now() - new Date(lastAnalyzedAt).getTime();
      const staleMs = staleHours * 60 * 60 * 1000;
      if (ageMs < staleMs) {
        postEvent(`${telemetryPrefix}_SKIPPED`, itemId, {
          reason: "not_stale",
          confidence,
          ageHours: Math.round(ageMs / 3600000),
        });
        return;
      }
    }

    autoFiredRef.current = true;
    window.sessionStorage.setItem(sessionKey, "1");
    if (photosFingerprint) {
      window.sessionStorage.setItem(photosKey, photosFingerprint);
    }
    setBusy(true);

    const controller = new AbortController();

    postEvent(`${telemetryPrefix}_FIRED`, itemId, {
      confidence,
      lastAnalyzedAt,
      photosFingerprint,
      photosChanged,
    });

    fetch(endpoint, { method: "POST", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${botKey} ${res.status}`);
        return postEvent(`${telemetryPrefix}_COMPLETE`, itemId, { confidence });
      })
      .then(() => {
        if (onComplete) onComplete();
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        postEvent(`${telemetryPrefix}_FAIL`, itemId, {
          confidence,
          error: String(err?.message ?? err),
        });
      })
      .finally(() => setBusy(false));

    return () => controller.abort();
  }, [
    botKey,
    confidence,
    endpoint,
    itemId,
    lastAnalyzedAt,
    lowThreshold,
    onComplete,
    photosFingerprint,
    staleHours,
    telemetryPrefix,
  ]);

  return { busy };
}
