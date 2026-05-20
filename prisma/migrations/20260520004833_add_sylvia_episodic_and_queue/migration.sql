-- CMD-SYLVIA-SUBSTRATE-ROUTER-PATTERN V20 MEDIUM · 2026-05-19
-- Folds Wave 16 unmigrated SylviaEpisodic + NEW SylviaCorpusQueue into one migration.
-- Hand-written per BINDING #31 replacement (broader schema drift caught · scope-limited
-- to sylvia substrate tables only · Sylvia-App Separation honored).
-- BINDING #6 dev-only via `prisma migrate resolve --applied` registration.
-- CYL 3 pushes this same SQL to prod Turso (CEO BINDING #6 gate).

-- CreateTable
CREATE TABLE "sylvia_episodic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "itemId" TEXT,
    "sylviaMemoryId" TEXT,
    "payload" TEXT NOT NULL,
    "causedById" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sylvia_episodic_causedById_fkey" FOREIGN KEY ("causedById") REFERENCES "sylvia_episodic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sylvia_episodic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sylvia_episodic_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sylvia_episodic_sylviaMemoryId_fkey" FOREIGN KEY ("sylviaMemoryId") REFERENCES "sylvia_memory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sylvia_episodic_sessionId_idx" ON "sylvia_episodic"("sessionId");

-- CreateIndex
CREATE INDEX "sylvia_episodic_timestamp_idx" ON "sylvia_episodic"("timestamp");

-- CreateIndex
CREATE INDEX "sylvia_episodic_eventType_idx" ON "sylvia_episodic"("eventType");

-- CreateIndex
CREATE INDEX "sylvia_episodic_userId_idx" ON "sylvia_episodic"("userId");

-- CreateIndex
CREATE INDEX "sylvia_episodic_causedById_idx" ON "sylvia_episodic"("causedById");

-- CreateTable
CREATE TABLE "sylvia_corpus_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "verticalId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" DATETIME,
    "completedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "sylvia_corpus_queue_status_createdAt_idx" ON "sylvia_corpus_queue"("status", "createdAt");
