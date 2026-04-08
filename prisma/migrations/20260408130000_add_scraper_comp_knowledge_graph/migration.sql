-- CMD-SCRAPER-ENRICHMENT-E: ScraperComp knowledge graph
-- Persistent comp cache. Per-category TTL, dedupe by (slug, sourceUrl),
-- multi-bot contributor tracking, hit count for cache analytics.

-- CreateTable
CREATE TABLE "ScraperComp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourcePlatform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priceUsd" REAL,
    "soldPrice" REAL,
    "condition" TEXT,
    "category" TEXT,
    "keywordsJson" TEXT,
    "imageUrlsJson" TEXT,
    "metadataJson" TEXT,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL,
    "ttlExpiresAt" DATETIME NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "contributorBotsJson" TEXT,
    "firstContributedBy" TEXT,
    "qualityScore" REAL,
    "sourceItemId" TEXT,
    "sourceUserId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "ScraperComp_slug_sourceUrl_key" ON "ScraperComp"("slug", "sourceUrl");

-- CreateIndex
CREATE INDEX "ScraperComp_category_ttlExpiresAt_idx" ON "ScraperComp"("category", "ttlExpiresAt");

-- CreateIndex
CREATE INDEX "ScraperComp_slug_firstSeenAt_idx" ON "ScraperComp"("slug", "firstSeenAt");

-- CreateIndex
CREATE INDEX "ScraperComp_sourcePlatform_soldPrice_idx" ON "ScraperComp"("sourcePlatform", "soldPrice");

-- CreateIndex
CREATE INDEX "ScraperComp_sourceItemId_idx" ON "ScraperComp"("sourceItemId");

-- CreateIndex
CREATE INDEX "ScraperComp_sourceUserId_idx" ON "ScraperComp"("sourceUserId");
