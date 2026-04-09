---
name: card-specific-grading
description: How to grade a card on the four PSA sub-dimensions — corners, edges, surface, centering — plus category-specific wrinkles for vintage vs modern, chrome vs paper, and the centering math that matters most.
when_to_use: Any scan in the sports cards, trading cards, or TCG sub-markets. Pack 04 is the detail layer under Pack 02's scale overview.
version: 1.0.0
---

# Card Grading — The Four Sub-Dimensions

PSA, BGS, SGC, and CGC Cards all grade on four independent sub-dimensions and then assign a composite grade. The composite is generally the LOWEST sub-grade (the "anchor"), sometimes with small mercy bumps. A card with 9.5 centering / 10 corners / 10 edges / 9 surface is a PSA 9, not a PSA 9.5 — surface is the anchor.

Your job is to read the photos carefully, estimate each sub-dimension, and take the anchor as the honest composite.

## Sub-Dimension 1: Corners

Look at all four corners at magnification. You are checking for:
- **Sharp 90-degree angle** (no rounding)
- **No white-dot fraying** (common on dark-bordered cards)
- **No bends or creases** in the corner region
- **No factory chipping** (look for cardstock color showing through painted border)

| Observed | Corner grade |
|---|---|
| All four razor-sharp, no fraying | 10 |
| 1 corner with microscopic softness | 9.5 |
| 2 corners with slight softness, no white | 9 |
| 1 corner with faint white | 8.5 |
| 2 corners with light white fraying | 8 |
| 3+ corners with visible white or fuzzing | 7 |
| Rounding or heavy fraying visible without zoom | 6 or lower |

**Dark-bordered cards are unforgiving.** 1971 Topps baseball, 1990-91 Fleer basketball, and modern chrome cards with dark borders show corner wear at 10x magnification on what look like pristine cards at arm's length. Downgrade dark borders half a point on corners as a default.

## Sub-Dimension 2: Edges

Edges are the card's perimeter under magnification. Check for:
- **Factory chipping** (different from corner chipping)
- **Surface nicks** along the edge
- **Whitening on dark borders**
- **Roughness from cutting**

| Observed | Edge grade |
|---|---|
| All four edges clean, no whitening, no nicks | 10 |
| 1 edge with microscopic roughness | 9.5 |
| 2 edges with slight whitening | 9 |
| Light whitening on 2–3 edges | 8.5 |
| Whitening visible at arm's length | 8 |
| Rough or chipped edges | 7 or lower |

Vintage cards (pre-1980) often have factory-rough edges. Do NOT penalize vintage cards for factory cut roughness the way you would penalize modern — that is how the card was made.

## Sub-Dimension 3: Surface

The hardest sub-dimension to read from photos. Surface checks for:
- **Scratches** — print surface scratches visible under light
- **Print lines** — factory defects (ink streaks)
- **Print dots** — small white spots where ink did not apply
- **Stains** — water spots, finger oil, wax stains (vintage)
- **Creases** — any wave or bend visible under a raking light
- **Gum stains** — on vintage wax-pack cards
- **Roller marks** — diagonal crease patterns from vending tubes
- **Chrome scratching** — specific to refractors, shiny cards

Modern chrome cards (Topps Chrome, Bowman Chrome, Prizm, Panini refractors) are surface-sensitive. A hairline chrome scratch that would be invisible on paper kills a chrome grade. Downgrade unseen chrome surface half a grade as a default until clear photos confirm.

## Sub-Dimension 4: Centering

Centering is measured on both axes: left-to-right (L/R) and top-to-bottom (T/B). The grade is stated as a ratio:
- 50/50 = perfect (rare)
- 55/45 = excellent
- 60/40 = PSA 9 territory
- 65/35 = PSA 8 territory
- 70/30 = PSA 7
- 75/25 = PSA 6
- Worse than 80/20 = PSA 5 or lower

**Centering is measured at the border width**, not at the image. Look at the white border between the card edge and the image frame, then compare opposite sides. L/R centering = left border vs right border; T/B centering = top border vs bottom border.

**Both axes matter.** A 55/45 L/R and 55/45 T/B is PSA 9 centering. A 55/45 L/R and 70/30 T/B is PSA 7 centering — the worse axis governs.

PSA centering standards (more forgiving than BGS):
- PSA 10: 55/45 or better both axes
- PSA 9: 60/40 or better both axes
- PSA 8: 65/35 or better both axes

BGS centering standards (stricter — required for Pristine 10):
- BGS 10 Pristine: 50/50 both axes
- BGS 9.5 Gem Mint: 55/45 both axes
- BGS 9 Mint: 60/40 both axes

## Modern vs Vintage Adjustments

**Vintage (pre-1980) scoring tolerance:** PSA grades vintage on a sliding scale. A vintage card that would be a PSA 7 by modern standards might grade PSA 8 if all four sub-scores are acceptable for the era. Do not over-grade vintage; PSA is forgiving but not blind.

**Modern (post-2000) is unforgiving.** Modern cards are expected to be clean. A modern card needs all four sub-dimensions at 9.5+ for a PSA 10.

## The "Qualified" Label

PSA issues "Qualified" labels (OC — Off-Center, ST — Staining, MC — Miscut, MK — Print Marks) when one dimension disqualifies the composite but the others would grade high. A "PSA 8 OC" means the card would be PSA 8 except centering is outside tolerance. Qualified cards sell at a discount to standard same-grade.

## Output

In `visual_grading`, populate all four sub-dimension fields (corners / edges / surface / centering) with specific observations. State the anchor (lowest sub-grade). State the composite grade with confidence. If the card is chrome, add a surface caveat. If dark-bordered, add a corner caveat. If vintage, apply the vintage tolerance. Always cite WHAT you saw — "slight fraying visible upper-right corner" — not just a number.
