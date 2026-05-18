// lib/sylvia/swarm/coordinator.ts
//
// CMD-RUFLO-CONCEPT-EXTRACT V20 v2.1 R29 P-WAVE-20-PHASE-2 · 2026-05-18
//
// Swarm coordinator · classification-only v1 (NO execution).
// classify task → map to topology + role roster → set forceAlias hints
// per worker → telemetry capture → return SwarmDecision.
//
// BINDING #10 single egress preserved (NO HTTP) ·
// BINDING #16 clone-not-modify (concept from Ruflo · code custom).
//
// Feature-flag SYLVIA_SWARM_ENABLED default OFF · zero production behavior.

import type {
  SwarmTask,
  SwarmDecision,
  SwarmAgentSpec,
  SwarmEpisodicPayload,
  SwarmTopology,
  SwarmTaskDomain,
} from "./types";
import {
  CANONICAL_SWARM_ROSTER,
  getTopologyPolicy,
  SWARM_MAX_AGENTS,
} from "./topology";
import { appendEpisodic } from "../memory";
import { preClassifyPatternHint } from "../dispatcher/classify";

function isSwarmEnabled(): boolean {
  return process.env.SYLVIA_SWARM_ENABLED === "1";
}

// Domain-aware role selection (rule-based v1 · Phase 7 activation flips for runtime)
const DOMAIN_ROLE_HINTS: Record<SwarmTaskDomain, string[]> = {
  code: ["architect", "coder", "reviewer", "tester"],
  search: ["researcher", "data-analyst"],
  reasoning: ["auditor", "data-analyst", "architect"],
  vision: ["ui-designer", "scribe"],
  creative: ["ui-designer", "scribe"],
  intel: ["researcher", "data-analyst"],
  marketplace: ["negotiator", "external-marketplace-agent"],
  general: ["scribe", "ops-engineer"],
};

function pickWorkersForTask(task: SwarmTask): SwarmAgentSpec[] {
  if (task.requestedRoles && task.requestedRoles.length > 0) {
    return CANONICAL_SWARM_ROSTER.filter((s) =>
      task.requestedRoles?.includes(s.role),
    );
  }
  const hintRoles = DOMAIN_ROLE_HINTS[task.domain] ?? DOMAIN_ROLE_HINTS.general;
  return CANONICAL_SWARM_ROSTER.filter((s) => hintRoles.includes(s.role));
}

export async function classifySwarm(task: SwarmTask): Promise<SwarmDecision> {
  const topology: SwarmTopology = task.forceTopology ?? "hierarchical-mesh";
  const policy = getTopologyPolicy(topology);
  const workers = pickWorkersForTask(task);

  // Pattern hint enrichment · P74 consumer · fail-soft
  let patternClassifier: "topology-rule" | "domain-hint" | "force-topology" =
    "topology-rule";
  if (task.forceTopology) patternClassifier = "force-topology";
  else if (task.requestedRoles) patternClassifier = "force-topology";
  else {
    try {
      const hint = await preClassifyPatternHint({
        promptHash: simpleHash(task.prompt),
        prompt: task.prompt,
        sessionId: task.sessionId ?? "default",
      });
      if (hint.confidence >= 60) patternClassifier = "domain-hint";
    } catch {
      /* fail-soft */
    }
  }

  const estimatedCostUsd = workers.length * 0.005; // placeholder · Phase 4 refines via tier cost-table

  const decision: SwarmDecision = {
    topology,
    queen: "queen",
    workers,
    rationale: `swarm classify: topology=${topology} domain=${task.domain} workers=${workers.length} classifier=${patternClassifier}`,
    estimatedCostUsd,
    policySnapshot: policy,
  };

  // Telemetry · BINDING #31 push-back replacement
  // (eventType="triage" + payload.swarm sentinel · NO schema migration)
  if (task.sessionId && isSwarmEnabled()) {
    const payload: SwarmEpisodicPayload = {
      swarm: "v1",
      topology,
      queen: "queen",
      workers: workers.map((w) => w.role),
      domain: task.domain,
      classifier: patternClassifier,
      taskId: task.taskId,
    };
    await safeEpisodicEmit({
      timestamp: new Date().toISOString(),
      sessionId: task.sessionId,
      eventType: "triage",
      payload: payload as unknown as Record<string, unknown>,
      source: "direct",
    });
  }

  return decision;
}

export function getCanonicalRoster(): SwarmAgentSpec[] {
  return CANONICAL_SWARM_ROSTER;
}

export function getSwarmMaxAgents(): number {
  return SWARM_MAX_AGENTS;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8);
}

async function safeEpisodicEmit(
  entry: Parameters<typeof appendEpisodic>[0],
): Promise<void> {
  try {
    await appendEpisodic(entry);
  } catch (err) {
    console.warn(
      `[sylvia-swarm] episodic emit failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}
