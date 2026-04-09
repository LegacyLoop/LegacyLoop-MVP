---
name: garage-sale-quick-pricing
description: Fast turnaround pricing discipline for high-volume, low-value items. Covers the 15-second price rule, tiered analysis depth by value bracket, mobile output format, and bundle pricing.
when_to_use: Every PriceBot scan.
version: 1.0.0
---

# Garage Sale Quick Pricing

## The Core Discipline: Matching Analysis Depth to Item Value

The most common PriceBot error in high-volume, low-value contexts is over-analysis. Applying the same research depth to a $12 set of kitchen towels as to a $350 vintage camera is not thorough — it is a misallocation of the seller's attention and the system's output capacity.

Pricing discipline at the low end of the value spectrum means accepting that a good-enough price, delivered instantly, is more valuable than a perfect price delivered after five minutes of analysis. The seller at a Saturday morning garage sale has 150 items to price, 40 people walking through the yard, and no patience for a pricing report that takes two minutes to read.

The system must adapt its output depth and format to the item's estimated value. This is not a reduction in quality — it is a calibration of effort to return.

## The 15-Second Price Rule

For any item with an estimated value under $25, the pricing recommendation must be readable and actionable in 15 seconds. This means:

One price recommendation, not a range. A range of "$8-$14" requires the seller to make a decision. A recommendation of "$10" is immediately usable.

One sentence of rationale, maximum. "Priced at market for similar used kitchenware" is sufficient. A paragraph about condition adjustments and platform routing is not.

No caveats. Freshness warnings, confidence bands, and platform comparisons are appropriate for higher-value items. For a $10 item, they are noise.

The 15-second rule exists because the alternative — spending cognitive energy on a $10 item — has a measurable opportunity cost. A seller who reads a detailed pricing report for each of 80 low-value items will spend hours in analysis before anything is priced. The same seller using the 15-second rule can price 80 items in 20 minutes.

## The Four Value Brackets

PriceBot applies one of four analysis tiers based on estimated item value. The tier assignment happens before the full analysis runs, using the quick-estimate signal (description keywords, category, and any prior AI result).

### Bracket 1: Under $10

Price in $1 increments. Round numbers only. No research needed — use category baseline pricing.

Output format: single line. "Recommended price: $[X]."

Category baselines for common Bracket 1 items: books $1-3, single plates or cups $1-2, VHS tapes $1, standard paperbacks $1, most small decorative items $2-5, basic tools $3-8, common glassware $1-3.

Do not run comp searches for Bracket 1 items. The time cost of a comp search exceeds the potential value gain.

### Bracket 2: $10-$50

Quick comp check: 1 to 3 eBay completed sales, matched on category and general condition. Round the recommendation to the nearest $5.

Output format: two to three lines. Recommended price, one-line rationale, one platform suggestion.

Example: "Recommended price: $25. Based on recent sales of comparable hand mixers in working condition. Facebook Marketplace or local garage sale."

At this bracket, the seller benefits from knowing that a quick check was done. The output should name the comp source ("based on 2 recent eBay sales") to signal that the price is grounded, not guessed.

### Bracket 3: $50-$200

Standard analysis: 5 to 10 comps, condition adjustment, platform routing, net-to-seller estimate.

Output format: standard PriceBot output with executive summary, brief rationale, and next steps. Three bullet points maximum.

This is the transition zone between yard-sale pricing and marketplace pricing. Many sellers underestimate items in this range because they are accustomed to garage sale psychology. PriceBot should note, at this bracket, when an item is likely to achieve better results on eBay or Facebook Marketplace than at a yard sale.

### Bracket 4: $200 and Above

Full analysis as defined in the standard PriceBot output format (see Pack 15). High-value item treatment applies at $500+ (see Pack 09).

For items in the $200-$500 range: standard comp analysis, confidence band, platform comparison, net-to-seller math. Dual-opinion report is not required but Gemini secondary is recommended.

## The Volume-Pricing Framework

When a seller submits multiple items for simultaneous pricing (batch mode), the system should:

- Sort items by estimated value, descending
- Apply full analysis only to items above $200
- Apply standard analysis to items between $50 and $200
- Apply quick-check analysis to items between $10 and $50
- Apply baseline pricing to items under $10, grouped by category

The batch output should present a pricing table: item name, recommended price, platform, and estimated sell time. Items under $10 may be grouped ("Miscellaneous kitchenware — 12 pieces: $1-3 each, or bundle at $15 for all").

## Bundle Pricing for Sub-$5 Items

Individual items worth under $5 are often better sold as bundles. The bundling math: group 4-8 related items, price the bundle at 60-70% of their combined individual prices (enough to create perceived value for the buyer), and present it as a deal.

Effective bundle categories: kitchen items (utensils, measuring cups, mixing bowls), books by genre or author, decorative items by color or style, tools by type (gardening, hand tools, painting supplies), children's toys by age range.

Bundle naming matters for online listings. "Kitchen Tools Bundle — 6 Pieces" sells better than "Misc Kitchen Stuff." PriceBot should suggest bundle names when recommending the bundle strategy.

The upper limit for bundle pricing: do not bundle items over $20 each unless they are a natural set (matching dinnerware, tool set with original case). High-value items bundled with low-value items drag down the high-value item's perceived worth.

## Mobile-Friendly Quick Price Output

Sellers using LegacyLoop at an active garage sale are on a phone. The output for Bracket 1 and Bracket 2 items must be designed for mobile reading — specifically, for someone holding a phone with one hand while managing a yard sale table with the other.

Mobile output requirements:
- Recommended price in large text at the top, before any rationale
- No tables
- No multi-column layouts
- Three lines maximum for the main recommendation
- Next steps in plain numbered list, no nested bullets
- Total output length: under 100 words for Bracket 1 and 2 items

The mobile output format should be the default for all items when the request metadata indicates a mobile client. Desktop clients may receive the expanded format.

## When Good Enough Beats Perfect

The philosophical case for quick pricing: the enemy of a successful garage sale is unsold inventory. An item priced at $10 that sells in the first hour is better than an item worth $14 that sits all day because the seller spent 20 minutes determining the right price and then never got around to marking it.

The same logic applies to online selling for low-value items. The time cost of managing a $12 eBay listing — photographing, listing, communicating with buyers, packaging, shipping — often exceeds the net proceeds. For items under $15, local cash sale at a yard sale is frequently the highest-net option when time is treated as having value.

PriceBot should surface this analysis when appropriate: "This item is worth approximately $12 online but would likely sell at $8-10 in a local cash sale. If your time to manage an online listing is worth more than $2-4, the local sale is probably the better choice."

This kind of honest, seller-first analysis builds trust and is the standard PriceBot should meet.
