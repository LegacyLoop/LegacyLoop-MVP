#!/usr/bin/env node
// CMD-W24-L2 · Turso prod table existence probe (read-only).
// Usage: node --env-file=.env.turso.tmp scripts/sylvia/probe-turso-tables.mjs
// BINDING #6 OP-B · libsql client direct · no Prisma.

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL/TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN");
  process.exit(2);
}

const client = createClient({ url, authToken });

const TARGETS = ["sylvia_memory", "sylvia_episodic", "sylvia_corpus_queue"];

const r = await client.execute({
  sql: `SELECT name, type FROM sqlite_master WHERE type IN ('table','index') AND name LIKE 'sylvia_%' ORDER BY name`,
  args: [],
});

const present = new Set(r.rows.filter((row) => row.type === "table").map((row) => row.name));

console.log("=== sylvia_* objects in Turso prod ===");
for (const row of r.rows) console.log(`  ${row.type.padEnd(6)} ${row.name}`);

console.log("\n=== target table check ===");
for (const t of TARGETS) console.log(`  ${present.has(t) ? "PRESENT" : "ABSENT "} ${t}`);

const missing = TARGETS.filter((t) => !present.has(t));
if (missing.length > 0) {
  console.log(`\nMISSING: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("\nAll target tables present.");
process.exit(0);
