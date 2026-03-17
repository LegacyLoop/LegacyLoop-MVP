-- CreateTable
CREATE TABLE "ReconBot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "platformsJson" TEXT NOT NULL DEFAULT '["facebook","ebay","craigslist"]',
    "searchRadius" INTEGER NOT NULL DEFAULT 50,
    "scanFrequency" INTEGER NOT NULL DEFAULT 6,
    "competitorCount" INTEGER NOT NULL DEFAULT 0,
    "lowestPrice" REAL,
    "highestPrice" REAL,
    "averagePrice" REAL,
    "medianPrice" REAL,
    "latestCompetitorsJson" TEXT NOT NULL DEFAULT '[]',
    "currentStatus" TEXT NOT NULL DEFAULT 'ANALYZING',
    "recommendation" TEXT,
    "confidenceScore" REAL,
    "lastScan" DATETIME,
    "nextScan" DATETIME,
    "scansCompleted" INTEGER NOT NULL DEFAULT 0,
    "alertsSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReconBot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReconBot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReconAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconBotId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionable" BOOLEAN NOT NULL DEFAULT true,
    "suggestedAction" TEXT,
    "triggerDataJson" TEXT NOT NULL DEFAULT '{}',
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" DATETIME,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" DATETIME,
    "actionTaken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReconAlert_reconBotId_fkey" FOREIGN KEY ("reconBotId") REFERENCES "ReconBot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataCollectionConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dataCollection" BOOLEAN NOT NULL DEFAULT false,
    "aiTraining" BOOLEAN NOT NULL DEFAULT false,
    "marketResearch" BOOLEAN NOT NULL DEFAULT false,
    "anonymousSharing" BOOLEAN NOT NULL DEFAULT false,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "consentedAt" DATETIME,
    "revokedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DataCollectionConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReconBot_userId_idx" ON "ReconBot"("userId");

-- CreateIndex
CREATE INDEX "ReconBot_itemId_idx" ON "ReconBot"("itemId");

-- CreateIndex
CREATE INDEX "ReconBot_isActive_idx" ON "ReconBot"("isActive");

-- CreateIndex
CREATE INDEX "ReconAlert_reconBotId_idx" ON "ReconAlert"("reconBotId");

-- CreateIndex
CREATE INDEX "ReconAlert_viewed_idx" ON "ReconAlert"("viewed");

-- CreateIndex
CREATE INDEX "ReconAlert_dismissed_idx" ON "ReconAlert"("dismissed");

-- CreateIndex
CREATE UNIQUE INDEX "DataCollectionConsent_userId_key" ON "DataCollectionConsent"("userId");

-- CreateIndex
CREATE INDEX "DataCollectionConsent_userId_idx" ON "DataCollectionConsent"("userId");
