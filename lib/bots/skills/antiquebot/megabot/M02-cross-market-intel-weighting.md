---
name: antiquebot-megabot-cross-market-intel-weighting
description: >
  Multi-auction house price weighting framework for MegaBot consensus
  in AntiqueBot. Governs how the four AI models reconcile comparable
  sales data from Invaluable, 1stDibs, LiveAuctioneers, RubyLane, and
  eBay. Defines source tiers, weighting formulas, regional premium
  adjustments, and conflict-resolution logic when comp data diverges.
when_to_use: >
  Invoke during MegaBot consensus synthesis whenever two or more AI
  models return pricing estimates drawn from different marketplace
  sources. Required for any item valued above $500 where comp spread
  exceeds 30 percent. Also required when any single AI cites only
  one source tier.
version: "1.0.0"
---

# Cross-Market Intelligence Weighting for MegaBot Consensus

## Purpose

When four AI models each independently research comparable sales, they
will inevitably draw from different sources, different date ranges, and
different geographic markets. Without a disciplined weighting framework,
the consensus valuation becomes a simple average of unequal inputs. This
skill defines the hierarchy of source authority, the formulas for
weighting conflicting data, and the standards for presenting a defensible
final estimate.

The cardinal rule: a sold result always outweighs an asking price. A
Tier 1 auction hammer price always outweighs a Tier 4 marketplace listing.
This is not a preference — it is market epistemology. A sold result is
a transaction that occurred. An asking price is a hope.

---

## Source Tier Hierarchy

### Tier 1 — Major International Auction Houses
Sotheby's, Christie's, Bonhams, Phillips, Doyle, Heritage, Rago, Wright.
These results carry maximum weight. Buyer's premiums are published and
consistent. Cataloguing is performed by credentialed specialists. Condition
reports accompany most lots. Provenance is vetted. Results are publicly
archived and verifiable.

Weight multiplier: 1.00 (baseline authority)

### Tier 2 — Regional Auction Houses with Specialist Staff
Skinner, Neal Auction, Michaan's, Cowan's, Brunk, Pook and Pook,
Copake Auction, Crocker Farm. These houses employ category specialists
and maintain professional cataloguing standards. Results are reliable
but reflect regional buyer pools, which may suppress or inflate certain
categories relative to international markets.

Weight multiplier: 0.88

### Tier 3 — Curated Online Marketplaces (Dealer Listed)
1stDibs, Chairish, TIAS, RubyLane (dealer storefronts). Prices here are
asking prices set by professional dealers who have acquired inventory and
carry overhead. Dealer asking prices represent the retail ceiling, not
the auction clearing price. However, they reflect current market appetite
and can establish price floors for categories where auction results are
sparse.

Weight multiplier: 0.65 (asking price discount applied automatically)

### Tier 4 — General Online Marketplaces
eBay (sold listings only), Etsy (vintage category), LiveAuctioneers
(small regional cataloguers without specialist staff), Invaluable
(aggregator — source quality varies widely). eBay sold data is high
volume but condition documentation is inconsistent. Seller descriptions
are self-reported. Buyer pool is broad, which produces both bargain and
premium results depending on listing quality.

Weight multiplier: 0.52 (eBay sold) / 0.35 (eBay asking — discard)

---

## Hammer Price vs Pre-Sale Estimate as Demand Signals

A hammer price that exceeds the high estimate signals strong buyer
competition. Treat this as a demand-premium flag and increase the
Tier 1 comp weight by 0.10 for that specific result.

A hammer price that falls below the low estimate signals weak demand,
condition disappointment at preview, or estate market saturation for
that category. Treat this as a suppression signal and discount the
result by 0.15 relative to its tier weight.

A no-sale (passed lot or bought-in) is not a zero. It establishes a
reserve floor. If the reserve is published, use it as a price floor.
If the reserve is unpublished, discard the result rather than guess.

---

## Regional vs National vs International Premiums

American furniture sold at a New England regional house will reflect
the local collector base, which is often the strongest in the country
for that category. A Goddard-Townsend Newport piece at Skinner will
often exceed its equivalent at a Southern regional house.

Apply regional premium flags:
- New England furniture at New England houses: +8 percent
- American folk art at American folk art specialists: +12 percent
- European Old Masters at European auction houses: +10 percent
- Asian works at Hong Kong or Taiwanese houses: +15 percent
- Native American art at Santa Fe regional houses: +18 percent

When a comp crosses regions (American piece sold in Europe), apply a
neutralizing factor of minus 8 percent to account for import friction,
currency exchange at sale date, and buyer pool unfamiliarity.

---

## Weighting Table for MegaBot Consensus

| Source Type                       | Data Type     | Raw Weight | Demand Bonus | Suppression |
|-----------------------------------|---------------|------------|--------------|-------------|
| Tier 1 Major House (exceeded est) | Hammer/Sold   | 1.00       | +0.10        | n/a         |
| Tier 1 Major House (within est)   | Hammer/Sold   | 1.00       | none         | n/a         |
| Tier 1 Major House (below est)    | Hammer/Sold   | 1.00       | n/a          | -0.15       |
| Tier 2 Regional House             | Hammer/Sold   | 0.88       | +0.08        | -0.12       |
| Tier 3 Dealer Listed              | Asking Price  | 0.65       | none         | n/a         |
| Tier 4 eBay Sold                  | Sold          | 0.52       | none         | -0.10       |
| Tier 4 eBay Asking                | Asking Price  | Discard    | n/a          | n/a         |
| Tier 4 LiveAuctioneers (small)    | Hammer/Sold   | 0.48       | none         | -0.10       |

---

## When Comp Data Clusters vs Spreads

A tight cluster — all comps within 20 percent of the median — indicates
a liquid, well-documented category. Report the midpoint with a narrow
band of plus or minus 15 percent.

A moderate spread — comps within 20 to 50 percent of the median —
indicates category volatility or condition-driven pricing variation.
Report the midpoint with a band of plus or minus 25 percent. Flag the
spread in the output.

A wide spread — comps spanning more than 50 percent of the median —
indicates one or more of: significant condition variation in the comps,
inconsistent attribution, regional market fragmentation, or a category
in transition. In this case, weight only Tier 1 and Tier 2 results,
discard Tier 3 and Tier 4, and report with a band of plus or minus 35
percent. Recommend specialist review.

---

## How the Four AIs Weight Against Each Other

When all four models return comps, the consensus engine weights each
AI's input by the highest source tier its comps achieved.

If Model A cited two Tier 1 comps, Model B cited one Tier 1 and two
Tier 4, Model C cited three Tier 3 dealer listings, and Model D cited
five Tier 4 eBay results, the consensus should weight Model A at full
authority, Model B at blended authority (Tier 1 dominates but Tier 4
dilutes), Model C at 0.65, and Model D at 0.52.

The consensus midpoint should not be a simple average of four model
outputs. It should be a weighted average where each model's contribution
is scaled by its highest-tier comp source multiplied by the number of
sold results (not asking prices) it produced.

---

## Conflict Resolution: Specific Examples

Example 1 — Chippendale chest: Model A finds a Sotheby's 2023 result
at $18,500. Model B finds three eBay sold listings averaging $4,200.
Model C finds a 1stDibs asking price at $28,000. Model D finds a
Skinner 2022 result at $12,000. Apply weights: Sotheby's (1.00),
Skinner (0.88), 1stDibs asking (0.65), eBay average (0.52). Weighted
consensus centers near $14,800. The eBay data pulls low because the
condition documentation on those listings was unverified. The 1stDibs
asking price is ceiling, not clearing. Report estimate range $12,000
to $18,500 with midpoint $14,800.

Example 2 — Tiffany lamp: All four models return Tier 1 results because
the market is well-documented. Three results cluster between $65,000 and
$80,000. One outlier sold at $42,000 (noted in the Christie's catalog
as having a replaced shade). Discard the outlier on condition grounds,
or treat it as a low-condition floor. Report $65,000 to $85,000.

---

## Handling Missing Comp Data

If fewer than three sold comps exist across all tiers for a specific
model or maker, expand the search radius: first to related maker, then
to period and style, then to material and form. Document each expansion
step in the output. A valuation built on style comps rather than maker
comps must be labeled as such.

Never synthesize a range without disclosing the source tier of the
comps that produced it. The seller deserves to know whether the estimate
rests on Christie's hammer prices or on eBay sold listings.
