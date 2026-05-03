/**
 * Sylvia Triage Router V1
 *
 * CMD-SYLVIA-TRIAGE-ROUTER-V1 · V18 · 2026-05-03
 * Author: Pam (Cowork · Layer 1 · AI track)
 *
 * Auto-classifies task complexity and routes to the cheapest capable
 * model alias via LiteLLM Gateway. Cost ceiling enforcement and
 * structured telemetry baked in.
 *
 * RooFlow-inspired · LegacyLoop custom build. NO LangChain. NO direct
 * provider SDKs. Gateway is the single egress point per
 * DOC-TELEMETRY-LOCK.
 *
 * USAGE EXAMPLE:
 *   import { triageAndRoute } from "@/lib/sylvia";
 *
 *   const result = await triageAndRoute({
 *     prompt: "What's the auction trend for Roseville pottery?",
 *     requiresLiveWeb: true,
 *     sessionId: "user-abc",
 *   });
 *   // → routes to sonar-reasoning-pro · enforces cost ceilings ·
 *   //   emits structured telemetry to console.log (V1 sink).
 *
 * V2 banked:
 *   - LLM-based classifier escalation
 *   - Prisma SylviaMemory telemetry persistence (Spec 3)
 *   - app/api/sylvia/triage/route.ts public surface
 *   - Open WebUI consumer wiring
 */

import type {
  TaskComplexity,
  ModelAlias,
  TriageTask,
  TriageDecision,
  TriageResult,
  TriageTelemetry,
} from "./types";
import { recordTriage } from "./memory";

// ─── Constants ────────────────────────────────────────────────────

// TODO(env-ify): banked CMD-LITELLM-GATEWAY-URL-ENVIFY · formalize
// the env var across .env.example + Vercel project settings.
const GATEWAY_URL =
  process.env.LITELLM_GATEWAY_URL ?? "http://localhost:8000";

const DEFAULT_PER_CALL_CEILING_USD = 0.05;
const DEFAULT_PER_SESSION_CEILING_USD = 1.0;

/**
 * Public per-1M-token pricing per alias (USD · cited 2026-05-03).
 * Local Ollama aliases are pinned to 0 — compute is sunk cost ·
 * keeping the entry near-zero so ceiling math behaves consistently.
 *
 * UPDATE on provider price change. Banks DOC-COST-MAP-CITATION-FRESHNESS
 * doctrine candidate · ratifies on first stale-cost incident.
 */
const ALIAS_COST_PER_1M_TOKENS_USD: Record<
  ModelAlias,
  { in: number; out: number }
> = {
  // Local Ollama · effectively free for ceiling math
  "llama-3.2-local": { in: 0, out: 0 },
  "qwen-coder-2.5-local": { in: 0, out: 0 },
  "deepseek-r1-local": { in: 0, out: 0 },

  // Cloud · per provider public pricing as of 2026-05-03
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "claude-haiku-4-5": { in: 0.8, out: 4.0 },
  "gemini-2.5-flash": { in: 0.075, out: 0.3 },
  "grok-4": { in: 5.0, out: 15.0 },

  // Sonar · live-web premium · reasoning > pro > base
  sonar: { in: 1.0, out: 1.0 },
  "sonar-pro": { in: 3.0, out: 15.0 },
  "sonar-reasoning-pro": { in: 2.0, out: 8.0 },
  "sonar-deep-research": { in: 2.0, out: 8.0 }, // + research surcharge tracked V2
};

/**
 * Cheapest-first cascade per complexity bucket. Order matters —
 * triageAndRoute() walks the array in sequence on Gateway failure.
 */
const COMPLEXITY_CASCADE: Record<TaskComplexity, ModelAlias[]> = {
  simple: ["llama-3.2-local", "gpt-4o-mini"],
  medium: ["gpt-4o-mini", "claude-haiku-4-5"],
  complex: ["claude-haiku-4-5", "gpt-4o-mini", "gemini-2.5-flash"],
  specialized: ["sonar-reasoning-pro", "sonar-pro", "sonar"],
};

// Pre-compiled regexes · avoid per-call recompilation cost
const RX_CODE_FENCE = /```/;
const RX_COMPLEX_KW =
  /\b(refactor|debug|architecture|review|analyze|synthesize|cross-reference)\b/i;
const RX_RESEARCH_KW = /\b(research|cite|sources|current|live)\b/i;

// ─── Session cost tracking (in-memory · V2 persists via Spec 3) ──

const sessionCostMap = new Map<string, number>();

// ─── Classifier ───────────────────────────────────────────────────

/**
 * Rule-based complexity classifier. V1 · deterministic · sub-1ms.
 * V2 banks LLM-based escalation when rules return low confidence.
 *
 * Priority order (first match wins):
 *   1. forceAlias  → "specialized" + "force-alias" classifier tag
 *   2. complexityHint → caller-supplied bucket
 *   3. requiresLiveWeb → "specialized"
 *   4. requiresLocal → "simple" (pinned to local Ollama tier)
 *   5. research keywords → "specialized"
 *   6. code fence OR complex keywords → "complex"
 *   7. length > 1500 chars → "complex"
 *   8. length < 200 chars → "simple"
 *   9. default → "medium"
 */
export function classifyComplexity(task: TriageTask): {
  complexity: TaskComplexity;
  classifier: "rule-based" | "hint-override" | "force-alias";
} {
  if (task.forceAlias) {
    return { complexity: "specialized", classifier: "force-alias" };
  }
  if (task.complexityHint) {
    return {
      complexity: task.complexityHint,
      classifier: "hint-override",
    };
  }
  if (task.requiresLiveWeb) {
    return { complexity: "specialized", classifier: "rule-based" };
  }
  if (task.requiresLocal) {
    return { complexity: "simple", classifier: "rule-based" };
  }

  const p = task.prompt;
  const len = p.length;
  const hasResearchKw = RX_RESEARCH_KW.test(p);
  if (hasResearchKw) {
    return { complexity: "specialized", classifier: "rule-based" };
  }
  const hasCodeFence = RX_CODE_FENCE.test(p);
  const hasComplexKw = RX_COMPLEX_KW.test(p);
  if (hasCodeFence || hasComplexKw) {
    return { complexity: "complex", classifier: "rule-based" };
  }
  if (len > 1500) {
    return { complexity: "complex", classifier: "rule-based" };
  }
  if (len < 200) {
    return { complexity: "simple", classifier: "rule-based" };
  }
  return { complexity: "medium", classifier: "rule-based" };
}

// ─── Cost estimation ──────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateCostUsd(
  alias: ModelAlias,
  promptText: string,
  expectedOutTokens = 500,
): number {
  const cost = ALIAS_COST_PER_1M_TOKENS_USD[alias];
  const inTok = estimateTokens(promptText);
  const totalUsd = (inTok * cost.in + expectedOutTokens * cost.out) / 1_000_000;
  return Math.round(totalUsd * 10000) / 10000; // 4 decimal places
}

// ─── Decision ─────────────────────────────────────────────────────

function decide(task: TriageTask): TriageDecision {
  const { complexity, classifier } = classifyComplexity(task);
  const cascade = task.forceAlias
    ? [task.forceAlias]
    : COMPLEXITY_CASCADE[complexity];
  const chosenAlias = cascade[0];
  const estimatedCostUsd = estimateCostUsd(
    chosenAlias,
    task.prompt + (task.context ?? ""),
  );
  return {
    complexity,
    chosenAlias,
    reason: `Classifier=${classifier} · cascade[0]=${chosenAlias}`,
    estimatedCostUsd,
    fallbackChain: cascade.slice(1),
  };
}

// ─── Cost ceiling gates ───────────────────────────────────────────

function checkCeilings(
  decision: TriageDecision,
  task: TriageTask,
): { ok: boolean; trigger: TriageTelemetry["ceilingTriggered"] } {
  const perCall = task.costCeilingPerCallUsd ?? DEFAULT_PER_CALL_CEILING_USD;
  const perSession =
    task.costCeilingPerSessionUsd ?? DEFAULT_PER_SESSION_CEILING_USD;
  const sessionId = task.sessionId ?? "default";
  const sessionTotal = sessionCostMap.get(sessionId) ?? 0;

  if (decision.estimatedCostUsd > perCall) {
    return { ok: false, trigger: "per-call" };
  }
  if (sessionTotal + decision.estimatedCostUsd > perSession) {
    return { ok: false, trigger: "per-session" };
  }
  return { ok: true, trigger: "none" };
}

// ─── Gateway call (single egress point per DOC-TELEMETRY-LOCK) ────

interface GatewayResponse {
  text: string;
  tokensIn?: number;
  tokensOut?: number;
  streamed: boolean;
}

async function callGateway(
  alias: ModelAlias,
  prompt: string,
  context: string | undefined,
  stream: boolean,
): Promise<GatewayResponse> {
  const messages = [
    ...(context ? [{ role: "system", content: context }] : []),
    { role: "user", content: prompt },
  ];

  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: alias, messages, stream }),
  });

  if (!res.ok) {
    throw new Error(`Gateway ${res.status}: ${await res.text()}`);
  }

  if (stream && res.body) {
    // SSE accumulate · format: "data: {json}\n\n" · sentinel "[DONE]"
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let acc = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      const lines = acc.split("\n");
      acc = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const j = JSON.parse(payload);
          const delta = j.choices?.[0]?.delta?.content;
          if (typeof delta === "string") text += delta;
        } catch {
          // skip malformed line
        }
      }
    }
    return { text, streamed: true };
  }

  const j = await res.json();
  const text = j.choices?.[0]?.message?.content ?? "";
  return {
    text,
    tokensIn: j.usage?.prompt_tokens,
    tokensOut: j.usage?.completion_tokens,
    streamed: false,
  };
}

// ─── Telemetry ────────────────────────────────────────────────────

async function emitTelemetry(t: TriageTelemetry): Promise<void> {
  // V1 sink: structured JSON to console.log (preserved for dev visibility)
  console.log(`[sylvia-triage] ${JSON.stringify(t)}`);

  // V2 sink: Prisma SylviaMemory persist · CMD-SYLVIA-TRIAGE-ROUTER-V2-
  // TELEMETRY-PERSIST 2026-05-03 · activates compounding moat (Investor
  // Moat #8). Memory write failure is NON-FATAL · routing path must
  // never break because telemetry persistence hiccupped. V2.1 banked
  // for caller-context propagation (userId · itemId · responseText).
  try {
    await recordTriage({ telemetry: t });
  } catch (err) {
    console.warn(
      `[sylvia-triage] memory persist failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

function hashPrompt(prompt: string): string {
  // Simple non-crypto hash for de-dup · 8 chars
  let h = 0;
  for (let i = 0; i < prompt.length; i++) {
    h = ((h << 5) - h + prompt.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8);
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Auto-classify a task and route it to the cheapest capable alias
 * via LiteLLM Gateway. Enforces per-call + per-session cost
 * ceilings BEFORE the network call (saves money on bad
 * classifications). Walks the cascade fallback chain on Gateway
 * failure. Emits structured telemetry via emitTelemetry() · V1 sinks
 * to console.log · V2 (Spec 3) persists to SylviaMemory.
 *
 * Throws on:
 *   - cost ceiling exceeded (per-call OR per-session)
 *   - all cascade aliases failed
 */
export async function triageAndRoute(task: TriageTask): Promise<TriageResult> {
  const t0 = Date.now();
  const sessionId = task.sessionId ?? "default";
  const decision = decide(task);
  const ceiling = checkCeilings(decision, task);
  const cascadeAttempted: ModelAlias[] = [];
  const classifierTag = classifyComplexity(task).classifier;
  const promptHash = hashPrompt(task.prompt);

  if (!ceiling.ok) {
    const tel: TriageTelemetry = {
      timestamp: new Date().toISOString(),
      sessionId,
      promptHash,
      promptLength: task.prompt.length,
      classifier: classifierTag,
      classification: decision.complexity,
      chosenAlias: decision.chosenAlias,
      cascadeAttempted: [],
      fallbackUsed: false,
      costEstimateUsd: decision.estimatedCostUsd,
      costActualUsd: 0,
      ceilingTriggered: ceiling.trigger,
      durationMs: Date.now() - t0,
      errorClass: `ceiling-${ceiling.trigger}-exceeded`,
    };
    await emitTelemetry(tel);
    throw new Error(
      `[sylvia-triage] cost ceiling exceeded: ${ceiling.trigger}`,
    );
  }

  const tryChain = [decision.chosenAlias, ...decision.fallbackChain];
  const stream = task.stream ?? true;
  let lastErr: unknown = null;

  for (const alias of tryChain) {
    cascadeAttempted.push(alias);
    try {
      const out = await callGateway(alias, task.prompt, task.context, stream);
      const tokensIn =
        out.tokensIn ?? estimateTokens(task.prompt + (task.context ?? ""));
      const tokensOut = out.tokensOut ?? estimateTokens(out.text);
      const cost = ALIAS_COST_PER_1M_TOKENS_USD[alias];
      const actualCostUsd =
        (tokensIn * cost.in + tokensOut * cost.out) / 1_000_000;
      sessionCostMap.set(
        sessionId,
        (sessionCostMap.get(sessionId) ?? 0) + actualCostUsd,
      );

      const tel: TriageTelemetry = {
        timestamp: new Date().toISOString(),
        sessionId,
        promptHash,
        promptLength: task.prompt.length,
        classifier: classifierTag,
        classification: decision.complexity,
        chosenAlias: alias,
        cascadeAttempted: [...cascadeAttempted],
        fallbackUsed: alias !== decision.chosenAlias,
        costEstimateUsd: decision.estimatedCostUsd,
        costActualUsd: Math.round(actualCostUsd * 10000) / 10000,
        ceilingTriggered: "none",
        durationMs: Date.now() - t0,
        tokensIn,
        tokensOut,
      };
      await emitTelemetry(tel);

      return {
        decision: { ...decision, chosenAlias: alias },
        responseText: out.text,
        responseStreamed: out.streamed,
        durationMs: Date.now() - t0,
        actualCostUsd: tel.costActualUsd,
        telemetry: tel,
      };
    } catch (err) {
      lastErr = err;
      // continue cascade
    }
  }

  const errMsg =
    lastErr instanceof Error ? lastErr.message.slice(0, 100) : "unknown";
  const tel: TriageTelemetry = {
    timestamp: new Date().toISOString(),
    sessionId,
    promptHash,
    promptLength: task.prompt.length,
    classifier: classifierTag,
    classification: decision.complexity,
    chosenAlias: decision.chosenAlias,
    cascadeAttempted: [...cascadeAttempted],
    fallbackUsed: cascadeAttempted.length > 1,
    costEstimateUsd: decision.estimatedCostUsd,
    costActualUsd: 0,
    ceilingTriggered: "none",
    durationMs: Date.now() - t0,
    errorClass: errMsg,
  };
  await emitTelemetry(tel);
  throw new Error(`[sylvia-triage] cascade exhausted: ${errMsg}`);
}

// ─── Test helpers (exported · NOT for production wiring) ──────────

export function _resetSessionCostMap(): void {
  sessionCostMap.clear();
}

export function _getSessionCostUsd(sessionId: string): number {
  return sessionCostMap.get(sessionId) ?? 0;
}
