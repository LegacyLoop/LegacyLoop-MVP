// lib/sylvia/swarm-activate/index.ts
//
// CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 v2.1 R29 P-WAVE-20-PHASE-7 · 2026-05-18
// ★ M19 AUTONOMOUS SWARM ACTIVATION moat + FOUNDATION primitives Phase D/E ★
//
// Public API barrel · feature-flag SYLVIA_SWARM_ACTIVATE_ENABLED default OFF.
// CEO §5.X Gate 1 picked Option A hierarchical-mesh (matches Phase 2 baseline).

export {
  activateSwarm,
  deactivateSwarm,
  dispatchToSwarm,
  isSwarmActivateEnabled,
  assignRolesFromCommunities,
  activatePerCustomerAgents,
  activatePerPlatformAgents,
  activatePerConsumerAgents,
  getActivationStats,
} from "./coordinator";

export type { RoleAssignmentResult } from "./coordinator";

export type {
  ActivationConfig,
  SwarmActivation,
  SwarmActivateOperation,
  SwarmActivateEpisodicPayload,
  PerCustomerActivationConfig,
  PerPlatformActivationConfig,
  PerConsumerActivationConfig,
} from "./types";
