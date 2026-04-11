---
name: garage-sale-market-awareness
description: Teaches AnalyzeBot to provide three-tier pricing context on first analysis. Online marketplace price, garage sale price, and quick sale price — all from the first scan.
when_to_use: Every AnalyzeBot scan. Provide garage sale pricing context alongside standard analysis.
version: 1.0.0
---

# Garage Sale Market Awareness

## The Two Markets Every Seller Faces

Every item exists in two simultaneous markets with fundamentally different buyer psychology:

**Online Marketplace** — patient buyers searching for specific items, willing to pay near-market value, comparing prices across listings, making decisions over days or weeks.

**In-Person Sale** — impulse buyers hunting for bargains, expecting 20-40 cents on the dollar versus retail, making decisions in seconds, physically inspecting items before buying, rarely willing to exceed $50-60 for household items regardless of online value.

AnalyzeBot must acknowledge both markets on every scan. A $135 kitchen appliance is worth $135 online but $35-50 at a Saturday morning garage sale. Both prices are correct — they serve different selling contexts with different timelines.

## Three-Tier Price Output

On first analysis of any item, immediately include all three price tiers:

1. **Online Marketplace Price** — maximum value, requires listing effort, takes 1-4 weeks to sell. This is the existing analysis output.
2. **Garage Sale Price** — what in-person buyers will realistically pay this weekend. Apply the category-appropriate discount factor. Range format: "$35-50."
3. **Quick Sale Price** — side-of-the-road, gone-today pricing. 60-65% of the garage sale price. For sellers who need the item gone immediately.

State which selling context makes most sense based on item type, condition, and value. A $15 item is not worth listing online — say so. A $500 antique should never be priced at garage sale rates — say that too.

## Category Exceptions — Never Discount

NEVER apply garage sale discounting to items flagged by AntiqueBot or CollectiblesBot. Antiques, collectibles, art, jewelry, coins, watches, and stamps hold their value at garage sales because the buyers who seek them out are collectors who know what things are worth. A collector at a garage sale is still a collector.

If you detect antique or collectible indicators during your analysis, note: "This item may hold full value even at a garage sale. Do not discount — collectors will find it."

## Condition Context

- Like new condition → upper end of garage sale range
- Good condition → mid-range pricing
- Fair condition → lower end of range
- Poor condition → quick sale pricing only, recommend bundling with similar items

## Location Awareness

Garage sale prices are location-sensitive. The system automatically adjusts prices based on the seller's ZIP code and market tier. When analyzing items:

- In HIGH DEMAND markets (Boston, NYC, SF, DC suburbs): garage sale buyers have more money — prices can be 10-20% higher than national average
- In LOW DEMAND markets (rural Maine, Mississippi, West Virginia): prices are 15-25% lower — fewer buyers, more price pressure
- Always mention the seller's market context: "In your area, this typically sells for..."
- If the seller set their sale radius to local (25 miles or less), all recommendations should reflect LOCAL selling — meetups, not shipping
