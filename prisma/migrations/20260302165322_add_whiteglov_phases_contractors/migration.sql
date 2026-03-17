-- CreateTable
CREATE TABLE "WhiteGlovePhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "phaseName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "tasksJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhiteGlovePhase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "WhiteGloveProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "serviceArea" TEXT NOT NULL DEFAULT 'Maine',
    "ratesJson" TEXT NOT NULL DEFAULT '{}',
    "rating" REAL NOT NULL DEFAULT 5.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContractorJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "completedDate" DATETIME,
    "cost" REAL NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractorJob_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WhiteGloveProject" (
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
    "teamJson" TEXT NOT NULL DEFAULT '{}',
    "currentPhase" TEXT NOT NULL DEFAULT 'CONSULTATION',
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
INSERT INTO "new_WhiteGloveProject" ("actualRevenue", "addOnServicesJson", "additionalFees", "address", "archiveUrl", "basePrice", "bedrooms", "city", "commission", "completionDate", "consultDate", "contractUrl", "createdAt", "estimatedItems", "estimatedValue", "estimatedWeeks", "id", "includedServicesJson", "inventoryUrl", "notes", "projectManager", "startDate", "state", "status", "tier", "totalUpfront", "updatedAt", "userId", "zip") SELECT "actualRevenue", "addOnServicesJson", "additionalFees", "address", "archiveUrl", "basePrice", "bedrooms", "city", "commission", "completionDate", "consultDate", "contractUrl", "createdAt", "estimatedItems", "estimatedValue", "estimatedWeeks", "id", "includedServicesJson", "inventoryUrl", "notes", "projectManager", "startDate", "state", "status", "tier", "totalUpfront", "updatedAt", "userId", "zip" FROM "WhiteGloveProject";
DROP TABLE "WhiteGloveProject";
ALTER TABLE "new_WhiteGloveProject" RENAME TO "WhiteGloveProject";
CREATE INDEX "WhiteGloveProject_userId_idx" ON "WhiteGloveProject"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WhiteGlovePhase_projectId_idx" ON "WhiteGlovePhase"("projectId");

-- CreateIndex
CREATE INDEX "Contractor_type_idx" ON "Contractor"("type");

-- CreateIndex
CREATE INDEX "ContractorJob_contractorId_idx" ON "ContractorJob"("contractorId");

-- CreateIndex
CREATE INDEX "ContractorJob_projectId_idx" ON "ContractorJob"("projectId");
