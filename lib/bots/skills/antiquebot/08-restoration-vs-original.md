---
name: restoration-vs-original
description: The originality premium rubric. How to distinguish original surface and parts from sympathetic restoration, heavy restoration, and replacement. Originality is the single most expensive condition variable on period furniture and silver.
when_to_use: Every AntiqueBot scan on period pieces. Call out restoration clearly — it changes the valuation multiplier.
version: 1.0.0
---

# Originality — The Premium You Cannot Get Back

In the period antique market, originality is the single most expensive condition variable. A period mahogany chest with its original 1780 shellac surface is worth 2 to 3 times the same chest that was refinished in 1960. An original-paint New England blanket chest is worth 4 to 10 times a stripped one. An unpolished pre-1930 Georgian silver tea service is worth more than the same service polished to a mirror every Sunday for a century. Restoration is often well-intended, sometimes necessary, but it ALWAYS costs money on the market.

The rubric below maps observed restoration to a four-tier scale that populates condition_assessment.restoration_detected (boolean) plus restoration_details (free text) plus a specific value multiplier.

## The Four Restoration Tiers

| Tier | Definition | Value multiplier |
|---|---|---|
| Original | No restoration visible, period surface and parts | 1.0x (baseline) |
| Sympathetic | Minor, period-appropriate repair (glue refresh, wax, minor touch-up) | 0.85-0.95x |
| Moderate | Partial refinish, some hardware replaced, one major repair | 0.50-0.70x |
| Heavy | Full refinish, multiple replacements, significant rebuilding | 0.25-0.45x |

Note: these multipliers are FOR PERIOD PIECES. On revival and 20th century furniture the penalties are smaller because originality matters less to those markets. A refinished 1920 Stickley is still worth serious money. A refinished 1780 Newport chest loses most of its value.

## Restoration Evidence Furniture

Original surface tells:
- Uneven color, deeper in recesses
- Patina on edges from handling
- Old shellac has characteristic alligator craze pattern after 150+ years
- Wax buildup in carved details
- Period screws in the same position they were installed in
- Drawer runners worn in exactly the pattern the drawer travels

Refinish tells:
- Uniform color across surfaces
- Finish fills carved detail instead of accumulating around it
- Scrape marks on the secondary surfaces from stripping chemicals
- Modern finish chemistry (lacquer post-1920, polyurethane post-1950)
- Sanded-flat surfaces with no honest weathering
- Replaced hardware with modern reproduction screws

## Restoration Evidence Silver

- Original surface: soft gray-to-silver patina in recesses, bright on high points from handling
- Polished: uniformly bright, recesses cleaned out, engraving edges rounded from polishing
- Over-polished: hallmark detail worn away, monogram erased, crisp edges softened
- Replaced parts: handles reattached (check solder lines), feet replaced, spouts repaired
- Rim repairs: common on teapots and creamers, visible under magnification
- Modern bright-cut re-engraving over erased original

The single most damaging act to silver value is removing an original monogram. A Georgian coffee pot with a period monogram is worth 2-3x the same pot with the monogram polished away.

## Restoration Evidence Porcelain And Pottery

- UV light shows repairs as dark patches against original body (modern restoration adhesives fluoresce differently)
- Visible invisible repair is never actually invisible — look at rims, handles, spouts, finials, where damage occurs
- Overpaint on a chip shows at an angle or under magnification
- Re-glazing is common on high-value pieces; surface will be slightly different texture
- Replaced lid is extremely common — measure, check mark consistency, look at color match

Restoration to porcelain rarely adds value. Even museum-quality restoration is a deduction. The only exception is when restoration is reversible and documented (conservation-grade).

## Restoration Evidence Paintings

- Over-paint visible under UV as dark patches
- Relining (new canvas backing glued to original) is common on 18th-19th century works; not disqualifying but noted
- Varnish removal and re-varnish — the single most common restoration
- In-painting of losses; small amounts acceptable, large amounts flagged
- Cradle added to panel paintings — structural, common on 17th-18th C, not disqualifying

## Restoration Evidence Clocks And Watches

- Replacement movements are common — period case, later movement, flag explicitly
- Re-silvered dials
- Replaced hands
- Replaced glass
- Replaced winding keys
- The movement should match the case period; mismatches are flagged

## The "Honest Restoration" Category

Some restoration is expected, appropriate, and does NOT reduce value significantly:
- Period-appropriate glue refresh on a loose joint
- Leather top replacement on a library table (leather never lasts 200 years)
- Caning replacement on a seat (caning is a consumable)
- Upholstery replacement (fabric is a consumable)
- Wax refresh on wood

These are "honest restoration." Call them out as present but do NOT apply the heavy penalty multiplier.

## The Hardest Call — Is It Original Or Replaced?

Hardware is the most commonly replaced element on period furniture. Tells of original hardware:
- The hole pattern on the drawer front matches the current pulls exactly
- The hole edges are chamfered from 200 years of hardware movement
- The back side shows matching period wear patterns
- Screw slots align with period-appropriate screws

Tells of replaced hardware:
- Multiple hole patterns on the drawer front (plugs from previous hardware)
- New holes beside old holes
- Hardware that does not match the period
- Modern screws

## Output

Populate condition_assessment.restoration_detected as a boolean. Populate condition_assessment.restoration_details with specific observed restoration — type, location, extent. Apply the appropriate multiplier to the valuation.auction_estimate and note it in valuation.valuation_methodology. Be diplomatic with the seller: restoration is not their fault, but it affects the price they will see.
