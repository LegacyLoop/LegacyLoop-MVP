/**
 * lib/adapters/bot-ai-router/logging.ts
 * ─────────────────────────────────────────────────────────────────
 * EventLog audit trail for every routing decision.
 *
 * Writes BOT_AI_ROUTING rows so we can later:
 *   • diff routing decisions vs sale outcomes
 *   • self-tune trigger thresholds from history
 *   • spot provider failures + cost spikes
 *   • prove margin protection during investor due diligence
 *
 * CRITICAL: Logging must NEVER throw. If the DB write fails, we
 * swallow the error and console.warn — the bot call must succeed
 * regardless of audit-trail health.
 *
 * CMD-AIROUTER-001 — Step 2
 * ─────────────────────────────────────────────────────────────────
 */

import { prisma } from "@/lib/db";
import type {
  BotName,
  ProviderName,
  TriggerName,
} from "./types";

/** Payload shape persisted to EventLog.payload (JSON-stringified). */
export interface RoutingLogPayload {
  botName: BotName;
  primary: ProviderName;
  secondary?: ProviderName;
  triggersFired: TriggerName[];
  providersAttempted: ProviderName[];
  providersUsed: ProviderName[];
  costUsd: number;
  /** CARRY-OVER FIX (Step 3): real USD cost from token metering. */
  actualCostUsd?: number;
  latencyMs: number;
  fallbackUsed: boolean;
  degraded: boolean;
  confidence: number | null;
  mergedStrategy: "primary_only" | "merged_consensus" | "degraded";
  /** CARRY-OVER FIX (Step 3): per-provider token usage. */
  tokens?: {
    [provider: string]: {
      input: number | null;
      output: number | null;
      total: number | null;
    };
  };
  demoMode: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Persist a routing decision to EventLog. Fire-and-forget — caller
 * does NOT await this in the critical path.
 */
export async function logRoutingDecision(params: {
  itemId: string;
  payload: RoutingLogPayload;
}): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        itemId: params.itemId,
        eventType: "BOT_AI_ROUTING",
        payload: JSON.stringify(params.payload),
      },
    });
  } catch (e: any) {
    // Logging failure must NEVER block the caller. Console only.
    console.warn(
      `[bot-ai-router] EventLog write failed for item ${params.itemId}: ${e?.message ?? e}`,
    );
  }
}

/**
 * Helper: derive the merged-strategy label from a routed result.
 * Used by index.ts when building the log payload.
 */
export function deriveMergedStrategy(
  hasPrimary: boolean,
  hasSecondary: boolean,
  degraded: boolean,
): RoutingLogPayload["mergedStrategy"] {
  if (degraded) return "degraded";
  if (hasPrimary && hasSecondary) return "merged_consensus";
  return "primary_only";
}
