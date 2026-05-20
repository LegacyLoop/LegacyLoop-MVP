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

async function drainBatch() {
  const claimedAt = new Date();

  // Atomic claim · flips PENDING rows under attempt cap to CLAIMED with timestamp
  const batch = await prisma.sylviaCorpusQueue.updateMany({
    where: {
      status: "PENDING",
      attemptCount: { lt: MAX_ATTEMPTS },
    },
    data: {
      status: "CLAIMED",
      claimedAt,
    },
  });

  if (batch.count === 0) return 0;

  // Read claimed rows (limit BATCH_SIZE · oldest first)
  const rows = await prisma.sylviaCorpusQueue.findMany({
    where: { status: "CLAIMED", claimedAt },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  for (const row of rows) {
    try {
      const payload = JSON.parse(row.payload);
      await graphIngestExternalCorpus(payload);
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
        },
        source: "queue-drain",
      });
      await prisma.sylviaCorpusQueue.update({
        where: { id: row.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
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
        },
      });
      console.error(
        `[sylvia-queue-drain] row=${row.id} attempt=${nextAttempt}/${MAX_ATTEMPTS} cause=${errCause}`,
      );
    }
  }
  return rows.length;
}

async function main() {
  console.log(`[sylvia-queue-drain] worker=${WORKER_ID} started`);
  const drained = await drainBatch();
  console.log(`[sylvia-queue-drain] worker=${WORKER_ID} drained=${drained}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`[sylvia-queue-drain] worker=${WORKER_ID} fatal:`, err);
  process.exit(1);
});
