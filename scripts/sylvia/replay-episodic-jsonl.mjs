#!/usr/bin/env node
// CMD-W24-L2 FIX 3 · Idempotent JSONL replay → Turso sylvia_episodic.
// Reads sylvia-data/audit/episodic-YYYY-MM-DD.jsonl, inserts to Turso.
// Deterministic id = sha256(timestamp|sessionId|eventType|payload|source).slice(0,32)
// → INSERT OR IGNORE = idempotent. Re-runnable.
// Counts: total / accepted / skipped_duplicate / rejected_malformed. No silent drop.
// Usage: node --env-file=.env.turso.tmp scripts/sylvia/replay-episodic-jsonl.mjs [--dry-run]
// BINDING #6 OP-B · W22-L1 no-silent-drop lesson.

import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

const DRY_RUN = process.argv.includes("--dry-run");
const AUDIT_DIR = join(process.cwd(), "sylvia-data", "audit");
const BATCH_SIZE = 100;

const url = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing Turso env");
  process.exit(2);
}

const client = createClient({ url, authToken });

function deterministicId(entry) {
  const key = [
    entry.timestamp,
    entry.sessionId,
    entry.eventType,
    typeof entry.payload === "string" ? entry.payload : JSON.stringify(entry.payload),
    entry.source,
  ].join("|");
  return "rpl_" + createHash("sha256").update(key).digest("hex").slice(0, 25);
}

function validate(entry) {
  if (!entry || typeof entry !== "object") return "not-object";
  if (typeof entry.timestamp !== "string") return "bad-timestamp";
  if (typeof entry.sessionId !== "string") return "bad-sessionId";
  if (typeof entry.eventType !== "string") return "bad-eventType";
  if (entry.payload == null) return "no-payload";
  if (typeof entry.source !== "string") return "bad-source";
  return null;
}

const files = (await readdir(AUDIT_DIR))
  .filter((f) => f.startsWith("episodic-") && f.endsWith(".jsonl"))
  .sort();

console.log(`Found ${files.length} JSONL files in ${AUDIT_DIR}`);
if (DRY_RUN) console.log("DRY RUN · no inserts will be executed");

let total = 0;
let accepted = 0;
let skippedDuplicate = 0;
const rejected = []; // {file, line, reason}

let batch = [];
async function flush() {
  if (batch.length === 0) return;
  if (DRY_RUN) {
    batch = [];
    return;
  }
  const stmts = batch.map((row) => ({
    sql: `INSERT OR IGNORE INTO sylvia_episodic
          (id, timestamp, sessionId, eventType, userId, itemId, sylviaMemoryId, payload, causedById, source, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    args: [
      row.id,
      row.timestamp,
      row.sessionId,
      row.eventType,
      row.userId ?? null,
      row.itemId ?? null,
      row.sylviaMemoryId ?? null,
      row.payload,
      row.causedById ?? null,
      row.source,
    ],
  }));
  const results = await client.batch(stmts, "write");
  for (const r of results) {
    if (r.rowsAffected === 1) accepted++;
    else skippedDuplicate++;
  }
  batch = [];
}

for (const file of files) {
  const path = join(AUDIT_DIR, file);
  const text = await readFile(path, "utf8");
  const lines = text.split("\n");
  let fileTotal = 0;
  let fileAccepted = 0;
  let fileSkipped = 0;
  let fileRejected = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    total++;
    fileTotal++;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      rejected.push({ file, line: i + 1, reason: "json-parse" });
      fileRejected++;
      continue;
    }
    const v = validate(entry);
    if (v) {
      rejected.push({ file, line: i + 1, reason: v });
      fileRejected++;
      continue;
    }

    const payloadStr = typeof entry.payload === "string" ? entry.payload : JSON.stringify(entry.payload);
    const row = {
      id: deterministicId(entry),
      timestamp: new Date(entry.timestamp).toISOString().replace("T", " ").slice(0, 23),
      sessionId: entry.sessionId,
      eventType: entry.eventType,
      userId: entry.userId ?? null,
      itemId: entry.itemId ?? null,
      sylviaMemoryId: entry.sylviaMemoryId ?? null,
      payload: payloadStr,
      causedById: entry.causedById ?? null,
      source: entry.source,
    };
    const before = { accepted, skippedDuplicate };
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      await flush();
      fileAccepted += accepted - before.accepted;
      fileSkipped += skippedDuplicate - before.skippedDuplicate;
    }
  }
  // flush remaining for file
  const before = { accepted, skippedDuplicate };
  await flush();
  fileAccepted += accepted - before.accepted;
  fileSkipped += skippedDuplicate - before.skippedDuplicate;

  console.log(
    `  ${file}: total=${fileTotal} accepted=${fileAccepted} skipped=${fileSkipped} rejected=${fileRejected}`,
  );
}

await flush();

console.log("\n=== REPLAY SUMMARY ===");
console.log(`  total rows scanned:     ${total}`);
console.log(`  accepted (inserted):    ${accepted}`);
console.log(`  skipped_duplicate:      ${skippedDuplicate}`);
console.log(`  rejected_malformed:     ${rejected.length}`);
const reconciled = accepted + skippedDuplicate + rejected.length;
console.log(`  reconciliation:         ${reconciled}/${total} ${reconciled === total ? "✓" : "✗ MISMATCH"}`);

if (rejected.length > 0) {
  console.log("\n=== REJECTED SAMPLE (first 10) ===");
  for (const r of rejected.slice(0, 10)) console.log(`  ${r.file}:${r.line} reason=${r.reason}`);
}

process.exit(reconciled === total ? 0 : 1);
