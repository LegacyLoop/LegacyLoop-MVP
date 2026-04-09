---
name: price-freshness-decay
description: How comp age degrades pricing confidence and must be disclosed. Covers the freshness decay curve, pandemic-era data distortion, mandatory freshness warnings, and category-specific decay rates.
when_to_use: Every PriceBot scan.
version: 1.0.0
---

# Price Freshness Decay

## Why Freshness Is a First-Class Pricing Dimension

A comp from 12 months ago is not the same as a comp from last week. In a stable market, the difference might be minor. In the used goods market of 2023-2026, the difference can be 30-50% in either direction depending on the category.

PriceBot treats comp freshness as a first-class pricing dimension — not an afterthought or a footnote. Every output that draws on comp data must disclose the age distribution of that data, apply the appropriate confidence weight, and flag when staleness materially affects the reliability of the recommendation.

Sellers making real decisions about real money deserve to know whether the price they are given is based on what sold last Tuesday or what sold eighteen months ago during a different market.

## The Freshness Decay Curve

PriceBot applies the following weighting schedule to individual comps when computing the weighted median price:

0-30 days: full weight, 100%. These are fresh comps and receive maximum influence on the pricing recommendation.

31-60 days: 90% weight. Recent but not current. For fast-moving categories (electronics, fashion), treat with mild caution.

61-90 days: 80% weight. Three-month-old data is still useful in stable categories. Flag in output if the category is fast-moving.

91-180 days: 65% weight. Half-year-old comps have meaningful decay. Include but apply a confidence reduction.

181-365 days: 40% weight. Data this old is directional at best. Useful as a sanity check but should not anchor the primary estimate.

Over 365 days: 20% weight, treated as directional only. Never cite as primary support for a pricing recommendation. Use only as a backstop in categories with very thin recent data.

When computing the weighted median, apply these weights to the comp price values before calculating the central tendency. A set of 8 comps that includes 3 from last month and 5 from 18 months ago should not produce the same confidence as a set of 8 comps from the last 30 days.

## The 2021-2022 Pandemic Bubble and Its Aftermath

The used goods market went through a documented distortion cycle between 2020 and 2025. During 2021 and 2022, stimulus-driven consumer spending, supply chain disruptions, and pandemic-era behavioral changes (people nesting, collecting, and shopping online) inflated prices across many categories.

By 2023, deflation set in as inventory normalized, consumer savings declined, and discretionary spending contracted. By 2025-2026, many categories have settled at prices 20-40% below their 2021-2022 peaks.

The practical consequence for PriceBot: any comp from 2021 or 2022 in an affected category is structurally misleading. It does not reflect current market demand. Using it to support a 2026 pricing recommendation overstates what the seller will actually receive.

Affected categories where 2021-2022 comps are especially unreliable: home exercise equipment, musical instruments, gaming hardware and collectibles, bicycles, RVs, power tools, home improvement supplies, and many mid-century modern furniture categories. These categories saw the steepest run-up and the steepest correction.

Categories less affected by the bubble cycle: fine antiques, jewelry, and art (slow-moving, less correlated to consumer trends), books and media (small dollar amounts, stable demand), and specialty industrial items.

When PriceBot detects that available comps skew toward 2021-2022 dates and the item is in an affected category, the output must include an explicit distortion warning.

## The Mandatory Freshness Warning Threshold

When the median comp age across the available comp set exceeds 120 days, the output must include a prominently placed freshness warning. This is a hard rule, not a judgment call.

The warning must state, in plain language:

- How many comps were used
- The median age of those comps
- The confidence reduction applied
- A plain-language explanation of what this means for the seller

Example warning: "Pricing based on 4 comps with a median age of 185 days. This data is moderately stale. Our confidence in this estimate is reduced to [X]%. The recommended price should be treated as directional. We recommend checking 2-3 recent completed sales on eBay before finalizing your listing price."

When the median comp age exceeds 180 days, the warning escalates: the word "stale" must appear, the confidence reduction must be displayed numerically, and the output must include a recommendation to gather fresh data before listing.

When the median comp age exceeds 365 days, the output must not present a confident price recommendation. It should present a directional range and state clearly that current pricing requires either fresh data or professional assessment.

## Communicating Freshness to Sellers

Sellers do not understand comp weighting formulas. They do understand the difference between "this price is based on what sold last week" and "this price is based on what sold last year."

Use plain-language freshness tiers in all output:

Fresh data: median comp age under 60 days. Use the label "fresh data" in the output. Example: "Based on 8 comps from the last 60 days (fresh data), we recommend pricing at $[X]."

Recent data: median comp age 60-120 days. Use the label "recent data." Example: "Based on 6 comps from the last 90 days (recent data), confidence is good."

Dated data: median comp age 120-180 days. Use the label "dated data." Include freshness warning. Example: "Based on 4 comps from 4-6 months ago (dated data — confidence reduced). Verify with current listings before finalizing."

Stale data: median comp age over 180 days. Use the label "stale data." Include elevated warning. Example: "Based on 3 comps older than 6 months (stale data — confidence significantly reduced). We strongly recommend verifying current market prices before listing."

## Category-Specific Decay Rates

Not all markets move at the same speed. The decay curve above is a default; category-specific adjustments override it.

Electronics: fastest decay. Prices for consumer electronics drop on a roughly weekly cycle as new models release and inventory accumulates. For electronics, a 60-day-old comp should be treated with the same caution as a 120-day-old comp in a stable category. The 31-60 day weight for electronics is reduced to 75% rather than 90%.

Fashion and apparel: seasonal decay. A comp from the opposite season carries reduced weight. A winter coat comp from last March is not a useful anchor for a listing in November — the comp is only 8 months old but season-mismatched. Apply an additional 30% weight reduction for seasonally mismatched comps.

Toys and games: release-cycle decay. Toy prices peak at holiday season (October-December) and deflate sharply in January-March. Board games and puzzles follow similar seasonal patterns. A comp from November for a toy being listed in February should be weighted at 50% of its age-adjusted weight.

Antiques and fine art: slowest decay. Prices for well-documented antiques and art move slowly and are less correlated to consumer market cycles. The decay curve for antiques extends: 0-90 days = 100%, 91-180 days = 95%, 181-365 days = 85%, over 365 days = 70% (still directionally useful, not merely decorative).

Furniture: moderate decay, category-dependent. Mid-century modern has had significant market movement (runup 2018-2022, correction 2023-2025). Victorian and traditional furniture has been in secular decline for a decade. The decay curve should be applied at standard rates but accompanied by trend context.

## Comp Source Freshness Verification

PriceBot must request comp data with date filters applied. Fetching all-time eBay sold listings and using the full set without date weighting is a category error. The comp request should prioritize the most recent 90 days, request up to 180 days if the 90-day set contains fewer than 5 comps, and go to 365 days only when the 180-day set is still below 3 comps.

When the 365-day set contains fewer than 3 comps, the item is thinly traded and should be flagged as such. Thin-market pricing requires either specialist assessment or a directional estimate with an explicit caveat.
