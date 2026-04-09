---
name: confidence-band-rubric
description: PriceBot-specific price confidence band calibration. Extends the shared confidence rubric with evidence tiers, band widths by data quality, multi-AI consensus narrowing, and appraisal thresholds.
when_to_use: Every PriceBot scan.
version: 1.0.0
---

# Confidence Band Rubric

## Relationship to the Shared Confidence Rubric

This pack extends the general confidence framework defined in _shared/03-confidence-rubric.md. That pack establishes the 0-100 confidence score scale, the five confidence tiers, and the multi-AI consensus amplification principle. This pack applies those principles to PriceBot's specific output: price ranges.

The shared rubric answers: how confident is PriceBot? This pack answers: given that confidence level, what width should the price band be, and how should it be communicated to the seller?

## Price Band Widths by Evidence Tier

Price band width is expressed as a percentage of the midpoint. A band of plus or minus 10% on a $100 midpoint produces a range of $90-$110.

### Narrow Band: Plus or Minus 8-10%

Trigger conditions: 10 or more comps, median comp age under 60 days, strong condition match (seller condition matches comp condition within one grade), well-known and liquid category, seller ZIP code in a well-served market with established comparable sales.

This band applies when the data set is rich enough that the pricing uncertainty is primarily from market noise and negotiation variance, not from data gaps. A seller can list confidently at the midpoint and expect to close within the band.

Example output: "Recommended price: $145. Based on 12 fresh comps (last 45 days), confidence is high. Expected range: $130-$160."

### Standard Band: Plus or Minus 15-20%

Trigger conditions: 5 to 9 comps, median comp age 30-90 days, reasonable condition match (seller condition is identifiable but comps are not perfectly matched), moderate category liquidity.

This is the most common band for general household items and used goods. The range is actionable but the seller should expect some negotiation variance.

Example output: "Recommended price: $85. Based on 6 comps from the last 75 days, confidence is good. Expected range: $68-$102."

For items at the upper end of this range (9 comps, fresh data, good condition match), the seller can list at the high end of the band. For items at the lower end (5 comps, 90-day-old data, imperfect condition match), the seller should list at midpoint and expect downward negotiation.

### Wide Band: Plus or Minus 25-35%

Trigger conditions: 2 to 4 comps, thin data, stale comps (median age 90-180 days), unclear or mixed condition, unusual item with limited comparable sales, or significant variation across the available comps (comp range exceeds 50% of the median).

The wide band signals genuine uncertainty. The seller should understand that the market will tell them where the item actually prices — the listing may need adjustment after initial buyer response.

Example output: "Recommended price: $120. Based on 3 comps (some data over 90 days old), confidence is moderate. Price may range $78-$162. Consider starting at $130 and adjusting if no interest within 2 weeks."

For wide-band items, the output should include explicit price-testing guidance: what to do if the item gets many views but no offers (price is high, reduce by 10-15%), and what to do if it sells within 48 hours (may have been underpriced, note for similar future items).

### Very Wide Band: Plus or Minus 40-60%

Trigger conditions: 0 to 1 comps, no matching data, unique or one-of-a-kind items, custom or handmade items without comparable sales, items with unusual provenance or condition extremes.

The very wide band is an honest admission that the system does not have sufficient data to price the item with confidence. Presenting a narrow range here would be false precision.

Example output: "Estimated value: $200-$400. This item has very limited comparable sales data, and our confidence is low. We recommend professional appraisal, or starting at $350 and observing buyer response carefully."

When the very wide band is triggered, the output must include a recommendation for how to gather better pricing information: professional appraisal, specialist auction preview estimate, or consignment shop evaluation.

## How the Four AIs in MegaBot Narrow the Band

The MegaBot system runs up to four AI models (OpenAI primary, Gemini secondary, Anthropic Claude tertiary, and optionally a fourth) in parallel on specialty items. Consensus amplification — when multiple independent models arrive at similar estimates — reduces the effective band width.

Band reduction from consensus:

Two models within 10% of each other: reduce band width by 20% relative. A standard band of plus or minus 18% narrows to plus or minus 14%.

Three models within 10% of each other: reduce band width by 35% relative. A standard band of plus or minus 18% narrows to plus or minus 12%.

Four models within 10% of each other: reduce band width by 50% relative. A standard band of plus or minus 18% narrows to plus or minus 9%.

When models diverge (one outlier more than 25% from the others): flag the divergence explicitly in the output and do not apply band narrowing. A divergent model is a signal, not noise — it may be detecting something the others missed.

The rationale for consensus band narrowing: four independent AI systems drawing on different training data, different model architectures, and different internal pricing heuristics are unlikely to arrive at the same estimate by accident. Convergence is meaningful evidence of reliability.

## Evidence Tier Statement in Every Output

Every PriceBot output must include a one-line evidence tier statement that makes the confidence band's basis explicit. This is not optional and should not be omitted for brevity.

Format: "Confidence band: [band width]. Evidence tier: [tier name]. Based on [N] comps, median age [X] days, [condition match description]."

Examples:
- "Confidence band: plus or minus 10%. Evidence tier: Narrow. Based on 14 comps, median age 28 days, strong condition match."
- "Confidence band: plus or minus 28%. Evidence tier: Wide. Based on 3 comps, median age 140 days, condition match uncertain."
- "Confidence band: plus or minus 55%. Evidence tier: Very Wide. Based on 0 matching comps — unique item."

The evidence tier statement gives the seller a transparent, one-sentence summary of how much weight to put on the number. It serves the same function as an error bar on a scientific result: not a sign of weakness, but a sign of intellectual honesty.

## The Appraisal Threshold

When the confidence score falls below 50 AND the estimated item value is above $500, the output must include a professional appraisal recommendation. This is a compound trigger — both conditions must be met.

Low confidence alone (below 50) on a $10 item does not warrant appraisal. The cost of appraisal exceeds the item's value.

High value alone ($500+) with high confidence (above 70) does not automatically require appraisal, though it may be recommended for insurance purposes (see Pack 09).

The compound trigger (low confidence + high value) indicates a situation where the cost of appraisal ($150-$400 typical for a single item) is clearly worth paying given the potential downside of mispricing a $500+ item.

The appraisal recommendation must include:
- Specific type of appraiser recommended (ISA-certified, ASA, AAA, or specialist by category)
- Estimated appraisal cost
- What the appraisal will provide that AI assessment cannot (USPAP compliance, written documentation, defensible in legal proceedings)
- Where to find a credentialed appraiser (appraiser finder services, local auction houses, estate attorneys)

## Band Width and Listing Strategy

The price band informs not just what price to list at, but how the listing should be managed over time.

Narrow band items: list at the midpoint or 5% above. The market is well-defined and the seller can be confident. Do not accept the first low offer automatically — the data supports holding price.

Standard band items: list at 10% above the midpoint. This leaves room for negotiation to land at a fair price. If no offers after two weeks, reduce to midpoint.

Wide band items: list at the midpoint. The uncertainty in the pricing means the market response is the best feedback mechanism. After two weeks of no offers, reduce by 15%. After four weeks, reassess using new comp data.

Very wide band items: list at the high end of the estimated range. With limited data, there is asymmetric upside in testing a higher price — a quick sale at the high end reveals the item may be worth more than estimated. A slow sale at the high end provides data to calibrate down.
