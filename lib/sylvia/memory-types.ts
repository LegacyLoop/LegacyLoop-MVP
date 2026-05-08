// lib/sylvia/memory-types.ts
//
// CMD-SYLVIA-MEMORY-HOOK V19 · R24 P1 · 2026-05-08
//
// Audit + query shapes for the Sylvia memory layer. Forward-compat
// absolute per NB Seed 1 doctrine — R25+ extends with embedding[]
// surface (semantic recall) without breaking v1 callers.

import type { KbProvenance } from "@/lib/sylvia-kb/types";

/**
 * Audit entry written to sylvia-data/audit/{YYYY-MM-DD}.jsonl per
 * consensus dispatch. PII-safe: questionHash is sha256 prefix,
 * never the raw question.
 */
export interface AuditEntry {
  timestamp: string; // ISO8601
  questionHash: string; // sha256 prefix · NEVER raw question
  stakes: "low" | "high";
  confidenceBand: number; // 0-100
  agreementScore?: number; // present iff stakes === "high"
  providers: string[]; // which providers responded
  costUsd: number; // per-question total
  refused?: boolean; // true iff Truth Gate <70
  truncated?: boolean; // true iff budget cap mid-flight
  sessionId?: string; // optional · cross-call correlation
}

/**
 * Result returned from queryMemoryByTopic(). v1 returns content +
 * provenance + age. R25+ extends with relevanceScore via vector
 * similarity (embedding[] field added to KbCorpusEntry).
 */
export interface MemoryHit {
  content: string;
  provenance: KbProvenance;
  relevanceScore?: number; // 0-100 · R25+ vector similarity
  ageMs: number;
}
