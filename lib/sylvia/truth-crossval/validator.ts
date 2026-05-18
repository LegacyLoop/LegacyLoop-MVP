// lib/sylvia/truth-crossval/validator.ts
//
// CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 v2.1 R29 P-WAVE-20-PHASE-8 · 2026-05-18
//
// Main orchestrator · consumes M10 consensus + Phase 4 hybrid + Phase 6 graphify
// + Phase 5 obsidian as cross-val sources. Feature-flag gated.
// BINDING #10: consumer-only · zero new HTTP. BINDING #31: payload.truth_crossval="v1".

import { randomUUID } from "node:crypto";
import { callM10Consensus } from "./consensus-bridge";
import { computeAgreement } from "./aggregator";
import { hybridRecall } from "../hybrid";
import { buildGraph } from "../graphify";
import { getBacklinksFor } from "../obsidian";
import { appendEpisodic } from "../memory";
import type {
  CrossvalInput,
  CrossvalResult,
  CrossvalSourceResult,
  CrossvalSource,
  CrossvalEpisodicPayload,
} from "./types";

const DEFAULT_SOURCES: CrossvalSource[] = ["consensus", "hybrid", "graphify"];

export function isTruthCrossvalEnabled(): boolean {
  return process.env.SYLVIA_TRUTH_CROSSVAL_ENABLED === "1";
}

export async function crossValidate(
  input: CrossvalInput,
): Promise<CrossvalResult | null> {
  if (!isTruthCrossvalEnabled()) return null;

  const started = Date.now();
  const sessionId = input.sessionId ?? `sylvia-crossval-${randomUUID()}`;
  const sources = input.sources ?? DEFAULT_SOURCES;
  const results: CrossvalSourceResult[] = [];

  // Always-present consensus baseline (M10 chokepoint)
  const m10 = await callM10Consensus({
    prompt: input.prompt,
    stakes: input.stakes,
    maxBudgetUsd: input.maxBudgetUsd,
    sessionId,
  });
  const consensusResult: CrossvalSourceResult = {
    source: "consensus",
    answer: m10.answer,
    confidence: m10.agreementScore,
    latencyMs: m10.latencyMs,
    ok: m10.ok,
    errorReason: m10.errorReason,
  };
  results.push(consensusResult);

  // Substrate cross-vals · defensive · fail-soft
  if (sources.includes("hybrid")) {
    results.push(await crossvalHybrid(input.prompt, input.context?.namespace));
  }
  if (sources.includes("graphify")) {
    results.push(await crossvalGraphify(input.prompt));
  }
  if (sources.includes("obsidian") && input.context?.itemId) {
    results.push(await crossvalObsidian(input.context.itemId));
  }

  const agg = computeAgreement(results);
  const totalLatencyMs = Date.now() - started;
  const totalCostUsd = m10.costUsd; // Phase 4/6 in-process · zero AI cost

  const result: CrossvalResult = {
    prompt: input.prompt,
    agreementScore: agg.agreementScore,
    consensus: consensusResult,
    sources: results.filter((r) => r.source !== "consensus"),
    accepted: agg.accepted,
    rejectionReason: agg.rejectionReason,
    auditId: sessionId,
    totalLatencyMs,
    totalCostUsd,
    emittedAt: new Date().toISOString(),
  };

  // Telemetry sentinel · BINDING #31 ABSOLUTE
  const payload: CrossvalEpisodicPayload = {
    truth_crossval: "v1",
    operation: "crossval",
    agreementScore: agg.agreementScore,
    sourcesCount: results.length,
    accepted: agg.accepted,
    latencyMs: totalLatencyMs,
    costUsd: totalCostUsd,
  };
  try {
    await appendEpisodic({
      timestamp: new Date().toISOString(),
      sessionId,
      eventType: "consensus", // existing union value · NO extension
      payload: payload as unknown as Record<string, unknown>,
      source: "direct",
    });
  } catch {
    // fail-soft · prisma dev-db gap handled
  }

  return result;
}

async function crossvalHybrid(
  prompt: string,
  namespace?: string,
): Promise<CrossvalSourceResult> {
  const t0 = Date.now();
  try {
    const hits = await hybridRecall({
      query: prompt,
      scope: (namespace as never) ?? "global",
      limit: 3,
    });
    const top = hits[0];
    return {
      source: "hybrid",
      answer: top?.content ?? "",
      confidence: top ? Math.round((top.score ?? 0) * 100) : 0,
      latencyMs: Date.now() - t0,
      ok: hits.length > 0,
      errorReason: hits.length === 0 ? "no-hybrid-hits" : undefined,
    };
  } catch (err) {
    return {
      source: "hybrid",
      answer: "",
      confidence: 0,
      latencyMs: Date.now() - t0,
      ok: false,
      errorReason: err instanceof Error ? err.message : "hybrid-fail",
    };
  }
}

async function crossvalGraphify(prompt: string): Promise<CrossvalSourceResult> {
  const t0 = Date.now();
  try {
    const snapshot = await buildGraph();
    const topCommunity = snapshot.communities[0];
    const summary = topCommunity
      ? `community ${topCommunity.id} (${topCommunity.label}): ${topCommunity.nodes.length} nodes cohesion=${topCommunity.cohesion.toFixed(2)}`
      : "";
    // Defensive: thin communities (Phase 6 §12 RISK inherited)
    const ok = snapshot.communities.length >= 1;
    return {
      source: "graphify",
      answer: summary,
      confidence: ok ? Math.round((topCommunity?.cohesion ?? 0) * 100) : 0,
      latencyMs: Date.now() - t0,
      ok,
      errorReason: ok ? undefined : "thin-communities",
    };
  } catch (err) {
    return {
      source: "graphify",
      answer: "",
      confidence: 0,
      latencyMs: Date.now() - t0,
      ok: false,
      errorReason: err instanceof Error ? err.message : "graphify-fail",
    };
  }
  void prompt;
}

async function crossvalObsidian(itemId: string): Promise<CrossvalSourceResult> {
  const t0 = Date.now();
  try {
    const links = await getBacklinksFor(itemId);
    const summary =
      links.length > 0
        ? `backlinks from ${links.length} notes: ${links.slice(0, 3).join(", ")}`
        : "";
    return {
      source: "obsidian",
      answer: summary,
      confidence: links.length > 0 ? Math.min(100, links.length * 20) : 0,
      latencyMs: Date.now() - t0,
      ok: links.length > 0,
      errorReason: links.length === 0 ? "no-backlinks" : undefined,
    };
  } catch (err) {
    return {
      source: "obsidian",
      answer: "",
      confidence: 0,
      latencyMs: Date.now() - t0,
      ok: false,
      errorReason: err instanceof Error ? err.message : "obsidian-fail",
    };
  }
}
