# W27-C · FREE-Scraper Cron Density Lift — AUDIT + EXECUTION

**CMD:** CMD-W27-C-FREE-SCRAPER-CRON-DENSITY V20 MED · Track A · Agent B (agent-2)
**Date:** 2026-05-30 · **Anchor HEAD:** b7e822e
**Outcome:** 🟢 GREEN — audit-first. 4 dedup-proven FREE sources lifted (n8n cron), 3 banked with cause. Apify $29 untouched. Zero paid acceleration. 7-day Sylvia-uplift watch banked.

---

## TL;DR

Audited 7 FREE-source scraper WFs (ToS rate limit + dedup path each). **Lifted cadence only where dedup is proven AND source ToS allows AND the source is not a commercial site.** Banked 3: USGS (dedup broken), 2 coin scrapers (commercial-site ToS). All lifts are idempotent (zero duplicate corpus rows) and crossValidate is in-process zero-AI-cost, so acceleration carries no $ cost.

---

## §0.5 DEDUP PATH (proven end-to-end)

n8n WF → POST `app.legacy-loop.com` `action=phase_c_ingest` → `app/api/webhooks/n8n/route.ts`:
1. Webhook enqueues one `sylviaCorpusQueue` row per entry — **no dedup at this layer** (unconditional create).
2. `scripts/sylvia-queue-drain.mjs` (Mac worker) claims rows → `graphIngestExternalCorpus`.
3. `lib/sylvia/graphify/consumer-hooks.ts` → `writeVaultNote(note, entry.id)`.
4. `lib/sylvia/obsidian/vault-writer.ts:58` → `fileKey = entry.id` → `namespaceToPath(namespace, entry.id)` → `fs.writeFile` (**overwrite**).

**Dedup key = `(namespace = skill:domain-corpus-${corpusId}, entry.id)`.** Same `(corpusId, entry.id)` re-ingested → same file path → overwrite, **zero duplicate nodes**. Cost: `crossValidate` is "Phase 4/6 in-process · zero AI cost" (`lib/sylvia/truth-crossval/validator.ts:70`) — re-processing is free.

**Caveat that decides safety:** if a WF omits `corpusId`, the webhook defaults to `phase-c-{verticalId}-${Date.now()}` (ms) → **every run gets a unique namespace → duplicates**. A stable (or date-stamped, intra-day-stable) `corpusId` is therefore the gate for safe acceleration.

---

## PER-SOURCE AUDIT

| WF | Source host | ToS rate limit (cited) | corpusId | entry.id | dedup | Decision |
|---|---|---|---|---|---|---|
| WF88 IA | archive.org | CDX ~60 req/min, 429→1h IP block (doubling) | `wf-v15-ia-`+date | `v15-ia-`+srcId | ✓ intra-day | **LIFT 1→2×** |
| WF78 LOC | www.loc.gov | No fixed number; throttling "strongly encouraged", 429+CAPTCHA on load | `wf-v15-loc-2026-05-28` (static) | deterministic | ✓ | **LIFT 1→2×** |
| WF79 Met | collectionapi.metmuseum.org | **80 req/sec**, no key | `wf-v15-met-`+date | deterministic | ✓ intra-day | **LIFT 1→2×** |
| WF85 YouTube | www.googleapis.com (Data API v3) | **10,000 units/day** (reset midnight PT) | `wf-v10-youtube-2026-05-28` (static) | deterministic | ✓ | **LIFT 1→3×** (fresh content) |
| WF89 USGS | api.nsf.gov, catalog.data.gov | api.data.gov **1,000 req/hr/key** | **NONE → Date.now()** | `a.id`/`d.id` | ✗ **BROKEN** | **BANK** — dups every run already |
| WF24 Coin | pcgs.com, ngccoin.com, usmint.gov | PCGS robots.txt returns **403 to automation**; commercial | `wf-coin-grading-corpus-...` (static) | deterministic | ✓ | **BANK** — commercial ToS |
| WF68 Numis | www.numismaster.com | Commercial site; no public API | static | deterministic | ✓ | **BANK** — commercial ToS |

### Sources (ToS)
- Met: https://metmuseum.github.io/ (80 req/sec, no key)
- LoC: https://www.loc.gov/apis/json-and-yaml/working-within-limits/ (429+CAPTCHA, throttle strongly encouraged)
- YouTube Data API v3: https://developers.google.com/youtube/v3/getting-started (10,000 units/day default)
- Internet Archive: https://archive.org/about/terms + developer docs (CDX ~60/min, 429→firewall block)
- api.data.gov (NSF/data.gov): https://api.data.gov/docs/developer-manual/ (1,000 req/hr default per key)
- PCGS: https://www.pcgs.com/ — robots.txt 403 to non-browser UA (automation-hostile)
- NumisMaster: https://www.numismaster.com/robots.txt (no crawl-delay; commercial)

---

## EXECUTION — cron lifts (n8n deactivate→PUT→activate · BINDING #49)

All verified `active=true` post-PUT. 24h-staggered, no minute collision.

| WF | id | before | after | multiple |
|---|---|---|---|---|
| YouTube WF85 | mFJLpn2Fwp6BviRc | `38 7 * * *` | `38 5,13,21 * * *` | 3× |
| IA WF88 | ICc2MriOInnTG8O9 | `47 7 * * *` | `47 6,18 * * *` | 2× |
| LOC WF78 | YQiNSG3MY8E0ZigZ | `30 7 * * *` | `30 7,19 * * *` | 2× |
| Met WF79 | THxg2wFG2UFSV4Jd | `31 7 * * *` | `31 8,20 * * *` | 2× |

**Smoke:** YouTube WF85 lifted first (deactivate 200 / PUT 200 / activate 200 / verify active=true + cron) before the remaining three.

### Banked (NOT touched — still daily, active)
| WF | id | cron (unchanged) | reason |
|---|---|---|---|
| USGS WF89 | 1l7KT9OJe5r05D4J | `49 7 * * *` | **Dedup broken** — no `corpusId` → `Date.now()` default dups every run. Fix corpusId BEFORE any lift (separate cyl). |
| Coin WF24 | 1BxsgTkxHlx0xzZE | `0 8 * * *` | Commercial sources (PCGS 403-blocks automation, NGC). "Never infringe" — bank. |
| Numis WF68 | FcZOFzvykn42viff | `7 7 * * *` | Commercial (NumisMaster). Bank. |

**Apify $29 cap: UNTOUCHED.** No paid source/WF modified. All 4 lifts are FREE (gov/museum/open APIs). $0.

---

## SENTINEL 429-HALT — design, deferred

All FREE WFs already carry an internal "Rate Limit (1 req/sec)" wait node + "Split URLs (per-URL loop · 1 req/sec)". A dedicated 429-halt sentinel (IF node after "Fetch HTML": `statusCode === 429` → stop branch + alert) requires **node-graph topology surgery** (add node + rewire connections) on 4 live production WFs — higher risk than a cron-expression PUT (§9 STOP: "n8n PUT shape error"). **Deferred to a follow-up cyl** with isolated per-WF testing. Current protection: 1 req/sec politeness + Fetch HTML error-fail behavior. IA's 429→1h-block risk is the main reason to add the sentinel next.

---

## ACCEPTANCE

- [x] Per-source ToS rate limit cited with URL (7 sources)
- [x] Dedup path proven end-to-end (writeVaultNote idempotent on `(corpusId, entry.id)`)
- [x] Cadence lifted ONLY where dedup-proven + ToS-safe + non-commercial (4 of 7)
- [x] 24h-staggered, no collision, `active=true` verified
- [x] Apify $29 untouched · zero paid acceleration · $0
- [x] Dedup-broken (USGS) + commercial (coin ×2) banked with cause
- [ ] Sentinel 429-halt — design documented, execution deferred (risk)
- [ ] 7-day Sylvia corpus-uplift watch (banked · cannot prove in one cyl)

## BANKED WATCH (CYCLIC)
7-day Sylvia corpus-uplift measurement on the 4 lifted sources. Compare net-new vault notes/week before vs after. Expectation: YouTube shows real uplift (fresh content); IA/LOC/Met show modest uplift (static catalogs — acceleration mainly catches new accessions sooner, no duplicate harm). If queue-row volume balloons without net-new notes, reconsider IA/Met multiples.
