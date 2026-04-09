---
name: museum-condition-grading
description: The six-tier museum condition grading scale plus five sub-scores (structural, surface, patina, completeness, mechanisms). Condition is the second-largest value driver after maker attribution.
when_to_use: Every AntiqueBot scan. Condition populates condition_assessment.overall_grade plus all five sub-scores plus age_appropriate_wear boolean.
version: 1.0.0
---

# Museum Condition Grading — The Six Tiers

Auction-house condition grading is a discipline. It is not "this looks nice" vs "this looks worn." It is a formal rubric that maps observed condition to value deltas, and the rubric is different for every category (silver is graded differently than furniture which is graded differently than porcelain). This pack teaches the universal six-tier scale AND the five sub-scores that populate the AntiqueBot schema.

## The Six-Tier Scale

| Grade | Definition | Value delta vs Excellent |
|---|---|---|
| Mint | As-made, no signs of use, no restoration | +15 to +30 percent |
| Excellent | Age-appropriate wear only, no damage, no restoration | 100 percent (baseline) |
| Very Good | Minor age-appropriate wear, small defects that do not affect structure | -10 to -20 percent |
| Good | Clear signs of use, minor damage or minor old repair, still presents well | -25 to -40 percent |
| Fair | Significant damage, restoration, or loss, presents with visible flaws | -50 to -70 percent |
| Poor | Structural damage, major loss, unrestorable, parts value only | -80 to -95 percent |

Mint is almost never seen on genuinely old objects. A "mint" 1780 chair either (a) sat in a closet for 240 years untouched (rare), (b) was never actually sat in (ceremonial), or (c) has been refinished and you are looking at restoration, not original mint. Mint on antiques is a flag. Verify.

## Sub-Score 1 — Structural (1-10)

The frame, joints, foundation integrity. Does the piece hold weight? Are joints tight? Are there breaks, repairs, replacements in the load-bearing members?

- 10: All original joints tight, no breaks, no repairs
- 8-9: Tight with minor old glue refresh
- 6-7: One or two old repairs, still sound
- 4-5: Multiple repairs, some instability
- 2-3: Significant structural compromise, one leg replaced, major break
- 0-1: Structurally failed

## Sub-Score 2 — Surface (1-10)

Finish, paint, veneer, surface treatment. Original surface is the single biggest premium in furniture — a period chest with its original 1780 shellac surface is worth 2-3x the same chest refinished.

- 10: Original surface, uneven patina, period-consistent
- 8-9: Original surface with minor touch-up
- 6-7: Partial refinish, original underneath in some areas
- 4-5: Fully refinished, period-appropriate finish
- 2-3: Refinished in non-period finish (polyurethane on a Federal chest)
- 0-1: Stripped, raw wood, or modern paint over original

## Sub-Score 3 — Patina (1-10)

Quality and authenticity of age-appropriate wear. Higher score = better, more convincing patina. Note: this is an authentication sub-score as well as a condition sub-score. Fake patina scores LOW on this scale, not high.

- 10: Deep, uneven, unmistakably genuine, the kind you cannot fake
- 8-9: Genuine patina, some light cleaning or wax refresh
- 6-7: Patina present but shallow, could be late-period
- 4-5: Patina thin, looks freshened
- 2-3: Suspect patina, possibly chemically induced
- 0-1: No patina or clearly faked

## Sub-Score 4 — Completeness (1-10)

All original parts, hardware, elements present. Missing a finial, a drawer pull, a key, or a glass insert can take 10-40 percent off the value.

- 10: All original parts present, no replacements
- 8-9: One or two minor replacements (one drawer pull, one finial)
- 6-7: Several replacements, mostly original hardware
- 4-5: Half or more of hardware replaced
- 2-3: Most hardware replaced, major parts missing
- 0-1: Skeleton only, parts salvage

## Sub-Score 5 — Mechanisms (1-10 or null)

Locks, hinges, drawers, moving parts. Null if the item has no moving parts (a statue has no mechanisms).

- 10: All mechanisms work, original, smooth
- 8-9: Minor stiffness, period-appropriate
- 6-7: One or two mechanisms compromised or replaced
- 4-5: Several mechanisms need work
- 2-3: Major mechanical failure
- 0-1: Non-functional
- null: No mechanisms on this form

## Age-Appropriate Wear Boolean

Set to true if the observed wear is consistent with the claimed age. A 1780 chest SHOULD have:
- Wear on the top from centuries of use
- Darker wood where hands touched most (drawer pulls, edges)
- Honest shrinkage — panels 1-3 percent narrower than when built
- Feet wear or replacement (often replaced, not disqualifying)
- Back panel splits from humidity cycling

Set to false if the wear pattern is wrong (perfect top with worn legs = backwards), suspiciously uniform, or absent.

## The Condition-Impact-On-Value Field

This is where you translate the grade and sub-scores into dollars. Example: "Overall Excellent with structural 10, surface 9, patina 10, completeness 8 (two drawer pulls replaced), mechanisms 9. Value impact: -8 percent from completeness deduction, otherwise at 100 percent of baseline."

## Output

Populate condition_assessment.overall_grade with one of the six tiers. Populate all five sub-scores with integers 1-10 (or null for mechanisms if N/A). Populate age_appropriate_wear boolean. Populate condition_impact_on_value with a specific sentence explaining the value delta. If any sub-score is below 6, flag the specific problem in condition_assessment.conservation_recommendations.
