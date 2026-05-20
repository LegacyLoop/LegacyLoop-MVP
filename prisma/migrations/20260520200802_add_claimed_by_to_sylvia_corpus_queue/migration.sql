-- CMD-PHASE-C-DRAIN-CLAIM-TIMEOUT-FIX V20 LOW · 2026-05-20
-- Additive only · ALTER TABLE ADD COLUMN + CREATE INDEX
-- Hand-written per BINDING #31 (prisma migrate dev --create-only blocked
-- by unrelated dev.db drift · class CYL 2 canonical hand-write pattern reused).

-- AlterTable
ALTER TABLE "sylvia_corpus_queue" ADD COLUMN "claimedBy" TEXT;

-- CreateIndex
CREATE INDEX "sylvia_corpus_queue_status_claimedAt_idx" ON "sylvia_corpus_queue"("status", "claimedAt");
