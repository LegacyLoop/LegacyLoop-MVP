-- CreateTable
CREATE TABLE "BuyerBot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMegaBot" BOOLEAN NOT NULL DEFAULT false,
    "platformsJson" TEXT NOT NULL DEFAULT '[]',
    "radius" INTEGER NOT NULL DEFAULT 50,
    "scansCompleted" INTEGER NOT NULL DEFAULT 0,
    "buyersFound" INTEGER NOT NULL DEFAULT 0,
    "outreachSent" INTEGER NOT NULL DEFAULT 0,
    "responsesReceived" INTEGER NOT NULL DEFAULT 0,
    "conversionsToSale" INTEGER NOT NULL DEFAULT 0,
    "lastScanAt" DATETIME,
    "nextScanAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerBot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'group_post',
    "sourceUrl" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerHandle" TEXT,
    "buyerEmail" TEXT,
    "searchingFor" TEXT,
    "maxBudget" REAL,
    "location" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "matchScore" INTEGER NOT NULL DEFAULT 75,
    "matchReason" TEXT,
    "aiConfidence" REAL NOT NULL DEFAULT 0.8,
    "botScore" INTEGER NOT NULL DEFAULT 75,
    "outreachStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "messageSent" TEXT,
    "contactedAt" DATETIME,
    "firstResponseAt" DATETIME,
    "responseText" TEXT,
    "viewedItem" BOOLEAN NOT NULL DEFAULT false,
    "madeOffer" BOOLEAN NOT NULL DEFAULT false,
    "offerAmount" REAL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerLead_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BuyerBot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemEngagementMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "botScans" INTEGER NOT NULL DEFAULT 0,
    "buyersFound" INTEGER NOT NULL DEFAULT 0,
    "outreachSent" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL,
    CONSTRAINT "ItemEngagementMetrics_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "referredEmail" TEXT,
    "code" TEXT NOT NULL,
    "rewardCredits" INTEGER NOT NULL DEFAULT 25,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BuyerBot_itemId_idx" ON "BuyerBot"("itemId");

-- CreateIndex
CREATE INDEX "BuyerLead_botId_idx" ON "BuyerLead"("botId");

-- CreateIndex
CREATE INDEX "BuyerLead_itemId_idx" ON "BuyerLead"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemEngagementMetrics_itemId_key" ON "ItemEngagementMetrics"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");
