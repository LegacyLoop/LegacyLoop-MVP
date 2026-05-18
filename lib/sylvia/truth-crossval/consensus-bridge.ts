// lib/sylvia/truth-crossval/consensus-bridge.ts
//
// CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 v2.1 R29 P-WAVE-20-PHASE-8 · 2026-05-18
//
// M10 consumer bridge · synthetic NextRequest + direct POST invocation.
// BINDING #10 ABSOLUTE: zero new fetch · re-uses M10 chokepoint completely
// (including BudgetTracker + classifyStakes + QUARTET + agreement scoring +
// audit-jsonl + Truth Gate refusal logic).
//
// ★ #46 NEW DOCTRINE CANDIDATE 1/5 anchor (DOC-TRUTH-CROSSVAL-CONSUMES-M10) ★

import { POST as consensusPOST } from "@/app/api/sylvia/consensus/route";
import { NextRequest } from "next/server";

export interface ConsensusBridgeOptions {
  prompt: string;
  stakes?: "low" | "high";
  maxBudgetUsd?: number;
  sessionId?: string;
}

export interface ConsensusBridgeResult {
  ok: boolean;
  answer: string;
  agreementScore: number;
  costUsd: number;
  latencyMs: number;
  errorReason?: string;
  auditId?: string;
}

export async function callM10Consensus(
  opts: ConsensusBridgeOptions,
): Promise<ConsensusBridgeResult> {
  const secret = process.env.SYLVIA_API_INTERNAL_SECRET;
  if (!secret) {
    return {
      ok: false,
      answer: "",
      agreementScore: 0,
      costUsd: 0,
      latencyMs: 0,
      errorReason: "SYLVIA_API_INTERNAL_SECRET not configured",
    };
  }

  // Build synthetic NextRequest carrying Bearer auth · zero new HTTP edge
  const url = new URL("http://localhost/api/sylvia/consensus");
  const body = JSON.stringify({
    question: opts.prompt,
    stakes: opts.stakes,
    maxBudgetUsd: opts.maxBudgetUsd,
    sessionId: opts.sessionId,
  });
  const synthetic = new NextRequest(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body,
  });

  const started = Date.now();
  try {
    const res = await consensusPOST(synthetic);
    const json = (await res.json()) as Record<string, unknown>;
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      return {
        ok: false,
        answer: "",
        agreementScore: 0,
        costUsd: typeof json.totalCostUsd === "number" ? json.totalCostUsd : 0,
        latencyMs,
        errorReason:
          typeof json.error === "string"
            ? json.error
            : `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      answer: typeof json.answer === "string" ? json.answer : "",
      agreementScore:
        typeof json.agreementScore === "number" ? json.agreementScore : 0,
      costUsd: typeof json.totalCostUsd === "number" ? json.totalCostUsd : 0,
      latencyMs,
      auditId: typeof json.auditId === "string" ? json.auditId : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      answer: "",
      agreementScore: 0,
      costUsd: 0,
      latencyMs: Date.now() - started,
      errorReason: err instanceof Error ? err.message : "unknown",
    };
  }
}
