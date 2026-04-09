---
name: comp-pulling-discipline
description: How to read live market comps through an auction-house lens, not a retail-flip lens. Sold comps outweigh active listings. Skinner hammers outweigh eBay BIN prices. This pack teaches comp weighting discipline.
when_to_use: Every AntiqueBot scan where ReconBot or the specialty scrapers return comps. The comp section of the systemPrompt comes loaded — this pack teaches how to interpret it.
version: 1.0.0
---

# Comp Pulling Discipline — Auction Lens, Not Retail Lens

ReconBot and the aggregator pull live comps from eBay, Ruby Lane, ShopGoodwill, LiveAuctioneers, Invaluable, 1stDibs, and others. The comps arrive as a flat list with platform, item, price, and date. AntiqueBot's job is NOT to average them and call that the estimate. AntiqueBot's job is to read each comp through an auction-specialist lens, weight them by evidentiary strength, and anchor the auction estimate on the comps that actually prove market value.

This is where AntiqueBot diverges most sharply from generic resale bots. PriceBot, BuyerBot, and ListBot read comps through a retail lens (what will it sell for on Facebook Marketplace). AntiqueBot reads them through an auction lens (what did it hammer for at Skinner last March). These are often different numbers.

## The Evidentiary Weighting Ladder

Every comp is not equal. Grade them on this ladder before using them:

| Weight | Comp type | Why |
|---|---|---|
| **Strongest** | Sold hammer at top or mid tier auction (Christie's, Sotheby's, Skinner, Freeman's, Doyle, Heritage) with date | Real transaction, real auction, priced by specialists and live bidders |
| **Strong** | Sold hammer at regional auction (Pook, Jeffrey Evans, Brunk, Garth's, Cowan's) with date | Real transaction, specialist-vetted, regional market |
| **Medium** | Sold price at vetted online dealer (1stDibs, Ruby Lane) with date | Real retail sale, dealer-vetted, retail multiple over auction |
| **Medium-Weak** | Sold eBay listing in "Sold" filter with date | Real transaction but no vetting, condition often unverifiable |
| **Weak** | Active dealer listing at 1stDibs or Ruby Lane | Asking price, not achieved price, typically inflated |
| **Weakest** | Active eBay Buy-It-Now listings | Asking price from unknown sellers, often wildly inflated |
| **Ignore** | eBay listings with zero bids and long duration | Survivor bias — the ones you see today are the ones that did not sell |

## The Auction Hammer To Retail Multiple

A critical piece of domain knowledge: the same object typically sells at auction hammer for 50-70 percent of its retail (dealer or 1stDibs) price. This is because:
- Auction buyers include dealers who must mark up
- Auction is wholesale, retail is retail
- Retail adds sourcing, inventory, photography, and showroom costs
- Retail waits for the right buyer; auction compresses time

So if you see a period Hepplewhite sideboard hammer at Skinner for $3,200 AND see a dealer on 1stDibs asking $6,800, these are consistent data points, not contradictory. The math is 3200 / 6800 = 0.47, consistent with the 50-70 percent ratio.

When the ratio breaks down (auction hammer BELOW 40 percent or ABOVE 80 percent of dealer asking), something is off. Dig deeper.

## The Solds Vs Actives Rule

Active listings are asking prices (hopes). Sold listings are transactions (reality). On eBay specifically, active listings are systematically inflated for three reasons:
1. Sellers price 15-30 percent above expected to leave room for offers
2. Zero cost to listing high
3. Survivor bias — you only see the ones that did not sell

Never use an active eBay listing as the basis for an auction estimate. Use them only to gauge SUPPLY LEVEL and CEILING INTENT. For the actual number, use sold comps.

## The Date Decay

Comp age matters. Weight by recency:
- Last 30 days: full weight
- Last 90 days: 90 percent weight
- Last 6 months: 75 percent weight
- Last 12 months: 60 percent weight
- 12-24 months: 40 percent weight, flag as stale
- Over 24 months: use only for directional signal

Markets move. A 2019 Skinner result on a Nakashima bench is not a 2026 data point — the mid-century design market boomed 2020-2022 and cooled slightly after. Adjust for market trends.

## The Condition Match Test

Before using any comp, verify the condition matches. A sold comp for a "period Chippendale chest" at $8,200 might be irrelevant if that chest had original surface and the subject chest is refinished. Always ask:
- Does the comp description mention restoration or refinishing?
- Does the comp photo show original surface?
- Does the comp note "in the manner of" vs period?
- Is the comp the SAME form (chest of drawers vs high chest vs low chest are different markets)?

If you cannot verify condition parity, down-weight the comp by 25-50 percent.

## Outlier Detection

If you pull 10 comps and 9 cluster in the $2,800-$4,200 range but one sold at $11,000 — the outlier is probably either a misattribution (the $11,000 sale was actually a better object), a provenance lift (that specific piece had documented Jefferson ownership), or a bidding war anomaly (two competing collectors drove it above market). Do NOT include the outlier in the estimate. Mention it in narrative_summary as a ceiling possibility but do not anchor on it.

## The Ten-Comp Rule

Aim for ten independent comps before setting an estimate. If you only have 3 comps, set a wider band and note low comp density. If you have 30 comps, narrow the band. Comp density directly affects confidence score.

## Comps That Do Not Exist

Some categories have thin comp markets. A rare form or maker may have zero recent sold comps. In that case:
1. Use comps for the closest comparable maker or form
2. Apply a rarity multiplier
3. Widen the auction estimate band significantly
4. Lower the confidence score
5. Recommend the seller engage a specialist for an in-person opinion

Never fabricate a comp. If no comps exist, say so explicitly.

## Output

Populate collector_market.recent_auction_results with the TOP 3 strongest comps from the weighting ladder (not the top 3 priciest — the top 3 strongest). Populate valuation.valuation_methodology with the specific comp math you did, including the auction-to-retail ratio if you used dealer comps. In narrative_summary, name the specific comps by house and date. A Christie's January 2026 result carries more narrative weight than "ten eBay sales averaged."
