#!/usr/bin/env node
// scripts/prod-prisma-push-sylvia-episodic.mjs
//
// CMD-PROD-PRISMA-PUSH-SYLVIA-EPISODIC V20 v2.1 R29 P78 · 2026-05-16
//
// BINDING #6 OP-B canonical · production Turso sync for SylviaEpisodic model #54
// Pattern source: May 8 R22.5 (SellingPipeline 17/17 stmts proven)
//
// Schema: prisma/schema.prisma L1367-L1404
// Table name (per @@map): sylvia_episodic (snake_case)
// Indexes follow Prisma convention: <table>_<field>_idx
//
// Usage:
//   node --env-file=.env scripts/prod-prisma-push-sylvia-episodic.mjs --dry-run
//   node --env-file=.env scripts/prod-prisma-push-sylvia-episodic.mjs --live
//
// Default: --dry-run (prints DDL · zero writes)
// --live requires CEO §5.X Gate 1 ack before invoke
//
// BINDING #5 honored: TURSO_AUTH_TOKEN read via process.env (env-file pattern · zero cat)
// BINDING #6 honored: production-side libsql direct execute (OP-B canonical)

import { createClient } from "@libsql/client";

const DRY_RUN = !process.argv.includes("--live");
const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("[FATAL] TURSO_CONNECTION_URL + TURSO_AUTH_TOKEN required (see .env)");
  process.exit(2);
}

const client = createClient({ url, authToken });

// DDL · 6 stmts · table + 5 indexes
// Table name: sylvia_episodic per @@map directive
// Index naming: <table>_<field>_idx per Prisma convention
const DDL = [
  // 1. CREATE TABLE sylvia_episodic
  `CREATE TABLE IF NOT EXISTS "sylvia_episodic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "itemId" TEXT,
    "sylviaMemoryId" TEXT,
    "payload" TEXT NOT NULL,
    "causedById" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("sylviaMemoryId") REFERENCES "sylvia_memory" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("causedById") REFERENCES "sylvia_episodic" ("id") ON DELETE SET NULL
  )`,
  // 2-6. CREATE INDEX (5 indexes per @@index directives)
  `CREATE INDEX IF NOT EXISTS "sylvia_episodic_sessionId_idx" ON "sylvia_episodic" ("sessionId")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_episodic_timestamp_idx" ON "sylvia_episodic" ("timestamp")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_episodic_eventType_idx" ON "sylvia_episodic" ("eventType")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_episodic_userId_idx" ON "sylvia_episodic" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "sylvia_episodic_causedById_idx" ON "sylvia_episodic" ("causedById")`,
];

async function probe() {
  // Pre-flight: verify Turso reachable
  const r = await client.execute("SELECT 1 AS ok");
  if (r.rows[0]?.ok !== 1) throw new Error("Turso probe failed");

  // Check if table already exists
  const t = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='sylvia_episodic'`
  );

  // Check sylvia_memory dependency exists (FK target)
  const dep = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='sylvia_memory'`
  );

  return { exists: t.rows.length > 0, depExists: dep.rows.length > 0 };
}

async function main() {
  console.log(`[mode] ${DRY_RUN ? "DRY-RUN" : "LIVE"}`);
  const pre = await probe();
  console.log(`[pre] sylvia_episodic exists: ${pre.exists}`);
  console.log(`[pre] sylvia_memory (FK dep) exists: ${pre.depExists}`);

  if (!pre.depExists) {
    console.warn(
      "[WARN] sylvia_memory table absent · FK on sylviaMemoryId will be soft (libsql defers FK enforcement) · proceed acceptable"
    );
  }

  if (DRY_RUN) {
    console.log("\n[dry-run] DDL to execute:");
    DDL.forEach((stmt, i) => console.log(`\n[${i + 1}/${DDL.length}]\n${stmt}`));
    console.log("\n[dry-run] Zero writes performed. Re-run with --live post-CEO-ack.");
    return;
  }

  // LIVE mode
  console.log("\n[live] executing DDL...");
  let success = 0;
  for (const [i, stmt] of DDL.entries()) {
    try {
      const r = await client.execute(stmt);
      console.log(`[live ${i + 1}/${DDL.length}] OK · rowsAffected=${r.rowsAffected ?? 0}`);
      success++;
    } catch (err) {
      console.error(`[live ${i + 1}/${DDL.length}] FAILED · ${err.message}`);
      throw err;
    }
  }

  // Post-flight verify
  const post = await probe();
  if (!post.exists) throw new Error("Post-flight: sylvia_episodic still absent");

  // Verify indexes
  const idx = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='sylvia_episodic' ORDER BY name`
  );
  console.log(`\n[verify] sylvia_episodic indexes: ${idx.rows.length}`);
  idx.rows.forEach((r) => console.log(`  - ${r.name}`));

  console.log(
    `\n[OK] ${success}/${DDL.length} stmts executed · table + indexes live in production Turso`
  );
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
