// lib/sylvia/swarm/types.ts
//
// CMD-RUFLO-CONCEPT-EXTRACT V20 v2.1 R29 P-WAVE-20-PHASE-2 · 2026-05-18
//
// Type contract for 15-agent hierarchical-mesh swarm orchestration.
// GREENFIELD · BINDING #16 ABSOLUTE: zero @claude-flow/* import.
// Concept ported from ~/ruflo-workspace/.claude-flow/config.yaml +
// CAPABILITIES.md + legacyloop-presets.json (clone-not-modify source).

export type SwarmTopology = "hierarchical" | "mesh" | "hierarchical-mesh";

export type SwarmAgentRole =
  | "queen"           // top-level coordinator · 1 per swarm
  | "architect"       // design + spec authoring
  | "researcher"      // search + intel gathering
  | "coder"           // implementation
  | "reviewer"        // code review + quality gate
  | "tester"          // verification + smoke
  | "perf-engineer"   // performance optimization
  | "security-architect" // security review
  | "auditor"         // compliance + audit trail
  | "data-analyst"    // data + telemetry analysis
  | "ui-designer"     // UI/UX surface
  | "scribe"          // documentation
  | "ops-engineer"    // daemons + infra
  // ─── MPMA Phase D extensibility hooks (§AMENDMENT-1 · MC Mon AM 2026-05-18) ───
  // 5 reserved slots for cross-platform marketplace agents.
  // BINDING #16: 15-agent topology = max ACTIVE agents in single swarm.
  // Enum CAN exceed 15 · pickWorkersForTask() selects ≤15 at runtime.
  // Phase D MPMA cyls activate these without enum migration.
  | "negotiator"                  // MPMA Layer 4 Unified Inbox · cross-platform messaging routing
  | "external-marketplace-agent"  // MPMA Layer 6 Inbound API · third-party marketplace plugged INTO Legacy-Loop
  | "platform-adapter"            // MPMA Layer 3 publishing adapter (per-platform: eBay/FB/Etsy/Mercari/etc.)
  | "listing-optimizer"           // MPMA Layer 3 per-platform format optimization (titles/specs/photos)
  | "pricing-analyst";            // MPMA cross-platform pricing intelligence (CCL × MPMA integration)

export type SwarmTaskDomain =
  | "code"
  | "search"
  | "reasoning"
  | "vision"
  | "creative"
  | "intel"
  | "marketplace"     // Phase D MPMA anticipation
  | "general";

export interface SwarmTask {
  taskId: string;
  prompt: string;
  context?: string;
  sessionId?: string;
  domain: SwarmTaskDomain;
  requestedRoles?: SwarmAgentRole[];
  forceTopology?: SwarmTopology;
  stakes: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
}

export interface SwarmAgentSpec {
  role: SwarmAgentRole;
  domain: SwarmTaskDomain;
  preferredTier?: "T1" | "T2" | "T3"; // bridge to P76 cost-tier router
  costCeilingPerCallUsd?: number;
}

export interface SwarmPolicy {
  topology: SwarmTopology;
  maxAgents: number;            // 15 per Ruflo config.yaml
  autoScale: boolean;           // true per Ruflo config
  coordinationStrategy: "consensus" | "directive" | "delegate";
  memoryBackend: "hybrid";      // matches Ruflo · bridges Sylvia §7 + §8
  hnswEnabled: boolean;         // Phase 3 RuVector substrate dep
  description: string;
}

export interface SwarmDecision {
  topology: SwarmTopology;
  queen: SwarmAgentRole; // always "queen" v1
  workers: SwarmAgentSpec[];
  rationale: string;
  estimatedCostUsd: number;
  policySnapshot: SwarmPolicy;
}

export type SwarmClassifier =
  | "topology-rule"
  | "domain-hint"
  | "force-topology"
  | "force-roles"
  | "fallback";

export interface SwarmEpisodicPayload {
  swarm: "v1";  // sentinel · BINDING #31 push-back replacement (vs schema-touch swarm eventType)
  topology: SwarmTopology;
  queen: SwarmAgentRole;
  workers: SwarmAgentRole[];
  domain: SwarmTaskDomain;
  classifier: SwarmClassifier;
  taskId: string;
}
