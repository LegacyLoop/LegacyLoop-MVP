// lib/sylvia/graphify/emitter.ts
//
// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 v2.1 R29 P-WAVE-20-PHASE-6 · 2026-05-18
//
// GraphSnapshot serialization · JSON + markdown emission for community pages.
// Markdown emission consumed by Phase 5 obsidian vault writer (community/<id>.md).

import type { GraphSnapshot, Community, GraphNode } from "./types";

/**
 * Serialize a GraphSnapshot to canonical JSON string.
 * Float weights rounded to 6 decimals for diff-friendliness.
 */
export function snapshotToJson(snapshot: GraphSnapshot): string {
  const rounded = {
    builtAt: snapshot.builtAt,
    algorithm: snapshot.algorithm,
    nodes: snapshot.nodes.map((n) => ({
      ...n,
      weight: Number(n.weight.toFixed(6)),
    })),
    edges: snapshot.edges.map((e) => ({
      ...e,
      weight: Number(e.weight.toFixed(6)),
    })),
    communities: snapshot.communities.map((c) => ({
      ...c,
      cohesion: Number(c.cohesion.toFixed(6)),
    })),
    godNodes: snapshot.godNodes.map((n) => ({
      id: n.id,
      title: n.title,
      weight: Number(n.weight.toFixed(6)),
    })),
    surprisingConnections: snapshot.surprisingConnections.map((e) => ({
      ...e,
      weight: Number(e.weight.toFixed(6)),
    })),
  };
  return JSON.stringify(rounded, null, 2);
}

/**
 * Render a community as Obsidian-compatible markdown for vault embedding.
 * Output saved at sylvia-data/obsidian-vault/pattern/community-<id>.md by caller.
 */
export function communityToMarkdown(
  community: Community,
  nodes: GraphNode[],
): string {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const lines: string[] = [
    "---",
    `namespace: pattern:community-${community.id}`,
    `created: ${new Date().toISOString()}`,
    `updated: ${new Date().toISOString()}`,
    `provenance: sylvia-graphify:v1:community`,
    `cohesion: ${community.cohesion.toFixed(4)}`,
    `node-count: ${community.nodes.length}`,
    "---",
    "",
    `# Community ${community.id} · ${community.label}`,
    "",
    `Cohesion: **${(community.cohesion * 100).toFixed(1)}%** · ${community.nodes.length} nodes`,
    "",
    "## Members",
    "",
  ];
  for (const nodeId of community.nodes.slice(0, 30)) {
    const n = nodeMap.get(nodeId);
    if (n) {
      lines.push(`- [[${n.title}]] (${n.namespace})`);
    } else {
      lines.push(`- ${nodeId}`);
    }
  }
  if (community.nodes.length > 30) {
    lines.push(`- _...and ${community.nodes.length - 30} more_`);
  }
  return lines.join("\n") + "\n";
}

/**
 * Compact one-line summary for telemetry · structured log shape mirrors
 * Phase 2-5 precedents (router=v1 swarm=v1 vector=v1 hybrid=v1 obsidian=v1).
 */
export function summaryLogLine(snapshot: GraphSnapshot): string {
  return [
    `graphify=v1`,
    `algorithm=${snapshot.algorithm}`,
    `nodes=${snapshot.nodes.length}`,
    `edges=${snapshot.edges.length}`,
    `communities=${snapshot.communities.length}`,
    `god-nodes=${snapshot.godNodes.length}`,
    `surprising=${snapshot.surprisingConnections.length}`,
  ].join(" ");
}
