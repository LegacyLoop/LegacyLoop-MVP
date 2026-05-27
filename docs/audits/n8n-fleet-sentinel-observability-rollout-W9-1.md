# n8n Fleet Sentinel Observability Rollout · Wave 9 W9-1 · 2026-05-27

> **Status:** 38/38 WFs sentinel-armed · ZERO errors · substrate completion
> **Anchor:** HEAD `2c5993c` · agent-3 worktree · Wave 9 W9-1
> **Builds on:** BINDING #50 RATIFIED (W8-1 `b123b91`) · W6-1 root cause · W7-1 sentinel v3
> **Doctrine yield:** DOC-N8N-AGGREGATE-NESTED-SENTINEL-ENTRIES-FILTER 2/5 → 3/5 · DOC-N8N-BP-TOPOLOGY-VARIANT 1/5 NEW

---

## §1 · 38 WF Target List

### 29 CLEAN (W7-2 catalog, daily cron, preventive)

| # | WF | Vertical | n8n ID |
|---|---|---|---|
| 1 | WF24 | V11 Coin Grading | 1BxsgTkxHlx0xzZE |
| 2 | WF58 | V7+V12 Cross-Vertical Fraud-Senior | 1BJDU9xtDD7JfbF3 |
| 3 | WF63 | V14 DocumentBot P3 | 2PFlNsFr0VWQ9SIy |
| 4 | WF67 | V14 Phase 5 | 4hPrQ0Jnk8s7hogc |
| 5 | WF35 | V3 EBTH Estate | 54mpPmFD802bawRg |
| 6 | WF36 | V8 Hagerty CarBot | 5JXk8TjyLLMGkAEs |
| 7 | WF48 | V14 Resale-Adjacent | 75itg6SssgHDgSZx |
| 8 | WF60 | V8 NHTSA+Fuel | 8FNZZt6fXfEFgyRB |
| 9 | WF33 | V15 Internet Archive | CGiOFYtrQbo0ikmm |
| 10 | WF61 | V11 NGC+CGC Pivot | FCc9JS3pS7YK7n7Q |
| 11 | WF68 | V11 NumisMaster PROTO | FcZOFzvykn42viff |
| 12 | WF39 | V2 BidSquare | I3AlApT7HQRwuoAF |
| 13 | WF30 | V15 Met Museum | Iq1a1l01sIzV0MRV |
| 14 | WF23 | V11 PSA/BGS/CGC | L3ILD1CN8SmBB9po |
| 15 | WF37 | V2 Liveauctioneers | Q1enfmld3pI4lY4J |
| 16 | WF56 | V14 Fed Register | QqbSa4kKkLb2dsZp |
| 17 | WF62 | V14 P2 SEC EDGAR | RPsJ1rk9ZzTqXgfu |
| 18 | WF38 | V3 MaxSold Estate | RShJUpxLnzmyPXl1 |
| 19 | WF49 | V16 Real Estate | TC088YWAAJYqGShe |
| 20 | WF34 | V3 EstateSales | W6Hqi0Rry2Hx280L |
| 21 | WF29 | V8 NHTSA vPIC | XYwJBPyvpnkNttfW |
| 22 | WF53 | V11 NGC+CGC | YXHDy0UKy0Ltzbxs |
| 23 | WF25 | V11 Hallmark | eOsok7XjLUCWi8WE |
| 24 | WF55 | V1 FirstDibs | hOvuzYo6QLAgH4GK |
| 25 | WF44 | V7 AARP+Eldercare | i9cw4JnBkPoIr16k |
| 26 | WF32 | V15 Library of Congress | iHZ3IKpYzwFxcacQ |
| 27 | WF65 | V13 GC+MF | j7SXUtsinIRxUYdk |
| 28 | WF42 | V8 Barrett-Jackson | jh6puPjc6kx8raTN |
| 29 | WF56-V2 | V2 LiveAuctioneers SPA | lvSFFgiKqQBXYwG6 |

### 9 NO_EXECS-now-executed (W8-3 catalog, preventive)

| # | WF | Vertical | n8n ID |
|---|---|---|---|
| 30 | WF54 | V15 Getty | suODeUH9RuYe6V8Q |
| 31 | WF41 | V8 Mecum | uKG8uH2YZMCCyE8e |
| 32 | WF28 | V2 Collectible Markets | ul74c4o5z5Wnw3hP |
| 33 | WF26 | V11 Autograph | uzNg1ciF4DhLVNCp |
| 34 | WF31 | V15 Smithsonian | vPcQFQMOC9Q1nvNf |
| 35 | WF47 | V13 Sweetwater | wJu9nWi9DSYTbmwt |
| 36 | WF46 | V13 BrickLink | xqZRGRtgx61UUzuE |
| 37 | WF40 | V8 ClassicCars | z67pIt9E4Xaq2cXN |
| 38 | WF27 | V1 Sotheby's | zKPNE3h4tFUQiFBj |

---

## §2 · BP Topology Classification

| Bucket | Count | Description |
|---|---|---|
| **entries** | **38** | `aggregated.entries[]` pattern (Aggregate → BP reads entries) |
| extract-all | 0 | `$('Extract').all()` direct pattern |
| other | 0 | Non-standard topology |

100% uniform entries-bucket. Single adapter covered all 38 WFs.

### Meta variable distribution

| Pattern | Count |
|---|---|
| `_splitMeta` (v4 early-define) | 32 WFs |
| `meta = $('Split...')` (v3 late-define) | 6 WFs |

Sentinel adapted per pattern: v4 uses `_splitMeta` reference, v3 uses inline `$('Split URLs...')` at `if (!html)` point.

---

## §3 · Batch Patch Results

| Pass | WFs | Status |
|---|---|---|
| Pass 1 | 34/38 | OK |
| Pass 1 ERR | 4 | `binaryMode` settings field rejected by n8n PUT API |
| Pass 2 (retry) | 4/4 | OK after stripping `binaryMode` + `availableInMCP` from settings |
| **Final** | **38/38** | **ALL OK** |

### Patches applied per WF

**Extract+Format (2 sentinel points each):**
1. `if (!html) return [];` → sentinel `_loopPassthrough` with `_zeroYieldReason: 'empty-html-from-fetch'`
2. `if (!title && !bodyText) return [];` → sentinel `_loopPassthrough` with `_zeroYieldReason: 'no-title-no-body'`

**Build Payload (1 filter each):**
1. `const entries = aggregated.entries || [];` → filtered via `_rawEntries.filter(e => !e._loopPassthrough)` + sentinel count logging + skip-on-all-sentinel

### n8n API lesson

n8n PUT `/api/v1/workflows/{id}` rejects:
- Top-level: `id`, `createdAt`, `updatedAt`, `versionId`, `triggerCount`, `shared`, `meta`, `staticData`, `tags`, `active`, `pinData`
- In `settings`: `binaryMode`, `availableInMCP` (older WFs carry these)

Minimal valid PUT body: `{name, nodes, connections, settings}` with clean settings.

---

## §4 · Post-Patch Verification

5/5 sample WFs verified sentinel landed:

| WF | Extract sentinel | BP filter |
|---|---|---|
| WF58 (1BJDU9xt) | ✓ `_loopPassthrough` present | ✓ filter present |
| WF61 (FCc9JS3p) | ✓ | ✓ |
| WF34 (W6Hqi0Rr) | ✓ | ✓ |
| WF27 (zKPNE3h4) | ✓ | ✓ |
| WF24 (1BxsgTkx) | ✓ (retry WF) | ✓ |

---

## §5 · Fleet Sentinel Coverage Summary

| Category | Count | Status |
|---|---|---|
| Already armed (Wave 8) | 6 | WF43, WF57, WF64, WF66, WF69, WF70 |
| Newly armed (Wave 9 W9-1) | 38 | This batch |
| **Total sentinel-armed** | **44** | **of 46 SplitInBatches WFs** |
| Apify-dependent (banked) | 2 | WF45, WF50 (banked W10) |
| Non-SplitInBatches | 8 | No vulnerability |
| **Fleet total** | 54 | 44/46 vulnerable WFs protected |

---

## §6 · Doctrine Progression

| Doctrine | Before | After | Evidence |
|---|---|---|---|
| DOC-N8N-AGGREGATE-NESTED-SENTINEL-ENTRIES-FILTER | 2/5 | 3/5 | 38 WFs entries-bucket adapter applied |
| DOC-N8N-BP-TOPOLOGY-VARIANT | — | 1/5 NEW | 100% entries-bucket classification (no variants found) |
| BINDING #50 | RATIFIED | SUSTAINED | 38+6=44 WFs sentinel coverage |

---

## §7 · Banked Carry-Forwards

1. **WF45 + WF50 individual sentinel** — banked W10 (Apify dependency must resolve first)
2. **Sylvia M14 sentinel-emit Slack webhook** — auto-catch on N consecutive sentinel emits per source (Phase B6)
3. **Per-source sentinel telemetry dashboard** — long-term Prometheus/Grafana (post-funded)
4. **State.gov headless browser investigation** — persistent WAF block on n8n droplet IP
5. **OPM.gov RSS/sitemap pivot** — 403 anti-bot on direct fetch
