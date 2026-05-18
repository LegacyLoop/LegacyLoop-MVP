// lib/sylvia/swarm-activate/coordinator.ts
//
// CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 v2.1 R29 P-WAVE-20-PHASE-7 · 2026-05-18
//
// Public API surface · re-exports activator + consumer hooks + role assignment.
// BINDING #10: consumer-only · zero new HTTP · BINDING #31 sentinel telemetry.

export {
  activateSwarm,
  deactivateSwarm,
  dispatchToSwarm,
  isSwarmActivateEnabled,
} from "./activator";

export { assignRolesFromCommunities } from "./role-assignment";
export type { RoleAssignmentResult } from "./role-assignment";

export {
  activatePerCustomerAgents,
  activatePerPlatformAgents,
  activatePerConsumerAgents,
} from "./consumer-hooks";

/**
 * Compact stats accessor · useful for §5.X smoke verification + monitoring.
 */
export async function getActivationStats(): Promise<{
  enabled: boolean;
  defaultTopology: "hierarchical-mesh";
  defaultMaxAgents: 15;
  consumerHooksRegistered: 3;
}> {
  return {
    enabled: process.env.SYLVIA_SWARM_ACTIVATE_ENABLED === "1",
    defaultTopology: "hierarchical-mesh",
    defaultMaxAgents: 15,
    consumerHooksRegistered: 3, // PerCustomer + PerPlatform + PerConsumer
  };
}
