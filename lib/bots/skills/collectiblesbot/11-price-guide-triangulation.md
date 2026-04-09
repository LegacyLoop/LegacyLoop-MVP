---
name: price-guide-triangulation
description: How to triangulate valuations across PriceCharting, PSACard auction history, Beckett Marketplace, eBay sold listings, and Heritage archives. When each source is authoritative and how to weight conflicting signals.
when_to_use: Every CollectiblesBot scan where a value estimate is produced. The three specialty scrapers (PriceCharting + PSACard + Beckett) plus the general marketIntel comps must all be interpreted through this pack.
version: 1.0.0
---

# Price Guide Triangulation — Three Sources Or It Does Not Ship

Generic resale bots average five eBay sold listings and call it a price. CollectiblesBot does not. Collectibles have multiple authoritative price sources that disagree in meaningful ways. Your job is to read each source, understand its bias, and triangulate the true market value.

The three specialty scrapers that fire on card-category scans are:
1. **PriceCharting** — the "Beckett equivalent" for ungraded + graded price data across cards, video games, comics, coins, funko, and LEGO
2. **PSACard Auction Prices Realized** — graded PSA card sold data from major auction houses
3. **Beckett Marketplace** — collector-marketplace listings with graded + raw data (added to the stack in CORE-A)

Plus the general-purpose `getMarketIntelligence` pull across eBay + TCGPlayer + Courtyard + StockX + Chrono24.

## The Four-Source Weighting

| Source | Strength | Bias | Weight |
|---|---|---|---|
| PriceCharting | Wide category coverage, graded + raw tiers | Averages can lag hot market moves by 2-4 weeks | 30% |
| PSACard APR | Real auction hammer, blue-chip data | Only high-value cards appear; lower bound distorted | 30% |
| Beckett Marketplace | Collector asking prices, broad coverage | Asking prices are inflated (survivor bias) | 15% |
| eBay sold comps | Fresh data, high volume | Mixed quality, condition misrepresentation, auction variance | 25% |

These weights apply when all four sources return data. If only some return, redistribute proportionally. If only one returns, widen the confidence band (Pack 14).

## PriceCharting — Read The Tiers

PriceCharting segments data by condition tier. For cards and video games:
- **Loose / Ungraded** — raw item, no grading
- **Complete** — with box/manual (video games) or with packaging (sealed toys)
- **New / Sealed** — factory sealed, highest tier
- **Graded tiers** — PSA 6, PSA 7, PSA 8, PSA 9, PSA 9.5, PSA 10 (and BGS equivalents)

When you pull a PriceCharting comp, state WHICH tier matches the subject. A raw card compared against a PSA 10 price is a category error. The CollectiblesBot route already parses ungraded / graded 7 / graded 8+ separately — use those tiers in reasoning.

## PSACard APR — The Real Money Signal

PSA Auction Prices Realized is the strongest data source for high-value cards. It captures actual hammer prices from Goldin, Heritage, PWCC, Lelands, Robert Edward Auctions, and others. APR entries include:
- Date of sale
- Auction house
- Grade and cert number
- Realized price (after buyer's premium typically, stated clearly)
- Photographs of the exact card

For any card estimated over $500, APR is the PRIMARY anchor. If APR shows three recent sales at PSA 9 between $800 and $1,100, the midpoint is the honest estimate — not whatever eBay Buy-It-Now is showing.

APR has a blind spot: low-value cards (under $200) rarely appear because they do not go to major auction. For sub-$200 cards, APR may return zero results — use PriceCharting and eBay sold instead.

## Beckett Marketplace — Treat As Asking Prices

Beckett Marketplace shows dealer and collector listings. These are ASKING prices, not sold prices. Apply the 15-25 percent haircut that collector markets typically negotiate:
- Beckett Marketplace median asking: $100
- Triangulated market value: $75-85

Beckett is useful as a CEILING signal. If Beckett is asking $100 and PSACard APR hammer is $80, the true buyer will pay somewhere in between — likely $85-90 on a private sale, $75-80 at auction after fees.

## eBay Sold Comps — The Volume Baseline

eBay sold listings (NOT active — sold filter must be applied) are the highest-volume data source. Strengths:
- Real transactions
- Broad price range
- Fresh data (last 90 days)
- Condition photos often included

Weaknesses:
- Unvetted condition claims ("PSA 10 equivalent" raw cards)
- Auction variance (Sunday night final seconds effect)
- Shilling and bid retraction
- Regional price skew (international bidders cause spikes)

Use eBay sold as the floor confirmation. If all three specialty sources say $200 and eBay sold median is $90, something is wrong — either the specialty sources are stale or the eBay listings are low-condition examples. Dig in and explain.

## When Sources Disagree By More Than 40 Percent

The CollectiblesBot route already flags pricing_discrepancy when AI estimate and market median differ by >40 percent. Pack 11 extends this: if SOURCES disagree by >40 percent among themselves, the triangulation itself is broken and the confidence band must widen.

Example: PriceCharting graded PSA 8 says $120. PSACard APR says $180. eBay sold says $85. Beckett asks $200. Disagreement range = $85 to $200, that is 135 percent spread. Do NOT output a point estimate — output a wide band ($90 to $170) and explain the disagreement in value_reasoning.

## The Fresh vs Stale Problem

Collectibles prices move in waves. The sports card market peaked in early 2022 and has cooled 18-30 percent depending on era. Vintage watches held through 2025. Pokemon WOTC Base Set is still climbing. Sneaker resale softened post-hype. Always check comp DATES:
- Last 30 days = current market
- 30-90 days = still relevant
- 3-6 months = apply trend adjustment
- 6-12 months = reference only
- Over 12 months = stale, do not use as primary anchor

State the freshness tier in `market_trend` or `demand_reasoning`.

## Comp Freshness For New Releases

New releases (Pokemon 151 Set, 2024 Bowman Chrome prospects) often have no PSA 10 APR data at release. In that window, rely on:
1. PriceCharting raw + BGS 9 estimates
2. eBay sold comps for raw
3. Print-run projections

Widen confidence band significantly. A new release card has high variance for the first 6-12 months.

## Output

In `market_comps`, surface the top 3-5 most relevant comps from the combined source pool. In `market_median`, state the triangulated median (weighted average of available sources). In `pricing_sources`, name the sources that contributed. In `value_reasoning`, cite the specific source weights used and flag any 40 percent+ disagreement. In `market_trend`, state current direction (Rising / Stable / Declining) with a specific catalyst if identifiable.
