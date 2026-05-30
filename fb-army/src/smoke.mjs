// fb-army · local fixture smoke · pure JS · ZERO network · ZERO npm install required
// Mirrors marketplace.ts + groups.ts + envelope.ts parser logic for contract verification

import { createHash } from "node:crypto";

function makeId(parts) {
  const h = createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
  return `fb-army-${h}`;
}

function parseListingHtml(html, query, maxItems) {
  if (!html || html.length < 500) return [];
  const titlePattern = /<span[^>]*(?:class="[^"]*x676frb[^"]*"|aria-label="[^"]+")[^>]*>([^<]{6,200})<\/span>/g;
  const pricePattern = /\$[\d,]+(?:\.\d{2})?/g;
  const linkPattern = /href="(\/marketplace\/item\/\d+\/[^"]*)"/g;
  const titles = [...html.matchAll(titlePattern)].map((m) => m[1].trim());
  const prices = [...html.matchAll(pricePattern)].map((m) => m[0]);
  const links = [...html.matchAll(linkPattern)].map((m) => `https://www.facebook.com${m[1]}`);
  const out = [];
  const seen = new Set();
  const count = Math.min(maxItems, Math.max(titles.length, links.length));
  for (let i = 0; i < count; i++) {
    const title = (titles[i] ?? "").slice(0, 200);
    if (!title) continue;
    const link = links[i] ?? "";
    const price = prices[i] ?? "";
    const id = makeId(["marketplace", query.city, query.query, link || title, String(i)]);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      title,
      body: `${title}\n\nPrice: ${price}\nCity: ${query.city}\nQuery: ${query.query}\nSource: ${link || "(no permalink)"}`,
      metadata: { surface: "fb-marketplace", query: query.query, city: query.city, price, permalink: link || null, scrapedAt: new Date().toISOString() },
    });
  }
  return out;
}

function stripTags(s) { return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " "); }

function parseGroupHtml(html, query, maxPosts) {
  if (!html || html.length < 500) return [];
  const postPattern = /<div[^>]*data-ad-comet-preview="message"[^>]*>([\s\S]{20,2000}?)<\/div>/g;
  const fallbackPattern = /<span[^>]*data-ad-rendering-role="story_message"[^>]*>([\s\S]{20,2000}?)<\/span>/g;
  const permalinkPattern = /href="(\/groups\/\d+\/posts\/\d+\/[^"]*)"/g;
  const rawPosts = [...html.matchAll(postPattern), ...html.matchAll(fallbackPattern)].map((m) => stripTags(m[1]).trim());
  const permalinks = [...html.matchAll(permalinkPattern)].map((m) => `https://www.facebook.com${m[1]}`);
  const out = [];
  const seen = new Set();
  const count = Math.min(maxPosts, rawPosts.length);
  for (let i = 0; i < count; i++) {
    const text = (rawPosts[i] ?? "").slice(0, 2000);
    if (!text) continue;
    const title = text.split(/[.!?\n]/)[0].trim().slice(0, 200);
    if (!title) continue;
    const link = permalinks[i] ?? "";
    const id = makeId(["groups", query.groupId, link || title, String(i)]);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      title,
      body: `${text}\n\nGroup: ${query.groupName ?? query.groupId}\nSource: ${link || "(no permalink)"}`,
      metadata: { surface: "fb-groups", groupId: query.groupId, groupName: query.groupName ?? null, permalink: link || null, scrapedAt: new Date().toISOString() },
    });
  }
  return out;
}

function buildEnvelope(args) {
  return {
    action: "phase_c_ingest",
    data: {
      source: args.source,
      corpusId: args.corpusId,
      verticalId: args.verticalId,
      domain: args.domain,
      sourceTier: "T2",
      batchSize: args.entries.length,
      emittedAt: new Date().toISOString(),
      sources: args.sources,
      entries: args.entries,
    },
  };
}

// Fixtures
const FIXTURE_MP = `<!DOCTYPE html><html><body>
<a href="/marketplace/item/9991111/foo"><span class="x676frb">Vintage Singer Sewing Machine</span></a>
<span>$45</span>
<a href="/marketplace/item/9992222/bar"><span class="x676frb">Antique Oak Rocking Chair</span></a>
<span>$120</span>
<a href="/marketplace/item/9993333/baz"><span class="x676frb">Estate Sale: Silver Hallmark Tea Set</span></a>
<span>$280</span>
</body></html>`.padEnd(700, " ");

const FIXTURE_GRP = `<!DOCTYPE html><html><body>
<div data-ad-comet-preview="message">Anyone know what this porcelain marking is worth? Estate sale find for $5 yesterday.</div>
<a href="/groups/12345/posts/9991/foo">link</a>
<div data-ad-comet-preview="message">Flipping update: scored a vintage typewriter at a yard sale, listed on Mercari, sold within hours.</div>
<a href="/groups/12345/posts/9992/bar">link</a>
</body></html>`.padEnd(700, " ");

const mpEntries = parseListingHtml(FIXTURE_MP, { query: "vintage", city: "boston" }, 10);
const grpEntries = parseGroupHtml(FIXTURE_GRP, { groupId: "12345", groupName: "test-group" }, 10);

const mpEnv = buildEnvelope({ source: "fb-army-marketplace", corpusId: "fb-army-marketplace-smoke", verticalId: "V9", domain: "fb-marketplace", sources: ["fb-army-marketplace"], entries: mpEntries });
const grpEnv = buildEnvelope({ source: "fb-army-groups", corpusId: "fb-army-groups-smoke", verticalId: "V10", domain: "fb-groups", sources: ["fb-army-groups"], entries: grpEntries });

console.log("=== FB-Army Smoke (fixture · no network · no npm install) ===");
console.log(`Marketplace entries: ${mpEntries.length}`);
mpEntries.forEach((e, i) => console.log(`  [${i}] id=${e.id} title=${JSON.stringify(e.title)}`));
console.log(`Groups entries: ${grpEntries.length}`);
grpEntries.forEach((e, i) => console.log(`  [${i}] id=${e.id} title=${JSON.stringify(e.title)}`));
console.log(`\n=== Envelope verify ===`);
console.log(`MP: action=${mpEnv.action} batchSize=${mpEnv.data.batchSize} verticalId=${mpEnv.data.verticalId} sourceTier=${mpEnv.data.sourceTier}`);
console.log(`GRP: action=${grpEnv.action} batchSize=${grpEnv.data.batchSize} verticalId=${grpEnv.data.verticalId} sourceTier=${grpEnv.data.sourceTier}`);
const ok = mpEntries.length > 0 && grpEntries.length > 0 && mpEnv.action === "phase_c_ingest" && grpEnv.action === "phase_c_ingest";
console.log(`\nSMOKE: ${ok ? "✓ PASS" : "✗ FAIL"} (≥1 envelope record per surface required)`);
process.exit(ok ? 0 : 1);
