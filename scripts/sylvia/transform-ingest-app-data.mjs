// CMD-W17-L1-APP-DATA-TRANSFORM-INGEST · ★ HEADLINE
// LAW #38 HARD GUARD · read-only app reads · write-only sylvia_corpus_queue
// Schema empirical (verified pre-author 2026-05-28):
//   sylvia_corpus_queue (id PK, sessionId, verticalId, domain, payload, status, attemptCount, ...)
// Dedup gate: deterministic id = `w17-l1-{table}-{app_id}` · idempotent re-runs

import { createClient } from "@libsql/client";
import { createHash } from "node:crypto";

const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL;
const c = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

const RUN_TAG = "W17-L1-transform-ingest-" + new Date().toISOString().slice(0, 10);
const SESSION_ID = RUN_TAG;

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function hash16(s) {
  return createHash("sha256").update(String(s)).digest("hex").slice(0, 16);
}

function classifyEventLog(eventType) {
  if (!eventType) return null;
  if (eventType.startsWith("PRICING_") || eventType.startsWith("PRICEBOT_")) return "V9";
  if (eventType === "SHIPPING_QUOTED" || eventType === "DEMAND_SCORE") return "V8";
  if (eventType.startsWith("BUYERBOT_") || eventType === "GARAGE_SALE_V9_CALC") return "V9";
  if (eventType.startsWith("MEGABOT_") || eventType === "BOT_AI_ROUTING") return "V9";
  if (eventType.startsWith("AGENT_AI_") || eventType === "ANALYZED" || eventType === "ANALYZED_FORCE") return "V9";
  return null; // SKIP class: STATUS_CHANGE, ITEM_UPDATED, BOT_SEQUENCE, LISTBOT_RUN, etc.
}

function classifyItem(category) {
  if (!category) return "V9";
  const k = String(category).toLowerCase();
  if (/vehicle|car|auto|truck/.test(k)) return "V8";
  if (/coin|grading|hallmark/.test(k)) return "V11";
  if (/antique/.test(k)) return "V1";
  return "V9";
}

const counters = {
  read: 0,
  skipped_class: 0,
  skipped_dedup: 0,
  inserted: 0,
  errors: 0,
  by_vertical: {},
  by_table: {},
};

async function existsById(id) {
  const r = await c.execute({
    sql: "SELECT 1 FROM sylvia_corpus_queue WHERE id = ? LIMIT 1",
    args: [id],
  });
  return r.rows.length > 0;
}

async function existsV9eBayUrl(url) {
  if (!url) return false;
  const r = await c.execute({
    sql: "SELECT 1 FROM sylvia_corpus_queue WHERE verticalId = 'V9' AND payload LIKE ? LIMIT 1",
    args: ["%" + url + "%"],
  });
  return r.rows.length > 0;
}

async function insertRow({ id, verticalId, domain, payload }) {
  await c.execute({
    sql: `INSERT INTO sylvia_corpus_queue
          (id, sessionId, verticalId, domain, payload, status, attemptCount, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, 'PENDING', 0, datetime('now'), datetime('now'))`,
    args: [id, SESSION_ID, verticalId, domain, payload],
  });
}

function bumpCounters(table, verticalId) {
  counters.inserted++;
  counters.by_vertical[verticalId] = (counters.by_vertical[verticalId] || 0) + 1;
  counters.by_table[table] = (counters.by_table[table] || 0) + 1;
}

// ============ Item (28 rows) ============
console.log("=== Item ===");
const items = (await c.execute(
  "SELECT id, title, condition, aiWeightLbs, aiDimsEstimate, aiShippingDifficulty, aiShippingNotes, aiShippingConfidence FROM Item",
)).rows;
for (const it of items) {
  counters.read++;
  const vid = classifyItem(it.condition);
  const id = `w17-l1-Item-${it.id}`;
  if (await existsById(id)) { counters.skipped_dedup++; continue; }
  const payload = JSON.stringify({
    title: it.title,
    condition: it.condition,
    enrichment: {
      aiWeightLbs: it.aiWeightLbs,
      aiDimsEstimate: it.aiDimsEstimate,
      aiShippingDifficulty: it.aiShippingDifficulty,
      aiShippingNotes: it.aiShippingNotes,
      aiShippingConfidence: it.aiShippingConfidence,
    },
    provenance: { app_table: "Item", app_id: it.id, ingested_via: RUN_TAG },
  });
  try {
    await insertRow({ id, verticalId: vid, domain: "app-data-item", payload });
    bumpCounters("Item", vid);
  } catch (e) {
    counters.errors++;
    console.error("Item err", it.id, e.message);
  }
}

// ============ MarketComp (72 rows · richest density · V9 eBay dedup gate) ============
console.log("=== MarketComp ===");
const comps = (await c.execute(
  "SELECT id, itemId, platform, title, price, currency, url, shipping FROM MarketComp",
)).rows;
for (const mc of comps) {
  counters.read++;
  const vid = "V9";
  const id = `w17-l1-MarketComp-${mc.id}`;
  if (await existsById(id)) { counters.skipped_dedup++; continue; }
  // V9 eBay sourceUrl overlap gate (against WF77 W13-T1 seeded 600)
  if (mc.platform && String(mc.platform).toLowerCase().includes("ebay") && mc.url) {
    if (await existsV9eBayUrl(mc.url)) {
      counters.skipped_dedup++;
      continue;
    }
  }
  const payload = JSON.stringify({
    platform: mc.platform,
    title: mc.title,
    price: mc.price,
    currency: mc.currency,
    url: mc.url,
    shipping: mc.shipping,
    provenance: { app_table: "MarketComp", app_id: mc.id, itemId: mc.itemId, ingested_via: RUN_TAG },
  });
  try {
    await insertRow({ id, verticalId: vid, domain: "app-data-marketcomp", payload });
    bumpCounters("MarketComp", vid);
  } catch (e) {
    counters.errors++;
    console.error("MarketComp err", mc.id, e.message);
  }
}

// ============ AiResult (27 rows) ============
console.log("=== AiResult ===");
const ais = (await c.execute(
  "SELECT id, itemId, rawJson, confidence FROM AiResult",
)).rows;
for (const ar of ais) {
  counters.read++;
  const id = `w17-l1-AiResult-${ar.id}`;
  if (await existsById(id)) { counters.skipped_dedup++; continue; }
  const payload = JSON.stringify({
    rawJson: ar.rawJson,
    confidence: ar.confidence,
    provenance: { app_table: "AiResult", app_id: ar.id, itemId: ar.itemId, ingested_via: RUN_TAG },
  });
  try {
    await insertRow({ id, verticalId: "V9", domain: "app-data-airesult", payload });
    bumpCounters("AiResult", "V9");
  } catch (e) {
    counters.errors++;
  }
}

// ============ Valuation (27 rows) ============
console.log("=== Valuation ===");
const vals = (await c.execute(
  "SELECT id, itemId, low, mid, high, confidence, source, rationale FROM Valuation",
)).rows;
for (const v of vals) {
  counters.read++;
  const id = `w17-l1-Valuation-${v.id}`;
  if (await existsById(id)) { counters.skipped_dedup++; continue; }
  const payload = JSON.stringify({
    low: v.low,
    mid: v.mid,
    high: v.high,
    confidence: v.confidence,
    source: v.source,
    rationale: v.rationale,
    provenance: { app_table: "Valuation", app_id: v.id, itemId: v.itemId, ingested_via: RUN_TAG },
  });
  try {
    await insertRow({ id, verticalId: "V9", domain: "app-data-valuation", payload });
    bumpCounters("Valuation", "V9");
  } catch (e) {
    counters.errors++;
  }
}

// ============ EventLog (2,272 rows · dominant) ============
console.log("=== EventLog (2,272 rows · longest leg) ===");
const events = (await c.execute(
  "SELECT id, eventType, payload, createdAt FROM EventLog",
)).rows;
for (const ev of events) {
  counters.read++;
  const vid = classifyEventLog(ev.eventType);
  if (!vid) {
    counters.skipped_class++;
    continue;
  }
  const id = `w17-l1-EventLog-${ev.id}`;
  if (await existsById(id)) {
    counters.skipped_dedup++;
    continue;
  }
  const parsed = safeParseJSON(ev.payload);
  const payload = JSON.stringify({
    eventType: ev.eventType,
    payload: parsed ?? ev.payload,
    appCreatedAt: ev.createdAt,
    provenance: { app_table: "EventLog", app_id: ev.id, ingested_via: RUN_TAG },
  });
  try {
    await insertRow({ id, verticalId: vid, domain: "app-data-eventlog", payload });
    bumpCounters("EventLog", vid);
  } catch (e) {
    counters.errors++;
  }
}

// ============ BuyerLead (10 rows · PII-redacted) ============
console.log("=== BuyerLead ===");
const leads = (await c.execute(
  "SELECT id, itemId, matchScore, aiConfidence, responseText, platform, urgency FROM BuyerLead",
)).rows;
for (const bl of leads) {
  counters.read++;
  const id = `w17-l1-BuyerLead-${bl.id}`;
  if (await existsById(id)) { counters.skipped_dedup++; continue; }
  const payload = JSON.stringify({
    matchScore: bl.matchScore,
    aiConfidence: bl.aiConfidence,
    responseTextHash: hash16(bl.responseText || ""),
    platform: bl.platform,
    urgency: bl.urgency,
    provenance: { app_table: "BuyerLead", app_id: bl.id, itemId: bl.itemId, ingested_via: RUN_TAG, pii_redacted: true },
  });
  try {
    await insertRow({ id, verticalId: "V9", domain: "app-data-buyerlead", payload });
    bumpCounters("BuyerLead", "V9");
  } catch (e) {
    counters.errors++;
  }
}

// ============ ScraperUsageLog (8 rows) ============
console.log("=== ScraperUsageLog ===");
const sul = (await c.execute(
  "SELECT id, botName, slug, tier, payloadJson, compsReturned, cost, durationMs FROM ScraperUsageLog",
)).rows;
for (const s of sul) {
  counters.read++;
  const id = `w17-l1-ScraperUsageLog-${s.id}`;
  if (await existsById(id)) { counters.skipped_dedup++; continue; }
  const parsed = safeParseJSON(s.payloadJson);
  const payload = JSON.stringify({
    botName: s.botName,
    slug: s.slug,
    tier: s.tier,
    payload: parsed ?? s.payloadJson,
    compsReturned: s.compsReturned,
    cost: s.cost,
    durationMs: s.durationMs,
    provenance: { app_table: "ScraperUsageLog", app_id: s.id, ingested_via: RUN_TAG },
  });
  try {
    await insertRow({ id, verticalId: "V9", domain: "app-data-scraperusagelog", payload });
    bumpCounters("ScraperUsageLog", "V9");
  } catch (e) {
    counters.errors++;
  }
}

// ============ Final report ============
console.log("\n=== FINAL REPORT ===");
console.log(JSON.stringify({ run_tag: RUN_TAG, counters }, null, 2));
