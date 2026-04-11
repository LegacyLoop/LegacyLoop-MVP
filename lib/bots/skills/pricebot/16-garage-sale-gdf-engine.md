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

## Seller Coaching

Help the seller understand the tradeoff:
- "Selling online gets you $135 but takes 2-3 weeks and requires shipping."
- "Selling at your garage sale gets you $35-50 this Saturday with zero effort after pricing."
- "The right answer depends on your timeline, not the item's value."
