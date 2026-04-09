---
name: classic-collector-valuation
description: How to value classic and collector cars. Hagerty valuation tiers (#1 Concours, #2 Excellent, #3 Good, #4 Fair). Matching-numbers premium. Barn-find discount. Restoration cost math. Era-based appreciation curves.
when_to_use: Any scan on a vehicle 25+ years old, or any vehicle flagged as "collector" or "classic" or "vintage" by AnalyzeBot. Also fires for rare/low-production moderns.
version: 1.0.0
---

# Classic Car Valuation — The Hagerty Four-Tier System

The classic car market runs on a standardized four-tier condition grading system pioneered by Hagerty Insurance and now used by most auction houses, Barrett-Jackson catalogers, and Mecum specialists. Mastering these tiers is how CarBot speaks the language of the collector market.

## The Four Hagerty Tiers

| Tier | Grade | Definition | Premium over #4 |
|---|---|---|---|
| #1 | Concours | Show-winning, restored to better-than-new, frame-off restoration, trailered to shows, never driven | 3-10x |
| #2 | Excellent | Fully restored or exceptionally preserved original, driven sparingly, minor flaws only under scrutiny | 2-4x |
| #3 | Good | Complete, presentable, drivable, honest wear consistent with occasional use | 1.4-2x |
| #4 | Fair | Running but needs work, visible flaws, project-to-driver transition | 1x (baseline) |

A #1 Concours 1967 Shelby GT500 is a different object than a #4 driver. Same VIN-year combo, different market entirely. Get the tier right or get the value wrong.

## Tier #1 Concours — What It Takes

- Frame-off restoration by a recognized shop (not DIY)
- Every bolt, every fastener, every hose period-correct or NOS (new old stock)
- Documented restoration with photos at every stage
- Show wins (local, regional, or national concours — Amelia Island, Pebble Beach, etc.)
- Original documentation: window sticker, build sheet, dealer invoice, owner's manual
- Matching numbers engine, transmission, rear axle
- Judged and graded by marque specialists

A vehicle without show provenance is NOT #1 Concours even if it looks perfect. The tier requires third-party validation.

## Tier #2 Excellent — The Driver-Show-Car

- High-quality restoration OR exceptional preservation
- Drives reliably and is driven (300-3,000 miles per year)
- Minor flaws visible only under direct scrutiny (paint thickness, seam alignment)
- Interior clean and complete, original or period-correct upholstery
- Mechanicals sound, no deferred maintenance
- Full documentation of mechanical work
- Does not need to be matching-numbers but commands premium if it is

Tier #2 is the realistic ceiling for most classic cars in the estate-sale market. A well-kept single-family-owner 1972 Chevelle SS that has been garage-kept and lightly driven hits #2.

## Tier #3 Good — The Honest Driver

- Complete, drivable, presentable
- Visible age-appropriate wear (paint fade, chrome pitting, worn carpet)
- Original or older repaint
- Runs and drives without major issues
- Some mechanical work may be deferred (shocks, bushings, tires)
- Interior shows use but is complete
- This is the most common tier for estate sales

Tier #3 is often the "inherited the car when dad passed" condition. Driven occasionally, maintained when needed, not babied but not neglected.

## Tier #4 Fair — The Project Car

- Running and driving OR close to running
- Significant cosmetic or mechanical needs
- Rust visible but not structural
- Interior needs restoration
- Worth more as a starting point than as a driver
- Matching numbers valuable even at #4
- Barn-find category often enters here

Barn finds are their own sub-market: original condition, untouched, with documented provenance. A barn-find 1967 Shelby GT500 at "fair" condition might sell for more than a #3 driver because the restoration potential plus provenance story is worth a premium. That is the exception, not the rule.

## Matching Numbers — The Big Multiplier

"Matching numbers" means the engine VIN stamp, transmission stamp, and rear axle code all match the build sheet for this specific car. This is verifiable on most American muscle from 1964-1974, many European sports cars, and documented race cars.

| Matching status | Value impact |
|---|---|
| Fully matching (engine + trans + rear) | +30-70% over non-matching |
| Matching engine only | +15-30% |
| Correct-date replacement (same part number, same year) | +5-15% |
| Correct type replacement (wrong date but right spec) | 0% (baseline) |
| Swapped engine (different model, different era) | -10-30% from baseline |

For a high-end muscle car, matching numbers can be the difference between $80k and $160k. State it explicitly in the `identification` block.

## Provenance Chain

Classic car provenance is documented the same way antique provenance is (Pack 03 for AntiqueBot applies here):

- **Tier 1**: Build sheet + window sticker + original title chain + period photos with owners
- **Tier 2**: Original owner's manual + service receipts + photos
- **Tier 3**: Dealer history documented, 1-2 owner car
- **Tier 4**: 3+ owners but unbroken title chain
- **Tier 5**: Title gaps or salvage history

Single-owner provenance (especially "one-family since new") adds 10-30% to most classic values.

## The Barn-Find Trap

Every classic car seller wants their car to be a barn find. True barn finds are:
- Untouched since the 1970s-1990s
- Original paint, original interior, original mechanicals
- Garage or barn-stored (not outdoor rust)
- Documented history of when it was parked
- Often in a specific VIN range that's documented

A "barn find" that's been repainted, reupholstered, or had the engine rebuilt is NOT a barn find — it's a restored car. Call this out when the seller's story does not match the visible evidence.

## Output

In `identification`, state era + Hagerty tier. In `value_drivers`, list matching-numbers status, provenance tier, and tier-specific upside. In `market.private_party_value`, reference the Hagerty Valuation Tools range for the specific year/make/model/tier. Name auction house tier in `selling_strategy.best_venue` — Mecum, Barrett-Jackson, Bring a Trailer, or regional classic car dealer (Pack 10 for the full rubric).
