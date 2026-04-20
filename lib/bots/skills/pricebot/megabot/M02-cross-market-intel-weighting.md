---
name: pricebot-megabot-cross-market-intel-weighting
description: >
  Platform signal weighting methodology for MegaBot pricing. Defines
  the source hierarchy (sold auction, completed marketplace, dealer
  asking, retail new, social asking), a recency weighting curve, the
  platform-fee-adjusted seller-net formula across 8 marketplaces,
  regional correction factors, local-vs-national comp weighting for
  LOCAL_PICKUP items, and Amazon Rainforest/paid-pool integration
  reserved for MegaBot-tier access.
when_to_use: "MegaBot scans only. PriceBot MegaBot lane."
version: 1.0.0
---

# PriceBot MegaBot Skill: Cross-Market Intelligence Weighting

## Purpose

Pricing data from different sources has different predictive value.
Treating a completed eBay sold listing as equivalent to a Facebook
Marketplace asking price produces prices that lose money at the
transaction. This skill defines how the 4-AI team weights price
signals from multiple sources into a single synthesized valuation
and how LOCAL_PICKUP context changes that weighting.

---

## The Source Hierarchy

Sources are ranked by proximity to an actual closed transaction.
Higher-tier sources get higher weight in the weighted-median
calculation.

### Tier 1 — Sold auction-house results (weight 1.00)

A hammer price at a credentialed auction house is the gold standard.
It represents competitive bidding among motivated buyers, the price
is published, and the conditions of sale are documented. Auction
results anchor the top of the price band for collector-grade
categories.

Apply the full buyer's-premium-inclusive price as the signal, not
the hammer alone. Private buyers pay total price; the hammer is an
internal reporting metric.

### Tier 2 — Completed eBay sold listings (weight 0.90)

eBay sold data is the most abundant, most recent, most category-
comprehensive transaction evidence available. A closed eBay sale
is a closed transaction at a defined price, usually visible with
photos and a condition description. For nearly every category
below auction-grade, eBay sold is the primary anchor.

Filter for:
- Sold within the last 90 days (full weight)
- Condition tier within one step of target item
- Original-listing description is specific enough to confirm
  same-model identification

### Tier 3 — Reverb / 1stDibs / specialist-marketplace sold (weight 0.92)

For category-specific specialist platforms, sold data is actually
higher-signal than generic eBay because the buyer pool is
pre-qualified. Reverb sold for musical instruments, 1stDibs sold
for antiques and designer furniture, Watchrecon for watches,
Grailed for designer fashion.

Weight these ABOVE eBay when the category has a dedicated
specialist marketplace and the platform's sold filter is reliable.

### Tier 4 — Dealer asking prices on credentialed sites (weight 0.65)

Published dealer asking prices from established retailers (physical
storefront, known reputation) represent the retail ceiling. Dealers
price to include margin, so an asking price typically runs 25 to
40 percent above the comparable sold price.

Use dealer asking as a ceiling anchor only, never as a midpoint.

### Tier 5 — Retail new (weight 0.40, adjusted)

The new-retail price informs the ceiling of the secondary market
for categories where new and used compete (appliances, tools,
electronics). For categories where the collector market is
disconnected from new retail (vintage instruments, antiques,
discontinued electronics), retail new is not relevant.

Apply a depreciation curve:
- Year 1 used: 60 to 75 percent of new retail
- Year 2 to 5 used: 40 to 60 percent of new retail
- Year 5 to 10 used: 25 to 40 percent of new retail
- Year 10+ used: category-dependent — may appreciate in
  collector categories, continues to depreciate in commodity
  categories

### Tier 6 — Social and active-listing asking prices (weight 0.35)

Facebook Marketplace asks, Craigslist asks, OfferUp asks — these
are seller aspirations, not buyer agreements. Useful for
establishing the range of seller expectations in the local market
but should never anchor pricing alone.

### Tier 7 — Mentions without price (weight 0.10)

Reddit discussion, Instagram posts, TikTok demonstrations — these
signal category activity but do not inform price. Use as context
for demand-level assessment only.

---

## The Recency Weighting Curve

Market conditions shift. A comp from 30 days ago is materially
more predictive than one from 18 months ago. Apply this curve to
every comp before combining it into the weighted median.

- Last 30 days: weight 1.00
- 30 to 90 days: weight 0.85
- 90 days to 6 months: weight 0.70
- 6 months to 12 months: weight 0.45
- 12 months to 24 months: weight 0.20
- Older than 24 months: do not include without justification

Exception: for low-transaction-volume specialist categories (rare
antiques, museum-grade pieces), older comps carry more weight
because recent comps may not exist. The 4-AI team flags this
condition explicitly when relying on older data.

---

## Platform-Fee-Adjusted Seller-Net Math

Different platforms charge different fees. A $100 eBay sale and a
$100 Facebook Marketplace sale put different amounts in the seller's
pocket. The 4-AI team always computes seller-net by platform and
returns both list price and net.

### Fee table (as of current methodology)

| Platform | Fee | Payment Processing | Effective Take |
|----------|------|---------------------|----------------|
| eBay | 13.25% final value | Included | 13.25% |
| Etsy | 6.5% transaction | 3% + $0.25 | ~9.75% on avg order |
| Mercari | 10% final value | Included | 10% |
| Poshmark | 20% (over $15) | Included | 20% |
| OfferUp | 12.9% final value | Included | 12.9% |
| Reverb | 5% transaction | 2.7% + $0.25 | ~7.95% |
| Facebook Marketplace local | 0% | Cash/Venmo | 0% |
| Facebook Marketplace shipped | 5% | Included | 5% |
| Auction house (standard) | 15-25% sellers commission | N/A | 20% avg |
| 1stDibs | 15% seller commission | 3% | 18% |

### The seller-net formula

```
seller_net = list_price × (1 - fee_pct) - fixed_fees
```

For a $500 item:
- eBay: $500 × (1 - 0.1325) = $433.75 seller net
- Facebook Marketplace local: $500 × (1 - 0) = $500 seller net
- Poshmark: $500 × (1 - 0.20) = $400 seller net

### The "best platform" decision rule

Best platform is NOT the platform with the highest list price. It
is the platform with the highest (seller_net × probability_of_sale
÷ expected_days_to_sell).

A higher-fee platform that sells reliably in 7 days often beats a
lower-fee platform that sits for 90 days.

---

## Regional Correction Factors

Two identical items in different geographic markets command
different prices. The 4-AI team applies regional correction based
on seller ZIP.

### Rural correction (population density under 50k within 50 miles)

- Standard categories: haircut 10 to 20 percent vs national median
- Collector categories: haircut 15 to 25 percent (buyer pool smaller)
- Heavy/bulky items: premium 0 to 15 percent (shipping is expensive,
  local pickup is more valuable to rural buyers with limited
  alternatives)

### Urban premium (population density above 500k within 25 miles)

- Standard categories: premium 5 to 15 percent
- Designer/luxury categories: premium 15 to 25 percent
- Collector categories serving that urban collector market:
  premium 10 to 30 percent

### Regional specialty premiums

Some categories have geographic concentration in demand:

- Mid-century modern furniture: premium in Portland OR, Austin,
  Brooklyn, LA
- Vintage surfboards: premium in coastal CA, HI, FL
- Vintage snowmobiles: premium in ME, MN, MI, AK
- Southern antiques: premium in New Orleans, Charleston, Nashville

Identify specialty premium zones and recommend shipping to those
zones when the premium exceeds shipping cost.

---

## Local vs National Comp Weighting for LOCAL_PICKUP

When `saleMethod === "LOCAL_PICKUP"`, the weighting shifts.

### LOCAL_PICKUP weighting

- Facebook Marketplace sold (local area): weight 1.10 (boosted
  above eBay for this case)
- Local classifieds sold (Craigslist, Uncle Henry's for Maine):
  weight 0.95
- eBay sold: weight 0.60 (downweighted because shipping factor
  does not apply)
- National specialty marketplace sold: weight 0.45
- Auction house: weight 0.30 (not representative of local
  pickup market)

### LOCAL_PICKUP narrative rules

Per base PriceBot pack 19 (sale-method-local-pickup-discipline):

- NEVER reference national or distant-city prices in the pricing
  rationale.
- NEVER suggest shipping as an option when saleMethod is
  LOCAL_PICKUP.
- Local multiplier from `lib/pricing/market-data.ts` applies.
- Rural Maine 049xx zone: roughly 0.75× national median on
  common categories, less steep on specialty items with active
  local collector communities.

### Dean Guitar Worked Example (LOCAL_PICKUP, 04901, 25mi radius)

- National Reverb sold median (last 90 days): $485
- eBay sold median: $420
- Facebook Marketplace Maine sold (last 90 days): $350 to $400
- Local multiplier for 049xx zone: ~0.78
- Applied: $485 × 0.78 = $378 midpoint anchor
- Final band: $325 to $425 list, $350 target
- Narrative: "Local pickup in central Maine. Reverb national is
  higher but not relevant to local pickup — you'll see Maine
  buyers in the $350 range for a player-grade condition." NO
  reference to Nashville, Austin, or shipping.

---

## Amazon Rainforest and Paid-Pool Integration

MegaBot-tier access unlocks additional pricing sources that base
PriceBot does not see. The `isMegaBot=true` flag on the
getMarketIntelligence call enables:

### Amazon via Rainforest API

- New retail price
- Used marketplace price (when available)
- Prime vs third-party delta
- Review count and star rating (proxy for category velocity)

Use Amazon pricing as a ceiling reference for categories where
Amazon competes (appliances, tools, electronics, modern
collectibles). Do not use for antiques or specialty items where
Amazon is not the primary market.

### Paid auction aggregators

LiveAuctioneers, Invaluable, ShopGoodwill, Ruby Lane — these
feed into the MegaBot comp pool at full weight. Paid-pool comps
are the specialist anchor for antique and fine-art categories.

### Weighting when paid-pool data is present

Paid-pool comps carry weight 0.95 (near parity with Tier 2 eBay
sold). When paid-pool shows 3+ comps in the target category at
a consistent price point, that price point anchors the midpoint
with high confidence.

---

## Handling Source Disagreement

When eBay median says $500 and 1stDibs asking says $1,200, the
4-AI team does not average. It reasons about the disagreement.

### The market-segmentation reading

Wide disagreement usually means there are two markets for the
same item: a retail-dealer market at the 1stDibs level and a
marketplace-flip market at the eBay level. Both are valid. The
correct response is to present both and route by seller
priority:

- Seller wants speed: price at eBay level, list fast-turn
  platform
- Seller wants maximum: price at 1stDibs level, accept longer
  time-to-sale, consider consignment
- Seller wants balance: target midway, list at 1stDibs-adjacent
  asking, be willing to negotiate toward eBay median

Never hide source disagreement in an averaged number. The seller
needs to see the range and the logic to make the right decision.
