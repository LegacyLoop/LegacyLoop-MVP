// lib/sylvia/episodic.ts
//
// CMD-SYLVIA-EPISODIC-MEMORY-UNIFY V20 v2.1 R29 P72 · Wave 15 Slot A · 2026-05-16
//
// Unified episodic memory primitive · consumes Prisma SylviaEpisodic +
// legacy EventLog + ScraperUsageLog + sylvia-data/audit/*.jsonl into
// single timeline API.
//
// Doctrine:
//   BINDING #16 · clones lib/sylvia/memory.ts patterns · zero novel abstractions
//   BINDING #17 · audit-first-wire honored · §0.3 verbatim cites
//   BINDING #6  · DEV-PROD-DB-ISOLATION via prisma adapter
//
// Public API (4 fns + 1 backfill helper):
//   - recallByTimeWindow({ start, end, eventTypes?, limit?, includeJSONL? })
//   - recallBySession(sessionId, limit?)
//   - recallByCause(eventType, sinceDays?, limit?)
//   - recallCausationChain(rootId, maxDepth?)
//   - backfillFromLegacySources({ dryRun? }) · one-time migration

import { prisma } from "@/lib/db";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import type {
  EpisodicEntry,
  EpisodicEventType,
  EpisodicSource,
} from "./memory-types";

const AUDIT_DIR = join(process.cwd(), "sylvia-data", "audit");

export interface RecallByTimeWindowOpts {
  start: Date;
  end: Date;
  eventTypes?: EpisodicEventType[];
  limit?: number; // default 100
  includeJSONL?: boolean; // default false · explicit opt-in for JSONL fallback consumption
}

function rowToEntry(row: {
  timestamp: Date;
  sessionId: string;
  eventType: string;
  userId: string | null;
  itemId: string | null;
  sylviaMemoryId: string | null;
  payload: string;
  causedById: string | null;
  source: string;
}): EpisodicEntry {
  let parsedPayload: Record<string, unknown>;
  try {
    parsedPayload = JSON.parse(row.payload) as Record<string, unknown>;
  } catch {
    parsedPayload = { _parseError: row.payload };
  }
  return {
    timestamp: row.timestamp.toISOString(),
    sessionId: row.sessionId,
    eventType: row.eventType as EpisodicEventType,
    userId: row.userId ?? undefined,
    itemId: row.itemId ?? undefined,
    sylviaMemoryId: row.sylviaMemoryId ?? undefined,
    payload: parsedPayload,
    causedById: row.causedById ?? undefined,
    source: row.source as EpisodicSource,
  };
}

/**
 * Recall episodic entries within a time window.
 * Primary source: Prisma SylviaEpisodic.
 * Optional: includes JSONL fallback rows if includeJSONL=true.
 */
export async function recallByTimeWindow(
  opts: RecallByTimeWindowOpts,
): Promise<EpisodicEntry[]> {
  const limit = opts.limit ?? 100;
  const eventTypeFilter = opts.eventTypes && opts.eventTypes.length > 0
    ? { in: opts.eventTypes as string[] }
    : undefined;

  let prismaHits: EpisodicEntry[] = [];
  try {
    const rows = await prisma.sylviaEpisodic.findMany({
      where: {
        timestamp: { gte: opts.start, lte: opts.end },
        ...(eventTypeFilter ? { eventType: eventTypeFilter } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    prismaHits = rows.map(rowToEntry);
  } catch (err) {
    console.error("[sylvia-episodic] recallByTimeWindow Prisma error:", err);
    prismaHits = [];
  }

  if (!opts.includeJSONL) return prismaHits;

  // JSONL fallback scan (opt-in · scoped to date range)
  const jsonlHits: EpisodicEntry[] = [];
  try {
    const files = await fs.readdir(AUDIT_DIR);
    const startISO = opts.start.toISOString().slice(0, 10);
    const endISO = opts.end.toISOString().slice(0, 10);
    for (const file of files) {
      if (!file.startsWith("episodic-")) continue;
      const dateMatch = file.match(/^episodic-(\d{4}-\d{2}-\d{2})\.jsonl$/);
      if (!dateMatch) continue;
      const fileDate = dateMatch[1];
      if (fileDate < startISO || fileDate > endISO) continue;
      const content = await fs.readFile(join(AUDIT_DIR, file), "utf8");
      for (const line of content.split("\n")) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line) as EpisodicEntry;
          const ts = new Date(entry.timestamp);
          if (ts < opts.start || ts > opts.end) continue;
          if (eventTypeFilter && !opts.eventTypes?.includes(entry.eventType)) continue;
          jsonlHits.push(entry);
        } catch {
          // skip malformed line
        }
      }
    }
  } catch (err) {
    console.error("[sylvia-episodic] recallByTimeWindow JSONL error:", err);
  }

  // Merge + sort desc by timestamp · cap at limit
  const merged = [...prismaHits, ...jsonlHits].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
  return merged.slice(0, limit);
}

/**
 * Recall episodic entries for a single session.
 */
export async function recallBySession(
  sessionId: string,
  limit = 50,
): Promise<EpisodicEntry[]> {
  try {
    const rows = await prisma.sylviaEpisodic.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
      take: limit,
    });
    return rows.map(rowToEntry);
  } catch (err) {
    console.error("[sylvia-episodic] recallBySession error:", err);
    return [];
  }
}

/**
 * Recall episodic entries by eventType in a sliding window.
 */
export async function recallByCause(
  eventType: EpisodicEventType,
  sinceDays = 30,
  limit = 25,
): Promise<EpisodicEntry[]> {
  try {
    const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await prisma.sylviaEpisodic.findMany({
      where: { eventType, createdAt: { gte: cutoff } },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return rows.map(rowToEntry);
  } catch (err) {
    console.error("[sylvia-episodic] recallByCause error:", err);
    return [];
  }
}

/**
 * BFS traversal of causation chain via SylviaEpisodic.causedById self-ref.
 * Returns chain in causation order (rootId first, descendants follow).
 */
export async function recallCausationChain(
  rootId: string,
  maxDepth = 5,
): Promise<EpisodicEntry[]> {
  const visited = new Set<string>();
  const chain: EpisodicEntry[] = [];
  let frontier: string[] = [rootId];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    try {
      const rows = await prisma.sylviaEpisodic.findMany({
        where: { id: { in: frontier.filter(id => !visited.has(id)) } },
      });
      for (const row of rows) {
        if (visited.has(row.id)) continue;
        visited.add(row.id);
        chain.push(rowToEntry(row));
      }
      // Next frontier: rows whose causedById is in current frontier (descendants)
      const descendants = await prisma.sylviaEpisodic.findMany({
        where: { causedById: { in: frontier.filter(id => !visited.has(id) || true) } },
        select: { id: true },
      });
      frontier = descendants.map(d => d.id).filter(id => !visited.has(id));
    } catch (err) {
      console.error("[sylvia-episodic] recallCausationChain error:", err);
      break;
    }
  }
  return chain;
}

/**
 * Backfill legacy EventLog + ScraperUsageLog + audit JSONL entries
 * into SylviaEpisodic. One-time migration helper · idempotent via
 * timestamp+sessionId+source composite key. NOT called from consumers ·
 * CEO routes execution post-spec close.
 *
 * v1: dryRun-default true · IT inspects projected counts before live run.
 */
export async function backfillFromLegacySources(
  opts: { dryRun?: boolean } = {},
): Promise<{
  eventLogCount: number;
  scraperUsageLogCount: number;
  jsonlCount: number;
  insertedCount: number;
}> {
  const dryRun = opts.dryRun ?? true;
  let eventLogCount = 0;
  let scraperUsageLogCount = 0;
  let jsonlCount = 0;
  let insertedCount = 0;

  try {
    eventLogCount = await prisma.eventLog.count();
    scraperUsageLogCount = await prisma.scraperUsageLog.count();
  } catch (err) {
    console.error("[sylvia-episodic] backfill count error:", err);
  }

  try {
    const files = await fs.readdir(AUDIT_DIR);
    for (const file of files) {
      if (!/\.jsonl$/.test(file)) continue;
      const content = await fs.readFile(join(AUDIT_DIR, file), "utf8");
      jsonlCount += content.split("\n").filter(l => l.trim()).length;
    }
  } catch {
    // audit dir absent OK
  }

  if (dryRun) {
    return { eventLogCount, scraperUsageLogCount, jsonlCount, insertedCount };
  }

  // Live backfill stub · v1 ships dry-run-only · live migration runs in
  // separate cyl with CEO routing per BINDING #6 (volume + timing-sensitive)
  console.warn(
    "[sylvia-episodic] live backfill not implemented in v1 · CEO routes via separate cyl",
  );
  return { eventLogCount, scraperUsageLogCount, jsonlCount, insertedCount };
}

export { appendEpisodic } from "./memory";
