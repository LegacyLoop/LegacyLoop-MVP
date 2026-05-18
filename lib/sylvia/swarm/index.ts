// lib/sylvia/swarm/index.ts
//
// CMD-RUFLO-CONCEPT-EXTRACT V20 v2.1 R29 P-WAVE-20-PHASE-2 · 2026-05-18
//
// Public API barrel for Sylvia swarm orchestration · Wave 20 Phase 2.
// Substrate-only v1 · feature-flag SYLVIA_SWARM_ENABLED default OFF.
// Phase 3 RuVector HNSW · Phase 4 hybrid memory integration ·
// Phase 7 15-agent activation.

export {
  classifySwarm,
  getCanonicalRoster,
  getSwarmMaxAgents,
} from "./coordinator";

export {
  CANONICAL_SWARM_ROSTER,
  MPMA_RESERVED_ROSTER,
  HIERARCHICAL_MESH_POLICY,
  getTopologyPolicy,
  SWARM_MAX_AGENTS,
} from "./topology";

export { STUB_MEMORY_BRIDGE } from "./memory-bridge";

export type {
  SwarmTopology,
  SwarmAgentRole,
  SwarmTaskDomain,
  SwarmTask,
  SwarmAgentSpec,
  SwarmDecision,
  SwarmPolicy,
  SwarmClassifier,
  SwarmEpisodicPayload,
} from "./types";

export type {
  SwarmMemoryQuery,
  SwarmMemoryEntry,
  SwarmMemoryBridge,
} from "./memory-bridge";
