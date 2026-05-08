// app/api/sylvia/consensus/route.ts
//
// CMD-SYLVIA-TRUTH-GATE-DISPATCHER V19 · R24 P0 · 2026-05-08
//
// POST /api/sylvia/consensus — Truth Gate dispatcher.
// Implements docs/sylvia/SYLVIA_API_CONTRACT.md §2.2 + §3 + §4 + §6 + §7
// verbatim (R22.6 anchor).
//
// Auth (BINDING #16 DOC-DELEGATE-TO-CANONICAL · clones cron-auth pattern):
//   X-Sylvia-Internal-Secret · Authorization: Bearer · ?secret=<token>
//   timingSafeEqual + length guard + Buffer.from(utf8)
//
// Routing (BINDING #10 DOC-TELEMETRY-LOCK · single chokepoint):
//   All AI calls flow via lib/sylvia triageAndRoute → LiteLLM Gateway.
//   Zero direct provider SDK imports. Zero LangChain.
//
// 4-AI quartet (forceAlias · ModelAlias union per lib/sylvia/types.ts):
//   claude-haiku-4-5  (Anthropic)
//   gpt-4o-mini       (OpenAI)
//   gemini-2.5-flash  (Gemini)
//   grok-4            (xAI)
//
// Truth Gate per §3:
//   agreementScore >= 85 → "verified" · ship answer
//   70-84               → "partial"  · ship with caveat flag
//   < 70                → "refused"  · 422 with code: VALIDATION

import { NextResponse, type NextRequest } from "next/server";
import { triageAndRoute } from "@/lib/sylvia";
import {
  verifySylviaInternalSecret,
  classifyStakes,
  computeAgreement,
  BudgetTracker,
  type ProviderResponse,
  type Stakes,
} from "@/lib/sylvia/dispatcher";

export const runtime = "nodejs";
export const maxDuration = 60;

const PER_PROVIDER_TIMEOUT_MS = 25_000;
const QUARTET = ["claude-haiku-4-5", "gpt-4o-mini", "gemini-2.5-flash", "grok-4"] as const;

type ProviderAlias = (typeof QUARTET)[number];

interface ConsensusRequest {
  question?: string;
  stakes?: Stakes;
  maxBudgetUsd?: number;
  sessionId?: string;
}

interface ProvenanceEntry {
  kind: "real-time" | "memory" | "training" | "inferred";
  source?: string;
  timestamp?: string;
  rationale?: string;
}

function errorEnvelope(status: number, message: string, code?: string) {
  return NextResponse.json(
    code
      ? { error: message, code, traceId: crypto.randomUUID() }
      : { error: message, traceId: crypto.randomUUID() },
    { status },
  );
}

async function callProvider(
  alias: ProviderAlias,
  question: string,
  sessionId: string,
): Promise<ProviderResponse> {
  const started = Date.now();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("provider-timeout")), PER_PROVIDER_TIMEOUT_MS),
  );
  try {
    const result = await Promise.race([
      triageAndRoute({
        prompt: question,
        forceAlias: alias,
        sessionId,
        stream: false,
      }),
      timeoutPromise,
    ]);
    return {
      provider: alias,
      answer: result.responseText,
      costUsd: result.actualCostUsd,
      latencyMs: Date.now() - started,
      ok: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[sylvia-consensus] provider=${alias} failed: ${msg}`);
    return {
      provider: alias,
      answer: "",
      costUsd: 0,
      latencyMs: Date.now() - started,
      ok: false,
    };
  }
}

function aggregateAnswer(responses: ProviderResponse[]): string {
  const successful = responses.filter(r => r.ok && r.answer.trim().length > 0);
  if (successful.length === 0) return "";
  // v1: return the longest non-empty answer (deterministic · zero LLM call).
  // R25+ may swap to embedding-centroid synthesis.
  return successful.reduce((best, r) => (r.answer.length > best.length ? r.answer : best), "");
}

function defaultProvenance(): ProvenanceEntry[] {
  return [{ kind: "training", timestamp: new Date().toISOString() }];
}

export async function POST(req: NextRequest) {
  // Auth
  const auth = verifySylviaInternalSecret(req);
  if (!auth.ok) {
    return errorEnvelope(auth.status, auth.reason, auth.status === 401 ? "AUTH" : undefined);
  }

  // Parse body
  let body: ConsensusRequest;
  try {
    body = (await req.json()) as ConsensusRequest;
  } catch {
    return errorEnvelope(400, "Invalid JSON body", "VALIDATION");
  }
  const question = body.question?.trim();
  if (!question) {
    return errorEnvelope(400, "question required", "VALIDATION");
  }

  const sessionId = body.sessionId?.trim() || `sylvia-consensus-${crypto.randomUUID()}`;
  const budget = new BudgetTracker(body.maxBudgetUsd);

  try {
    // Stakes
    let stakes: Stakes;
    let classifyCostUsd = 0;
    if (body.stakes === "low" || body.stakes === "high") {
      stakes = body.stakes;
    } else {
      const cls = await classifyStakes(question, sessionId);
      stakes = cls.stakes;
      classifyCostUsd = cls.costUsd;
      budget.record(classifyCostUsd);
    }

    // LOW-stakes path
    if (stakes === "low") {
      const single = await callProvider("claude-haiku-4-5", question, sessionId);
      budget.record(single.costUsd);
      if (!single.ok) {
        return errorEnvelope(502, "Single-agent dispatch failed");
      }
      return NextResponse.json({
        answer: single.answer,
        confidenceBand: 70,
        verdict: "verified",
        provenance: defaultProvenance(),
        perProvider: [single],
        sessionId,
        totalCostUsd: budget.getQuestionSpent(),
        totalLatencyMs: single.latencyMs,
      });
    }

    // HIGH-stakes path · 4-AI quartet · Promise.allSettled (partial-failure tolerant)
    const settled = await Promise.allSettled(
      QUARTET.map(alias => callProvider(alias, question, sessionId)),
    );
    const responses: ProviderResponse[] = settled.map((s, i) =>
      s.status === "fulfilled"
        ? s.value
        : {
            provider: QUARTET[i],
            answer: "",
            costUsd: 0,
            latencyMs: 0,
            ok: false,
          },
    );

    for (const r of responses) budget.record(r.costUsd);

    const agreement = computeAgreement(responses);
    const totalLatencyMs = Math.max(...responses.map(r => r.latencyMs), 0);

    // Truth Gate
    if (agreement.score < 70) {
      return NextResponse.json(
        {
          error: "Need more info",
          code: "VALIDATION",
          agreementScore: agreement.score,
          verdict: "refused",
          perProvider: responses,
          sessionId,
          totalCostUsd: budget.getQuestionSpent(),
        },
        { status: 422 },
      );
    }

    const verdict: "verified" | "partial" = agreement.score >= 85 ? "verified" : "partial";
    const confidenceBand = Math.min(99, agreement.score);

    return NextResponse.json({
      answer: aggregateAnswer(responses),
      agreementScore: agreement.score,
      verdict,
      confidenceBand,
      provenance: defaultProvenance(),
      perProvider: responses,
      perPair: agreement.perPair,
      degraded: agreement.degraded,
      successfulCount: agreement.successfulCount,
      sessionId,
      totalCostUsd: budget.getQuestionSpent(),
      totalLatencyMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[sylvia-consensus] dispatch error: ${msg}`);
    return errorEnvelope(500, "Internal error");
  }
}
