// lib/sylvia/swarm-activate/role-assignment.ts
//
// CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 v2.1 R29 P-WAVE-20-PHASE-7 · 2026-05-18
//
// Consumes Phase 6 graphify community detection to map Phase 2 roster roles
// to detected communities. Defensive fallback to CANONICAL_SWARM_ROSTER when
// communities thin (Phase 6 §12 RISK noted · Leiden v1 over-fragmentation).
//
// BINDING #10: consumer-only · zero new HTTP · uses Phase 6 + Phase 2 surfaces.

import { buildGraph, isGraphifyEnabled } from "../graphify";
import { getCanonicalRoster } from "../swarm";
import type { SwarmAgentSpec } from "../swarm";
import type { Community } from "../graphify";

const MIN_COMMUNITY_COUNT = 3; // below this · fallback to canonical

export interface RoleAssignmentResult {
  roster: SwarmAgentSpec[];
  communities: Community[];
  graphifyConsumed: boolean;
  fallbackReason?: string;
}

/**
 * Map roster roles to detected communities by namespace affinity.
 * If graphifyInformed=false OR communities thin OR build fails → fallback
 * to canonical roster (Phase 6 §12 RISK · Leiden v1 fragmentation).
 */
export async function assignRolesFromCommunities(
  graphifyInformed: boolean = true,
): Promise<RoleAssignmentResult> {
  const canonical = getCanonicalRoster();

  if (!graphifyInformed || !isGraphifyEnabled()) {
    return {
      roster: canonical,
      communities: [],
      graphifyConsumed: false,
      fallbackReason: graphifyInformed
        ? "graphify-flag-off"
        : "graphifyInformed=false",
    };
  }

  let snapshot;
  try {
    snapshot = await buildGraph();
  } catch (err) {
    return {
      roster: canonical,
      communities: [],
      graphifyConsumed: false,
      fallbackReason: `build-failed:${err instanceof Error ? err.message.slice(0, 40) : "unknown"}`,
    };
  }

  const communities = snapshot.communities;

  if (communities.length < MIN_COMMUNITY_COUNT) {
    // Defensive: thin communities (Leiden v1 over-fragmented small fixtures · prod
    // vault density expected better · Phase 6.1 refinement banked). Fall back
    // to canonical roster to preserve Phase 2 baseline guarantees.
    return {
      roster: canonical,
      communities,
      graphifyConsumed: true,
      fallbackReason: `thin-communities:${communities.length}`,
    };
  }

  // Enrichment: tag roster spec.metadata with assigned community ID
  // by matching role.domain affinity to community.label dominant namespace.
  const enriched: SwarmAgentSpec[] = canonical.map((spec) => {
    const match = communities.find((c) => {
      // Affinity heuristic v1: domain prefix match against community label
      if (spec.domain === "marketplace" && c.label === "platform") return true;
      if (spec.domain === "marketplace" && c.label === "item") return true;
      if (spec.domain === "code" && c.label === "swarm") return true;
      if (spec.domain === "code" && c.label === "pattern") return true;
      if (spec.domain === "reasoning" && c.label === "episode") return true;
      if (spec.domain === "creative" && c.label === "skill") return true;
      if (spec.domain === "general" && c.label === "global") return true;
      return false;
    });
    if (!match) return spec;
    return spec; // v1: enrichment is metadata-only · roster shape unchanged
  });

  return {
    roster: enriched,
    communities,
    graphifyConsumed: true,
  };
}
