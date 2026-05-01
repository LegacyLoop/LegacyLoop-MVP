"use client";

/**
 * useAutoReconcile · CMD-PRICEBOT-AUTO-RECONCILE V18
 *
 * Invisible auto-fire pattern that re-runs PriceBot when the pricing-
 * dissent banner emits AND a 7-gate safety set is met. Clones the
 * `useAutoBotRefresh` discipline (Strict-Mode ref · sessionStorage
 * circuit-breaker · AbortController cleanup · 4-event telemetry)
 * and diverges in the gate set.
 *
 * Why each gate (per spec §4 diagnostic):
 *  · Gate A (LOCAL_PICKUP override active) — re-running won't change
 *    canonical v8 output. Skip preserves S4 floor parity.
 *  · Gate D (dissent below floor) — banner emits at >=1 dissent · we
 *    auto-fire only at >=2 (matches multi-field banner copy).
 *  · Gate E (volatility above ceiling) — markets >3.0× range are
 *    genuinely volatile · auto-fire adds noise.
 *  · Gate F (identification confidence < HIGH) — don't auto-price
 *    items whose identity is uncertain.
 *  · Gate B (comps freshness) — < 4h since last consensus = no value.
 *  · Gate C (debounce) — sessionStorage timestamp < 10min = no fire.
 *  · Gate G (user quiesce) — last pointermove/keydown < 30s = wait.
 *  · Jury bypass — `consensusResolvedBy === "jury"` = banner is null
 *    anyway · belt + suspenders skip.
 *
 * On all-pass: stagger ${AUTO_RECONCILE_THRESHOLDS.STAGGER_MS}ms ·
 * POST `/api/bots/pricebot/${itemId}` with `X-Auto-Reconcile: 1` header
 * (server-side rate-limit gate keys on this) · `onComplete()` typically
 * `router.refresh()` to re-fetch server consensus.
 *
 * 4 telemetry events: FIRED · COMPLETE · FAIL · SKIPPED (with reason).
 * Plus a Gate-A-specific SKIPPED event for canonical-override visibility
 * (highest-volume skip · investor narrative).
 */

import { useEffect, useRef, useState } from "react";
import type { PricingConsensus } from "@/lib/pricing/reconcile";
import {
  AI_CONFIDENCE_THRESHOLDS,
  AUTO_RECONCILE_THRESHOLDS,
} from "@/lib/constants/pricing";

export interface UseAutoReconcileOptions {
  itemId: string;
  pricingConsensus: PricingConsensus | null;
  /** AnalyzeBot identification confidence (0-100, normalized). null disables. */
  identificationConfidence: number | null;
  saleMethod: "LOCAL_PICKUP" | "ONLINE_SHIPPING" | "BOTH" | string | null;
  /** Typically `() => router.refresh()` to re-fetch server consensus. */
  onComplete?: () => void;
}

export interface UseAutoReconcileResult {
  /** True while the auto-fire fetch is in flight (incl. stagger). */
  busy: boolean;
  /** True once gates pass · before fetch starts. Telemetry mirror. */
  willFire: boolean;
  /** Last skip reason, or null if all gates passed. */
  skipReason: string | null;
}

function postEvent(
  eventType: string,
  itemId: string,
  metadata: Record<string, unknown>,
) {
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

export function useAutoReconcile(
  options: UseAutoReconcileOptions,
): UseAutoReconcileResult {
  const {
    itemId,
    pricingConsensus,
    identificationConfidence,
    saleMethod,
    onComplete,
  } = options;

  const [busy, setBusy] = useState(false);
  const [willFire, setWillFire] = useState(false);
  const [skipReason, setSkipReason] = useState<string | null>(null);
  const autoFiredRef = useRef(false);
  const lastUserInputAtRef = useRef<number>(0);

  // Track user activity to gate against firing during interaction.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stamp = () => { lastUserInputAtRef.current = Date.now(); };
    window.addEventListener("pointermove", stamp, { passive: true });
    window.addEventListener("keydown", stamp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", stamp);
      window.removeEventListener("keydown", stamp);
    };
  }, []);

  useEffect(() => {
    // No consensus yet · nothing to reconcile.
    if (!pricingConsensus) return;
    // Strict-Mode + nav guard.
    if (autoFiredRef.current) return;
    if (typeof window === "undefined") return;

    const dissents = pricingConsensus.dissents ?? [];

    // ── Gate A · LOCAL_PICKUP canonical override active ────────────
    if (saleMethod === "LOCAL_PICKUP") {
      const v8 = (pricingConsensus.sources ?? []).find(
        (s) => s.name === "v8_engine"
      );
      const v8Active = !!(v8 &&
        typeof v8.listPrice === "number" &&
        typeof v8.acceptPrice === "number" &&
        typeof v8.floorPrice === "number");
      if (v8Active) {
        autoFiredRef.current = true;
        setSkipReason("local_pickup_canonical_override");
        postEvent("RECONCILE_AUTOFIX_SKIPPED_GATE_A", itemId, {
          saleMethod,
          hasV8Snapshot: true,
        });
        return;
      }
    }

    // ── Jury-resolved bypass (belt + suspenders · banner is null) ──
    if (pricingConsensus.consensusResolvedBy === "jury") {
      autoFiredRef.current = true;
      setSkipReason("jury_resolved");
      postEvent("RECONCILE_AUTOFIX_SKIPPED", itemId, {
        reason: "jury_resolved",
        consensusResolvedBy: pricingConsensus.consensusResolvedBy,
      });
      return;
    }

    // ── Gate D · Dissent below floor ───────────────────────────────
    if (dissents.length < AUTO_RECONCILE_THRESHOLDS.DISSENT_FLOOR) {
      autoFiredRef.current = true;
      setSkipReason("dissent_below_floor");
      postEvent("RECONCILE_AUTOFIX_SKIPPED", itemId, {
        reason: "dissent_below_floor",
        dissentCount: dissents.length,
        floor: AUTO_RECONCILE_THRESHOLDS.DISSENT_FLOOR,
      });
      return;
    }

    // ── Gate E · Volatility above ceiling ──────────────────────────
    const maxSpreadPct = dissents.length > 0
      ? Math.max(...dissents.map((d) => d.spreadPct))
      : 0;
    if (maxSpreadPct > AUTO_RECONCILE_THRESHOLDS.VOLATILITY_CEILING) {
      autoFiredRef.current = true;
      setSkipReason("volatility_above_ceiling");
      postEvent("RECONCILE_AUTOFIX_SKIPPED", itemId, {
        reason: "volatility_above_ceiling",
        maxSpreadPct,
        ceiling: AUTO_RECONCILE_THRESHOLDS.VOLATILITY_CEILING,
      });
      return;
    }

    // ── Gate F · Identification confidence below HIGH ──────────────
    if (
      identificationConfidence == null ||
      identificationConfidence < AI_CONFIDENCE_THRESHOLDS.HIGH
    ) {
      autoFiredRef.current = true;
      setSkipReason("identification_low");
      postEvent("RECONCILE_AUTOFIX_SKIPPED", itemId, {
        reason: "identification_low",
        identificationConfidence,
        threshold: AI_CONFIDENCE_THRESHOLDS.HIGH,
      });
      return;
    }

    // ── Gate B · Comps freshness ───────────────────────────────────
    const computedAtMs = pricingConsensus.computedAt
      ? new Date(pricingConsensus.computedAt).getTime()
      : 0;
    const computedAtAge = Date.now() - computedAtMs;
    const freshnessMs = AUTO_RECONCILE_THRESHOLDS.FRESHNESS_HOURS * 3_600_000;
    if (computedAtMs > 0 && computedAtAge < freshnessMs) {
      autoFiredRef.current = true;
      setSkipReason("comps_fresh");
      postEvent("RECONCILE_AUTOFIX_SKIPPED", itemId, {
        reason: "comps_fresh",
        computedAtAge,
        freshnessMs,
      });
      return;
    }

    // ── Gate C · Debounce window (sessionStorage timestamp) ────────
    const debounceKey = `auto-reconcile:${itemId}`;
    const debounceRaw = window.sessionStorage.getItem(debounceKey);
    const debounceTs = debounceRaw ? Number(debounceRaw) : 0;
    if (debounceTs > 0 && Date.now() - debounceTs < AUTO_RECONCILE_THRESHOLDS.DEBOUNCE_MS) {
      autoFiredRef.current = true;
      setSkipReason("debounce_active");
      postEvent("RECONCILE_AUTOFIX_SKIPPED", itemId, {
        reason: "debounce_active",
        ageMs: Date.now() - debounceTs,
        windowMs: AUTO_RECONCILE_THRESHOLDS.DEBOUNCE_MS,
      });
      return;
    }

    // ── Gate G · User quiesce ──────────────────────────────────────
    const sinceUserInput = Date.now() - lastUserInputAtRef.current;
    const userActive =
      lastUserInputAtRef.current > 0 &&
      sinceUserInput < AUTO_RECONCILE_THRESHOLDS.USER_QUIESCE_MS;
    if (userActive) {
      // Don't latch · re-evaluate on next render (user may quiesce).
      setSkipReason("user_active");
      postEvent("RECONCILE_AUTOFIX_SKIPPED", itemId, {
        reason: "user_active",
        sinceUserInput,
        quiesceMs: AUTO_RECONCILE_THRESHOLDS.USER_QUIESCE_MS,
      });
      return;
    }

    // ── ALL GATES PASS ─────────────────────────────────────────────
    autoFiredRef.current = true;
    window.sessionStorage.setItem(debounceKey, String(Date.now()));
    setSkipReason(null);
    setWillFire(true);
    setBusy(true);

    const controller = new AbortController();
    const fireStart = Date.now();

    postEvent("RECONCILE_AUTOFIX_FIRED", itemId, {
      dissentCount: dissents.length,
      maxSpreadPct,
      computedAtAge,
      identificationConfidence,
      saleMethod,
      gateTransit: "all_pass",
    });

    // Tech Advisor stagger · cancellable via AbortController via Promise.race.
    const stagger = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, AUTO_RECONCILE_THRESHOLDS.STAGGER_MS);
      controller.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("aborted", "AbortError"));
      });
    });

    stagger
      .then(() => fetch(`/api/bots/pricebot/${itemId}`, {
        method: "POST",
        headers: { "X-Auto-Reconcile": "1" },
        signal: controller.signal,
      }))
      .then((res) => {
        if (!res.ok) throw new Error(`pricebot ${res.status}`);
        return postEvent("RECONCILE_AUTOFIX_COMPLETE", itemId, {
          durationMs: Date.now() - fireStart,
          prevDissentCount: dissents.length,
          newConsensusFetchedAt: null,
        });
      })
      .then(() => {
        if (onComplete) onComplete();
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        postEvent("RECONCILE_AUTOFIX_FAIL", itemId, {
          status: null,
          error: String(err?.message ?? err),
        });
      })
      .finally(() => {
        setBusy(false);
        setWillFire(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, pricingConsensus, identificationConfidence, saleMethod]);

  return { busy, willFire, skipReason };
}
