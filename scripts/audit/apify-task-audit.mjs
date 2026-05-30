#!/usr/bin/env node
// CMD-W27-B audit-only · enumerate Apify actor-tasks + underlying actor pricingModel.
// Read-only · 0 actor runs · no DML. Outputs JSON to stdout for ingest into audit doc.
//
// Usage:
//   node --env-file=.env scripts/audit/apify-task-audit.mjs
//
// References:
//   Apify API · GET /v2/actor-tasks (list user's tasks) · paginated
//   Apify API · GET /v2/acts/{actorId} (actor metadata incl. pricingInfos)

const TOKEN = process.env.APIFY_API_TOKEN;
if (!TOKEN) {
  console.error("Missing APIFY_API_TOKEN");
  process.exit(2);
}

const BASE = "https://api.apify.com/v2";

async function apiGet(path, params = {}) {
  const qs = new URLSearchParams({ token: TOKEN, ...params }).toString();
  const url = `${BASE}${path}?${qs}`;
  const r = await fetch(url);
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`GET ${path} HTTP ${r.status} ${body.slice(0, 200)}`);
  }
  return (await r.json()).data;
}

async function listAllTasks() {
  const out = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const page = await apiGet("/actor-tasks", { limit: String(limit), offset: String(offset), desc: "false" });
    const items = page.items || [];
    out.push(...items);
    if (items.length < limit) break;
    offset += limit;
  }
  return out;
}

function classifyPricingModel(actor) {
  const infos = actor.pricingInfos || [];
  const current = infos[infos.length - 1] || infos[0] || {};
  const model = current.pricingModel || "UNKNOWN";
  const usd = current.pricePerUnitUsd ?? current.flatPricePerMonthUsd ?? null;
  let burnRisk = "UNKNOWN";
  switch (model) {
    case "FREE":
      burnRisk = "NONE";
      break;
    case "FLAT_PRICE_PER_MONTH":
      burnRisk = "LOW";
      break;
    case "PRICE_PER_DATASET_ITEM":
    case "PAY_PER_RESULT":
      burnRisk = "MEDIUM";
      break;
    case "PAY_PER_EVENT":
      burnRisk = "MEDIUM";
      break;
    case "PRICE_PER_USAGE_USD":
    case "PAY_PER_USAGE":
    case "COMPUTE":
      burnRisk = "HIGH";
      break;
  }
  return { model, unitPriceUsd: usd, burnRisk };
}

const tasks = await listAllTasks();

// Dedup actor lookups
const actorIds = [...new Set(tasks.map((t) => t.actId).filter(Boolean))];
const actorCache = new Map();
for (const id of actorIds) {
  try {
    const actor = await apiGet(`/acts/${encodeURIComponent(id)}`);
    actorCache.set(id, actor);
  } catch (e) {
    actorCache.set(id, { name: "(fetch failed)", username: "?", _err: e.message });
  }
}

const rows = tasks.map((t) => {
  const actor = actorCache.get(t.actId) || {};
  const pricing = classifyPricingModel(actor);
  return {
    taskId: t.id,
    taskName: t.name,
    actorId: t.actId,
    actorName: actor.name ?? "?",
    actorUsername: actor.username ?? "?",
    pricingModel: pricing.model,
    unitPriceUsd: pricing.unitPriceUsd,
    burnRisk: pricing.burnRisk,
    createdAt: t.createdAt,
    modifiedAt: t.modifiedAt,
  };
});

rows.sort((a, b) => {
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3, UNKNOWN: 4 };
  return (order[a.burnRisk] ?? 9) - (order[b.burnRisk] ?? 9) || a.taskName.localeCompare(b.taskName);
});

const summary = {
  totalTasks: rows.length,
  byBurnRisk: rows.reduce((acc, r) => {
    acc[r.burnRisk] = (acc[r.burnRisk] ?? 0) + 1;
    return acc;
  }, {}),
  byPricingModel: rows.reduce((acc, r) => {
    acc[r.pricingModel] = (acc[r.pricingModel] ?? 0) + 1;
    return acc;
  }, {}),
};

console.log(JSON.stringify({ summary, tasks: rows }, null, 2));
