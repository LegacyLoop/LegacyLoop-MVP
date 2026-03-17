-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "requestedFrom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromTier" TEXT,
    "toTier" TEXT,
    "changeType" TEXT NOT NULL,
    "amountPaid" REAL NOT NULL,
    "daysUsed" INTEGER NOT NULL,
    "daysRemaining" INTEGER NOT NULL,
    "proratedRefund" REAL NOT NULL,
    "creditIssued" REAL NOT NULL DEFAULT 0,
    "originalPeriodStart" DATETIME NOT NULL,
    "originalPeriodEnd" DATETIME NOT NULL,
    "changeDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "refundedAt" DATETIME,
    "refundMethod" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShipmentLabel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "fromAddressJson" TEXT NOT NULL,
    "toAddressJson" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "carrier" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "labelUrl" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "trackingUrl" TEXT,
    "qrCodeUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipmentLabel_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "SubscriptionChange_userId_idx" ON "SubscriptionChange"("userId");

-- CreateIndex
CREATE INDEX "ShipmentLabel_itemId_idx" ON "ShipmentLabel"("itemId");
