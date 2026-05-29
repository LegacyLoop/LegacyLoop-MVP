#!/usr/bin/env node
// CMD-W19-L1 · one-time recovery · re-wrap FAILED L1 app-data payloads to corpus envelope
// LAW #38 HARD GUARD · write-only sylvia_corpus_queue · idempotent (entries-wrapper guard)
// Clones canonical envelope shape from bidirectional-sync-app-data.mjs (BINDING #16)

import { createClient } from "@libsql/client";

const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL;
const c = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

function renderBody(flat) {
  return Object.entries(flat)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("\n");
}

const sel = await c.execute({
  sql: "SELECT id, verticalId, domain, payload FROM sylvia_corpus_queue WHERE status='FAILED' AND lastError LIKE 'corpus.entries is not iterable%'",
  args: [],
});

let rewrapped = 0;
let skipped_already = 0;
let parse_errors = 0;

for (const r of sel.rows) {
  let flat;
  try {
    flat = JSON.parse(r.payload);
  } catch {
    parse_errors++;
    continue;
  }
  // Idempotency guard · already-wrapped rows skip
  if (flat && Array.isArray(flat.entries)) {
    skipped_already++;
    continue;
  }
  const envelope = {
    source: "scraper",
    corpusId: `app-data-${r.verticalId}`,
    domain: r.domain || r.verticalId,
    entries: [{
      id: r.id,
      title: flat.title || r.id,
      body: renderBody(flat),
      metadata: { verticalId: r.verticalId, ...flat },
    }],
  };
  await c.execute({
    sql: "UPDATE sylvia_corpus_queue SET payload=?, status='PENDING', attemptCount=0, lastError=NULL, claimedAt=NULL, claimedBy=NULL WHERE id=?",
    args: [JSON.stringify(envelope), r.id],
  });
  rewrapped++;
}

console.log(JSON.stringify({ rewrapped, skipped_already, parse_errors, total_scanned: sel.rows.length }, null, 2));
