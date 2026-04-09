---
name: condition-impact-valuation
description: How condition scores on a 1-10 scale move resale prices. Covers exact percentage impacts per grade, condition-rarity interaction, photo-only assessment downgrades, and category-specific condition impact tables.
when_to_use: "Every PriceBot scan."
version: 1.0.0
---

# Condition Impact Valuation

## The Condition Score System

PriceBot reads three condition scores from the AiResult record: a composite condition score (1-10), a cosmetic condition score (1-10), and a functional condition score (1-10). These are populated by the AI analysis pipeline. When all three are available, use the composite score as the primary pricing driver and the cosmetic and functional scores to refine the output.

Condition score 8 out of 10 is the pricing baseline. It represents an item in good, honest vintage condition: normal age-related wear, fully functional if applicable, no damage that would concern a careful buyer. All price percentages below are relative to this baseline.

## Condition Score to Price Adjustment Table

Score 10 of 10 — Museum or dealer mint:
No visible wear, original packaging or paperwork if applicable, functions perfectly, no repairs or restorations. Price adjustment: +20 to +30 percent above baseline. This grade is rare. Do not assign it from photos alone without explicit evidence (original box shown, no wear visible from multiple angles).

Score 9 of 10 — Excellent:
Minimal wear visible only on close inspection, fully functional, no repairs. Price adjustment: +10 to +15 percent above baseline.

Score 8 of 10 — Good (baseline):
Normal age-related wear, fully functional, honest vintage condition, no damage. Price adjustment: 0 percent. This is the assumed standard for a carefully described vintage item.

Score 7 of 10 — Good minus:
Visible light wear, minor chips, small scratches, or light fading that does not obscure the item's appeal. Fully functional. Price adjustment: -10 to -15 percent.

Score 6 of 10 — Fair:
Noticeable wear, moderate chips or scratches, possible minor repair visible on inspection, may have restored or replaced elements. Price adjustment: -20 to -30 percent.

Score 5 of 10 — Acceptable:
Significant wear or damage, major repairs or restorations, non-original elements, or functional issues that are disclosed. Still displayable or usable for its intended purpose. Price adjustment: -35 to -50 percent.

Score 4 of 10 — Poor:
Substantial damage, heavy repairs, significant missing elements, or major functional problems. Value is primarily parts, scrap, or restoration project. Price adjustment: -50 to -65 percent.

Score 3 of 10 or below — Parts or project:
The item has value only as a source of parts, as a restoration project for a specialist, or as material (silver weight, copper, wood). Price adjustment: -65 to -80 percent off the baseline functional price. In some cases, price by material or parts value rather than by item category.

## The Condition-Rarity-Age Interaction

Condition is not the only driver of price. It interacts with rarity and age in ways that can override a simple percentage adjustment.

High rarity, poor condition: A genuinely rare item in poor condition may be worth more than a common item in excellent condition. Example: a rare manufacturer's sample in Fair condition might sell for three times what a common production model in Excellent condition sells for. When rarity signals are present (low comp count, maker marks, unusual variants, limited production runs), do not let a low condition score collapse the price to near zero without noting the rarity premium.

Low rarity, high condition: For common items, condition is everything because the buyer can find another example. A mass-produced mid-century glass bowl in Excellent condition commands a meaningful premium over the same bowl in Good condition, because Excellent examples are easy to find and buyers who want one will pay for it.

Age without rarity: Older does not automatically mean more valuable. A 100-year-old mass-produced item may be worth less than a 30-year-old limited production item. Anchor to comp data, not to age alone.

Provenance overrides condition: A documented provenance (celebrity ownership, historical association, original purchase receipt) can raise value by 20 to 200 percent regardless of condition. Flag provenance signals when present and recommend professional appraisal.

## Photo-Only Assessment Downgrade

When PriceBot is pricing from AI analysis based on photos rather than physical inspection, apply a 1-point downgrade to the stated condition score before computing price adjustments. This is a conservative correction for the things photos cannot reveal:

- Weight and heft (relevant for silver, bronze, glass, ceramics)
- Undersurface condition (the back of a painting, the bottom of a vase, the underside of furniture)
- Mechanical function (clocks, cameras, instruments, watches)
- Smell (mold, smoke damage, pet odors that affect textile and paper items)
- Structural integrity (hairline cracks in ceramics visible only by backlighting, wood joinery separation)

State this downgrade explicitly: "Condition assessment is based on photos only. A 1-point conservative adjustment has been applied. Physical inspection may support a higher score and higher price."

This protects the seller from over-promising condition to buyers and protects the platform from disputes.

## Category-Specific Condition Impact Notes

Furniture:
Condition drives price strongly because large items are difficult to ship and buyers often inspect in person. A chip on the interior of a drawer is less impactful than a chip on a visible surface. Refinished pieces are typically priced 15 to 25 percent below original-finish pieces in the collector market, but may be priced similarly or higher in the decorator market.

Electronics and Cameras:
Functional condition score is the dominant driver. A non-functioning vintage camera or radio is worth 30 to 60 percent less than a working example regardless of cosmetic condition. Always flag non-functional status prominently. For electronics, cosmetic condition matters mostly for display items (tube radios, neon signs) where functionality is secondary.

Clothing and Textiles:
Condition scoring differs by intended use. Wearable vintage: condition must be excellent to command full price because buyers will wear it. Display or costume: moderate condition is acceptable. Textile damage (holes, stains, moth damage) causes steep price drops (40 to 70 percent) because repair is specialist work. Check for odors specifically — fabric holds cigarette smoke and mildew and buyers return items for this reason frequently.

Toys and Collectibles:
Original box is worth 20 to 50 percent of the item price on its own for certain categories (action figures, die-cast vehicles, model kits). An item graded as "C9 with original box" can be worth three to five times an unboxed example. Apply the box premium only when the original box is confirmed present and in reasonable condition.

Books:
Condition for books is graded Fine, Near Fine, Very Good Plus, Very Good, Good, Fair, Poor. Price impact is steep: a first edition in Very Good condition may be worth half what a Fine copy brings. Dust jacket presence and condition is often worth more than the book itself for certain titles. A book described as "Good" by a general seller is typically what book dealers call "Fair."

Silver and Metalware:
For sterling silver, condition affects decorative value but not material (melt) value. If decorative value is close to melt value due to condition, recommend pricing at melt value plus a small premium. For silverplate, condition is critical because damaged silverplate has no meaningful melt value and low decorative value. Monograms reduce value by 20 to 50 percent depending on category and buyer type.

Ceramics and Glass:
Any chip, crack, or repair is a major price reduction. The rule of thumb: a chip reduces value by 30 to 50 percent. A crack reduces value by 50 to 70 percent. A restored chip or repair (if done by a conservator) reduces value by 20 to 30 percent, and the restoration must be disclosed. "Fleabite" chips on the base are considered minor and may reduce value by only 5 to 10 percent.

## Applying Cosmetic vs Functional Scores

When both scores are available and diverge significantly, apply them separately:

- High cosmetic, low functional (example: beautiful lamp that does not work): Treat as a decorator or parts item. Price at 40 to 60 percent of full functional value. Buyers exist for beautiful non-working lamps as display pieces, but the market is narrower.
- Low cosmetic, high functional (example: beat-up but working vintage radio): Treat as a user item. Price at 50 to 70 percent of full value. Working examples in rough condition appeal to hobbyists and restorers.
- Both high: Full condition premium applies.
- Both low: Sum the adjustments. A 6 cosmetic and a 5 functional does not average to a 5.5 — it compounds, because buyers must deal with both problems.

## Stating Condition Uncertainty

When the condition score from AI analysis has low confidence (flag from AiResult.confidence), or when photos are limited (fewer than 3 submitted), state the uncertainty directly:

"Condition assessment confidence is limited due to [few photos / low image resolution / no detail shots]. The price range below reflects this uncertainty with a wider band. Providing additional photos may tighten the estimate."

A wide price band is an honest answer. Collapsing uncertainty into a false precise number harms sellers who use that number to make listing decisions.
