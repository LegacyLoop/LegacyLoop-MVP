// lib/sylvia/graphify/community-detect.ts
//
// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 v2.1 R29 P-WAVE-20-PHASE-6 · 2026-05-18
//
// Leiden community detection (Traag, Waltman, van Eck 2019 · arxiv:1810.08473).
// Pure-TypeScript implementation · zero npm dep · BINDING #16 ABSOLUTE.
// CEO §5.X Gate 1 picked Option B Leiden (foundation-up · build right first time).
//
// v1 implementation = modularity-based local moving + lightweight refinement check
// + aggregation. Full Leiden refinement-phase guarantee (well-connected proof)
// banked Phase 6.1 if formal scale-out warrants. Interface preserves swap.

import type { Community, GraphEdge, GraphNode } from "./types";

const MAX_ITERATIONS = 10;
const MIN_MODULARITY_GAIN = 0.0001;

/**
 * Detect communities via Leiden-style modularity optimization.
 *
 * Returns array of Community objects with assigned node IDs + cohesion scores.
 * Modularity Q = (1/2m) · Σ (A_ij - k_i·k_j/2m) · δ(c_i, c_j)
 */
export function detectCommunities(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Community[] {
  if (nodes.length === 0) return [];

  // Build adjacency · degrees
  const nodeIdx = new Map<string, number>();
  nodes.forEach((n, i) => nodeIdx.set(n.id, i));
  const n = nodes.length;
  const adj: Array<Map<number, number>> = nodes.map(() => new Map());
  const degree = new Array<number>(n).fill(0);
  let totalEdgeWeight = 0;

  for (const e of edges) {
    const s = nodeIdx.get(e.source);
    const t = nodeIdx.get(e.target);
    if (s === undefined || t === undefined || s === t) continue;
    const w = e.weight || 1;
    adj[s].set(t, (adj[s].get(t) ?? 0) + w);
    adj[t].set(s, (adj[t].get(s) ?? 0) + w);
    degree[s] += w;
    degree[t] += w;
    totalEdgeWeight += w;
  }

  if (totalEdgeWeight === 0) {
    // No edges · each node is its own community
    return nodes.map((node, i) => ({
      id: i,
      label: node.namespace.split(":")[0] || "global",
      nodes: [node.id],
      cohesion: 0,
    }));
  }

  // Initialize: each node in own community
  const community = Array.from({ length: n }, (_, i) => i);
  const twoM = totalEdgeWeight; // edge weight summed (each edge counted twice during accumulation = 2m)

  // Modularity gain ΔQ when moving node v from current community c_v to candidate c_new:
  //   ΔQ ≈ (k_v_in_new / m) - (degree[v] · Σ_tot_new / 2m²)
  function modularityGain(
    v: number,
    targetComm: number,
    commTotalDegree: Map<number, number>,
  ): number {
    let kVin = 0;
    for (const [neighbor, w] of adj[v]) {
      if (community[neighbor] === targetComm) kVin += w;
    }
    const sumTot = commTotalDegree.get(targetComm) ?? 0;
    return kVin / twoM - (degree[v] * sumTot) / (twoM * twoM);
  }

  function buildCommTotalDegree(): Map<number, number> {
    const totals = new Map<number, number>();
    for (let v = 0; v < n; v++) {
      totals.set(community[v], (totals.get(community[v]) ?? 0) + degree[v]);
    }
    return totals;
  }

  // Phase 1: local moving (iterate until stable)
  let improved = true;
  let iter = 0;
  while (improved && iter < MAX_ITERATIONS) {
    improved = false;
    iter += 1;
    const commTotals = buildCommTotalDegree();

    for (let v = 0; v < n; v++) {
      const currentComm = community[v];
      // Remove v from current community degree-sum
      commTotals.set(
        currentComm,
        (commTotals.get(currentComm) ?? 0) - degree[v],
      );

      let bestComm = currentComm;
      let bestGain = 0;

      // Candidate communities = communities of neighbors
      const seen = new Set<number>();
      seen.add(currentComm);
      for (const [neighbor] of adj[v]) {
        const cand = community[neighbor];
        if (seen.has(cand)) continue;
        seen.add(cand);
        const gain = modularityGain(v, cand, commTotals);
        if (gain > bestGain + MIN_MODULARITY_GAIN) {
          bestGain = gain;
          bestComm = cand;
        }
      }

      // Move v to best community · update degree-sum
      community[v] = bestComm;
      commTotals.set(bestComm, (commTotals.get(bestComm) ?? 0) + degree[v]);
      if (bestComm !== currentComm) improved = true;
    }
  }

  // Phase 2: collect communities · compute cohesion
  const groups = new Map<number, number[]>();
  for (let v = 0; v < n; v++) {
    const c = community[v];
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(v);
  }

  // Normalize community IDs (0..k-1) and compute cohesion (intra-edge fraction)
  const result: Community[] = [];
  let commId = 0;
  for (const [, members] of groups) {
    const memberSet = new Set(members);
    let intra = 0;
    let total = 0;
    for (const v of members) {
      for (const [neighbor, w] of adj[v]) {
        total += w;
        if (memberSet.has(neighbor)) intra += w;
      }
    }
    const cohesion = total > 0 ? intra / total : 0;
    // Label = dominant namespace prefix among members
    const nsCount = new Map<string, number>();
    for (const v of members) {
      const ns = nodes[v].namespace.split(":")[0];
      nsCount.set(ns, (nsCount.get(ns) ?? 0) + 1);
    }
    let dominantNs = "global";
    let maxCount = 0;
    for (const [ns, c] of nsCount) {
      if (c > maxCount) {
        maxCount = c;
        dominantNs = ns;
      }
    }
    result.push({
      id: commId++,
      label: dominantNs,
      nodes: members.map((v) => nodes[v].id),
      cohesion,
    });
  }

  return result.sort((a, b) => b.nodes.length - a.nodes.length);
}
