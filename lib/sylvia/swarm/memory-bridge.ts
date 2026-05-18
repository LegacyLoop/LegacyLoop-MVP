// lib/sylvia/swarm/memory-bridge.ts
//
// CMD-RUFLO-CONCEPT-EXTRACT V20 v2.1 R29 P-WAVE-20-PHASE-2 · 2026-05-18
// CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20 R29 P-WAVE-20-PHASE-4 · 2026-05-18 (STUB swap)
//
// Memory bridge contract · v1 INTERFACE-ONLY (Phase 2) · v2 HYBRID-BACKED (Phase 4).
// Bridges swarm agents to Sylvia 7-memory framework via Phase 4 hybrid bridge
// (vector-first w/ keyword fallback · Phase 3 HNSW + P73 PATH A semantic).
//
// BINDING #16 additive: signature preserved · STUB body swapped to real hybrid
// call · Phase 2 swarm coordinator consumers transparently upgraded.

import type { SwarmAgentSpec, SwarmEpisodicPayload } from "./types";
import { hybridRecall } from "../hybrid";
import type { HybridScope, HybridResult } from "../hybrid";

export interface SwarmMemoryQuery {
  agent: SwarmAgentSpec;
  prompt: string;
  scope: "agent" | "swarm" | "project" | "global";
  limit?: number;
}

export interface SwarmMemoryEntry {
  source: "episodic" | "semantic" | "hnsw";
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface SwarmMemoryBridge {
  query(req: SwarmMemoryQuery): Promise<SwarmMemoryEntry[]>;
  record(payload: SwarmEpisodicPayload, sessionId: string): Promise<void>;
}

function swarmScopeToHybrid(scope: SwarmMemoryQuery["scope"]): HybridScope {
  switch (scope) {
    case "agent":
      return "swarm:agent";
    case "swarm":
      return "swarm:active";
    case "project":
      return "global";
    case "global":
      return "global";
  }
}

function mapSource(source: HybridResult["source"]): SwarmMemoryEntry["source"] {
  if (source === "vector" || source === "vector-fallback") return "hnsw";
  if (source === "hybrid-merged") return "hnsw"; // primary path is vector-side
  return "semantic"; // keyword · keyword-fallback · legacy
}

// Phase 4 swap · STUB body replaced with real hybrid bridge call.
// Signature preserved · feature-flag gating happens inside hybridRecall.
export const STUB_MEMORY_BRIDGE: SwarmMemoryBridge = {
  async query(req: SwarmMemoryQuery): Promise<SwarmMemoryEntry[]> {
    const results = await hybridRecall({
      query: req.prompt,
      scope: swarmScopeToHybrid(req.scope),
      limit: req.limit ?? 5,
    });
    return results.map((r) => ({
      source: mapSource(r.source),
      content: r.content,
      score: r.score,
      metadata: r.metadata,
    }));
  },
  async record(): Promise<void> {
    // No-op · classifySwarm() already emits via appendEpisodic
    return;
  },
};
