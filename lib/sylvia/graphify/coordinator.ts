// lib/sylvia/graphify/coordinator.ts
//
// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 v2.1 R29 P-WAVE-20-PHASE-6 · 2026-05-18
//
// Public API · feature-flag gated · BINDING #31 sentinel telemetry.
// Consumer-only · zero new HTTP · vault reads via Phase 5 obsidian.

import { buildGraphFromVault, countVaultNotes } from "./graph-builder";
import { detectCommunities } from "./community-detect";
import { pickGodNodes, detectSurprisingConnections } from "./god-nodes";
import { appendEpisodic } from "../memory";
import { triggerSync } from "../obsidian";
import type {
  GraphSnapshot,
  GraphNamespace,
  GraphNode,
  GraphifyEpisodicPayload,
} from "./types";

export function isGraphifyEnabled(): boolean {
  return process.env.SYLVIA_GRAPHIFY_ENABLED === "1";
}

async function safeEmit(
  payload: GraphifyEpisodicPayload,
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
      `[sylvia-graphify] episodic emit failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

export interface BuildGraphOptions {
  scope?: GraphNamespace;
  godNodeLimit?: number;
  surprisingLimit?: number;
  sessionId?: string;
  triggerVaultSync?: boolean; // call obsidian.triggerSync precondition
}

export async function buildGraph(
  options: BuildGraphOptions = {},
): Promise<GraphSnapshot> {
  const t0 = Date.now();

  if (!isGraphifyEnabled()) {
    return {
      builtAt: new Date().toISOString(),
      algorithm: "leiden",
      nodes: [],
      edges: [],
      communities: [],
      godNodes: [],
      surprisingConnections: [],
    };
  }

  // Phase 5 obsidian precondition · ensures fresh vault scan
  if (options.triggerVaultSync && options.scope) {
    await triggerSync(options.scope);
  }

  const { nodes, edges } = await buildGraphFromVault({ scope: options.scope });
  const communities = detectCommunities(nodes, edges);
  const godNodes = pickGodNodes(nodes, edges, options.godNodeLimit ?? 10);
  const surprisingConnections = detectSurprisingConnections(
    nodes,
    edges,
    communities,
    options.surprisingLimit ?? 10,
  );

  // Refresh weights on input nodes from god-nodes centrality
  const centralityMap = new Map(godNodes.map((g) => [g.id, g.weight]));
  const enrichedNodes: GraphNode[] = nodes.map((n) => ({
    ...n,
    weight: centralityMap.get(n.id) ?? n.weight,
  }));

  const snapshot: GraphSnapshot = {
    builtAt: new Date().toISOString(),
    algorithm: "leiden",
    nodes: enrichedNodes,
    edges,
    communities,
    godNodes,
    surprisingConnections,
  };

  await safeEmit(
    {
      graphify: "v1",
      operation: "build",
      nodeCount: snapshot.nodes.length,
      edgeCount: snapshot.edges.length,
      communityCount: snapshot.communities.length,
      latencyMs: Date.now() - t0,
    },
    options.sessionId,
  );

  return snapshot;
}

export async function queryGraph(
  query: string,
  namespace?: GraphNamespace,
  options: { sessionId?: string; limit?: number } = {},
): Promise<GraphNode[]> {
  if (!isGraphifyEnabled()) return [];

  const t0 = Date.now();
  const snapshot = await buildGraph({ scope: namespace, sessionId: options.sessionId });
  const needle = query.toLowerCase().trim();
  const matches = snapshot.nodes.filter((n) =>
    n.title.toLowerCase().includes(needle),
  );
  const limit = options.limit ?? 10;
  const results = matches.slice(0, limit);

  await safeEmit(
    {
      graphify: "v1",
      operation: "query",
      nodeCount: snapshot.nodes.length,
      edgeCount: snapshot.edges.length,
      communityCount: snapshot.communities.length,
      latencyMs: Date.now() - t0,
    },
    options.sessionId,
  );

  return results;
}

export async function getStats(): Promise<{
  nodes: number;
  edges: number;
  communities: number;
}> {
  if (!isGraphifyEnabled()) {
    return { nodes: 0, edges: 0, communities: 0 };
  }
  const count = await countVaultNotes();
  return { nodes: count, edges: 0, communities: 0 }; // edges/communities require full build
}
