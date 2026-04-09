---
name: confidence-band-rubric
description: How identification confidence determines price band width, specialist bot behavior, and MegaBot consensus cascade logic. Extends the shared confidence rubric with AnalyzeBot-specific calibration and downstream routing rules.
when_to_use: Every AnalyzeBot scan.
version: 1.0.0
---

# Confidence Band Rubric

## Overview and Relationship to Shared Rubric

This pack extends the general confidence rubric in _shared/03-confidence-rubric.md with AnalyzeBot-specific calibration. The shared rubric defines the platform-wide confidence scale. This pack defines how AnalyzeBot's confidence score cascades into price band width, specialist bot behavior, photo requirements, and MegaBot consensus logic.

The confidence band is not just a display label. It is a system parameter that controls downstream bot behavior in measurable ways. Every confidence tier produces a different set of downstream actions.

## GOLD Identification (Confidence 85 and Above)

What GOLD means: the identification meets museum-grade attribution standards. The category, maker, era, and condition are all supported by multiple independent lines of evidence.

Evidence requirements for GOLD:

Category confirmed by three or more independent features. For furniture: form, construction method, and style all independently indicate the same category. For ceramics: form, glaze type, and mark all align. For vehicles: make confirmed by badge, model confirmed by body style, year confirmed by production-specific features.

Maker attributed with strong direct evidence: a visible mark, signature, label, or design element so distinctive that it is uniquely attributable to one maker. Style attribution alone, without a mark, caps at SILVER.

Era dated by at least two independent markers: construction method plus style is the minimum. Construction method plus dated secondary material plus style is GOLD-tier evidence.

Condition scored with both cosmetic and functional sub-scores based on visible evidence, not assumption.

GOLD downstream effects:

PriceBot uses a narrow price band, typically 20-30% of mid value. The comp search is category and maker specific rather than general.

Specialist bots that fire on GOLD identifications produce their highest-confidence outputs. AntiqueBot's GOLD-confidence analysis includes auction house estimate language. CollectiblesBot's GOLD output includes specific grade assignment rather than grade range.

ListBot generates confident, specific titles using all GOLD-tier enrichment fields. Keywords are drawn from confirmed maker, model, era, and style. Listings perform better on marketplace search.

## SILVER Identification (Confidence 70 to 84)

What SILVER means: the identification is likely correct, but one or more dimensions carry meaningful uncertainty. The most common cause is confirmed category with uncertain maker, or confirmed maker with uncertain era.

Typical SILVER profiles:

Strong category identification, maker attributed by style rather than mark. Example: "18th-century New England furniture consistent with Rhode Island school, maker unknown." Category is GOLD. Maker attribution is SILVER. The composite is SILVER.

Confirmed maker, era uncertain. Example: "Roseville Pottery, pattern confirmed by the raised script mark, but this pattern was produced from 1930 through 1952 and dating within that range is uncertain from photos."

Good condition scoring, but one sub-dimension is inaccessible. Example: the cosmetic condition is clear from photos (condition_cosmetic=7), but the functional condition of internal mechanisms cannot be assessed without hands-on inspection (condition_functional estimated at 6-8).

SILVER downstream effects:

PriceBot uses a standard band, typically 30-40% of mid value. Comp search is category-specific with maker as a filter where confirmed, but includes unattributed comps in the range.

Specialist bots fire on SILVER identifications but produce hedged language. AntiqueBot's SILVER output includes the auction estimate range without the specific attribution confidence of GOLD. CollectiblesBot's SILVER output assigns a grade range rather than a specific grade.

ListBot generates accurate titles but may use hedged language in the description ("attributed to" rather than "by") where maker attribution is SILVER.

## BRONZE Identification (Confidence 50 to 69)

What BRONZE means: the identification is the best available hypothesis given the evidence, but alternative identifications are plausible and the seller should understand this is a working identification rather than a confirmed attribution.

Typical BRONZE profiles:

Category probable but alternatives exist. Example: "Most likely a Victorian parlor table, but some features are consistent with a late-period Eastlake transitional piece. The category assignment affects both the comp set and the specialist bot routing."

Maker unknown and cannot be attributed by style with confidence. The item falls within a broad stylistic category with multiple possible producers.

Era estimated broadly (a 30-50 year span) without construction confirmation.

Condition scored but with significant uncertainty — photos are dark, item is partially obscured, or the seller's one photo does not show critical surfaces.

BRONZE downstream effects:

PriceBot uses a wide band, typically 50-60% of mid value. The comp search is general category rather than maker-specific. The resulting price range is less actionable for the seller.

Specialist bots that fire at BRONZE confidence produce their most hedged outputs. AntiqueBot's BRONZE output cannot support formal auction house language. The output clearly flags that a re-analysis with better photos or additional information would upgrade the assessment.

ListBot generates cautious listings that avoid overclaiming. Titles use general category terms rather than specific attributions.

## NOT_READY (Confidence Below 50)

What NOT_READY means: the available evidence does not support a defensible identification. The item has not failed — the photos or information have not provided enough for AnalyzeBot to work from.

NOT_READY is not a negative judgment on the item. It is a signal that the enrichment chain needs better inputs.

NOT_READY downstream effects:

PriceBot should receive a flag of insufficient_data and either decline to produce a price estimate or produce one with a band width of 80-100% of mid value with an explicit caveat.

Specialist bots should not fire on NOT_READY identifications. Firing AntiqueBot or CarBot on an unidentified item wastes credits and produces meaningless output.

ListBot cannot generate a useful listing from a NOT_READY analysis. The seller should be prompted to provide better photos before listing.

The seller-facing message on NOT_READY must include: a description of what was visible, a specific list of photos or information that would allow AnalyzeBot to produce a BRONZE or higher identification, and an offer to re-run the analysis when those inputs are available.

## Band Width Rules by Confidence Level

Price band width as a percentage of estimated_value_mid:

GOLD (85+): 20-30%. Example: mid=$500, low=$375, high=$625.
SILVER (70-84): 30-40%. Example: mid=$500, low=$350, high=$650.
BRONZE (50-69): 50-60%. Example: mid=$500, low=$275, high=$775.
NOT_READY (below 50): 80-100%. Example: mid=$500, low=$100, high=$900.

The band width is automatically derived from the confidence score in the PriceBot configuration. AnalyzeBot does not set the band width directly — it sets the confidence score, and the band width follows. This means the confidence score must be accurate for the pricing to reflect reality.

## Photo Requirements by Confidence Level

When the current evidence yields BRONZE or NOT_READY confidence, AnalyzeBot should specify exactly what additional photos would upgrade the confidence.

Common photo requests and what they unlock:

Bottom of ceramic piece: maker's mark, production code, country of origin marking.
Back of painting or drawing: canvas stamp, stretcher bar construction, label, signature.
Interior of furniture drawer: secondary wood species, drawer construction method, any paper label.
Close crop of any marks or labels visible in the photos: legible text or symbols.
Raking light photo of surface: reveals tooling marks, repairs, inlaid work that flat lighting obscures.
Photo with a reference object for scale: unlocks dimensional estimates.
Multiple angles on the same detail: reduces single-photo ambiguity.

## MegaBot Consensus and Confidence Cascade

When MegaBot's four-AI parallel analysis produces identifications, the confidence cascade logic applies:

All four AIs agree on category and maker at 80+ confidence: the AiResult is upgraded to GOLD and the confidence_source field records "megabot_consensus."

Three of four AIs agree at 75+ confidence: confidence is upgraded to SILVER minimum. The dissenting AI's alternative interpretation is logged in the analysis summary.

Two of four AIs agree, two disagree: confidence remains at the primary AI's score, and the conflict is surfaced to the seller as "our analysis produced two different assessments" with both interpretations shown.

MegaBot consensus upgrades cannot exceed the evidence. If three AIs agree that an item is probably mid-century American pottery but none can confirm the maker, the consensus upgrades the category confidence but not the maker attribution confidence. Each dimension is evaluated independently.
