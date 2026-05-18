// lib/sylvia/swarm-activate/activator.ts
//
// CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 v2.1 R29 P-WAVE-20-PHASE-7 · 2026-05-18
//
// Public activation API · feature-flag gated · zero behavior delta when OFF.
// Consumes Phase 2 swarm primitive + Phase 6 graphify communities.
// BINDING #10: zero new HTTP · BINDING #31 sentinel: payload.swarm_activate="v1".

import { randomUUID } from "node:crypto";
import { classifySwarm } from "../swarm";
import { appendEpisodic } from "../memory";
import { assignRolesFromCommunities } from "./role-assignment";
import type {
  ActivationConfig,
  SwarmActivation,
  SwarmActivateEpisodicPayload,
  SwarmActivateOperation,
} from "./types";
import type { SwarmTask, SwarmDecision, SwarmTopology } from "../swarm";

const DEFAULT_TOPOLOGY: SwarmTopology = "hierarchical-mesh";
const DEFAULT_MAX_AGENTS = 15;

export function isSwarmActivateEnabled(): boolean {
  return process.env.SYLVIA_SWARM_ACTIVATE_ENABLED === "1";
}

async function safeEmit(
  payload: SwarmActivateEpisodicPayload,
  sessionId?: string,
): Promise<void> {
  if (!sessionId) return;
  try {
    await appendEpisodic({
      timestamp: new Date().toISOString(),
      sessionId,
      eventType: "triage",
      payload: payload as unknown as Record<string, unknown>,
      source: "direct",
    });
  } catch (err) {
    console.warn(
      `[sylvia-swarm-activate] episodic emit failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

/**
 * Activate Sylvia swarm · returns SwarmActivation when flag ON · null when OFF.
 * Consumes Phase 6 graphify communities (if available + graphifyInformed=true)
 * for role assignment · falls back to CANONICAL_SWARM_ROSTER defensively.
 */
export async function activateSwarm(
  config: ActivationConfig = {},
): Promise<SwarmActivation | null> {
  if (!isSwarmActivateEnabled()) return null;

  const t0 = Date.now();
  const topology = config.topology ?? DEFAULT_TOPOLOGY;
  const maxAgents = config.maxAgents ?? DEFAULT_MAX_AGENTS;
  const graphifyInformed = config.graphifyInformed ?? true;

  const assignment = await assignRolesFromCommunities(graphifyInformed);
  const roster = assignment.roster.slice(0, maxAgents);

  const swarmId = `swarm-${randomUUID()}`;
  const activation: SwarmActivation = {
    swarmId,
    topology,
    roster,
    graphifyCommunities: assignment.communities,
    activatedAt: new Date().toISOString(),
    sessionId: config.sessionId,
  };

  await safeEmit(
    {
      swarm_activate: "v1",
      operation: "activate",
      topology,
      agentCount: roster.length,
      graphifyInformed: assignment.graphifyConsumed,
      latencyMs: Date.now() - t0,
    },
    config.sessionId,
  );

  return activation;
}

/**
 * Deactivate · stateless v1 (no swarm registry to teardown).
 * Phase 7.1 banked stateful registry will populate teardown logic.
 */
export async function deactivateSwarm(
  swarmId: string,
  sessionId?: string,
): Promise<void> {
  if (!isSwarmActivateEnabled()) return;
  const t0 = Date.now();
  await safeEmit(
    {
      swarm_activate: "v1",
      operation: "deactivate" as SwarmActivateOperation,
      topology: DEFAULT_TOPOLOGY,
      agentCount: 0,
      graphifyInformed: false,
      latencyMs: Date.now() - t0,
    },
    sessionId,
  );
  // swarmId logged via sessionId-keyed entry · stateless v1
  void swarmId;
}

/**
 * Dispatch a SwarmTask to an active swarm · delegates to Phase 2 classifySwarm.
 * BINDING #16 clone-not-modify: adds activation context · Phase 2 signature preserved.
 */
export async function dispatchToSwarm(
  task: SwarmTask,
  swarmId: string,
  sessionId?: string,
): Promise<SwarmDecision> {
  if (!isSwarmActivateEnabled()) {
    return classifySwarm(task); // flag-OFF: bypass to Phase 2 direct call
  }
  const t0 = Date.now();
  const decision = await classifySwarm(task);
  await safeEmit(
    {
      swarm_activate: "v1",
      operation: "dispatch",
      topology: decision.topology,
      agentCount: decision.workers.length,
      graphifyInformed: false,
      latencyMs: Date.now() - t0,
    },
    sessionId,
  );
  void swarmId;
  return decision;
}
