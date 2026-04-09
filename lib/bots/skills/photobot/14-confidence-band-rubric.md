---
name: confidence-band-rubric
description: How photo quality affects PriceBot pricing confidence bands, listing readiness tiers, and MegaBot AI confidence amplification.
when_to_use: Every PhotoBot scan.
version: 1.0.0
---

# Confidence Band Rubric

## Overview and Integration

This pack extends the general confidence scoring framework from _shared/03-confidence-rubric.md
with PhotoBot-specific calibration. The core principle: photo quality is not merely a visual
presentation concern — it is a pricing data quality concern. The richness of information that
PhotoBot can extract from a photo set directly determines how narrowly PriceBot can price an item.
A wide pricing band is not a failure of PriceBot's market data — it is often a reflection of
insufficient visual evidence. Better photos produce narrower, more defensible price estimates.

The four tiers defined here — GOLD, SILVER, BRONZE, and NOT_READY — feed directly into:
- PriceBot's confidence band width for the final price estimate range.
- The listing readiness score displayed to the seller.
- The confidence amplification or suppression applied by the four AI models in the MegaBot consensus.

## GOLD Tier: Listing Readiness 90-100

### What Qualifies as GOLD

A GOLD tier photo set meets all of the following criteria:
- All required angles for the item category are present and accounted for.
- The hero photo scores 8 or above on the 10-point photo quality scale.
- No individual photo in the set scores below 6 out of 10.
- Condition is fully documented: any wear, damage, repairs, or restoration are clearly visible
  in at least one photo.
- Maker marks, signatures, or identifying features are photographed at sufficient resolution
  to be readable and identifiable.
- Scale reference is present for any item where size affects buyer decision-making.

### GOLD Impact on PriceBot

When the photo set reaches GOLD tier, PriceBot operates with maximum visual evidence. The AI
can identify maker, material, era, style, and condition with the highest available confidence.
Comparable sales data is applied with a narrow confidence band. The resulting price estimate has
a spread of approximately 10 to 20 percent between low and high. For a $1,000 item, this means
a range of roughly $900 to $1,100 — a tight, actionable estimate that gives the seller a clear
pricing target.

PriceBot output language for GOLD: "Based on strong photo evidence and comparable sales, this
item is estimated at [range]. Listing at [midpoint] is well-supported by market data."

## SILVER Tier: Listing Readiness 75-89

### What Qualifies as SILVER

A SILVER tier photo set meets most but not all GOLD criteria:
- Most required angles for the category are present; one or two secondary angles may be missing
  but the primary angles (hero, back, key detail) are all present.
- The hero photo scores 6 or above on the 10-point scale.
- The majority of photos score 6 or above; one or two photos would benefit from retakes but do
  not critically impair analysis.
- Condition documentation may be incomplete — not all minor wear is photographed, but major
  condition issues are visible.

### SILVER Impact on PriceBot

At SILVER tier, PriceBot can complete a full analysis but applies a standard confidence band
width of approximately 20 to 35 percent. For a $1,000 item, this produces a range of roughly
$800 to $1,150. The estimate is usable and accurate but somewhat wider than GOLD.

PriceBot output language for SILVER: "Photo coverage is good. Pricing confidence is strong.
For a tighter price range, consider retaking [specific photo] and adding [missing angle]."

## BRONZE Tier: Listing Readiness 60-74

### What Qualifies as BRONZE

A BRONZE tier photo set has meaningful gaps that limit analysis quality:
- Two or three required angles for the category are missing.
- The hero photo scores between 4 and 6 on the 10-point scale — acceptable but not strong.
- Several photos are suboptimal in lighting, focus, or composition.
- Maker marks, condition issues, or key identifying features may be absent from the photo set.

### BRONZE Impact on PriceBot

At BRONZE tier, PriceBot works with materially reduced visual evidence. The AI identification
confidence is lower. The comparable sales match quality is reduced because the item cannot be
fully categorized. PriceBot applies a wide confidence band of approximately 35 to 55 percent.
For a $1,000 item, this produces a range of $700 to $1,200 — wide enough that the seller may
struggle to set a confident listing price.

PriceBot output language for BRONZE: "The current photo set supports a preliminary estimate.
Better photos would narrow this range. Recommend retaking the hero photo and adding [missing
angles] before listing to achieve a tighter price estimate."

The BRONZE output should always include the note: "Better photos would narrow this range."
This is a clear, actionable signal to the seller that photo improvement has direct dollar value.

## NOT_READY Tier: Listing Readiness Below 60

### What Qualifies as NOT_READY

A NOT_READY photo set has critical deficiencies that prevent confident analysis:
- Critical angles are missing: the hero photo is absent, or the item is not clearly visible
  in any submitted photo.
- The hero photo scores below 4 on the 10-point scale: too dark, too blurry, or too
  partial to identify the item with confidence.
- The overall photo quality is insufficient for confident identification of category,
  maker, condition, or material.

### NOT_READY Impact on PriceBot

When a photo set reaches NOT_READY status, PriceBot should flag the situation rather than
produce a price estimate that would be misleading. The pricing confidence is LOW and this
must be communicated to the seller.

PriceBot output language for NOT_READY: "Pricing confidence is LOW due to photo quality. The
current photos do not provide sufficient visual information for a reliable price estimate.
We recommend retaking the following photos before listing: [specific list]. Once better photos
are uploaded, re-analyzing the item will produce a much more accurate price range."

## When to Hold Pricing Until Better Photos Arrive

PhotoBot should recommend holding the price estimate and relisting for re-analysis in the
following circumstances:

The item appears to be high-value (indicators: age, maker marks visible but unreadable, category
known to have high auction potential) and the photo set is BRONZE or NOT_READY. A wide band on a
potentially high-value item costs the seller real money. The investment of retaking photos is
clearly worthwhile.

The maker mark is present but unreadable at the current photo resolution. A readable maker mark
can shift an item from the general market into a specialist collector market where prices are
significantly higher. An unreadable mark leaves that value uplift on the table.

The item is in a condition-sensitive category (jewelry, watches, fine art, vintage electronics)
and condition documentation is absent or incomplete. Condition is the primary price driver in
these categories. An estimate without condition evidence is unreliable.

## How the Four MegaBot AIs Use Photo Quality Scores

The MegaBot consensus system uses four AI models running in parallel. Each model receives the
photo quality tier as an input signal and adjusts its confidence amplification accordingly.

At GOLD tier: all four models operate at full confidence amplification. The consensus range is
narrow and the individual model estimates cluster tightly around the central value.

At SILVER tier: models apply standard confidence weighting. The consensus range is somewhat
wider but still produces a defensible central estimate.

At BRONZE tier: models apply a confidence suppression factor. Estimates that rely heavily on
visual identification (maker, material, condition score) are widened. Estimates based on
structural category data (eBay comps, market data) are less affected. The consensus range
reflects the reduced visual evidence.

At NOT_READY tier: models are instructed to flag rather than estimate. The MegaBot consensus
output carries a warning that visual evidence is insufficient for reliable pricing and
recommends photo retakes before the consensus is meaningful.

## Per-Photo Scoring Calibration for PhotoBot

When PhotoBot scores individual photos on the 10-point scale, the following calibration applies:

9-10: Professional quality. Sharp focus, controlled lighting, clean background, item fills the
frame appropriately, no distracting elements, color accurate.

7-8: High quality. Sharp focus, adequate lighting (may be natural rather than controlled), clean
or near-clean background, item clearly visible, color reasonable.

5-6: Acceptable quality. Focus is adequate, lighting may be dim or slightly harsh but item is
identifiable, background may have some clutter, item is visible but may not fill the frame well.

3-4: Below standard. Focus may be soft, lighting is poor (too dark, harsh flash, strong backlight),
background is cluttered, item is partially visible or not clearly separated from background.

1-2: Unusable. Severely out of focus, extremely dark or completely blown out, item occupies a
small fraction of the frame or is partially obscured, compression artifacts visible.
