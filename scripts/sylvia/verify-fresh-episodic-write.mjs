#!/usr/bin/env node
// CMD-W24-L2 FIX 4 · Verify fresh episodic write lands in Turso prod (not JSONL fallback).
// Inserts one sentinel row tagged eventType='w24_l2_verify' · reads it back · cites row.
// Usage: node --env-file=.env.turso.tmp scripts/sylvia/verify-fresh-episodic-write.mjs

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing Turso env");
  process.exit(2);
}

const client = createClient({ url, authToken });

const id = "vfy_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const nowIso = new Date().toISOString().replace("T", " ").slice(0, 23);
const sessionId = "w24-l2-verify";
const payload = JSON.stringify({ source: "FIX 4 sentinel", note: "verifies sylvia_memory + sylvia_episodic round-trip" });

console.log(`Inserting sentinel row id=${id} sessionId=${sessionId}`);

const insertRes = await client.execute({
  sql: `INSERT INTO sylvia_episodic
        (id, timestamp, sessionId, eventType, payload, source, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
  args: [id, nowIso, sessionId, "w24_l2_verify", payload, "direct"],
});
console.log(`  rowsAffected: ${insertRes.rowsAffected}`);

const readRes = await client.execute({
  sql: `SELECT id, timestamp, sessionId, eventType, source FROM sylvia_episodic WHERE id = ?`,
  args: [id],
});

if (readRes.rows.length === 1) {
  const r = readRes.rows[0];
  console.log("\nRound-trip ✓");
  console.log(`  id:        ${r.id}`);
  console.log(`  timestamp: ${r.timestamp}`);
  console.log(`  sessionId: ${r.sessionId}`);
  console.log(`  eventType: ${r.eventType}`);
  console.log(`  source:    ${r.source}`);
} else {
  console.error("Round-trip ✗ sentinel not found");
  process.exit(1);
}

const countRes = await client.execute({
  sql: `SELECT COUNT(*) AS n FROM sylvia_episodic`,
  args: [],
});
console.log(`\nTotal sylvia_episodic rows in Turso prod: ${countRes.rows[0].n}`);

const w24Count = await client.execute({
  sql: `SELECT COUNT(*) AS n FROM sylvia_episodic WHERE eventType = 'w24_l2_verify'`,
  args: [],
});
console.log(`Sentinel rows (w24_l2_verify): ${w24Count.rows[0].n}`);

process.exit(0);
