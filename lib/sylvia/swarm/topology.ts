// lib/sylvia/swarm/topology.ts
//
// CMD-RUFLO-CONCEPT-EXTRACT V20 v2.1 R29 P-WAVE-20-PHASE-2 · 2026-05-18
//
// 15-agent hierarchical-mesh topology · cloned concept from
// ~/ruflo-workspace/.claude-flow/config.yaml (BINDING #16 clone-not-modify).
//
// 1 Queen + 14 specialist workers · mesh-connect for peer-to-peer
// SendMessage coordination · hierarchical for delegation flow.

import type { SwarmAgentSpec, SwarmPolicy, SwarmTopology } from "./types";

export const SWARM_MAX_AGENTS = 15;

export const HIERARCHICAL_MESH_POLICY: SwarmPolicy = {
  topology: "hierarchical-mesh",
  maxAgents: SWARM_MAX_AGENTS,
  autoScale: true,
  coordinationStrategy: "consensus",
  memoryBackend: "hybrid",
  hnswEnabled: false, // Phase 3 RuVector substrate flips this true
  description: "15-agent hierarchical-mesh · Queen-led consensus · custom-port from Ruflo · BINDING #16",
};

// CANONICAL_SWARM_ROSTER = 15 ACTIVE agents (Queen + 14 specialist workers)
// matches Ruflo's 15-agent max topology · MPMA-reserved roles bench-banked
// (defined in enum but not in default active roster · Phase D activates
//  via task.requestedRoles override at pickWorkersForTask() time).
export const CANONICAL_SWARM_ROSTER: SwarmAgentSpec[] = [
  { role: "queen", domain: "general", preferredTier: "T3" },
  { role: "architect", domain: "code", preferredTier: "T3" },
  { role: "researcher", domain: "search", preferredTier: "T2" },
  { role: "coder", domain: "code", preferredTier: "T2" },
  { role: "reviewer", domain: "code", preferredTier: "T3" },
  { role: "tester", domain: "code", preferredTier: "T2" },
  { role: "perf-engineer", domain: "code", preferredTier: "T2" },
  { role: "security-architect", domain: "code", preferredTier: "T3" },
  { role: "auditor", domain: "reasoning", preferredTier: "T3" },
  { role: "data-analyst", domain: "reasoning", preferredTier: "T2" },
  { role: "ui-designer", domain: "creative", preferredTier: "T2" },
  { role: "scribe", domain: "general", preferredTier: "T1" },
  { role: "ops-engineer", domain: "code", preferredTier: "T2" },
  { role: "negotiator", domain: "marketplace", preferredTier: "T2" },
  { role: "external-marketplace-agent", domain: "marketplace", preferredTier: "T2" },
];

// MPMA_RESERVED_ROSTER = bench-banked agents for Phase D activation.
// Not in CANONICAL_SWARM_ROSTER (would exceed 15-agent topology limit).
// pickWorkersForTask() includes via task.requestedRoles or
// DOMAIN_ROLE_HINTS["marketplace"] expansion at Phase D fire time.
export const MPMA_RESERVED_ROSTER: SwarmAgentSpec[] = [
  { role: "platform-adapter", domain: "marketplace", preferredTier: "T2" },
  { role: "listing-optimizer", domain: "marketplace", preferredTier: "T2" },
  { role: "pricing-analyst", domain: "marketplace", preferredTier: "T2" },
];

export function getTopologyPolicy(topology: SwarmTopology): SwarmPolicy {
  if (topology === "hierarchical-mesh") return HIERARCHICAL_MESH_POLICY;
  // Phase 2 ships hierarchical-mesh only · others banked Phase 7+
  return HIERARCHICAL_MESH_POLICY;
}
