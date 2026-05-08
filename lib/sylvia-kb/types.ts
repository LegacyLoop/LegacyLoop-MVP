// lib/sylvia-kb/types.ts
//
// CMD-NB-SEED-2-SYLVIA-KB-SCHEMA V19 · R23 P0 · 2026-05-08
//
// Sylvia Knowledge Base · forward-compat type contracts (NB Seed 2).
// Pure types module · zero AI calls · zero DB calls · zero side effects.
//
// Phase consumers:
//   - Phase 7 NotebookLM Dossier (extends DossierItem with KbHit[] arrays)
//   - Phase 8 Manus autonomous selling (KB-driven listing generation)
//
// All extension surfaces optional · zero breaking changes when phases
// activate · zero refactor cost. Pattern cloned from lib/dossier/types.ts
// NB Seed 1 (R22 P1 · 2d9ff63) per BINDING #16 DOC-DELEGATE-TO-CANONICAL.
//
// Provenance shape mirrors docs/sylvia/SYLVIA_API_CONTRACT.md §4 (Moat 7)
// authored R22.6 3c22ba7 · 4 kinds: real-time · memory · training · inferred.
//
// Holy Grail Foundation Seeds lineage:
//   NB Seed 1 (R22 P1 lib/dossier/types.ts · 49 LOC)
//     ↓
//   NB Seed 2 (this · R23 P0)
//     ↓
//   NB Seed 3 (banked · Dossier template prototype · consumes KbHit[])
//     ↓
//   NB Seed 4 (banked · Gateway synthesis pattern)

/** Item domain category · used for KB filtering + Phase 7/8 routing. */
export type KbCategory =
  | "antique"
  | "collectible"
  | "vehicle"
  | "household"
  | "art"
  | "estate-bulk"
  | "uncategorized";

/** Source-of-truth provenance for a KB document or hit. */
export type KbSource =
  | "ebay-sold"
  | "auction-house"
  | "rainforest-amazon"
  | "user-upload"
  | "megabot-consensus"
  | "scraper-corpus";

/**
 * Provenance descriptor (Moat 7 · matches SYLVIA_API_CONTRACT.md §4).
 * Discipline rule (Phase 7+): kind === "training" or "inferred" with
 * stakes === "high" forces consumer-side confidenceBand <= 60.
 */
export interface KbProvenance {
  kind: "real-time" | "memory" | "training" | "inferred";
  sourceUrl?: string; // when kind === "real-time"
  timestamp?: string; // ISO8601 when applicable
  rationale?: string; // when kind === "inferred"
  scrapeSessionId?: string; // when source === "scraper-corpus"
  megabotAgreement?: number; // 0-100 when source === "megabot-consensus"
}

/** Single KB document · canonical persisted shape. */
export interface KbDocument {
  id: string;
  category: KbCategory;
  source: KbSource;
  title: string;
  body: string;
  metadata?: Record<string, unknown>; // extension surface · optional
  createdAt: string; // ISO8601
  updatedAt?: string; // optional
}

/** Corpus entry · document + optional embedding + provenance. */
export interface KbCorpusEntry {
  document: KbDocument;
  embedding?: number[]; // optional · vector-store wire (Phase 7+)
  provenance: KbProvenance; // mandatory · Moat 7
}

/**
 * KB query request · matches POST /api/sylvia/corpus contract per
 * SYLVIA_API_CONTRACT.md §2.3 (R22.6 anchor).
 */
export interface KbQueryRequest {
  query: string;
  topK?: number; // default 10
  filterCategory?: KbCategory;
  filterSource?: KbSource;
  minProvenanceScore?: number; // 0-100 · default 0
}

/** Single hit returned from a KB query. */
export interface KbHit {
  document: KbDocument;
  score: number; // 0-100 · semantic similarity
  provenance: KbProvenance;
}

/** KB query response · canonical shape returned to consumers. */
export interface KbQueryResponse {
  hits: KbHit[];
  totalMatches: number;
  latencyMs: number;
  truncated: boolean;
}
