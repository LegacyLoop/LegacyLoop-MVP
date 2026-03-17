/*
  Warnings:

  - You are about to drop the column `botScore` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `flags` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `senderName` on the `Message` table. All the data in the column will be lost.
  - Added the required column `conversationId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'direct',
    "botScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("condition", "createdAt", "description", "id", "purchaseDate", "purchasePrice", "saleMethod", "saleRadiusMi", "saleZip", "status", "title", "userId") SELECT "condition", "createdAt", "description", "id", "purchaseDate", "purchasePrice", "saleMethod", "saleRadiusMi", "saleZip", "status", "title", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_userId_idx" ON "Item"("userId");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "id") SELECT "content", "createdAt", "id" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Conversation_itemId_idx" ON "Conversation"("itemId");
