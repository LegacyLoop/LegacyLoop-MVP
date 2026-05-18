// lib/sylvia/swarm-activate/types.ts
//
// CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 v2.1 R29 P-WAVE-20-PHASE-7 · 2026-05-18
// ★ M19 AUTONOMOUS SWARM ACTIVATION moat + FOUNDATION primitives Phase D/E ★
//
// Type contract for swarm activation layer.
// GREENFIELD · BINDING #16 ABSOLUTE: zero @claude-flow/* import.
// CEO §5.X Gate 1 picked Option A hierarchical-mesh (matches Phase 2 baseline).
//
// §0.7 DESIGN-ANTICIPATION (#45 LAW-emerging · 1/5→2/5 ratchet):
// 3 NEW consumer hooks pre-position Phase D CCL + MPMA + Phase E paths.
// Combined with Phase 6 graphify 4 hooks = 7 total Phase C/D/E hooks pre-positioned.

import type {
  SwarmAgentSpec,
  SwarmTopology,
  SwarmTask,
  SwarmDecision,
} from "../swarm";
import type { Community } from "../graphify";

export interface ActivationConfig {
  topology?: SwarmTopology;          // default hierarchical-mesh
  maxAgents?: number;                // default 15 (SWARM_MAX_AGENTS)
  graphifyInformed?: boolean;        // default true · consume Phase 6 communities
  sessionId?: string;
}

export interface SwarmActivation {
  swarmId: string;
  topology: SwarmTopology;
  roster: SwarmAgentSpec[];
  graphifyCommunities?: Community[]; // populated when graphifyInformed=true + Phase 6 has data
  activatedAt: string;
  sessionId?: string;
}

export type SwarmActivateOperation = "activate" | "deactivate" | "dispatch";

export interface SwarmActivateEpisodicPayload {
  swarm_activate: "v1";              // sentinel · matches Phase 2-6 + CYL #1 precedents
  operation: SwarmActivateOperation;
  topology: SwarmTopology;
  agentCount: number;
  graphifyInformed: boolean;
  latencyMs: number;
}

// ─── §0.7 FOUNDATION-UP CONSUMER HOOK CONFIGS (#45 LAW-emerging anchor) ───

export interface PerCustomerActivationConfig {
  customerId: string;
  scope: "behavior" | "items-listed" | "items-sold" | "preferences";
  maxAgents?: number;                // default 5 per customer (Queen + 4 specialists)
}

export interface PerPlatformActivationConfig {
  platformName: string;              // "ebay" | "fb-marketplace" | "etsy" | etc.
  scope: "listing" | "watcher" | "sale" | "negotiation";
  pricingAnalyst?: boolean;          // include pricing-analyst MPMA role
  listingOptimizer?: boolean;        // include listing-optimizer MPMA role
}

export interface PerConsumerActivationConfig {
  consumerId: string;                // API client identifier
  authToken: string;                 // bearer token verified upstream
  rateLimitPerHour?: number;         // default 100 swarm tasks/hr per consumer
}

// Re-export Phase 2 swarm types for downstream consumers
export type { SwarmAgentSpec, SwarmTopology, SwarmTask, SwarmDecision };
