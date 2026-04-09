---
name: high-value-item-pricing
description: Specialist treatment for items valued at $500 or above, including dual-opinion pricing reports, three distinct value types, and professional appraisal thresholds.
when_to_use: Every PriceBot scan.
version: 1.0.0
---

# High-Value Item Pricing

## Trigger Conditions

When PriceBot receives an item with an estimated value at or above $500, or when the routing engine has set the specialty_item flag, the standard single-number pricing output is insufficient. The Gemini secondary fires on these items and produces a dual-opinion pricing report. The OpenAI primary and Gemini secondary results are presented together, with agreement and divergence both surfaced explicitly.

This elevated treatment exists because the cost of error is asymmetric. Underpricing a $600 item by 20% means the seller loses $120 in realized value. Overpricing a $600 item by 30% means it sits unsold. Both outcomes are costly in ways that a $30 error on a $45 item is not.

## Three Distinct Value Types

Every high-value item output must include three value types. These are not interchangeable and must never be collapsed into a single number.

### Insurance Replacement Value

Insurance replacement value (IRV) is the cost to replace the item with an equivalent one purchased at retail or from a reputable dealer. IRV is typically 1.5 to 2.0 times fair market value, depending on category. For antiques, fine art, and jewelry, dealer retail premiums are highest. For electronics and appliances, dealer retail is only modestly above private-party resale.

Present IRV to the seller as: the amount a homeowner's or renter's insurance policy should cover this item for. IRV is not what you will receive selling it — it is what it would cost you to replace it if it were lost or stolen.

### Fair Market Value

Fair market value (FMV) is the price at which the item would change hands between a willing buyer and a willing seller, neither being under compulsion to buy or sell and both having reasonable knowledge of relevant facts. This is the IRS standard and the foundation of estate and gift tax valuations.

FMV is derived from recent completed sales of comparable items in comparable condition, adjusted for local market dynamics, platform, and condition differentials. PriceBot's comp analysis produces a FMV range. The midpoint of the comp-derived range, after applying confidence weighting and market multipliers, is PriceBot's FMV estimate.

### Liquidation Value

Liquidation value is the price achievable under forced or time-constrained sale conditions. This is typically 40 to 60 percent of FMV, though the range varies by category.

Items with deep, liquid markets (common furniture, popular electronics) liquidate closer to 55-65% of FMV because there are always buyers. Items with thin markets (unusual antiques, specialized equipment) liquidate at 30-45% of FMV because the buyer pool is small and urgency punishes the seller.

Liquidation value must be presented honestly but gently. Many sellers conflate what they could get at auction house quick-sale with what their item is worth. The output must make clear that a lower liquidation value does not mean the item is not valuable — it means the item benefits from patient selling.

## Dual-Opinion Report Structure

When Gemini secondary fires, the output includes:

- OpenAI primary estimate (low, mid, high with confidence)
- Gemini secondary estimate (low, mid, high with confidence)
- Consensus range (overlap zone or averaged midpoint)
- Notable divergence note (if the two estimates differ by more than 15%, state why)
- Final recommended listing price (consensus-derived)

Present the dual opinion as a feature, not a flaw. Two independent AI models arriving at similar values increases seller confidence. When they diverge, the divergence is informative — it may indicate condition uncertainty, thin comp data, or genuine market ambiguity.

## When to Recommend Professional Appraisal

PriceBot must recommend professional appraisal in the following situations:

Items with a FMV estimate at or above $2,000. At this threshold, the cost of a professional appraisal (typically $150-$400 for a single item) is small relative to the potential pricing error. An appraiser may find the item is worth $4,000 or $800 — either finding matters at that dollar level.

Unique or one-of-a-kind items. If PriceBot's comp search returns fewer than 3 comparable sales, or if the item has unique provenance, maker, or historical significance, AI-derived pricing cannot be adequately calibrated.

Insurance documentation purposes. If the seller explicitly mentions insurance, estate filing, IRS donation, divorce proceeding, or legal dispute, AI assessment is not appropriate for documentation. Certified appraisal is required.

Fine art, jewelry, and watches over $500. These categories have specialist appraisal markets for good reason. The difference between an authenticated piece and an unattributed one can be multiples of value.

## USPAP Disclosure

Every high-value item output must include the following statement, or a close equivalent:

"This pricing assessment is produced by an AI system and does not constitute a certified appraisal. It is not compliant with the Uniform Standards of Professional Appraisal Practice (USPAP). For insurance documentation, estate tax filing, legal proceedings, or items where the value determination has formal consequences, a USPAP-compliant appraisal from a credentialed appraiser is required."

This is not boilerplate to be skimmed. It must be visually prominent in the output, not buried in a footer. The seller making decisions on a $3,000 item deserves to understand what they are working with.

## Presenting Three Values Without Confusing the Seller

The common seller confusion is to anchor on the highest number (usually IRV) and treat it as what they will receive. The output must address this directly.

Recommended framing: "Your [item] has three relevant values. The insurance replacement value is $[IRV range] — this is what it would cost to replace it. The fair market value is $[FMV range] — this is what a patient, well-marketed sale should produce. The liquidation value is $[LV range] — this is what you could expect in a quick or forced sale. We recommend listing at $[FMV mid] and adjusting if it has not sold in [X] days."

## Market Category Notes for High-Value Items

Furniture: Antique and period furniture retains value well. Mid-century modern has a strong collector market. Brown furniture (Victorian-era dark wood) has been deflating for a decade and should not be priced on age alone.

Silver and silverplate: Sterling silver has a melt value floor (calculate from current spot price times troy ounces times 0.925 purity). Silverplate has no melt value and is priced on aesthetic and maker reputation alone.

Watches: Rolex, Patek Philippe, and a handful of other Swiss makers have robust secondary markets with published reference prices. Non-luxury watches are almost always worth far less than the seller expects.

Jewelry: Without gemological certification (GIA, AGS), AI pricing of jewelry is speculative. Always recommend professional appraisal for jewelry above $500.
