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

// ─── R29 P63 additions (operational tool audit shape) ─────────────
// CMD-SYLVIA-TOOL-FILE-READ V20 v2.1 R29 P63 · 2026-05-15
//
// Tool audit shape · distinct from consensus AuditEntry which is
// dispatch-specific. Operational tools (file_read · file_write · bash)
// share this shape. Forward-compat: R25+ may merge to unified shape
// via OperationalAuditEntry parent if patterns converge.

export type SylviaToolName = "file_read" | "file_write" | "bash";

export type ToolOutcome = "ok" | "deny" | "error" | "exists" | "timeout";

export interface ToolAuditEntry {
  timestamp: string; // ISO8601
  tool: SylviaToolName;
  caller: string; // session ID or "sylvia-open-webui-<id>"
  request: Record<string, unknown>; // tool-specific request shape · JSON-serializable
  permission: {
    outcome: "allow" | "deny";
    matchedAllow?: string | null;
    matchedDeny?: string | null;
    reason?: string;
  };
  result: {
    outcome: ToolOutcome;
    duration_ms: number;
    bytes?: number;
    credentialsRedacted?: number;
    reason?: string;
  };
}

// ─── R29 P72 additions (episodic memory shape) ────────────────────
// CMD-SYLVIA-EPISODIC-MEMORY-UNIFY V20 v2.1 R29 P72 · 2026-05-16
//
// Episodic memory entry shape · unifies EventLog + ScraperUsageLog +
// audit JSONL into a single timeline contract. Forward-compat: R25+
// AgentDB swap consumed via same shape.

export type EpisodicEventType =
  | "triage"
  | "consensus"
  | "tool_call"
  | "chat_turn"
  | "error"
  | "human_route";

export type EpisodicSource =
  | "EventLog"
  | "ScraperUsageLog"
  | "audit-jsonl"
  | "direct";

export interface EpisodicEntry {
  timestamp: string; // ISO8601
  sessionId: string;
  eventType: EpisodicEventType;
  userId?: string;
  itemId?: string;
  sylviaMemoryId?: string;
  payload: Record<string, unknown>;
  causedById?: string;
  source: EpisodicSource;
}
