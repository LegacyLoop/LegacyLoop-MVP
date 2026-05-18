// lib/sylvia/obsidian/types.ts
//
// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 v2.1 R29 P-WAVE-20-PHASE-5 · 2026-05-18
// ★ M17 BRAIN EXTERNALIZATION moat · POSSIBLE #39+#40 RATIFY · 35 → 37 BINDING ★
//
// Type contract for bi-directional Obsidian vault sync.
// GREENFIELD · BINDING #16 ABSOLUTE: zero @claude-flow/* import.
// CEO §5.X Gate 1 picked Option D (manual trigger · no chokidar · BINDING #18 safe).
//
// §0.7 DESIGN-ANTICIPATION (BINDING #42 cand 3/5→4/5):
// VaultNamespace = VectorNamespace passthrough · 8 sub-vaults pre-position
// Phase D MPMA (item:* platform:*) + CCL (customer:*) consumers.

import type { VectorNamespace } from "../vector";

export type VaultNamespace = VectorNamespace;

export interface ObsidianNote {
  namespace: VaultNamespace;
  filePath: string;        // relative to vault root
  title: string;
  body: string;
  frontmatter: NoteFrontmatter;
  backlinks: string[];     // wikilink targets resolved from body
}

export interface NoteFrontmatter {
  namespace: VaultNamespace;
  created: string;          // ISO8601
  updated: string;
  embeddingHash?: string;   // optional · null when embedder unavailable (BINDING #28 Phase 4 catch · LiteLLM /v1/embeddings 400)
  provenance: string;       // origin sentinel · e.g. "sylvia-hybrid:v1" or "ceo-manual"
  // Phase D MPMA extensions banked
  platforms?: string[];     // item notes · MPMA Layer 3
  condition?: string;       // item notes
  priceUsd?: number;        // item notes
  // Phase D CCL extensions banked
  customerId?: string;
  // forward-compat
  [key: string]: unknown;
}

export type SyncDirection = "vault-to-hybrid" | "hybrid-to-vault";

export interface SyncEvent {
  direction: SyncDirection;
  namespace: VaultNamespace;
  filePath?: string;
  hitCount: number;
  latencyMs: number;
  timestamp: string;
}

export interface ObsidianEpisodicPayload {
  obsidian: "v1";              // sentinel · matches Phase 2 swarm + Phase 3 vector + Phase 4 hybrid + CYL #1 router
  direction: SyncDirection;
  namespace: VaultNamespace;
  filePath?: string;
  hitCount: number;
  latencyMs: number;
}

export interface VaultStructure {
  root: string;                // absolute path to vault root
  subVaults: VaultNamespace[]; // 8 sub-vault prefixes
}

export interface SyncOptions {
  limit?: number;              // hybrid-to-vault recall depth
  sessionId?: string;          // telemetry
  dryRun?: boolean;            // preview · no fs writes
}
