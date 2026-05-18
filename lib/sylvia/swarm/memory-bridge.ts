// lib/sylvia/swarm/memory-bridge.ts
//
// CMD-RUFLO-CONCEPT-EXTRACT V20 v2.1 R29 P-WAVE-20-PHASE-2 · 2026-05-18
//
// Memory bridge contract · INTERFACE-ONLY v1 · Phase 4 implements.
// Bridges swarm agents to Sylvia 7-memory framework (§7 Episodic + §8 Semantic
// via existing surfaces · HNSW substrate Phase 3 lands first).
//
// v1 = type contract + stubs that delegate to existing memory layer.
// Phase 4 (Hybrid memory integration) wires HNSW + scope semantics.

import type { SwarmAgentSpec, SwarmEpisodicPayload } from "./types";

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

// v1 stub · Phase 4 replaces with HNSW-backed implementation
export const STUB_MEMORY_BRIDGE: SwarmMemoryBridge = {
  async query(): Promise<SwarmMemoryEntry[]> {
    // Phase 4 wires §7 Episodic + §8 Semantic + Phase-3 HNSW
    return [];
  },
  async record(): Promise<void> {
    // No-op · classifySwarm() already emits via appendEpisodic
    return;
  },
};
