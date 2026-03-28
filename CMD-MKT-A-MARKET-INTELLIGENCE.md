# LEGACYLOOP — COMMAND TEMPLATE v11 UPDATED
**CMD-MKT-A — Market Intelligence Engine (Beckett-Grade Pricing Agent)**
**March 27, 2026 | Ryan Hallee | Paste into Claude Code**

---

## SECTION 1 — CRITICAL DESIGN DIRECTIVE

READ BEFORE MAKING ANY CHANGES:

This app has an established design system: sleek, elegant, high-tech —
inspired by Tesla, SpaceX, and Grok. Dark theme, teal (#00bcd4) accents,
glass morphism cards, subtle animations, premium typography. Senior-friendly.

ALL styles inline style={{}} — NO Tailwind. NO external CSS.
NO className for styling. ONLY inline style={{}}. NO EXCEPTIONS.

LIGHT MODE RULE: Theme-aware surfaces MUST use CSS variables.
NEVER hardcoded rgba/hex on theme-aware surfaces.

ELON MUSK STANDARD: This must feel like a $1B product.

THIS IS A BACKEND INFRASTRUCTURE COMMAND. Creates 8 new files + modifies 2.
No UI changes. All new files use TypeScript strict typing.

---

## SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

```bash
echo '=== CHECKPOINT ==='
grep 'DEMO_MODE' .env | head -2
npx tsc --noEmit 2>&1 | tail -3
echo '--- Existing pricing ---'
wc -l lib/adapters/pricing.ts lib/adapters/ebay.ts
ls lib/adapters/rainforest.ts 2>/dev/null && wc -l lib/adapters/rainforest.ts || echo "rainforest.ts not found"
echo '--- CollectiblesBot route ---'
wc -l app/api/bots/collectiblesbot/\[itemId\]/route.ts
echo '--- Check market-intelligence dir ---'
ls lib/market-intelligence/ 2>/dev/null || echo "Directory does not exist yet — will create"
echo '=== CHECKPOINT COMPLETE ==='
```

---

## SECTION 3 — PERMANENTLY LOCKED FILES

Standard locked file list applies (Command Template v11 Updated, all sections).

**! SURGICAL UNLOCK FOR CMD-MKT-A:**

NEW FILES (create):
- `lib/market-intelligence/types.ts` — NEW
- `lib/market-intelligence/scraper-base.ts` — NEW
- `lib/market-intelligence/adapters/ebay-sold.ts` — NEW
- `lib/market-intelligence/adapters/tcgplayer.ts` — NEW
- `lib/market-intelligence/adapters/discogs.ts` — NEW
- `lib/market-intelligence/adapters/heritage-auctions.ts` — NEW
- `lib/market-intelligence/aggregator.ts` — NEW
- `app/api/market-intelligence/[itemId]/route.ts` — NEW

MODIFY:
- `app/api/bots/collectiblesbot/[itemId]/route.ts` — ADD market intelligence call after AI analysis
- `lib/enrichment/item-context.ts` — ADD market intelligence extraction (Section 12)

All files return to LOCKED after Ryan approves CMD-MKT-A.

LOCKED (READ ONLY for reference):
- `lib/adapters/ebay.ts` — existing eBay adapter (read for pattern reference)
- `lib/adapters/pricing.ts` — existing pricing engine (DO NOT MODIFY)

---

## SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-5: All bot AI logic + prompts, MegaBot consensus engine, antique detection,
collectible detection, Amazon enrichment, shipping calculator, offer negotiation,
credit system, subscription tiers, pro-rate billing, commission, Publish Hub,
marketplace, bundles, trades, data pipelines, onboarding, email, pricing constants,
Item Control Center, message center.

CMD5J-7G: All shipping fixes, all bot console upgrades, all MegaBot engine upgrades.

CMD8A-8K: All Item Dashboard panel polish.

CMD-CAR-A through G: Full CarBot suite.

CMD-ANT-A through D: Full AntiqueBot suite.

CMD-COL-A through D: CollectiblesBot AI + schema — ALL LOCKED.
CMD-COL-F: CollectiblesBot UI light mode — LOCKED (separate command).

**LOCKED SECTIONS WITHIN UNLOCKED FILES:**
- `collectiblesbot/route.ts` — GET route logic: LOCKED
- `collectiblesbot/route.ts` — Tier/credit gating: LOCKED
- `collectiblesbot/route.ts` — AI prompt and schema fields: LOCKED
- `item-context.ts` — All existing extraction sections (1-11): LOCKED

---

## SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Every feature must answer: Does this collect signal we learn from?
Does it make the next AI prediction better?
Does it create data nobody else has? Does it compound over time?
Flag all missed data collection opportunities.

Market comps are HIGH VALUE data — store everything. Every sold price is
a signal that makes future AI predictions better.

---

## SECTION 6 — BUILD PATTERN

Types → Scraper base → Adapters (4) → Aggregator → API route →
CollectiblesBot integration → Enrichment extraction → Build verify

No migrations. Market intelligence stored in EventLog as JSON payload.

---

## SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth. 13 platforms. Demo-ready.
DEMO_MODE=true — admin bypasses all gates and credit deductions.
Both test accounts Tier 4 Estate Manager — full access.

---

## SECTION 8 — CREATIVE LATITUDE

You MAY: Add additional scraping patterns beyond spec, add more robust
error handling, add logging for debugging, optimize cache strategies,
add category-to-query refinement heuristics, flag missed data opportunities.

You MAY NOT: Touch locked files, change existing pricing.ts pipeline,
change existing ebay.ts adapter, change AI prompts or schema fields,
change any UI files, change schema without approval, add npm packages,
deviate from inline style={{}}.

Flag everything outside scope.

---

## SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env — active now.
shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)

TEST ACCOUNTS:
- annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
- ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager

SYSTEM_USER_ID = cmmqpoljs0000pkwpl1uygvkz
FEE MODEL: 3.5% total = 1.75% buyer + 1.75% seller. LOCKED.

---

## SECTION 10 — ENVIRONMENT VARIABLES

All 4 AI keys SET. Square SET (sandbox). SendGrid SET. DEMO_MODE=true.
ARTA_API_KEY SET (test). EASYPOST_API_KEY SET.
No new API keys needed — all scrapers use public data or free APIs.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## OBJECTIVE — CMD-MKT-A: BUILD LEGACYLOOP MARKET INTELLIGENCE ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CollectiblesBot generates ALL prices from AI guesses. No real market comp
data. When we say "PSA 8 value: $1,200" — that is GPT-4o's opinion, not
backed by any real sold data. Unacceptable for an investor demo.

Build a Market Intelligence Engine that scrapes real sold prices from
public marketplaces and aggregates them into confidence-scored valuations.
This is our own Beckett-grade pricing system.

Architecture:
- Layer 1: Official APIs (Discogs public API)
- Layer 2: Web scrapers (eBay sold listings, Heritage Auctions realized prices, TCGPlayer)
- Layer 3: AI Synthesis (aggregator that merges, dedupes, scores confidence)

After build, CollectiblesBot will show:
  "Valued at $120-$180 based on 8 recent sold listings (eBay: 5, Heritage: 3)"
  Instead of:
  "Valued at $120-$180 based on AI estimate"

**! CRITICAL CONSTRAINTS:**
- Do NOT change existing pricing.ts pipeline
- Do NOT change existing ebay.ts adapter
- Do NOT change AI prompts or schema fields
- Do NOT change any UI files (CMD-COL-F scope)
- Do NOT use an Agent — do all work directly
- Market intelligence is ADDITIVE — fires alongside existing AI, does not replace it

**FILES TO CREATE:** 8 new files
**FILES TO MODIFY:** 2 existing files

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART A — MANDATORY FULL READ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**! DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.**

**Read lib/adapters/ebay.ts — FULL file:**
FIND: How eBay Browse API is called (URL, auth, params)
FIND: How results are parsed into comps
FIND: Token caching pattern

**Read lib/adapters/pricing.ts — Lines 1-60 + Lines 220-260:**
FIND: How eBay comps feed into pricing
FIND: PricingEstimate type

**Read app/api/bots/collectiblesbot/[itemId]/route.ts — Lines 340-470:**
FIND: Where AI analysis completes
FIND: Where demo generator produces result
FIND: Where EventLog is stored
FIND: Where validation keys are checked

**Read lib/enrichment/item-context.ts — Find extractCollectiblesBot function:**
FIND: Last section (Section 11: Executive Summary)
FIND: Where to insert Section 12

Print ALL findings with exact line numbers.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART B — NEW FILE: lib/market-intelligence/types.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create shared types:

```typescript
export interface MarketComp {
  item: string;           // exact listing title
  price: number;          // sold price in USD
  date: string;           // YYYY-MM-DD or YYYY-MM format
  platform: string;       // "eBay", "Heritage", "TCGPlayer", etc.
  condition: string;      // condition/grade as listed
  url?: string;           // listing URL if available
}

export interface MarketIntelligence {
  comps: MarketComp[];
  median: number;
  low: number;            // 25th percentile
  high: number;           // 75th percentile
  trend: "Rising" | "Stable" | "Declining" | "Unknown";
  confidence: number;     // 0-1 score
  sources: string[];      // which platforms returned data
  queriedAt: string;      // ISO timestamp
  compCount: number;
}

export interface ScraperResult {
  success: boolean;
  comps: MarketComp[];
  source: string;
  error?: string;
}

export type CollectibleCategory =
  | "Sports Cards" | "Trading Cards" | "Comics" | "Coins & Currency"
  | "Vinyl Records" | "Watches" | "Sneakers" | "Rare Books"
  | "Jewelry" | "Memorabilia" | "Vintage Toys" | "Minerals"
  | "Video Games" | "Funko" | "General";
```

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART C — NEW FILE: lib/market-intelligence/scraper-base.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Shared infrastructure for all scrapers:

**TASK C1:** USER_AGENTS array — 5 realistic browser user agents for rotation.

**TASK C2:** `fetchWithRetry(url, options?)` — 2 retry attempts, 2-second
delay between, 10-second timeout (AbortController), rotates user agent,
throws on final failure.

**TASK C3:** In-memory response cache — `Map<string, { html: string; fetchedAt: number }>`,
24-hour TTL (86400000ms), keyed by URL.

**TASK C4:** Rate limiter — `Map<string, number>` tracking last request
time per domain. Enforce minimum 1 second between requests to same domain.

**TASK C5:** `parsePrice(text: string): number | null` — extract dollar
amount from "$1,234.56" or "1234" or "US $45.00". Returns null if no price.

**TASK C6:** `parseDate(text: string): string` — normalize date formats
to "YYYY-MM-DD". Return original if unparseable.

**TASK C7:** `deduplicateComps(comps: MarketComp[]): MarketComp[]` —
remove duplicates by title similarity (>80% match) + same price.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART D — NEW FILES: 4 SCRAPER ADAPTERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**TASK D1:** `lib/market-intelligence/adapters/ebay-sold.ts`

`export async function scrapeEbaySold(query: string): Promise<ScraperResult>`

Build URL: `https://www.ebay.com/sch/i.html?_nkw={query}&LH_Complete=1&LH_Sold=1&_sop=13`
Fetch with fetchWithRetry. Parse HTML with regex for s-item__title, s-item__price,
s-item__ended-date. Extract up to 12 most recent sold listings.
Map to MarketComp[] with platform: "eBay".
Graceful failure: `{ success: false, comps: [], source: "eBay Sold", error: message }`

**TASK D2:** `lib/market-intelligence/adapters/tcgplayer.ts`

`export async function scrapeTcgPlayer(query: string): Promise<ScraperResult>`

URL: `https://www.tcgplayer.com/search/all/product?q={query}&view=grid`
Fetch HTML, parse for product name + market price + low price.
Extract up to 8 listings. Platform: "TCGPlayer".
Category routing: ONLY for "Sports Cards", "Trading Cards".
Graceful failure.

**TASK D3:** `lib/market-intelligence/adapters/discogs.ts`

`export async function queryDiscogs(query: string): Promise<ScraperResult>`

Official public API — no auth needed.
Search: `GET https://api.discogs.com/database/search?q={query}&type=release`
Header: `{ "User-Agent": "LegacyLoop/1.0" }`
Get release ID from first result. Then:
`GET https://api.discogs.com/marketplace/stats/{releaseId}`
Map to MarketComp[] with platform: "Discogs".
Category routing: ONLY for "Vinyl Records".
Rate limit: 60 req/min.
Graceful failure.

**TASK D4:** `lib/market-intelligence/adapters/heritage-auctions.ts`

`export async function scrapeHeritage(query: string): Promise<ScraperResult>`

URL: `https://www.ha.com/c/search-results.zx?N=0&Ntt={query}&type=past-auction`
Fetch HTML, parse for lot titles + hammer prices + auction dates.
Extract up to 8 results. Platform: "Heritage Auctions".
Category routing: Comics, Coins, Memorabilia, Minerals, Rare Books, Jewelry,
Watches, Sports Cards, Vintage Toys.
Graceful failure.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART E — NEW FILE: lib/market-intelligence/aggregator.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The "Beckett Brain" — routes to adapters, merges results, scores confidence.

**TASK E1:** CATEGORY_ADAPTER_MAP — routes each category to its scrapers:
```
"Sports Cards":    [scrapeEbaySold, scrapeHeritage]
"Trading Cards":   [scrapeTcgPlayer, scrapeEbaySold]
"Comics":          [scrapeHeritage, scrapeEbaySold]
"Coins & Currency":[scrapeHeritage, scrapeEbaySold]
"Vinyl Records":   [queryDiscogs, scrapeEbaySold]
"Watches":         [scrapeEbaySold, scrapeHeritage]
"Sneakers":        [scrapeEbaySold]
"Rare Books":      [scrapeHeritage, scrapeEbaySold]
"Jewelry":         [scrapeHeritage, scrapeEbaySold]
"Memorabilia":     [scrapeHeritage, scrapeEbaySold]
"Vintage Toys":    [scrapeEbaySold, scrapeHeritage]
"Minerals":        [scrapeHeritage, scrapeEbaySold]
"Video Games":     [scrapeEbaySold]
"Funko":           [scrapeEbaySold]
Default fallback:  [scrapeEbaySold]
```

**TASK E2:** Main function:
`export async function getMarketIntelligence(itemName: string, category: string): Promise<MarketIntelligence>`

Steps:
a. Look up adapters from CATEGORY_ADAPTER_MAP
b. Run ALL in parallel: `Promise.allSettled(...)`
c. Collect successful comps, deduplicate, sort by date
d. Calculate median, 25th/75th percentile, trend, confidence
e. Confidence formula: `Math.min(0.95, 0.3 + (compCount * 0.05))`
f. Trend: newest 3 avg vs oldest 3 avg → Rising/Declining/Stable/Unknown

**TASK E3:** In-memory result cache:
`Map<string, { result: MarketIntelligence; builtAt: number }>`
TTL: 4 hours. Key: `${category}:${itemName}` lowercased.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART F — NEW FILE: app/api/market-intelligence/[itemId]/route.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**TASK F1:** GET handler:
Auth check. Find most recent EventLog with eventType "MARKET_INTELLIGENCE_RESULT"
for itemId. Return `{ hasResult, result, createdAt }` or `{ hasResult: false }`.

**TASK F2:** POST handler:
Auth check. Load item with aiResult. Parse AI result for item_name + category.
Call `getMarketIntelligence(itemName, category)`.
Store result in EventLog: eventType "MARKET_INTELLIGENCE_RESULT", payload JSON.
Return `{ success: true, result }`.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART G — MODIFY: CollectiblesBot Route Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/api/bots/collectiblesbot/[itemId]/route.ts`

**TASK G1:** Import getMarketIntelligence from aggregator.

**TASK G2:** After AI analysis completes (after JSON parsing, before validation keys):
```javascript
const marketData = await getMarketIntelligence(
  result.item_name || itemName,
  result.category || category
).catch(() => null);
```

**TASK G3:** If marketData has comps:
- `result.market_comps = marketData.comps.slice(0, 5)`
- `result.market_median = marketData.median`
- `result.market_low = marketData.low`
- `result.market_high = marketData.high`
- `result.market_confidence = marketData.confidence`
- `result.pricing_sources = marketData.sources`
- `result.market_trend = marketData.trend`

**TASK G4:** If market median differs from AI `raw_value_mid` by >40%:
```javascript
result.pricing_discrepancy = true;
result.pricing_discrepancy_note = "Market data differs significantly from AI estimate";
```

**TASK G5:** Add to validation key list: "market_comps", "pricing_sources"

**TASK G6:** SAME for demo generator: after demo result is built, call
market intelligence and populate comparable_sales with REAL data instead
of synthetic.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART H — MODIFY: Enrichment Extraction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `lib/enrichment/item-context.ts`

In `extractCollectiblesBot()`, add Section 12 after Executive Summary:

```javascript
// ── Section 12: Market Intelligence ──
if (d.market_comps && Array.isArray(d.market_comps) && d.market_comps.length > 0) {
  parts.push(`Market Comps: ${d.market_comps.length} real sold listings`);
}
if (d.market_median != null) parts.push(`Market Median: $${d.market_median}`);
if (d.market_confidence != null) parts.push(`Market Confidence: ${Math.round(d.market_confidence * 100)}%`);
if (d.pricing_sources && Array.isArray(d.pricing_sources)) {
  parts.push(`Pricing Sources: ${d.pricing_sources.join(", ")}`);
}
if (d.market_trend) parts.push(`Market Trend: ${d.market_trend}`);
if (d.pricing_discrepancy) parts.push(`⚠️ Pricing discrepancy: AI vs market data differ >40%`);
```

---

## DO NOT CHANGE:

- GET route logic in collectiblesbot
- Tier/credit gating
- AI prompt or schema fields
- Existing `pricing.ts` pipeline
- Existing `ebay.ts` adapter
- `CollectiblesBotClient.tsx` (CMD-COL-F scope)
- `collectible-detect.ts`
- `collectibles-score.ts`
- Any UI files

---

## SECTION 18 — VERIFICATION CHECKLIST

```
CHECKPOINT baseline: pass
Part A reads completed and printed: yes / no

NEW FILES:
— lib/market-intelligence/types.ts exists: yes / no
— lib/market-intelligence/scraper-base.ts exists: yes / no
— lib/market-intelligence/adapters/ebay-sold.ts exists: yes / no
— lib/market-intelligence/adapters/tcgplayer.ts exists: yes / no
— lib/market-intelligence/adapters/discogs.ts exists: yes / no
— lib/market-intelligence/adapters/heritage-auctions.ts exists: yes / no
— lib/market-intelligence/aggregator.ts exists: yes / no
— app/api/market-intelligence/[itemId]/route.ts exists: yes / no

SCRAPER QUALITY:
— eBay Sold adapter handles failure gracefully: yes / no
— TCGPlayer adapter handles failure gracefully: yes / no
— Discogs adapter handles failure gracefully: yes / no
— Heritage adapter handles failure gracefully: yes / no
— Rate limiting enforced (1 req/sec per domain): yes / no
— Response cache with 24hr TTL: yes / no
— User-agent rotation: yes / no

INTEGRATION:
— CollectiblesBot calls getMarketIntelligence after AI: yes / no
— Demo generator calls getMarketIntelligence: yes / no
— market_comps populated in result: yes / no
— pricing_sources populated: yes / no
— pricing_discrepancy flagging works: yes / no
— Enrichment extraction Section 12 added: yes / no

LOCKED FILES NOT CHANGED:
— pricing.ts: confirmed
— ebay.ts: confirmed
— CollectiblesBotClient.tsx: confirmed
— collectible-detect.ts: confirmed
— All other locked files: confirmed
CMD-COL-A through F preserved: confirmed
All locked files untouched: yes / no
npx tsc --noEmit: 0 errors
npm run build: pass
CHECKPOINT post-change: pass
Dev server: localhost:3000
```

---

## SECTION 19 — REQUIRED REPORT FORMAT

```
CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

NEW FILES:
— types.ts: [created]
— scraper-base.ts: [created — fetch retry / cache / rate limit / helpers]
— ebay-sold.ts: [created — test query result count]
— tcgplayer.ts: [created — test query result count]
— discogs.ts: [created — test query result count]
— heritage-auctions.ts: [created — test query result count]
— aggregator.ts: [created — routing map / confidence formula / cache]
— API route: [created — GET + POST handlers]

INTEGRATION:
— CollectiblesBot market data integrated: [yes / no]
— Demo generator uses real market data: [yes / no]
— Pricing discrepancy flagging: [yes / no]
— Enrichment Section 12: [yes / no]

NOTHING CHANGED:
— pricing.ts: confirmed
— ebay.ts: confirmed
— AI prompts/schema: confirmed
— UI files: confirmed
— All locked files: confirmed

FLAGS FROM CLAUDE CODE:
— [Any scraper failures or edge cases]
— [Any rate limiting issues]
— [Any category routing gaps]

Files created: [list all — exact paths]
Files modified: [list all — exact paths]
Schema changes needed: [none]
Build: [pass / fail]
TypeScript: [0 errors / list all errors]
CHECKPOINT after: [pass / issue]
Dev server: localhost:3000

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.
Do NOT proceed until clean.
```

---

**Command CMD-MKT-A | LegacyLoop | March 27, 2026 | Ryan Hallee**
