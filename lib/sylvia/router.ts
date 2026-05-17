// lib/sylvia/router.ts
//
// CMD-SYLVIA-AI-ROUTER-V1 V20 v2.1 R29 P76 · Wave 19 Slot B KEYSTONE · 2026-05-17
//
// 3-tier cost-class router · stops $10/Haiku-test bleed · ROOFlow concept
// custom-written into Sylvia. Greenfield substrate.
//
// Architecture:
//   classify task → map complexity to tier → pick cheap-first alias within tier →
//   set forceAlias hint into triageAndRoute → BINDING #10 single egress preserved
//
// Doctrine:
//   BINDING #10 · LiteLLM Gateway single chokepoint (consumes triage-router · zero new HTTP)
//   BINDING #16 · clones classify.ts + triage-router patterns · zero novel abstractions
//   BINDING #17 · §0.3 substrate read verbatim before write
//   BINDING #25 · zero AI spend v1 · rule-based tier classifier
//   Feature-flag · SYLVIA_ROUTER_ENABLED default OFF · Phase 9.5 activation
//
// Wave 19 Slot B §5.X Gate 1 defaults applied (existing 11-alias union ·
// GLM-4.6 · Qwen 2.5-VL · Llama 3.3 · Sonnet · Gemini 3.1 Pro · GPT 5.4 BANKED
// Wave 17+ pending LiteLLM `/v1/models` probe + ModelAlias union extension).

import { classifyComplexity } from "./triage-router";
import { preClassifyPatternHint } from "./dispatcher/classify";
import { appendEpisodic } from "./memory";
import type {
  ModelAlias,
  TaskComplexity,
  TriageTask,
  TriageResult,
} from "./types";
import type {
  RouteTask,
  RouteDecision,
  Tier,
  TierPolicy,
} from "./router-types";

// ─── Tier policy (§5.X Gate 1 defaults · existing aliases only this fire) ────

const TIER_POLICIES: Record<Tier, TierPolicy> = {
  T1: {
    tier: "T1",
    aliases: [
      "llama-3.2-local",
      "qwen-coder-2.5-local",
      "deepseek-r1-local",
      // BANKED Wave 17+ (pending LiteLLM probe + ModelAlias extension):
      //   "glm-4.6-local" · "qwen-2.5-vl" · "llama-3.3-local"
    ],
    costCeilingPerCallUsd: 0.001,
    costCeilingPerSessionUsd: 0.02,
    description:
      "Local Ollama tier · simple tasks · zero AI spend · sub-second latency",
  },
  T2: {
    tier: "T2",
    aliases: [
      "gpt-4o-mini",
      "gemini-2.5-flash",
      // BANKED Wave 17+ (pending LiteLLM probe + ModelAlias extension):
      //   "deepseek" · "grok-4" (downgrade slot) · "perplexity-sonar"
    ],
    costCeilingPerCallUsd: 0.01,
    costCeilingPerSessionUsd: 0.2,
    description:
      "Mid-tier cloud · medium complexity · sub-$0.01/call · 5-10s latency",
  },
  T3: {
    tier: "T3",
    aliases: [
      "claude-haiku-4-5", // Anthropic emphasis · default first per CEO directive
      "gemini-2.5-flash",
      "grok-4",
      // BANKED Wave 17+ (pending upstream + ModelAlias extension):
      //   "claude-sonnet-4-5" · "gpt-5.4" · "gemini-3.1-pro"
    ],
    costCeilingPerCallUsd: 0.1,
    costCeilingPerSessionUsd: 2.0,
    description:
      "Premium tier · complex reasoning · Anthropic emphasis · investor-grade",
  },
};

// ─── Tier mapping (rule-based v1) ─────────────────────────────────────

function mapComplexityToTier(
  complexity: TaskComplexity,
  patternHint?: TaskComplexity,
): Tier {
  const effective = patternHint ?? complexity;
  switch (effective) {
    case "simple":
      return "T1"; // local Ollama · cheap-first
    case "medium":
      return "T2"; // mid cloud
    case "complex":
    case "specialized":
      return "T3"; // premium · Anthropic emphasis
    default:
      return "T2"; // safe default
  }
}

function isRouterEnabled(): boolean {
  return process.env.SYLVIA_ROUTER_ENABLED === "1";
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Classify a task and produce a tier-routed RouteDecision. Pure classifier ·
 * NO gateway call · NO AI spend (BINDING #25 honored at v1 router surface).
 *
 * Caller chains the decision into `triageAndRoute` via `forceAlias` to land
 * the actual provider call through the single LiteLLM egress chokepoint
 * (BINDING #10).
 */
export async function routeTask(task: RouteTask): Promise<RouteDecision> {
  // forceAlias bypass · pass through tier lookup for telemetry
  if (task.forceAlias) {
    const tier = findTierForAlias(task.forceAlias);
    const policy = TIER_POLICIES[tier];
    return {
      tier,
      chosenAlias: task.forceAlias,
      rationale: `force-alias bypass: ${task.forceAlias}`,
      classifier: "force-alias",
      fallbackCascade: [],
      estimatedCostUsd: estimateCost(task.forceAlias, task.prompt),
      policySnapshot: policy,
    };
  }

  // forceTier override · skip auto-classify · pick cheap-first within tier
  if (task.forceTier) {
    const policy = TIER_POLICIES[task.forceTier];
    const chosen = policy.aliases[0];
    if (!chosen) {
      throw new Error(
        `[sylvia-router] forceTier=${task.forceTier} has empty alias list`,
      );
    }
    return {
      tier: task.forceTier,
      chosenAlias: chosen,
      rationale: `force-tier override: ${task.forceTier}`,
      classifier: "force-tier",
      fallbackCascade: policy.aliases.slice(1),
      estimatedCostUsd: estimateCost(chosen, task.prompt),
      policySnapshot: policy,
    };
  }

  // Auto-classify · v1 rule-based
  const triageTask: TriageTask = {
    prompt: task.prompt,
    context: task.context,
    sessionId: task.sessionId,
    requiresLiveWeb: task.requiresLiveWeb,
    requiresLocal: task.requiresLocal,
  };
  const { complexity, classifier } = classifyComplexity(triageTask);

  // Pattern hint enrichment (P74 consumer · gated by P74's own env flag).
  // Fail-soft: pattern engine unavailable → proceed with classifier-only.
  let patternHint: TaskComplexity | undefined;
  try {
    const patternResult = await preClassifyPatternHint({
      promptHash: simpleHash(task.prompt),
      prompt: task.prompt,
      sessionId: task.sessionId ?? "default",
    });
    if (patternResult.confidence >= 60 && patternResult.hint) {
      patternHint = patternResult.hint;
    }
  } catch {
    // Fail-soft · proceed without pattern hint
  }

  const tier = mapComplexityToTier(complexity, patternHint);
  const policy = TIER_POLICIES[tier];
  const chosenAlias = policy.aliases[0];
  if (!chosenAlias) {
    throw new Error(`[sylvia-router] tier=${tier} has empty alias list`);
  }

  const decision: RouteDecision = {
    tier,
    chosenAlias,
    rationale: `auto: complexity=${complexity} · classifier=${classifier} · patternHint=${patternHint ?? "none"} · tier=${tier}`,
    classifier: patternHint ? "pattern-hint" : "complexity-rule",
    fallbackCascade: policy.aliases.slice(1),
    estimatedCostUsd: estimateCost(chosenAlias, task.prompt),
    policySnapshot: policy,
  };

  // Telemetry · banked Phase 9.5 activation · fail-soft
  if (task.sessionId) {
    await safeEpisodicEmit({
      timestamp: new Date().toISOString(),
      sessionId: task.sessionId,
      eventType: "triage",
      payload: {
        router: "v1",
        tier,
        chosenAlias,
        rationale: decision.rationale,
        classifier: decision.classifier,
      },
      source: "direct",
    });
  }

  return decision;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function findTierForAlias(alias: ModelAlias): Tier {
  for (const tier of ["T1", "T2", "T3"] as const) {
    if (TIER_POLICIES[tier].aliases.includes(alias)) return tier;
  }
  return "T2"; // default mid for unmapped aliases (sonar variants etc)
}

/**
 * Per-1k-token estimate · placeholder. Phase 9.5 swaps to read from
 * ALIAS_COST_PER_1M_TOKENS_USD in triage-router.ts directly.
 */
function estimateCost(_alias: ModelAlias, prompt: string): number {
  const tokens = Math.ceil(prompt.length / 4);
  return tokens * 0.000001; // placeholder · refined Phase 9.5
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8);
}

async function safeEpisodicEmit(
  entry: Parameters<typeof appendEpisodic>[0],
): Promise<void> {
  try {
    await appendEpisodic(entry);
  } catch (err) {
    console.warn(
      `[sylvia-router] episodic emit failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

// ─── Public: tier policy introspection (for §5.X gate review + tests) ──

export function getTierPolicies(): Record<Tier, TierPolicy> {
  return TIER_POLICIES;
}

// ─── Public: tier-routed dispatch (combines routeTask + triageAndRoute) ──

/**
 * Tier-routed triage shortcut · combines routeTask + triageAndRoute.
 *
 * Feature-flag OFF (`SYLVIA_ROUTER_ENABLED` unset/≠"1") → bypass router ·
 * pass straight through to triageAndRoute (zero behavioral delta).
 *
 * Feature-flag ON → router classifies tier · sets `forceAlias` hint ·
 * triageAndRoute lands the call through LiteLLM Gateway (BINDING #10).
 *
 * Cost-ceilings per tier flow through to `triageAndRoute` as
 * `costCeilingPerCallUsd` + `costCeilingPerSessionUsd`. Double-check
 * protects against runaway spend at the egress layer.
 */
export async function routeAndDispatch(
  task: RouteTask,
): Promise<{ decision: RouteDecision; result: TriageResult }> {
  if (!isRouterEnabled()) {
    // Router OFF · bypass · pass through to triage-router directly.
    const { triageAndRoute } = await import("./triage-router");
    const result = await triageAndRoute({
      prompt: task.prompt,
      context: task.context,
      sessionId: task.sessionId,
      forceAlias: task.forceAlias,
      requiresLiveWeb: task.requiresLiveWeb,
      requiresLocal: task.requiresLocal,
    });
    return {
      decision: {
        tier: "T3",
        chosenAlias: result.decision.chosenAlias,
        rationale: "router OFF · bypass to triage-router",
        classifier: "fallback",
        fallbackCascade: result.decision.fallbackChain,
        estimatedCostUsd: result.decision.estimatedCostUsd,
        policySnapshot: TIER_POLICIES.T3,
      },
      result,
    };
  }

  const decision = await routeTask(task);
  const { triageAndRoute } = await import("./triage-router");
  const result = await triageAndRoute({
    prompt: task.prompt,
    context: task.context,
    sessionId: task.sessionId,
    forceAlias: decision.chosenAlias, // router-routed alias
    costCeilingPerCallUsd: decision.policySnapshot.costCeilingPerCallUsd,
    costCeilingPerSessionUsd: decision.policySnapshot.costCeilingPerSessionUsd,
  });
  return { decision, result };
}
