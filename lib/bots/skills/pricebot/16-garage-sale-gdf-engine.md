---
name: garage-sale-gdf-engine
description: Enhanced garage sale pricing with Garage Sale Discount Factor awareness. Complements pack 11 with structured three-tier output and category-specific reasoning.
when_to_use: Every PriceBot scan. Structure output to include online, garage sale, and quick sale prices with reasoning.
version: 1.0.0
---

# Garage Sale Discount Factor Engine

## Structured Three-Price Output

When providing pricing analysis, always structure your response to include three distinct price points with reasoning:

### 1. Online Marketplace: $[price] — [reasoning]
The maximum achievable value through patient online selling. Include the best platform and estimated time to sell.

### 2. Garage Sale Price: $[low] – $[high] — [reasoning]
What in-person buyers will realistically pay at a Saturday morning yard sale, estate sale, or moving sale. Explain WHY this price is lower than online:
- Buyer psychology: "garage sale buyers expect deals"
- No shipping cost advantage for the buyer in person
- Competition from 50-100 other items on the same table
- Impulse purchase dynamics — decisions made in seconds

### 3. Quick Sale Price: $[low] – $[high] — [reasoning]
If the seller needs this gone today. Price it to move with zero negotiation. "First person who shows up takes it."

## Category-Specific Reasoning

- **Electronics/Appliances**: Online buyers pay for convenience and warranty. Garage sale buyers assume no returns — price 20-40% of online value.
- **Furniture**: Heavy items are harder to ship. Local garage sale can sometimes approach online prices for furniture because buyers avoid shipping costs.
- **Clothing**: Flat $1-5 per item at garage sales regardless of original retail. Exception: designer brands with visible labels.
- **Books**: $0.25-$1 each. Bundles of 10 for $5 move faster than individual pricing.
- **Tools**: Hold value well — garage sale buyers are often tradespeople who know tool values. 25-35% of retail.

## The Antique/Collectible Exception

If AntiqueBot or CollectiblesBot has flagged this item, or if you detect antique/collectible indicators: DO NOT apply standard garage sale discounting. State clearly: "This item's value holds at in-person sales. Collectors actively hunt garage sales for exactly this type of item. Price at 70-90% of online value."

## Location-Aware Garage Sale Pricing

Garage sale prices vary significantly by location. The same item at a garage sale in Manhattan suburbs will fetch 15-20% more than in rural Maine. Always factor in the seller's market:

**HIGH DEMAND MARKETS** (urban, affluent suburbs — NYC, SF, Boston, DC, LA, Seattle):
- Garage sale buyers have more disposable income
- Recognizable brands command higher prices in person
- Well-maintained items sell at the top of the range
- Competition among buyers is higher — pricing can be firmer

**LOW DEMAND MARKETS** (rural, lower-density areas — rural Maine, WV, MS, AR, Dakotas):
- Buyers expect deeper discounts at garage sales
- Price resistance is stronger — fewer competing buyers
- Quick sale prices may need to be even lower
- Items may take longer to sell even at in-person sales

**WHEN YOU KNOW THE SELLER'S LOCATION:**
Always reference it in your pricing rationale:
"In your area (Waterville, ME), this item would realistically sell for $22-36 at a garage sale. In a Boston suburb, the same item might fetch $30-45."

**LOCAL SELLING CONTEXT:**
When the seller has set their sale method to LOCAL_PICKUP or limited their sale radius:
- The "Best Market" recommendation should reflect LOCAL markets, not shipping destinations
- A city 15 minutes away is a LOCAL MEETUP, not a shipping destination
- "Drive to Augusta" is different from "Ship to Augusta"
- Factor the seller's stated radius into all recommendations

## Seller Coaching

Help the seller understand the tradeoff:
- "Selling online gets you $135 but takes 2-3 weeks and requires shipping."
- "Selling at your garage sale gets you $35-50 this Saturday with zero effort after pricing."
- "The right answer depends on your timeline, not the item's value."
- When local: "Augusta is 20 minutes from you — meet the buyer there for $175 with no shipping cost."
