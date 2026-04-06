/**
 * lib/bots/router-analytics.ts
 * ─────────────────────────────────────────────────────────────────
 * Read-only analytics layer over the BOT_AI_ROUTING EventLog.
 *
 * Foundation for self-tuning trigger thresholds (Step 13+). All
 * functions are pure reads — no writes, no mutations. Safe to call
 * from any UI/admin context.
 *
 * Three exports:
 *   • getRoutingHistory(itemId?, botName?) — recent decisions
 *   • getProviderHealth()                  — per-provider rollup
 *   • getTriggerEffectiveness()            — which triggers help
 *
 * CARRY-OVER FIX (Step 2 → Step 3): self-tuning foundation.
 * CMD-LISTBOT-HYBRID-001 — Step 3
 * ─────────────────────────────────────────────────────────────────
 */

import { prisma } from "@/lib/db";

type ProviderName = "openai" | "claude" | "gemini" | "grok";
type BotName =
  | "analyzebot" | "pricebot" | "photobot" | "buyerbot"
  | "reconbot" | "listbot" | "antiquebot"
  | "collectiblesbot" | "carbot" | "megabot";
type TriggerName =
  | "low_confidence" | "high_value" | "specialty_item"
  | "high_disagreement" | "borderline_grading"
  | "rare_vehicle" | "always";

interface RoutingPayload {
  botName: BotName;
  primary: ProviderName;
  secondary?: ProviderName;
  triggersFired: TriggerName[];
  providersAttempted: ProviderName[];
  providersUsed: ProviderName[];
  costUsd: number;
  actualCostUsd?: number;
  latencyMs: number;
  fallbackUsed: boolean;
  degraded: boolean;
  confidence: number | null;
  mergedStrategy: string;
  tokens?: Record<string, { input: number | null; output: number | null; total: number | null }>;
  demoMode: boolean;
  error?: string;
  timestamp: string;
}

function safeJson(s: string | null | undefined): RoutingPayload | null {
  if (!s) return null;
  try { return JSON.parse(s) as RoutingPayload; } catch { return null; }
}

/**
 * Recent BOT_AI_ROUTING decisions, optionally filtered by item or bot.
 * Returns up to 100 most recent rows.
 */
export async function getRoutingHistory(
  itemId?: string,
  botName?: BotName,
): Promise<Array<{ id: string; itemId: string; createdAt: Date; payload: RoutingPayload }>> {
  const rows = await prisma.eventLog.findMany({
    where: {
      eventType: "BOT_AI_ROUTING",
      ...(itemId ? { itemId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows
    .map((r) => {
      const payload = safeJson(r.payload);
      if (!payload) return null;
      if (botName && payload.botName !== botName) return null;
      return { id: r.id, itemId: r.itemId, createdAt: r.createdAt, payload };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export interface ProviderHealth {
  attempts: number;
  successes: number;
  successRate: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  avgActualCostUsd: number;
  avgConfidence: number | null;
}

/**
 * Per-provider health rollup across the last 1,000 routing decisions.
 * Use to spot degraded providers, cost spikes, or latency drift.
 */
export async function getProviderHealth(): Promise<Record<ProviderName, ProviderHealth>> {
  const rows = await prisma.eventLog.findMany({
    where: { eventType: "BOT_AI_ROUTING" },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const tally: Record<ProviderName, {
    attempts: number;
    successes: number;
    latencySum: number;
    costSum: number;
    actualCostSum: number;
    confSum: number;
    confCount: number;
  }> = {
    openai: { attempts: 0, successes: 0, latencySum: 0, costSum: 0, actualCostSum: 0, confSum: 0, confCount: 0 },
    claude: { attempts: 0, successes: 0, latencySum: 0, costSum: 0, actualCostSum: 0, confSum: 0, confCount: 0 },
    gemini: { attempts: 0, successes: 0, latencySum: 0, costSum: 0, actualCostSum: 0, confSum: 0, confCount: 0 },
    grok:   { attempts: 0, successes: 0, latencySum: 0, costSum: 0, actualCostSum: 0, confSum: 0, confCount: 0 },
  };

  for (const row of rows) {
    const p = safeJson(row.payload);
    if (!p) continue;
    for (const provider of p.providersAttempted ?? []) {
      const t = tally[provider];
      if (!t) continue;
      t.attempts++;
      if ((p.providersUsed ?? []).includes(provider)) t.successes++;
      // Latency + cost are call-level not per-provider; approximate by dividing
      const providerCount = Math.max(p.providersAttempted.length, 1);
      t.latencySum += (p.latencyMs ?? 0) / providerCount;
      t.costSum += (p.costUsd ?? 0) / providerCount;
      t.actualCostSum += (p.actualCostUsd ?? p.costUsd ?? 0) / providerCount;
      if (typeof p.confidence === "number") {
        t.confSum += p.confidence;
        t.confCount++;
      }
    }
  }

  const result: Record<ProviderName, ProviderHealth> = {} as any;
  for (const provider of ["openai", "claude", "gemini", "grok"] as ProviderName[]) {
    const t = tally[provider];
    result[provider] = {
      attempts: t.attempts,
      successes: t.successes,
      successRate: t.attempts > 0 ? Number((t.successes / t.attempts).toFixed(3)) : 0,
      avgLatencyMs: t.attempts > 0 ? Math.round(t.latencySum / t.attempts) : 0,
      avgCostUsd: t.attempts > 0 ? Number((t.costSum / t.attempts).toFixed(5)) : 0,
      avgActualCostUsd: t.attempts > 0 ? Number((t.actualCostSum / t.attempts).toFixed(6)) : 0,
      avgConfidence: t.confCount > 0 ? Number((t.confSum / t.confCount).toFixed(3)) : null,
    };
  }
  return result;
}

export interface TriggerStats {
  firedCount: number;
  /** Calls where this trigger fired AND a secondary actually ran. */
  ledToSecondaryRun: number;
}

/**
 * How often each trigger fires + how often it actually leads to a
 * secondary AI being invoked. Future Step 13 work will join this
 * against sale outcomes to compute ledToBetterAccuracy.
 */
export async function getTriggerEffectiveness(): Promise<Record<TriggerName, TriggerStats>> {
  const rows = await prisma.eventLog.findMany({
    where: { eventType: "BOT_AI_ROUTING" },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const tally: Record<TriggerName, TriggerStats> = {
    low_confidence:     { firedCount: 0, ledToSecondaryRun: 0 },
    high_value:         { firedCount: 0, ledToSecondaryRun: 0 },
    specialty_item:     { firedCount: 0, ledToSecondaryRun: 0 },
    high_disagreement:  { firedCount: 0, ledToSecondaryRun: 0 },
    borderline_grading: { firedCount: 0, ledToSecondaryRun: 0 },
    rare_vehicle:       { firedCount: 0, ledToSecondaryRun: 0 },
    always:             { firedCount: 0, ledToSecondaryRun: 0 },
  };

  for (const row of rows) {
    const p = safeJson(row.payload);
    if (!p || !Array.isArray(p.triggersFired)) continue;
    const ranSecondary = !!(p.secondary && (p.providersUsed ?? []).includes(p.secondary));
    for (const trigger of p.triggersFired) {
      const t = tally[trigger];
      if (!t) continue;
      t.firedCount++;
      if (ranSecondary) t.ledToSecondaryRun++;
    }
  }

  return tally;
}
