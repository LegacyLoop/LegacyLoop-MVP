#!/usr/bin/env node
// CMD-SYLVIA-SUBSTRATE-ROUTER-PATTERN V20 MEDIUM · 2026-05-19
// Mac drain worker · reads sylvia_corpus_queue · executes graphify locally.
// Sylvia-Local-Execution doctrine · zero Vercel serverless filesystem write.
// Demo-Retirement absolute · calls existing lib/sylvia/graphify primitives unchanged.

import { prisma } from "../lib/db.ts";
import { graphIngestExternalCorpus } from "../lib/sylvia/graphify/index.ts";
import { appendEpisodic } from "../lib/sylvia/memory.ts";

const WORKER_ID = process.env.WORKER_ID || `mac-drain-${process.pid}`;
const BATCH_SIZE = Number(process.env.SYLVIA_QUEUE_BATCH_SIZE || 10);
const MAX_ATTEMPTS = Number(process.env.SYLVIA_QUEUE_MAX_ATTEMPTS || 3);
const STALE_CLAIM_THRESHOLD_MS = Number(
  process.env.SYLVIA_QUEUE_STALE_MS || 5 * 60 * 1000,
);

async function drainBatch() {
  // STEP 1 · Reclaim stale CLAIMED rows · reset to PENDING for re-claim
  // CMD-PHASE-C-DRAIN-CLAIM-TIMEOUT-FIX V20 LOW · 2026-05-20
  // Fixes orphaned-claim class (V8 burst Wave 21 PM · Agent B audit anchor).
  const staleBefore = new Date(Date.now() - STALE_CLAIM_THRESHOLD_MS);
  const reclaimed = await prisma.sylviaCorpusQueue.updateMany({
    where: {
      status: "CLAIMED",
      claimedAt: { lt: staleBefore },
    },
    data: {
      status: "PENDING",
      claimedAt: null,
      claimedBy: null,
    },
  });
  if (reclaimed.count > 0) {
    console.log(
      `[sylvia-queue-drain] worker=${WORKER_ID} reclaimed=${reclaimed.count}`,
    );
  }

  // STEP 2 · Bounded claim · take only BATCH_SIZE rows (not all PENDING)
  // Replaces over-claim pattern that stranded 40+ rows per burst.
  // Raw SQL because Prisma updateMany has no LIMIT for SQLite/libsql.
  const claimedAt = new Date();
  const claimResult = await prisma.$executeRaw`
    UPDATE sylvia_corpus_queue
    SET status = 'CLAIMED', claimedAt = ${claimedAt}, claimedBy = ${WORKER_ID}
    WHERE id IN (
      SELECT id FROM sylvia_corpus_queue
      WHERE status = 'PENDING' AND attemptCount < ${MAX_ATTEMPTS}
      ORDER BY createdAt ASC
      LIMIT ${BATCH_SIZE}
    )
  `;
  if (claimResult === 0) return { drained: 0, reclaimed: reclaimed.count };

  // STEP 3 · Read claimed rows for this worker (matches claimedAt + claimedBy)
  const rows = await prisma.sylviaCorpusQueue.findMany({
    where: { status: "CLAIMED", claimedAt, claimedBy: WORKER_ID },
    orderBy: { createdAt: "asc" },
  });

  // STEP 4 · Process (existing flow · unchanged claim/batch logic)
  // W19-L2 ADDITIVE METRIC · entries-written-vs-attempted · silent-loss canary
  let sumIngested = 0;
  let rowsWithIngested = 0;
  for (const row of rows) {
    try {
      const payload = JSON.parse(row.payload);
      const ingestResult = await graphIngestExternalCorpus(payload);
      const ingested = ingestResult?.ingested ?? 0;
      sumIngested += ingested;
      if (ingested > 0) rowsWithIngested += 1;
      else
        console.warn(
          `[sylvia-queue-drain] row=${row.id} ingested=0 (entries empty?)`,
        );
      await appendEpisodic({
        timestamp: new Date().toISOString(),
        sessionId: row.sessionId,
        eventType: "consensus",
        payload: {
          phase_c_ingest: "v1",
          decision: "accept",
          verticalId: row.verticalId,
          domain: row.domain,
          queueRowId: row.id,
          drainedBy: WORKER_ID,
          entriesWritten: ingested,
        },
        source: "queue-drain",
      });
      await prisma.sylviaCorpusQueue.update({
        where: { id: row.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          claimedBy: WORKER_ID,
        },
      });
      console.log(
        `[sylvia-queue-drain] row=${row.id} entries-written=${ingested}`,
      );
    } catch (err) {
      const errCause = err instanceof Error ? err.message : String(err);
      const nextAttempt = row.attemptCount + 1;
      await prisma.sylviaCorpusQueue.update({
        where: { id: row.id },
        data: {
          status: nextAttempt >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
          attemptCount: { increment: 1 },
          lastError: errCause,
          claimedAt: null,
          claimedBy: null,
        },
      });
      console.error(
        `[sylvia-queue-drain] row=${row.id} attempt=${nextAttempt}/${MAX_ATTEMPTS} cause=${errCause}`,
      );
    }
  }
  const mismatch = rows.length - rowsWithIngested;
  return {
    drained: rows.length,
    reclaimed: reclaimed.count,
    sumIngested,
    rowsWithIngested,
    mismatch,
  };
}

async function main() {
  console.log(`[sylvia-queue-drain] worker=${WORKER_ID} started`);
  const { drained, reclaimed, sumIngested, rowsWithIngested, mismatch } =
    await drainBatch();
  console.log(
    `[sylvia-queue-drain] worker=${WORKER_ID} drained=${drained} reclaimed=${reclaimed} written=${sumIngested} rowsWithIngested=${rowsWithIngested} mismatch=${mismatch}`,
  );
  if (mismatch > 0) {
    console.warn(
      `[sylvia-queue-drain] worker=${WORKER_ID} ★ SILENT-LOSS CANARY · mismatch=${mismatch} of drained=${drained} rows wrote 0 entries`,
    );
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`[sylvia-queue-drain] worker=${WORKER_ID} fatal:`, err);
  process.exit(1);
});
