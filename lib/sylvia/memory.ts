/**
 * Sylvia Collective Memory · V1 helper module
 *
 * CMD-SYLVIA-COLLECTIVE-MEMORY-V1 · V18 · 2026-05-03
 * Author: Pam (Cowork · Layer 1 · AI track)
 *
 * Cross-agent context layer over the SylviaMemory Prisma model.
 * V1 exports record / recall / stats / prune. V2 (banked
 * CMD-SYLVIA-TRIAGE-ROUTER-V2-TELEMETRY-PERSIST) wires the triage
 * router to call recordTriage on every triageAndRoute call.
 *
 * DOC-DEV-PROD-DB-ISOLATION applies — this module uses lib/db.ts
 * which routes to dev SQLite OR prod Turso based on env. NO bypass
 * paths. NO direct sql exec.
 *
 * USAGE EXAMPLE:
 *   import { recordTriage, recallSimilar } from "@/lib/sylvia";
 *
 *   // After a triage call
 *   await recordTriage({ telemetry, userId, itemId, agentName: "@Sylvia-Pricing" });
 *
 *   // Lookup similar past prompts
 *   const recent = await recallSimilar({ promptHash: "abcd1234", limit: 5 });
 */

import { prisma } from "@/lib/db";
import type { TriageTelemetry } from "./types";

// ─── Types ────────────────────────────────────────────────────────

export interface RecordTriageInput {
  telemetry: TriageTelemetry;
  agentName?: string; // default "sylvia"
  responseText?: string; // null/undef to opt out of response storage (privacy default)
  responseHash?: string;
  userId?: string;
  itemId?: string;
  metadata?: Record<string, unknown>;
}

export interface RecallSimilarOpts {
  promptHash: string;
  agentName?: string;
  limit?: number; // default 5
  sinceDays?: number; // default 30
}

// ─── Internal: classification mapping ─────────────────────────────

// Maps Spec 2's TaskComplexity ("simple" | "medium" | "complex" |
// "specialized") to the SylviaMemoryClassification enum. Returns the
// matching enum value as a string-typed constant — Prisma client
// accepts the string at the generated enum field for type widening
// purposes.
const CLASSIFICATION_MAP = {
  simple: "SIMPLE",
  medium: "MEDIUM",
  complex: "COMPLEX",
  specialized: "SPECIALIZED",
} as const;

type SylviaMemoryClassificationLiteral =
  (typeof CLASSIFICATION_MAP)[keyof typeof CLASSIFICATION_MAP];

function toEnumClassification(
  c: TriageTelemetry["classification"],
): SylviaMemoryClassificationLiteral {
  return CLASSIFICATION_MAP[c];
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Persist one TriageTelemetry record to SylviaMemory.
 *
 * Privacy default: responseText is NOT stored unless caller opts in
 * (V1 default · V2 banks per-user retention preference). The
 * responseHash + responseLength fields are still useful for de-dup
 * even when the text body is omitted.
 *
 * Cross-references (userId / itemId) are SET NULL on parent delete
 * per schema · learnings outlive items (Investor Moat #8).
 */
export async function recordTriage(
  input: RecordTriageInput,
): Promise<{ id: string }> {
  const t = input.telemetry;
  const created = await prisma.sylviaMemory.create({
    data: {
      sessionId: t.sessionId,
      promptHash: t.promptHash,
      promptLength: t.promptLength,
      agentName: input.agentName ?? "sylvia",
      classifier: t.classifier,
      classification: toEnumClassification(t.classification),
      chosenAlias: t.chosenAlias,
      cascadeAttempted: JSON.stringify(t.cascadeAttempted),
      fallbackUsed: t.fallbackUsed,
      costEstimateUsd: t.costEstimateUsd,
      costActualUsd: t.costActualUsd,
      ceilingTriggered: t.ceilingTriggered,
      durationMs: t.durationMs,
      tokensIn: t.tokensIn ?? null,
      tokensOut: t.tokensOut ?? null,
      responseText: input.responseText ?? null,
      responseHash: input.responseHash ?? null,
      responseLength: input.responseText?.length ?? null,
      userId: input.userId ?? null,
      itemId: input.itemId ?? null,
      errorClass: t.errorClass ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
    select: { id: true },
  });
  return { id: created.id };
}

/**
 * Find prior triage rows with the same promptHash within the recall
 * window. Default window is 30 days · default limit is 5 rows. Omit
 * agentName to query across all agents (cross-agent memory recall).
 *
 * Returns lean projection (no responseText body) for fast browsing.
 * Caller follows up with a full-record read if needed.
 */
export async function recallSimilar(opts: RecallSimilarOpts) {
  const since = new Date(
    Date.now() - (opts.sinceDays ?? 30) * 24 * 60 * 60 * 1000,
  );
  return prisma.sylviaMemory.findMany({
    where: {
      promptHash: opts.promptHash,
      ...(opts.agentName ? { agentName: opts.agentName } : {}),
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 5,
    select: {
      id: true,
      classification: true,
      chosenAlias: true,
      durationMs: true,
      costActualUsd: true,
      tokensIn: true,
      tokensOut: true,
      responseHash: true,
      responseLength: true,
      createdAt: true,
    },
  });
}

/**
 * Aggregate cost + duration + classification breakdown for a session.
 * Used by Sylvia agents to surface "you've spent $X on Y calls this
 * session" UX and by admin dashboards (banked) to monitor moat health.
 */
export async function getSessionStats(sessionId: string) {
  const rows = await prisma.sylviaMemory.findMany({
    where: { sessionId },
    select: {
      costActualUsd: true,
      durationMs: true,
      classification: true,
      ceilingTriggered: true,
    },
  });
  const callCount = rows.length;
  const totalCostUsd = rows.reduce((s, r) => s + r.costActualUsd, 0);
  const totalDurationMs = rows.reduce((s, r) => s + r.durationMs, 0);
  const ceilingHits = rows.filter((r) => r.ceilingTriggered !== "none").length;
  const byClassification = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.classification] = (acc[r.classification] ?? 0) + 1;
    return acc;
  }, {});
  return {
    sessionId,
    callCount,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    totalDurationMs,
    ceilingHits,
    byClassification,
  };
}

/**
 * Delete SylviaMemory rows older than `daysOld` days. Hard safety
 * floor: refuses to prune anything younger than 7 days. This guards
 * against accidental data loss · the floor is intentionally
 * non-bypassable at this V1 layer (admin override would land in a
 * banked admin-panel cylinder with explicit unlock).
 */
export async function pruneOld(daysOld: number): Promise<{ deleted: number }> {
  if (daysOld < 7) {
    throw new Error(
      "[sylvia-memory] refusing to prune <7 days · safety floor",
    );
  }
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const res = await prisma.sylviaMemory.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return { deleted: res.count };
}

// ─── R24 P1 additions (audit + query) ─────────────────────────────
// CMD-SYLVIA-MEMORY-HOOK V19 · R24 P1 · 2026-05-08
//
// File-system audit writer + topic query shim. Forward-compat: R25+
// swaps file-system audit for AgentDB writes (Ruflo full · Moat 5b)
// and adds embedding[] surface to MemoryHit. Surface kept stable.
//
// Vercel ephemeral-filesystem note: lambda invocations have RW
// access to /tmp and the cwd, but writes are NOT persisted between
// invocations. v1 audit writes work locally + survive within a
// single warm-lambda window. Production durable audit lands in
// R25+ AgentDB cylinder. Banked carry-forward.

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { AuditEntry, MemoryHit, ToolAuditEntry, EpisodicEntry } from "./memory-types";

const AUDIT_DIR = join(process.cwd(), "sylvia-data", "audit");
const MEMORY_DIR = join(process.cwd(), "sylvia-data", "memory");

/**
 * Hash a raw question to a 16-char sha256 prefix. Used in AuditEntry
 * to preserve PII while enabling de-dup + cross-session correlation.
 * Same convention as triage-router.ts hashPrompt.
 */
export function hashQuestion(q: string): string {
  return createHash("sha256").update(q).digest("hex").slice(0, 16);
}

/**
 * Append one audit row to sylvia-data/audit/{YYYY-MM-DD}.jsonl.
 * Idempotent re: directory creation. Caller wraps in try/catch —
 * audit failure must NEVER fail the consumer's response.
 */
export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  await fs.mkdir(AUDIT_DIR, { recursive: true });
  const date = entry.timestamp.slice(0, 10); // YYYY-MM-DD
  const path = join(AUDIT_DIR, `${date}.jsonl`);
  await fs.appendFile(path, JSON.stringify(entry) + "\n", "utf8");
}

/**
 * Lexical topic search over sylvia-data/memory/* files. v1 is a
 * simple substring match (case-insensitive). R25+ swaps in vector
 * similarity via embeddings (KbCorpusEntry.embedding consumed).
 *
 * Defaults: limit=10. Returns [] on any I/O error (graceful · no
 * throw to caller).
 */
export async function queryMemoryByTopic(
  topic: string,
  limit: number = 10,
): Promise<MemoryHit[]> {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    const files = await fs.readdir(MEMORY_DIR);
    const hits: MemoryHit[] = [];
    const needle = topic.toLowerCase();
    for (const file of files) {
      if (hits.length >= limit) break;
      const filePath = join(MEMORY_DIR, file);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      const content = await fs.readFile(filePath, "utf8");
      if (content.toLowerCase().includes(needle)) {
        hits.push({
          content,
          provenance: {
            kind: "memory",
            sourceUrl: file,
            timestamp: stat.mtime.toISOString(),
          },
          ageMs: Date.now() - stat.mtimeMs,
        });
      }
    }
    return hits;
  } catch (err) {
    console.error("[sylvia/memory] queryMemoryByTopic error:", err);
    return [];
  }
}

// ─── R29 P63 additions (tool audit JSONL writer) ──────────────────
// CMD-SYLVIA-TOOL-FILE-READ V20 v2.1 R29 P63 · 2026-05-15
//
// Clones appendAuditEntry pattern · separate filename prefix to
// distinguish operational tool audits from consensus dispatch audits.
// Same dir · same fs ephemeral-window caveat applies (R25+ AgentDB).

/**
 * Append one tool audit row to sylvia-data/audit/tool-{YYYY-MM-DD}.jsonl.
 * Idempotent re: directory creation. Caller wraps in try/catch —
 * audit failure must NEVER fail the consumer's response.
 */
export async function appendToolAuditEntry(entry: ToolAuditEntry): Promise<void> {
  await fs.mkdir(AUDIT_DIR, { recursive: true });
  const date = entry.timestamp.slice(0, 10); // YYYY-MM-DD
  const path = join(AUDIT_DIR, `tool-${date}.jsonl`);
  await fs.appendFile(path, JSON.stringify(entry) + "\n", "utf8");
}

export type { ToolAuditEntry, SylviaToolName, ToolOutcome } from "./memory-types";

// ─── R29 P72 additions (episodic memory writer) ───────────────────
// CMD-SYLVIA-EPISODIC-MEMORY-UNIFY V20 v2.1 R29 P72 · 2026-05-16
//
// Clones appendToolAuditEntry pattern · writes to Prisma SylviaEpisodic
// with JSONL fallback when Prisma unavailable (Vercel ephemeral resilience).

/**
 * Append one episodic row to Prisma SylviaEpisodic + JSONL fallback.
 * Caller wraps in try/catch — episodic failure must NEVER fail consumer.
 */
export async function appendEpisodic(entry: EpisodicEntry): Promise<{ id?: string }> {
  try {
    const created = await prisma.sylviaEpisodic.create({
      data: {
        timestamp: new Date(entry.timestamp),
        sessionId: entry.sessionId,
        eventType: entry.eventType,
        userId: entry.userId ?? null,
        itemId: entry.itemId ?? null,
        sylviaMemoryId: entry.sylviaMemoryId ?? null,
        payload: JSON.stringify(entry.payload),
        causedById: entry.causedById ?? null,
        source: entry.source,
      },
      select: { id: true },
    });
    return { id: created.id };
  } catch (prismaErr) {
    try {
      await fs.mkdir(AUDIT_DIR, { recursive: true });
      const date = entry.timestamp.slice(0, 10);
      const path = join(AUDIT_DIR, `episodic-${date}.jsonl`);
      await fs.appendFile(path, JSON.stringify(entry) + "\n", "utf8");
      console.warn(
        `[sylvia-episodic] Prisma write failed · JSONL fallback used: ${prismaErr instanceof Error ? prismaErr.message : "unknown"}`,
      );
      return {};
    } catch (fsErr) {
      console.error(
        `[sylvia-episodic] BOTH Prisma + JSONL failed: ${fsErr instanceof Error ? fsErr.message : "unknown"}`,
      );
      return {};
    }
  }
}

export type { EpisodicEntry, EpisodicEventType, EpisodicSource } from "./memory-types";
