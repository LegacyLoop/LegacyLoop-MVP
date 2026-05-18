// lib/sylvia/graphify/god-nodes.ts
//
// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 v2.1 R29 P-WAVE-20-PHASE-6 · 2026-05-18
//
// PageRank-style centrality + top-N god-node selection + surprising-connection
// detector (cross-community high-weight edges).

import type { Community, GraphEdge, GraphNode } from "./types";

const DAMPING_FACTOR = 0.85;
const MAX_ITER = 30;
const CONVERGENCE_THRESHOLD = 0.0001;

/**
 * Compute PageRank-style centrality scores.
 * Returns map of nodeId → score [0.0 - 1.0+] (normalized to sum to 1 + epsilon).
 */
export function computeCentrality(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, number> {
  const scores = new Map<string, number>();
  if (nodes.length === 0) return scores;

  const initial = 1 / nodes.length;
  for (const n of nodes) scores.set(n.id, initial);

  const outDegree = new Map<string, number>();
  const incoming = new Map<string, Array<{ source: string; weight: number }>>();

  for (const e of edges) {
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + (e.weight || 1));
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push({ source: e.source, weight: e.weight || 1 });
  }

  const baseline = (1 - DAMPING_FACTOR) / nodes.length;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const next = new Map<string, number>();
    let totalDiff = 0;
    for (const n of nodes) {
      const inbound = incoming.get(n.id) ?? [];
      let contribution = 0;
      for (const link of inbound) {
        const srcOut = outDegree.get(link.source) ?? 1;
        const srcScore = scores.get(link.source) ?? 0;
        contribution += (srcScore * link.weight) / srcOut;
      }
      const newScore = baseline + DAMPING_FACTOR * contribution;
      next.set(n.id, newScore);
      totalDiff += Math.abs(newScore - (scores.get(n.id) ?? 0));
    }
    for (const [id, s] of next) scores.set(id, s);
    if (totalDiff < CONVERGENCE_THRESHOLD) break;
  }

  return scores;
}

/**
 * Return top-N nodes by centrality score · god-nodes.
 */
export function pickGodNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  n: number = 10,
): GraphNode[] {
  const scores = computeCentrality(nodes, edges);
  const ranked = nodes
    .map((node) => ({ node, score: scores.get(node.id) ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
  return ranked.map((r) => ({
    ...r.node,
    weight: r.score, // overwrite weight with centrality score
  }));
}

/**
 * Detect surprising connections · cross-community high-weight edges.
 * Returns edges where source.community !== target.community AND
 * combined endpoint centrality is high.
 */
export function detectSurprisingConnections(
  nodes: GraphNode[],
  edges: GraphEdge[],
  communities: Community[],
  limit: number = 10,
): GraphEdge[] {
  const nodeToComm = new Map<string, number>();
  for (const c of communities) {
    for (const nodeId of c.nodes) {
      nodeToComm.set(nodeId, c.id);
    }
  }
  const centrality = computeCentrality(nodes, edges);
  const cross: Array<{ edge: GraphEdge; rank: number }> = [];
  for (const e of edges) {
    const sc = nodeToComm.get(e.source);
    const tc = nodeToComm.get(e.target);
    if (sc === undefined || tc === undefined || sc === tc) continue;
    const sScore = centrality.get(e.source) ?? 0;
    const tScore = centrality.get(e.target) ?? 0;
    const rank = (e.weight || 1) * (sScore + tScore);
    cross.push({ edge: e, rank });
  }
  cross.sort((a, b) => b.rank - a.rank);
  return cross.slice(0, limit).map((c) => c.edge);
}
