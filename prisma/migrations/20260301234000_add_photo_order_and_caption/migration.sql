-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ItemPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ItemPhoto" ("createdAt", "filePath", "id", "itemId") SELECT "createdAt", "filePath", "id", "itemId" FROM "ItemPhoto";
DROP TABLE "ItemPhoto";
ALTER TABLE "new_ItemPhoto" RENAME TO "ItemPhoto";
CREATE INDEX "ItemPhoto_itemId_idx" ON "ItemPhoto"("itemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
