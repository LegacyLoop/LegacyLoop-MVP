---
name: damage-assessment-rubric
description: The damage-to-dollar matrix. How specific categories of damage translate to specific percentage deductions from fair market value, and which damage types are deal-breakers vs cosmetic.
when_to_use: Every AntiqueBot scan where any damage is visible or disclosed. Populates condition_assessment.condition_impact_on_value with specific numeric deductions.
version: 1.0.0
---

# Damage Assessment — The Dollar Impact Matrix

Condition grading (Pack 07) tells you WHERE on the six-tier scale the object sits. Restoration assessment (Pack 08) tells you HOW MUCH was done to it. Damage assessment is the third leg of the condition analysis: what exactly is broken, how bad is it, and how does each specific defect translate to dollars off the estimate? This pack gives you a category-by-category damage-to-deduction matrix.

## The Three Damage Categories

Every observed defect falls into one of three categories with very different market consequences:

1. **Cosmetic** — visible but does not affect structure or function. Typical deduction 5-15 percent.
2. **Functional** — affects use or display. Typical deduction 15-40 percent.
3. **Structural / Integrity** — affects the object's ability to hold together or its authenticity. Typical deduction 40-90 percent.

You must classify every observed defect into one of these three before pricing it.

## Furniture Damage Matrix

| Damage | Category | Deduction |
|---|---|---|
| Minor surface scratches | Cosmetic | 3-8% |
| Water ring on top | Cosmetic | 5-15% |
| Veneer lifting (small, stable) | Cosmetic | 5-12% |
| Veneer loss (small patch) | Cosmetic | 10-20% |
| Veneer loss (major, multiple panels) | Functional | 25-45% |
| Drawer runner replaced | Functional | 5-10% |
| Drawer bottom replaced | Functional | 10-15% |
| Loose joint (old glue failure) | Functional | 10-15% if repairable, 25% if multiple |
| Broken and repaired stretcher | Functional | 10-20% |
| Replaced foot (one) | Functional | 15-25% |
| Replaced feet (all) | Structural | 40-60% |
| Cracked top | Structural | 20-35% depending on severity |
| Split case side | Structural | 25-45% |
| Replaced top | Structural | 50-70% |
| Married piece (top and base not original) | Structural | 60-80% |
| Active woodworm infestation | Structural | Stop — treat before sale, then reassess |

## Silver Damage Matrix

| Damage | Category | Deduction |
|---|---|---|
| Tarnish (removable) | Cosmetic | 0% (natural) |
| Small dents | Cosmetic | 5-15% |
| Large dent or ding | Functional | 15-25% |
| Monogram erased | Functional | 20-40% (huge on Georgian silver) |
| Replaced handle | Functional | 15-30% |
| Replaced lid | Functional | 25-40% |
| Missing finial | Cosmetic | 5-10% |
| Crack in body | Structural | 40-60% |
| Split along seam | Structural | 30-50% |
| Hallmarks polished out | Structural | 50-80% (cannot be reauthenticated) |
| Heavy solder repair visible | Structural | 40-60% |
| Gilding worn or partial | Cosmetic | 5-15% on parcel gilt items |

Note: monogram erasure is a larger deduction on Georgian and Federal silver than most sellers realize. An engraved period crest or family cipher is part of the object's history — removing it removes that history.

## Porcelain And Pottery Damage Matrix

Porcelain is the least forgiving category. Buyers assume mint condition and penalize damage heavily.

| Damage | Category | Deduction |
|---|---|---|
| Hairline crack (under UV only) | Cosmetic | 15-25% |
| Hairline crack (visible) | Functional | 25-40% |
| Chip on rim (small) | Functional | 25-40% |
| Chip on rim (large) | Functional | 40-55% |
| Chip on handle, spout, finial | Functional | 30-50% |
| Restored chip (professional) | Functional | 35-55% |
| Restored chip (amateur) | Structural | 55-75% |
| Broken and reglued | Structural | 60-80% |
| Missing lid | Structural | 50-70% |
| Replaced lid | Structural | 30-50% |
| Firing flaw (original) | Cosmetic | 0-10% (period defect, expected) |
| Crazing (overall) | Cosmetic | 5-15% on fine porcelain, 0% on earthenware |
| Stained crazing | Cosmetic | 10-20% |

## Glass Damage Matrix

| Damage | Category | Deduction |
|---|---|---|
| Flea bite (microscopic chip) | Cosmetic | 5-10% |
| Small chip on rim | Functional | 20-35% |
| Ground rim (chip polished out) | Functional | 25-45% (common on Victorian cut glass) |
| Crack | Structural | 40-60% |
| Shattered and restored | Structural | 60-80% |
| Cloudy interior (sick glass) | Cosmetic | 10-25% depending on category |
| Base chips (cullet damage) | Cosmetic | 10-20% |

## Paintings And Prints Damage Matrix

| Damage | Category | Deduction |
|---|---|---|
| Yellowed varnish | Cosmetic | 5-15% (cleanable) |
| Dirt and grime | Cosmetic | 5-10% (cleanable) |
| Minor flaking | Functional | 15-30% |
| Small loss with in-paint | Functional | 15-25% |
| Large loss | Structural | 30-60% |
| Canvas tear (repaired) | Functional | 20-40% |
| Canvas tear (unrepaired) | Structural | 40-60% |
| Relining (older) | Cosmetic | 5-15% (expected on 17-19th C) |
| Water damage, stains | Structural | 40-70% |
| Foxing (prints, watercolors) | Cosmetic | 10-25% |

## Jewelry Damage Matrix

| Damage | Category | Deduction |
|---|---|---|
| Missing stone | Functional | 15-30% depending on stone value |
| Replaced stone | Functional | 10-25% |
| Worn setting | Cosmetic | 5-15% |
| Repaired shank (ring) | Cosmetic | 5-15% |
| Broken clasp | Cosmetic | 5-10% |
| Modified / resized significantly | Structural | 20-40% |

## The Stacking Rule

Multiple deductions do not simply add. Use multiplicative stacking: a 15 percent deduction plus a 20 percent deduction equals approximately 32 percent off (0.85 × 0.80 = 0.68 retention), not 35 percent. This matters on pieces with multiple small issues.

## Output

Populate condition_assessment.condition_impact_on_value with a specific sentence for each material issue, the category (Cosmetic / Functional / Structural), and the deduction percentage. Apply the stacked total to valuation.auction_estimate and note the math in valuation.valuation_methodology. Never apply a deduction without explaining which damage category it came from.
