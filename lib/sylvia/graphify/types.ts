// lib/sylvia/graphify/types.ts
//
// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 v2.1 R29 P-WAVE-20-PHASE-6 · 2026-05-18
// ★ M18 SELF-INTROSPECTING GRAPH moat + FOUNDATION PRIMITIVE for Phase C/D/E ★
// ★ FOUNDATION-UP DOCTRINE (#45 NEW 1/5 · CEO Mon PM directive) ★
//
// Type contract for self-introspecting knowledge graph.
// GREENFIELD · BINDING #16 ABSOLUTE: zero @claude-flow/* import.
// CEO §5.X Gate 1 picked Option B Leiden (foundation-up · build right first time).

import type { VaultNamespace } from "../obsidian";

export type GraphNamespace = VaultNamespace; // 8 patterns passthrough

export type GraphAlgorithm = "louvain" | "leiden" | "label-propagation";

export interface GraphNode {
  id: string;
  namespace: GraphNamespace;
  title: string;
  weight: number;            // centrality score (PageRank-like)
  metadata: Record<string, unknown>;
}

export type EdgeType =
  | "backlink"
  | "semantic-similar"
  | "co-occurrence"
  | "explicit-link";

export interface GraphEdge {
  source: string;            // GraphNode.id
  target: string;
  type: EdgeType;
  weight: number;
}

export interface Community {
  id: number;
  label: string;
  nodes: string[];           // GraphNode.id list
  cohesion: number;          // 0.0-1.0 (intra-community density)
}

export interface GraphSnapshot {
  builtAt: string;           // ISO8601
  algorithm: GraphAlgorithm;
  nodes: GraphNode[];
  edges: GraphEdge[];
  communities: Community[];
  godNodes: GraphNode[];     // top-N by centrality
  surprisingConnections: GraphEdge[]; // cross-community high-weight edges
}

export interface GraphifyEpisodicPayload {
  graphify: "v1";              // sentinel · matches Phase 2-5 + CYL #1 router precedents
  operation: "build" | "query" | "ingest" | "export";
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  latencyMs: number;
}

// ─── FOUNDATION-UP consumer hook contracts (#45 NEW · Phase C/D/E pre-position) ───

export interface ExternalCorpusEntry {
  source: "scraper" | "n8n-workflow" | "manual-upload";
  corpusId: string;
  domain: string;             // e.g. "ebay-vintage-collectibles"
  entries: Array<{
    id: string;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
  }>;
}

export interface CustomerGraphConfig {
  customerId: string;
  scope: "behavior" | "items-listed" | "items-sold" | "preferences";
  maxNodes?: number;
}

export interface ItemProvenanceConfig {
  itemId: string;
  platforms: string[];        // ["ebay", "fb-marketplace", "etsy"]
  trackingDepth: "listing" | "view" | "watcher" | "sale";
}

export interface ExternalConsumerQuery {
  consumerId: string;          // API client identifier
  query: string;
  scope?: string;              // namespace filter
  limit?: number;
  authToken: string;           // bearer token verified by Inbound API gateway
}
