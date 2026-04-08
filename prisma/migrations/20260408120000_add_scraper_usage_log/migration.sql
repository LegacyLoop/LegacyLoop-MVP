-- CreateTable
CREATE TABLE "ScraperUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "compsReturned" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "itemId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ScraperUsageLog_botName_createdAt_idx" ON "ScraperUsageLog"("botName", "createdAt");

-- CreateIndex
CREATE INDEX "ScraperUsageLog_slug_createdAt_idx" ON "ScraperUsageLog"("slug", "createdAt");

-- CreateIndex
CREATE INDEX "ScraperUsageLog_blocked_createdAt_idx" ON "ScraperUsageLog"("blocked", "createdAt");

-- CreateIndex
CREATE INDEX "ScraperUsageLog_userId_createdAt_idx" ON "ScraperUsageLog"("userId", "createdAt");
