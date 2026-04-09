---
name: comp-data-interpretation
description: How to read and weight sold comp data correctly for pricing. Covers active vs sold listing distinction, time-decay weighting, confidence thresholds, comp matching hierarchy, platform equivalence issues, and auction hammer price adjustments.
when_to_use: "Every PriceBot scan."
version: 1.0.0
---

# Comp Data Interpretation

## The Single Most Important Rule

Active listing prices are not comp data. They are asking prices. They represent what sellers hope to receive. Many of them will never sell at that price. PriceBot must never anchor a price recommendation on active listing data.

Sold listings are the only valid comp data. A sold listing is a completed market transaction between a willing buyer and a willing seller at an agreed price. It is the only price that matters.

When presenting comp-based pricing to sellers, be explicit: "This estimate is based on X items that actually sold on [platform] in the past [timeframe], not on what other sellers are currently asking."

## Active vs Sold Distinction in Practice

eBay provides both active listings and completed/sold listings. The interface distinction:
- "Completed listings" shows all listings that ended, including unsold items.
- "Sold listings" (checkbox in eBay search advanced options) shows only those that transacted.

The gap between active asking prices and actual sold prices is frequently 30 to 60 percent in vintage and antique categories. A seller who prices based on what they see listed is almost always overpricing.

Example: A seller sees 15 active listings of similar Victorian parlor chairs ranging from $280 to $850. They conclude their chair is worth $500. The sold data shows the last 10 completed sales of similar chairs at $120 to $280. The active listings are aspirational. The sold data is reality.

When active price data is the only data available (thin market, new category), flag it clearly: "No sold comps were found. Active listing prices suggest a range of $X to $Y, but these reflect seller asking prices, not confirmed market value. Recommend listing at the low end of this range to generate buyer interest and gather real-time market data."

## Time-Decay Weighting for Comps

Markets move. A price from three years ago may be significantly different from today's market. PriceBot applies time-decay weighting to comp data:

30 days or less: 100 percent weight. These are the most relevant comps and should be the primary anchor.

31 to 90 days: 90 percent weight. Still highly relevant. Minor trend adjustments may apply if the category is moving.

91 to 180 days: 75 percent weight. Use as supporting context. Check whether more recent comps are available before anchoring on these.

181 days to 12 months: 50 percent weight. Directional only. Market conditions may have changed significantly, especially in categories affected by trend cycles (mid-century furniture, vintage fashion).

More than 12 months: 25 percent weight. Use only as a historical floor or ceiling. Do not use as a primary price anchor. Flag the age: "The best available comps are more than one year old. Price with caution and plan to monitor and adjust."

When all available comps are more than 12 months old, note this prominently and recommend supplementing with a dealer or appraiser opinion for high-value items.

## Comp Confidence Thresholds

The number of matching sold comps determines pricing confidence and recommended price band width.

10 or more matching comps within 90 days: High confidence. Use the median sold price as the anchor. Present a tight band (plus or minus 10 to 15 percent). Eliminate outliers (highest and lowest 10 percent) before computing the median.

5 to 9 matching comps within 90 days: Moderate confidence. Use the median but present a wider band (plus or minus 15 to 25 percent). Note the comp count in the output.

2 to 4 matching comps within 90 days: Low confidence. Use the average of available comps but present a very wide band (plus or minus 25 to 40 percent). Explicitly flag: "Pricing confidence is limited. Fewer than 5 recent sold comps were found for this item. The range below reflects the available data but carries significant uncertainty."

0 to 1 comp within 90 days: Insufficient data for comp-based pricing. Do not fabricate a price from a single data point. Instead: (1) widen the search to 12 months; (2) search at the category level if item-level comps are absent; (3) flag "insufficient sold comp data" and recommend professional appraisal for items likely to exceed $200 in value; (4) use material value, AI pricing estimate, and category baselines as a floor and ceiling with explicit uncertainty disclosure.

## The Comp Matching Hierarchy

Comps must match the item to be valid. The hierarchy of match quality, from most to least valuable:

Level 1 — Same item: Same maker, same model, same variant, same size, same era, similar condition. This is a direct comp. Full weight.

Level 2 — Same maker: Same manufacturer or artist, different item in the same category, similar era and condition. 75 percent weight.

Level 3 — Same category, similar era: Different maker but same type of object, similar period. 50 percent weight.

Level 4 — Same category, different era: Same type of object but different time period. 25 percent weight. Useful for establishing category floor and ceiling, not for precise pricing.

Level 5 — Adjacent category: A related but different type of object. 10 percent weight. Use only when no category-level comps exist.

When PriceBot relies on Level 3, 4, or 5 comps, disclose this explicitly: "Direct comps for this item are limited. The price range below is extrapolated from [broader category / similar maker / adjacent category] sold data and carries higher uncertainty than a direct comp analysis."

## Auction Hammer Price Adjustment

Auction hammer prices (from LiveAuctioneers, Invaluable, Sotheby's, Christie's, regional auction houses) require adjustment before use as resale comps because they do not represent what the buyer paid or what the seller netted.

Buyer pays: hammer price plus buyer premium (typically 20 to 30 percent for major houses, 15 to 20 percent for regional houses). The "buyer paid" amount is hammer price times 1.20 to 1.30.

Seller nets: hammer price minus seller commission (typically 10 to 20 percent for major houses, 5 to 15 percent for regional houses). If a hammer price is $500 and the seller's commission is 15 percent, the seller received $425.

When using auction hammer prices as comps:
- Compare the hammer price to online resale asking prices, not to online resale net prices.
- A hammer price of $400 at a regional auction is roughly equivalent to a $360 to $440 eBay sold listing, depending on house and lot conditions.
- Do not treat a Sotheby's hammer price as equivalent to an eBay sold price without adjustment. Sotheby's buyers pay a higher premium and are a different buyer type — prices are not directly comparable.

## Platform Equivalence Issues

Sold prices on different platforms are not equivalent for the same item because the buyer pools differ significantly.

1stDibs sold price vs eBay sold price: 1stDibs prices may be 30 to 80 percent higher than eBay for the same item. The 1stDibs buyer is a decorator or institutional buyer paying for curation and convenience. The eBay buyer is a collector or reseller.

Etsy sold price vs eBay sold price: Etsy prices may be 10 to 30 percent above eBay for aesthetic categories (ceramics, vintage jewelry, textiles) because Etsy buyers are paying for presentation and story.

Facebook Marketplace sold price vs eBay sold price: Facebook local prices may be 20 to 40 percent below eBay because local buyers have less competition and more negotiating power.

Auction hammer price vs retail gallery: Auction hammer prices are typically 40 to 60 percent of dealer retail for similar items. A dealer retail price is not a comp — it is a markup over acquisition cost.

When mixing comps from multiple platforms, note the platform mix and the inherent price spread it introduces.

## Outlier Handling

Comp data sets frequently contain outliers that distort the analysis if included:

High outliers: One sale at 3 to 5 times the median often represents a misidentification (a common item mistakenly listed and sold as a rare variant), a provenance premium (celebrity ownership), or an auction bidding war between two motivated collectors. Do not anchor pricing on a single high outlier.

Low outliers: One sale at a fraction of the median often represents a misdescribed item, an estate lot bundled with other pieces, or a seller who urgently needed cash and accepted a lowball offer. Do not use a single low outlier as the floor.

Standard practice: For comp sets of 6 or more, remove the top and bottom 10 percent before computing median. For comp sets of 4 to 5, remove the single highest and single lowest. For comp sets of 2 to 3, note both sales and use the average with a wide band.

## Communicating Comp Quality to Sellers

Always tell sellers the quality of the comp data underlying the price estimate. Three levels of disclosure:

Strong comp basis: "This price range is based on 12 sold listings of similar [item type] on eBay in the past 45 days. Confidence is high."

Moderate comp basis: "This price range is based on 6 sold listings over the past 90 days, with some variation in condition match. Confidence is moderate."

Weak comp basis: "Direct sold comps for this item are limited. This estimate is extrapolated from [source] and should be treated as a broad directional range rather than a precise price. For items in this value range, we recommend professional appraisal before committing to a final price."

Sellers who understand the quality of their pricing data make better decisions. Presenting a confident precise number from weak data harms sellers and the platform's credibility.
