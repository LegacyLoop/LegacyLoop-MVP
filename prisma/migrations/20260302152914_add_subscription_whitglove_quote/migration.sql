-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0.05,
    "limitsJson" TEXT NOT NULL DEFAULT '{}',
    "featuresJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billingPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "currentPeriodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhiteGloveProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "additionalFees" REAL NOT NULL DEFAULT 0,
    "totalUpfront" REAL NOT NULL,
    "commission" REAL NOT NULL DEFAULT 0.30,
    "estimatedValue" REAL,
    "actualRevenue" REAL NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "estimatedItems" INTEGER NOT NULL DEFAULT 0,
    "projectManager" TEXT,
    "consultDate" DATETIME,
    "startDate" DATETIME,
    "completionDate" DATETIME,
    "estimatedWeeks" INTEGER,
    "includedServicesJson" TEXT NOT NULL DEFAULT '[]',
    "addOnServicesJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'QUOTE_REQUESTED',
    "contractUrl" TEXT,
    "inventoryUrl" TEXT,
    "archiveUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhiteGloveProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "squareFeet" INTEGER,
    "estimatedItems" TEXT NOT NULL,
    "requestedTier" TEXT NOT NULL,
    "addOnsJson" TEXT NOT NULL DEFAULT '[]',
    "urgency" TEXT NOT NULL DEFAULT 'flexible',
    "specialItems" TEXT,
    "accessConcerns" TEXT,
    "additionalNotes" TEXT,
    "quotedPrice" REAL,
    "quotedCommission" REAL,
    "quoteSentAt" DATETIME,
    "quoteSentBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "WhiteGloveProject_userId_idx" ON "WhiteGloveProject"("userId");

-- CreateIndex
CREATE INDEX "ServiceQuote_email_idx" ON "ServiceQuote"("email");
