---
name: location-sensitivity-pricing
description: How location changes everything in resale pricing. Covers market multipliers, ZIP-based demand tiers, saleMethod/saleRadiusMi integration, and how to communicate location impact to sellers clearly and respectfully.
when_to_use: "Every PriceBot scan."
version: 1.0.0
---

# Location Sensitivity Pricing

## Core Principle

The same physical object has three or four correct prices depending on who is buying it and from where. This is not a flaw in the market — it is the market. A vintage ceramic lamp in Waterville, Maine has a local pickup value, a regional value, and a national shipped value. All three are simultaneously true. PriceBot must report all relevant prices rather than collapsing them into a single figure.

## The Waterville-to-Brooklyn Example

A mid-century ceramic lamp in good condition:
- Local pickup in Waterville, ME: $40 to $55. The buyer base is thin, disposable income for decor is moderate, and there is no dealer competition to push prices up.
- Shipped nationally to a buyer in Brooklyn, NY: $160 to $200. A decorator or collector in a high-density urban market will pay a premium that reflects their access to fewer in-person options and a higher baseline willingness to pay for well-made vintage objects.
- Net to seller after shipping: $130 to $165 (assuming USPS flat rate or UPS ground around $18-$28 for a lamp of that weight and dimension).

The seller lives in Waterville. They need to know all three numbers to make a rational listing decision.

## Reading saleMethod from Item Data

PriceBot reads the saleMethod field from the item record. This field controls which price tiers are computed and surfaced.

- LOCAL_PICKUP: The buyer comes to the seller. No shipping cost. Price is anchored to local market demand. saleRadiusMi (default 25 miles) defines the effective buyer pool. In rural areas, a 25-mile radius may include very few competing buyers.
- ONLINE_SHIPPING: The item ships anywhere. Price is anchored to national demand. Shipping cost must be estimated and subtracted from gross price to give seller a net figure.
- BOTH: The item can be sold either way. PriceBot surfaces both prices and computes net-to-seller for each scenario so the seller can make a rational choice.

Always check saleRadiusMi. A seller who has set a 10-mile radius in a rural county is operating in a significantly thinner market than one who has set 75 miles to capture a nearest metro.

## The Market Multiplier System

PriceBot uses a ZIP-prefix-based market multiplier drawn from lib/pricing/market-data.ts. The multiplier adjusts a national baseline price up or down based on observed resale demand density in that geography.

Market tiers and representative multipliers:

- Tier 1 (Premium): NYC metro (1.35x), San Francisco Bay Area (1.35x), Boston metro (1.30x), Seattle (1.25x), Los Angeles (1.25x), Washington DC (1.25x).
- Tier 2 (Strong): Chicago, Denver, Austin, Portland, Atlanta, Minneapolis (1.10-1.20x).
- Tier 3 (Average): Mid-sized Midwest and Southeast cities, suburban markets (0.95-1.05x).
- Tier 4 (Soft): Rural New England, rural Appalachia, rural Deep South, rural Great Plains (0.70-0.90x).

The multiplier reflects buyer density, platform reach, collector presence, and income levels in the local market. It does not reflect the quality of the community or the people in it.

## High-Demand ZIP Behavior

In a high-demand ZIP, PriceBot should:
- Raise the local price toward or above the national baseline, because local buyers in these markets compete with national buyers.
- Flag that local pickup may outperform shipped pricing in some categories (furniture, art, fragile ceramics) because the buyer is nearby and shipping cost is eliminated.
- Note that platforms like Facebook Marketplace and Craigslist are more competitive in dense metros, which means items must be priced tighter and described more precisely to stand out.

## Low-Demand ZIP Behavior

In a low-demand ZIP, PriceBot should:
- Anchor local price to a conservative estimate reflecting thin buyer pool.
- Strongly recommend national listing for items with broad collector appeal (vintage electronics, mid-century furniture, silver, toys, books, art pottery).
- Compute the net gain from shipping: if shipping costs $15 and the national price is $80 higher than the local price, the seller nets an additional $65 by listing nationally. That math should be shown explicitly.
- Never imply that the seller's location is a problem. Frame it as an opportunity: "Because your local market is smaller, shipping this nationally could significantly increase what you receive."

## Communicating Location Impact to Sellers

Language matters. A seller in rural Maine should not feel that their location makes their items less valuable. The correct framing:

Do say: "Your local market supports a price of $45 to $60 for local pickup. If you ship nationally, buyers in larger cities are actively searching for this category and a price of $140 to $175 is well-supported by recent sold listings."

Do not say: "Your area has low demand" or "Rural markets undervalue antiques."

The goal is to give the seller more options and more information, not to explain why their community pays less.

## saleRadiusMi and Buyer Pool Depth

The saleRadiusMi field defines the geographic reach of a LOCAL_PICKUP or BOTH listing. PriceBot uses this to assess buyer pool depth:

- 0-25 miles in a rural county: very thin market, likely fewer than a few hundred potential buyers for any given category.
- 25-75 miles capturing a small city: moderate market, a few thousand potential buyers.
- 75-150 miles capturing a regional metro: reasonable depth, tens of thousands of potential buyers.
- 150+ miles or ONLINE_SHIPPING: national depth, millions of potential buyers across all platforms.

Buyer pool depth affects recommended listing price, acceptable time-to-sale expectations, and platform selection.

## When Local and National Prices Converge

For some categories, location matters less:
- Commodities (common tools, common books, generic kitchenware): prices are similar everywhere because the market is saturated nationally and locally.
- Highly niche collectibles (rare coins, specific sports cards): national collector networks dominate regardless of where the seller is located.

In these cases, PriceBot notes that location has minimal impact and focuses pricing on condition, completeness, and comp data.

## Integration with the Analyze Pipeline

The analyze route stores market multiplier data in Valuation.onlineRationale as a JSON blob including: marketTier, multiplier, bestMarketLabel, and bestMarketPriceRange. PriceBot reads this data and incorporates it into the pricing output rather than recomputing from scratch.

If the stored market data is more than 30 days old (compare Valuation.createdAt to current date), flag it as potentially stale and recommend re-running the AI analysis to refresh market positioning.

## Summary Checklist for Every Scan

1. Read saleMethod and saleRadiusMi from the item record.
2. Identify the seller ZIP prefix and look up the market multiplier.
3. Compute local price using multiplier-adjusted baseline.
4. If saleMethod includes ONLINE_SHIPPING or BOTH, compute national price and net-to-seller after estimated shipping.
5. Surface all applicable prices with clear labels.
6. Frame location impact positively, as an opportunity to reach a larger market.
7. Flag thin local markets with a recommendation to list nationally for maximum return.
