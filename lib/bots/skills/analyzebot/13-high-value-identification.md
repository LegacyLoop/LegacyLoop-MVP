---
name: high-value-identification
description: Accuracy standards, conservative valuation protocol, and specialist bot routing logic for items where estimated value exceeds $500. Covers the risk profile of high-value misidentification and how AnalyzeBot's initial estimate determines the entire downstream specialist chain.
when_to_use: Every AnalyzeBot scan.
version: 1.0.0
---

# High-Value Identification Standards

## Why High-Value Items Require Special Care

At the $50 price point, a $15 identification error is noise. A buyer pays slightly more or less than expected, and the transaction completes without incident.

At the $5,000 price point, a $1,500 identification error is a real financial injury. An underidentified piece sells for $3,500 when it should have fetched $5,000 — the seller loses $1,500 they were entitled to. An overidentified piece is listed at $7,000 based on a wrong attribution, sits unsold for months, and eventually sells at a deep discount after the seller loses confidence in the platform.

The accuracy standard for items above $500 is higher than for items below $500. This is not because the item is more important as an object — it is because the financial stakes of an error are higher.

## The Conservative Valuation Rule on First Pass

AnalyzeBot's first-pass valuation should lean conservative. This is the opposite of what sellers emotionally prefer, but it is the correct behavior for several reasons.

Conservative estimates that get revised upward by PriceBot feel like good news to the seller. The platform found even more value than it initially estimated. The seller's experience improves.

Aggressive estimates that get revised downward by PriceBot feel like the platform overpromised and underdelivered. The seller loses trust even when the final number is accurate.

Conservative estimates trigger the Gemini secondary more reliably. If you estimate $480 when the true value is $600, the secondary does not fire. If you estimate $520, it does fire, the secondary confirms, and the seller gets a more accurate final estimate. The trigger threshold of $500 exists for a reason — set your estimates accurately so it fires when it should.

What conservative means in practice: use the lower end of comparable sales when evidence is mixed. Do not extrapolate from the highest comp — extrapolate from the median. When condition is uncertain, assume fair rather than good. When attribution is uncertain, value as unattributed rather than attributed.

What conservative does not mean: deliberately undervaluing to suppress expectations. The goal is accuracy, not pessimism. A clearly documented, well-preserved Stickley sideboard should be valued like a Stickley sideboard, not like generic mission furniture.

## The High-Value Secondary AI Trigger

When estimated_value_mid reaches or exceeds $500, the router fires the Gemini secondary analysis pass automatically.

Your responsibility: set estimated_value fields accurately so this threshold fires correctly.

If you set estimated_value_mid to $495 on an item you believe is worth $600-800, you are suppressing a secondary that should fire. This is a process error with real consequences — the seller does not get the confirmation they paid for and the final price may be less accurate.

If you set estimated_value_mid to $600 on an item you believe is worth $300-400 because you want to trigger the secondary "just in case," you are creating a false high expectation that PriceBot will have to revise downward. This erodes seller trust.

Set the mid value at your honest best estimate of the most likely sale price, and let the threshold work as designed.

## Common High-Value Misidentification Risks

The errors that cost sellers the most money fall into three categories:

Reproduction misidentified as period piece (overvaluation): a 1970s "antique reproduction" Windsor chair sold as an 18th-century piece. A late Tiffany-style lamp (Arts and Crafts revival) sold as an early Tiffany Studios piece. A period-style piece made in the 1920s-1940s sold as a pre-Civil War original.

Detection signals for reproductions: too-perfect patina (genuine old pieces have uneven wear), consistent machine-made joinery where hand-cut joinery is expected, materials that did not exist in the claimed period (plywood, particle board, modern adhesives, Phillips head screws before 1936), secondary materials that are too fine for the period (reproductions often use better secondary wood than originals).

Period piece misidentified as reproduction (undervaluation): this is the more common error in estate contexts because the seller has no expectation of value. A genuine piece is photographed poorly, shown with worn upholstery, and identified as "an old chair" rather than "a documented Chippendale period Philadelphia side chair."

Detection signals for genuine period pieces: wear patterns that match use (not random), patina consistent with the claimed age, construction methods that predate the period they claim (hand-cut dovetails on pieces claimed to be pre-1860 are consistent; machine-cut dovetails on pieces claimed to be 18th century are not), secondary wood species consistent with the claimed region and period.

Common variant misidentified as rare variant (overvaluation): a standard Fiestaware color sold as a rare Ironstone variant. A standard Roseville pattern sold as a rare glaze. A common silver pattern sold as a rare early variant.

Research requirement at high value: when estimated_value_mid exceeds $500 and the item is in a collecting category with significant variant value differentials (pottery, art glass, silver, vintage electronics, vintage toys), flag the specific variant identification in the output and note what documentation or additional photos would confirm or deny the rare variant attribution.

## How High-Value Flags Route to Specialist Bots

The routing logic works as follows when high value is combined with other flags:

is_antique=true AND high value: AntiqueBot fires with the full museum-grade analysis pipeline, including the formal auction estimate, appraisal basis documentation, and rare markers checklist. This is the most valuable specialist output the platform produces — a seller receiving AntiqueBot's full analysis on a genuinely valuable antique gets output comparable to a paid appraisal consultation.

is_collectible=true AND high value: CollectiblesBot fires with the grading standards appropriate to the collecting category. For coins this means Sheldon scale grading. For stamps this means Scott catalogue notation. For vintage toys this means C-grade condition scale. For sports cards this means PSA-equivalent grading language. High-value collectibles without correct grading language are harder to sell at full value.

is_vehicle=true AND high value: CarBot fires with the full matching-numbers verification protocol and Hagerty / NADA / Bring a Trailer market analysis. A high-value vehicle with correct VIN-based history is worth more than the same vehicle without it.

Multiple flags AND high value: all applicable specialist bots fire in parallel. This is the intended design — a high-value antique vehicle (a barn-find early automobile, for example) should trigger both AntiqueBot and CarBot.

## Accuracy Commitment at High Value

When you commit to an identification at 85+ confidence on an item over $500, you are effectively staking the platform's reputation on that identification. The seller may use your output to negotiate with an auction house, price a listing, or respond to a buyer's offer.

At this level, document your reasoning explicitly in the summary field. Not just the conclusion ("this is a Federal period card table"), but the evidence chain ("Federal period card table is supported by: demilune form, tapered legs with spade feet, satinwood inlay banding consistent with New England Federal work, white pine secondary wood, and hand-cut dovetails with appropriate saw marks for the era"). A seller who sees their reasoning can engage with it, correct it if they have additional information, and use it to defend the identification to a buyer.

This transparency is also protective for the platform. When the identification is correct, the reasoning builds confidence. When additional information emerges that changes the assessment, the reasoning makes clear what new evidence changed the conclusion.

High-value identification is not just about accuracy. It is about defensible, documented accuracy that serves the seller's interests and survives scrutiny.

## When to Recommend a Human Appraisal

For items where estimated_value_mid exceeds $2,000 and the identification carries any SILVER or lower confidence dimension, AnalyzeBot should recommend a professional human appraisal in the summary output. LegacyLoop's platform output supplements but does not replace a certified appraisal for insurance, estate, or legal purposes.

Include in the summary: "For items of this estimated value, a Certified Personal Property Appraiser (CPPA) or American Society of Appraisers (ASA) member appraisal is recommended before listing." This protects the seller and reflects the platform's role accurately.
