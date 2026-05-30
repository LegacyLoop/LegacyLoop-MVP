#!/usr/bin/env node
// CMD-W24-L2 FIX 2 · Create missing sylvia_memory table in Turso prod.
// Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
// Mirrors prisma/schema.prisma model SylviaMemory (L1302) exactly.
// Usage: node --env-file=.env.turso.tmp scripts/sylvia/create-sylvia-memory-table.mjs
// BINDING #6 OP-B · libsql client direct · CEO STOP-GATE prod write.

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL/TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN");
  process.exit(2);
}

const client = createClient({ url, authToken });

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS "sylvia_memory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "promptHash" TEXT NOT NULL,
  "promptLength" INTEGER NOT NULL,
  "agentName" TEXT NOT NULL,
  "classifier" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "chosenAlias" TEXT NOT NULL,
  "cascadeAttempted" TEXT NOT NULL,
  "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
  "costEstimateUsd" REAL NOT NULL,
  "costActualUsd" REAL NOT NULL DEFAULT 0,
  "ceilingTriggered" TEXT NOT NULL DEFAULT 'none',
  "durationMs" INTEGER NOT NULL,
  "tokensIn" INTEGER,
  "tokensOut" INTEGER,
  "responseText" TEXT,
  "responseHash" TEXT,
  "responseLength" INTEGER,
  "userId" TEXT,
  "itemId" TEXT,
  "errorClass" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "sylvia_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "sylvia_memory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
)`;

const INDICES = [
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_sessionId_idx" ON "sylvia_memory"("sessionId")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_promptHash_idx" ON "sylvia_memory"("promptHash")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_agentName_idx" ON "sylvia_memory"("agentName")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_userId_idx" ON "sylvia_memory"("userId")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_itemId_idx" ON "sylvia_memory"("itemId")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_classification_idx" ON "sylvia_memory"("classification")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_createdAt_idx" ON "sylvia_memory"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_memory_sessionId_createdAt_idx" ON "sylvia_memory"("sessionId", "createdAt")`,
];

console.log("Creating sylvia_memory table (idempotent)...");
await client.execute(CREATE_TABLE);
console.log("  table create: OK");

for (const sql of INDICES) {
  const name = sql.match(/"([^"]+_idx)"/)[1];
  await client.execute(sql);
  console.log(`  index create: ${name}: OK`);
}

const verify = await client.execute({
  sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='sylvia_memory'`,
  args: [],
});
console.log(`\nVerify: sylvia_memory ${verify.rows.length === 1 ? "PRESENT ✓" : "MISSING ✗"}`);

const idxCount = await client.execute({
  sql: `SELECT COUNT(*) AS n FROM sqlite_master WHERE type='index' AND tbl_name='sylvia_memory' AND name LIKE 'sylvia_memory_%'`,
  args: [],
});
console.log(`Verify: indices created = ${idxCount.rows[0].n}/${INDICES.length}`);

process.exit(verify.rows.length === 1 ? 0 : 1);
