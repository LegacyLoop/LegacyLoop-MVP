// lib/sylvia/hybrid/bridge.ts
//
// CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20 v2.1 R29 P-WAVE-20-PHASE-4 · 2026-05-18
// ★ BINDING #38 RATIFY FIRE · empirical-cite mandatory ★
//
// Hybrid recall decision engine · routes queries through Phase 3 HNSW (vector)
// or existing Phase 0 semantic memory (keyword) per CEO §5.X Gate 1 policy.
//
// BINDING #10: zero new HTTP · consumer-only · vectorQuery owns LiteLLM Gateway
// chokepoint (Phase 3 ship · 64b910f) · semantic.recallByEntity is file-system-v1.
// BINDING #16: zero @claude-flow/* import · custom-port hybrid concept.
// BINDING #31: telemetry via eventType="triage" + payload.hybrid="v1" sentinel.
//
// §0.8 PUSH-BACK-WITH-REPLACEMENT (BINDING #31 IT empirical catch):
// Devin spec FIX 4 referenced `semantic.recallSimilar(query, bucket, limit)` but
// real semantic.ts exports `recallByEntity({entity, type?, limit?, fuzzy?})`
// returning SemanticEntry[]. REPLACEMENT: keyword path consumes recallByEntity.

import { vectorQuery } from "../vector";
import { recallByEntity } from "../semantic";
import { appendEpisodic } from "../memory";
import { rrfMerge } from "./merge";
import type {
  HybridQueryRequest,
  HybridResult,
  HybridMode,
  HybridPath,
  HybridEpisodicPayload,
} from "./types";

const DEFAULT_MODE: HybridMode = "vector-first"; // CEO §5.X Gate 1 pick (Option A)
const DEFAULT_VECTOR_SCORE_THRESHOLD = 0.7;
const DEFAULT_LIMIT = 5;

function isHybridEnabled(): boolean {
  return process.env.SYLVIA_HYBRID_MEMORY_ENABLED === "1";
}

export async function hybridRecall(
  req: HybridQueryRequest,
): Promise<HybridResult[]> {
  // Feature-flag OFF: legacy keyword-only path · zero behavior delta
  if (!isHybridEnabled()) {
    return legacyKeywordOnly(req);
  }

  const mode = req.mode ?? DEFAULT_MODE;
  const limit = req.limit ?? DEFAULT_LIMIT;
  const threshold = req.vectorScoreThreshold ?? DEFAULT_VECTOR_SCORE_THRESHOLD;
  const t0 = Date.now();

  let results: HybridResult[] = [];
  let pathUsed: HybridPath = "vector";

  switch (mode) {
    case "vector-first": {
      const vHits = await vectorQuery(req.scope, req.query, {
        k: limit,
        sessionId: req.sessionId,
      });
      const topScore = vHits[0]?.score ?? 0;
      if (vHits.length > 0 && topScore >= threshold) {
        results = vHits.map((v) => ({
          source: "vector" as const,
          id: v.entry.id,
          score: v.score,
          content: extractContent(v.entry.metadata),
          metadata: v.entry.metadata,
        }));
        pathUsed = "vector";
      } else {
        const kHits = await keywordRecall(req.query, limit);
        results = kHits.map((k) => ({ ...k, source: "keyword-fallback" as const }));
        pathUsed = "keyword-fallback";
      }
      break;
    }
    case "keyword-first": {
      const kHits = await keywordRecall(req.query, limit);
      if (kHits.length > 0) {
        results = kHits.map((k) => ({ ...k, source: "keyword" as const }));
        pathUsed = "keyword";
      } else {
        const vHits = await vectorQuery(req.scope, req.query, {
          k: limit,
          sessionId: req.sessionId,
        });
        results = vHits.map((v) => ({
          source: "vector-fallback" as const,
          id: v.entry.id,
          score: v.score,
          content: extractContent(v.entry.metadata),
          metadata: v.entry.metadata,
        }));
        pathUsed = "vector-fallback";
      }
      break;
    }
    case "always-hybrid": {
      const [vHits, kHits] = await Promise.all([
        vectorQuery(req.scope, req.query, { k: limit, sessionId: req.sessionId }),
        keywordRecall(req.query, limit),
      ]);
      const vResults: HybridResult[] = vHits.map((v) => ({
        source: "vector" as const,
        id: v.entry.id,
        score: v.score,
        content: extractContent(v.entry.metadata),
        metadata: v.entry.metadata,
      }));
      results = rrfMerge(vResults, kHits, limit);
      pathUsed = "hybrid-merged";
      break;
    }
  }

  await emitTelemetry({
    mode,
    pathUsed,
    hits: results.length,
    latencyMs: Date.now() - t0,
    scope: req.scope,
    sessionId: req.sessionId,
  });

  return results;
}

async function legacyKeywordOnly(req: HybridQueryRequest): Promise<HybridResult[]> {
  try {
    const hits = await keywordRecall(req.query, req.limit ?? DEFAULT_LIMIT);
    return hits.map((h) => ({ ...h, source: "legacy" as const }));
  } catch {
    return [];
  }
}

async function keywordRecall(query: string, limit: number): Promise<HybridResult[]> {
  // BINDING #31 push-back replacement: semantic.recallByEntity (real API)
  // vs Devin spec reference semantic.recallSimilar (does not exist).
  try {
    const entries = await recallByEntity({
      entity: query,
      limit,
      fuzzy: true,
    });
    return entries.map((e, i) => ({
      source: "keyword" as const,
      id: e.id,
      score: 1 - i / Math.max(1, entries.length), // rank-based score 1.0 → 0.0
      content: e.body ?? e.name,
      metadata: {
        type: e.type,
        name: e.name,
        domain: e.domain,
        tags: e.tags,
        path: e.path,
      },
    }));
  } catch {
    return [];
  }
}

function extractContent(metadata: Record<string, unknown>): string {
  if (typeof metadata.content === "string") return metadata.content;
  if (typeof metadata.text === "string") return metadata.text;
  if (typeof metadata.body === "string") return metadata.body;
  if (typeof metadata.name === "string") return metadata.name;
  return JSON.stringify(metadata);
}

interface TelemetryInput {
  mode: HybridMode;
  pathUsed: HybridPath;
  hits: number;
  latencyMs: number;
  scope: HybridQueryRequest["scope"];
  sessionId?: string;
}

async function emitTelemetry(t: TelemetryInput): Promise<void> {
  if (!t.sessionId) return;
  const payload: HybridEpisodicPayload = {
    hybrid: "v1",
    mode: t.mode,
    pathUsed: t.pathUsed,
    hits: t.hits,
    latencyMs: t.latencyMs,
    scope: t.scope,
  };
  try {
    await appendEpisodic({
      timestamp: new Date().toISOString(),
      sessionId: t.sessionId,
      eventType: "triage",
      payload: payload as unknown as Record<string, unknown>,
      source: "direct",
    });
  } catch (err) {
    console.warn(
      `[sylvia-hybrid] episodic emit failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

/** Test-only · expose constants for smoke harness. */
export function _getDefaults() {
  return {
    DEFAULT_MODE,
    DEFAULT_VECTOR_SCORE_THRESHOLD,
    DEFAULT_LIMIT,
  };
}
