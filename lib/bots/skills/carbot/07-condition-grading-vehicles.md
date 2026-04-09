---
name: condition-grading-vehicles
description: The KBB/NADA condition tiers (Excellent, Very Good, Good, Fair) and what each specifically means. How to grade from photos. The "inspection-ready" standard. Interior and exterior sub-grades. Paint meter expectations.
when_to_use: Every CarBot scan. Condition grade drives valuation. Pack 07 is the rubric behind condition.overall_grade and the sub-grades.
version: 1.0.0
---

# Condition Grading — The KBB/NADA Four-Tier Standard

KBB and NADA both use a four-tier used vehicle condition system that's industry-standard for private party valuations. Every CarBot output must grade to this system so the seller's expectations align with the dealer/retail market they'll encounter.

## The Four Tiers (With Real Percentages)

Per KBB's published definitions:

| Tier | % of used vehicles | Definition |
|---|---|---|
| Excellent | 3% | Looks new, runs perfectly, no visible defects, no mechanical problems, perfect maintenance history |
| Very Good | 23% | Minor cosmetic flaws only, runs perfectly, no mechanical issues, well-maintained |
| Good | 54% | Some cosmetic wear, may need minor repairs, runs well, reasonable maintenance |
| Fair | 18% | Significant cosmetic or mechanical issues, runs but needs work |

Note that only **3%** of used vehicles qualify as Excellent. Estate sellers routinely misgrade. A "perfect condition" 2008 Honda Civic with 150k miles is almost certainly Good, not Excellent. Recalibrate the seller gently but firmly.

## Excellent Tier (3% — The Rare Grade)

Every one of these must be true for Excellent:
- No rust anywhere, including underbody
- No paint imperfections, no panel misalignment
- Original paint OR high-quality professional repaint documented
- Interior like new: no carpet wear, no seat wear, no dashboard cracks
- All electronic features operational (windows, locks, AC, radio, lights)
- All factory equipment present including keys (both), owner's manual, service records
- Tires at 80%+ tread with matching wear pattern
- Complete service history with documented dealer or specialist maintenance
- Runs and drives without any noise, vibration, or mechanical concern
- Under 150% of expected mileage for age (e.g., 50k miles on a 5-year-old car)
- Clean title, no accident history, no paint thickness anomalies

A vehicle cannot be Excellent if ANY of: the AC doesn't work, the check engine light has come on, a scratch or small dent is visible, a single electrical feature is inoperative. The bar is brutal.

## Very Good Tier (23% — The Best Most Used Vehicles Get)

Every one of these must be true for Very Good:
- Only minor cosmetic flaws (small scratches, light curb rash, minor paint chips)
- No rust on primary panels, minor surface rust on underbody acceptable
- Interior clean with only light wear
- All features operational
- Complete service history OR reasonable gaps with explanations
- Tires at 60%+ tread
- Runs and drives without noticeable issues
- At or near expected mileage for age
- Clean title

Most "well-kept grandma cars" land in Very Good. Single-owner, garage-kept, regularly maintained, low-mileage — Very Good is the ceiling.

## Good Tier (54% — The Median Used Vehicle)

The most common tier. Every one of these is true:
- Visible cosmetic wear and imperfections
- Minor repairs needed (bulb replacement, wiper blades, small scratches)
- Normal mileage for age
- Service history incomplete but vehicle maintained
- Minor mechanical items needing attention (brakes approaching service, minor oil leaks)
- Interior shows wear consistent with age
- Tires at 40%+ tread
- Clean title

Most estate-sale inherited vehicles are Good. The owner drove it, maintained it reasonably, didn't baby it.

## Fair Tier (18% — Needs Work)

- Significant cosmetic defects (large dents, panel damage, faded paint, cracked bumpers)
- Mechanical repairs needed before resale
- High mileage for age
- Interior worn (seat rips, carpet stains, cracked dashboard)
- May have minor rust
- Runs but has issues (check engine light, rough idle, transmission hesitation)
- Tires at 20%+ tread
- May have minor title issues

Fair vehicles sell at wholesale prices. They need a buyer who can do repairs or flip them.

## Poor (Not An Official Tier — Salvage Territory)

Below Fair is salvage/parts vehicle territory. NOT a KBB/NADA tier. Use when:
- Doesn't run
- Frame damage
- Flood or collision salvage
- Missing major components
- Branded title (salvage, rebuilt, lemon)

Price against wholesale auction ring or parts yards, not private-party market.

## The Inspection-Ready Standard

A vehicle is "inspection-ready" if a buyer's mechanic could drive it to a shop without incident and pass basic safety inspection. This is the minimum bar for "runs and drives" in most private party sales.

Inspection-ready checklist:
- Starts on first or second turn
- All lights functional (headlights, tail lights, brake lights, turn signals)
- Brakes stop the vehicle without pulling
- Steering tracks straight
- Tires hold air and have adequate tread
- Horn works
- Windshield wipers work
- Seat belts lock

Vehicles that are NOT inspection-ready must be disclosed as "runs but needs work" or "project car, trailer home."

## Interior And Exterior Sub-Grades

Optional but useful: grade interior and exterior separately on a 1-10 scale.

**Exterior sub-grade:**
- 10: flawless paint, no scratches, perfect panels
- 8-9: minor flaws under scrutiny, showroom presentation
- 6-7: visible but minor defects, honest wear
- 4-5: clear cosmetic issues
- 2-3: significant damage or neglect
- 1: body integrity compromised

**Interior sub-grade:**
- 10: like new, factory plastic still on some surfaces
- 8-9: clean, minor wear on driver seat only
- 6-7: normal wear throughout, clean
- 4-5: noticeable wear, may need cleaning
- 2-3: seat damage, carpet stains, dashboard cracks
- 1: destroyed, needs replacement

State both sub-grades in `condition` to give buyers a clear picture.

## The Paint Meter Check

A paint meter (electronic thickness gauge) is the definitive tool for detecting previous bodywork. CarBot cannot use one, but can recommend one for high-value classics and exotics. Paint thickness across all panels should be within ±20-30 microns of factory spec. Panels showing 300-500% thicker than factory indicate filler or repaint.

For normal used vehicle scans, skip the paint meter recommendation unless the seller is already asking about buyer negotiation tactics.

## Output

In `condition.overall_grade`, state one of the four tiers. In `condition.exterior_sub_grade` and `condition.interior_sub_grade`, state the 1-10 numbers. In `condition.notes`, cite the specific defects observed and the single biggest condition issue. In `value_reasoning`, apply the tier to the KBB/NADA private party range for the specific year/make/model.
