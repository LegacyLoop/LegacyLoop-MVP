-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "description" TEXT,
    "condition" TEXT,
    "purchasePrice" REAL,
    "purchaseDate" DATETIME,
    "saleMethod" TEXT NOT NULL DEFAULT 'BOTH',
    "saleZip" TEXT,
    "saleRadiusMi" INTEGER NOT NULL DEFAULT 25,
    "megabotUsed" BOOLEAN NOT NULL DEFAULT false,
    "listingPrice" REAL,
    "shippingWeight" REAL,
    "shippingLength" REAL,
    "shippingWidth" REAL,
    "shippingHeight" REAL,
    "isFragile" BOOLEAN NOT NULL DEFAULT false,
    "shippingPreference" TEXT NOT NULL DEFAULT 'BUYER_PAYS',
    "story" TEXT,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("condition", "createdAt", "description", "id", "listingPrice", "megabotUsed", "projectId", "purchaseDate", "purchasePrice", "saleMethod", "saleRadiusMi", "saleZip", "status", "story", "title", "userId") SELECT "condition", "createdAt", "description", "id", "listingPrice", "megabotUsed", "projectId", "purchaseDate", "purchasePrice", "saleMethod", "saleRadiusMi", "saleZip", "status", "story", "title", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_userId_idx" ON "Item"("userId");
CREATE INDEX "Item_projectId_idx" ON "Item"("projectId");
CREATE TABLE "new_ShipmentLabel" (
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
    "deliveryMethod" TEXT NOT NULL DEFAULT 'print',
    "estimatedDays" INTEGER,
    "statusHistory" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipmentLabel_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShipmentLabel" ("carrier", "createdAt", "fromAddressJson", "id", "itemId", "labelUrl", "qrCodeUrl", "rate", "service", "status", "toAddressJson", "trackingNumber", "trackingUrl", "weight") SELECT "carrier", "createdAt", "fromAddressJson", "id", "itemId", "labelUrl", "qrCodeUrl", "rate", "service", "status", "toAddressJson", "trackingNumber", "trackingUrl", "weight" FROM "ShipmentLabel";
DROP TABLE "ShipmentLabel";
ALTER TABLE "new_ShipmentLabel" RENAME TO "ShipmentLabel";
CREATE INDEX "ShipmentLabel_itemId_idx" ON "ShipmentLabel"("itemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
