/**
 * Sylvia Triage Router — Type definitions
 *
 * CMD-SYLVIA-TRIAGE-ROUTER-V1 · V18 · 2026-05-03
 * Author: Pam (Cowork · Layer 1 · AI track)
 *
 * V1 contract — AGENT-facing (Sylvia) · separate from BOT-facing
 * lib/adapters/bot-ai-router. Pairs with Spec 3 for telemetry persistence.
 *
 * DOC-TELEMETRY-LOCK applies — all model calls route via LiteLLM
 * Gateway at localhost:8000. NO direct provider SDK imports anywhere
 * in lib/sylvia/.
 */

/** Coarse complexity buckets used by the rule-based classifier. */
export type TaskComplexity = "simple" | "medium" | "complex" | "specialized";

/**
 * Canonical alias names served by LiteLLM Gateway model_list.
 *
 * 11 aliases LIVE (per Pam briefing 2026-05-03 + Cyl 14a):
 *   3 local (Ollama-backed · catch-all /v1/ route · MAX_LOADED_MODELS=1)
 *   4 cloud (provider passthrough · /<provider>/v1/ routes)
 *   4 Sonar (Perplexity · live-web grounding · reasoning > pro > base)
 *
 * Alias additions are owned by CMD-LITELLM-CLOUD-VENDOR-ADD —
 * extending this union here without an alias landing in
 * litellm_config.yaml first will fail the Gateway call.
 */
export type ModelAlias =
  | "llama-3.2-local"
  | "qwen-coder-2.5-local"
  | "deepseek-r1-local"
  | "gpt-4o-mini"
  | "claude-haiku-4-5"
  | "gemini-2.5-flash"
  | "grok-4"
  | "sonar"
  | "sonar-pro"
  | "sonar-reasoning-pro"
  | "sonar-deep-research";

/**
 * Caller-supplied input to triageAndRoute(). All fields beyond
 * `prompt` are optional · classifier + cost-ceiling defaults handle
 * the omission cases.
 */
export interface TriageTask {
  prompt: string;
  context?: string;
  complexityHint?: TaskComplexity; // optional override
  forceAlias?: ModelAlias; // bypass classifier (for tests / CEO override)
  costCeilingPerCallUsd?: number; // default 0.05
  costCeilingPerSessionUsd?: number; // default 1.00
  sessionId?: string; // for cumulative cost tracking · default "default"
  stream?: boolean; // default true (advisor ruling 2)
  requiresLiveWeb?: boolean; // forces Sonar tier
  requiresLocal?: boolean; // forces Ollama tier (privacy / batch)
}

/** Pre-call decision · emitted regardless of cost-ceiling outcome. */
export interface TriageDecision {
  complexity: TaskComplexity;
  chosenAlias: ModelAlias;
  reason: string;
  estimatedCostUsd: number;
  fallbackChain: ModelAlias[];
}

/** Full result returned to the caller on successful Gateway round-trip. */
export interface TriageResult {
  decision: TriageDecision;
  responseText: string;
  responseStreamed: boolean;
  durationMs: number;
  actualCostUsd: number;
  telemetry: TriageTelemetry;
}

/**
 * Structured telemetry · emitted to console.log in V1 ·
 * Spec 3 (COLLECTIVE-MEMORY) swaps the sink to Prisma SylviaMemory.
 */
export interface TriageTelemetry {
  timestamp: string; // ISO
  sessionId: string;
  promptHash: string; // 8-char non-crypto hash · for de-dup
  promptLength: number;
  classifier: "rule-based" | "hint-override" | "force-alias";
  classification: TaskComplexity;
  chosenAlias: ModelAlias;
  cascadeAttempted: ModelAlias[];
  fallbackUsed: boolean;
  costEstimateUsd: number;
  costActualUsd: number;
  ceilingTriggered: "none" | "per-call" | "per-session";
  durationMs: number;
  tokensIn?: number;
  tokensOut?: number;
  errorClass?: string;
}
