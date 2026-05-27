# V11 PCGS Alt Path Probe — W6-3 Audit
# Agent C · agent-2 worktree · 2026-05-27

## Summary

PCGS canonical endpoint (`www.pcgs.com/prices`) returns HTTP 403 with Cloudflare
challenge wall (`Cf-Mitigated: challenge`). All 6 PCGS paths probed return 403.
PCGS is not scrapable without headless browser + challenge bypass — violates
zero-Apify-cost constraint (BINDING #49 candidate) and likely PCGS ToS.

**BINDING #31 push-back invoked.** Option C replacement identified: **USA Coin Book**.

## §0.5 Probe Results (14 checks)

### PCGS Endpoints (ALL 403)

| # | URL | Status | Notes |
|---|-----|--------|-------|
| 1 | `www.pcgs.com/prices` | 403 | Cloudflare challenge, `Cf-Mitigated: challenge` |
| 2 | `www.pcgs.com/cert` | 403 | Same Cloudflare wall |
| 3 | `www.pcgs.com/population` | 403 | Same Cloudflare wall |
| 4 | `www.pcgs.com/coinfacts` | 403 | Same Cloudflare wall |
| 5 | `www.pcgs.com/price-guide` | 403 | Same Cloudflare wall |
| 6 | `api.pcgs.com/` | 403 | Different infra (AWS ALB + ASP.NET) but still 403 |

**Conclusion:** PCGS has site-wide Cloudflare bot protection. No curl-accessible
endpoint exists. Would require Apify/Playwright with challenge solver — outside
project constraints.

### Alternative Sources Probed

| # | Source | URL | Status | Bot Wall | Data Quality |
|---|--------|-----|--------|----------|-------------|
| 7 | NGC Coin Explorer | `ngccoin.com/coin-explorer/` | 301→200 | None | Thin — category links, some price/grade mentions |
| 8 | NGC Census | `ngccoin.com/census/` | 404 | None | Path not found |
| 9 | USA Coin Book (root) | `usacoinbook.com/` | 200 | None | Navigation hub |
| 10 | USA Coin Book (Walking Liberty) | `usacoinbook.com/coins/half-dollars/walking-liberty/` | 200 | **None** | **RICH — structured HTML tables** |
| 11 | USA Coin Book (Washington Quarters) | `usacoinbook.com/coins/quarters/washington/` | 200 | None | 10 `coin-value-table` instances |
| 12 | USA Coin Book (Lincoln Wheat Cent) | `usacoinbook.com/coins/small-cents/lincoln-wheat-cent/` | 200 | None | 8 `coin-value-table` instances |
| 13 | CoinStudy | `coinstudy.com/` | 200 | None | Not deeply probed — nginx/PageSpeed |
| 14 | NGC price-guide | `ngccoin.com/price-guide/` | 404 | None | Path not found |

## Option C Replacement: USA Coin Book

### Data Structure Confirmed

HTML tables with CSS class `coin-value-table`. Columns:

```
Year | Details | Mintage | G(4) | VG(8) | F(12) | VF(20) | EF(40) | AU(50) | MS(60) | MS(63) | PR(65) | For Sale
```

Example data (1916 Walking Liberty Half Dollar):
- 1916 P: G=$91, VG=$95, F=$134, VF=$239, EF=$335, AU=$352, MS60=$812, MS63=$1,265
- 1916 S: G=$153, VG=$215, F=$335, VF=$578, EF=$812, AU=$1,209, MS60=$2,055, MS63=$3,523

Additional metadata per series:
- Designer/Engraver
- Metal Composition (e.g., "90% Silver - 10% Copper")
- Diameter (mm)
- Mass/Weight (grams)
- Mintage per year/mint

### Why USA Coin Book > PCGS for This Use Case

| Factor | PCGS | USA Coin Book |
|--------|------|--------------|
| HTTP access | 403 Cloudflare | 200 clean |
| Bot wall | Full-site challenge | None |
| Price data | N/A (blocked) | Grade-by-grade Sheldon scale |
| Grade coverage | N/A | G(4) through PR(65), 9+ grades |
| Mintage data | N/A | Yes, per year/mint |
| Coin metadata | N/A | Composition, diameter, weight |
| Parsing difficulty | N/A | Low — `coin-value-table` CSS class |
| Apify cost | Would require headless + solver | Zero — plain HTTP |
| Data freshness | N/A | Updated regularly |

### URL Pattern

```
https://www.usacoinbook.com/coins/{denomination}/{series}/
```

Verified denominations:
- `/coins/half-dollars/walking-liberty/`
- `/coins/quarters/washington/`
- `/coins/small-cents/lincoln-wheat-cent/`

### Scraper Adapter Integration Point

Current codebase at `lib/market-intelligence/aggregator.ts:85`:
```typescript
"Coins & Currency": [scrapeHeritage, scrapeEbaySold, (q) => scrapePriceCharting(q, "coins")],
```

New adapter would slot in as:
```typescript
"Coins & Currency": [scrapeUsaCoinBook, scrapeHeritage, scrapeEbaySold, (q) => scrapePriceCharting(q, "coins")],
```

Adapter file: `lib/market-intelligence/adapters/usa-coin-book.ts`

### n8n Workflow Opportunity

Could mirror existing V8/V3 workflow pattern (WF22-WF70 fleet):
- Source URL: `https://www.usacoinbook.com/coins/{denomination}/{series}/`
- Parse: `coin-value-table` HTML tables
- Extract: year, mint mark, mintage, grade prices (G4→PR65)
- Store: Turso `corpus_items` (V11 vertical)

Estimated yield per series page: 20-50 rows (one per year/mint variant).

## Existing Codebase Coin Support

- **Detection:** `lib/collectible-detect.ts:26` — `coinSignals` array routes numismatic items
- **Aggregator:** Heritage + eBay Sold + PriceCharting (no grade-specific pricing)
- **Bot skills:** `lib/bots/skills/collectiblesbot/06-coin-numismatic-grading.md` — Sheldon scale knowledge, PCGS/NGC grade standards
- **Population reports:** Skill pack `03-population-reports-scarcity.md` references PCGS Pop Report / NGC Census (manual lookup, not API)
- **TTL:** `lib/market-intelligence/enrichment-ttl.ts` — coins = 14-day cache
- **No dedicated PCGS adapter exists** — gap this probe addresses

## Recommendation

1. **PCGS: DEAD END.** Do not invest further probe time. Cloudflare wall is permanent.
2. **USA Coin Book: BUILD ADAPTER.** Structured HTML, no bot wall, grade-by-grade Sheldon pricing, mintage data. Richer than PriceCharting for coins.
3. **NGC: SECONDARY.** Coin Explorer accessible (no bot wall) but thinner data. Worth as cross-reference source later.
4. **Adapter priority:** USA Coin Book adapter → aggregator slot → n8n workflow (mirrors V8 NHTSA pattern).

## FLAGS

- **FLAG-PCGS-PERMANENT-403:** PCGS entire domain behind Cloudflare challenge. Not a temporary outage — architectural anti-bot decision. Mark as permanent blocker.
- **FLAG-USA-COIN-BOOK-ADAPTER-READY:** Data structure confirmed, URL pattern mapped, integration point identified. Ready for CMD-V11-USA-COIN-BOOK-ADAPTER fire.
- **FLAG-NGC-COIN-EXPLORER-SECONDARY:** NGC `/coin-explorer/` accessible but needs deeper content probe for pricing table structure.
- **FLAG-COIN-GRADE-PRICING-GAP:** Current aggregator (Heritage + eBay + PriceCharting) returns market comps but NOT grade-specific Sheldon pricing. USA Coin Book fills this gap.

## Doctrine Applied

- BINDING #30 (§0.5 IT deep-dive): 14-check empirical probe completed
- BINDING #31 (push-back with replacement): PCGS dead-end → USA Coin Book Option C
- BINDING #17 (audit-first-wire): read codebase before any code recommendation
- BINDING #49 candidate (Apify cap-saturation): zero-Apify-cost path confirmed

---

*Agent C · W6-3 · 2026-05-27 · HEAD 50dc80f*
