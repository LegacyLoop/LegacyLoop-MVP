---
name: regional-vs-national-pricing-patterns
description: How geography distorts comp prices and how to adjust recommendations for the seller's actual location.
when_to_use: Every ReconBot scan where the seller's zip is known and shipping vs local pickup matters.
version: 1.0.0
---

# Geography Changes Everything

The same item can sell for $200 in Brooklyn and $80 in rural Maine — same condition, same era, same maker. Geography is a major price multiplier you must factor in. Most amateur AI tools ignore this entirely. You will not.

## The Three Geographic Markets

### Local Pickup Market (within 50 miles)
Buyers physically come to the seller. Limited buyer pool. Heavily skewed by local demographics.

**Local pickup advantages:**
- No shipping cost or risk
- No packing labor
- Cash on pickup, instant payment
- Buyers can verify condition in person

**Local pickup disadvantages:**
- Smaller buyer pool (especially in rural areas)
- Slower discovery (relies on local platforms)
- Lower prices in low-density regions

### Regional Shipping Market (200-500 miles)
Buyers in nearby states. Affordable ground shipping. Larger pool than local but still constrained.

### National Shipping Market (USA-wide)
Maximum buyer pool. Best for unique, valuable, or specialty items where the right buyer might be in California even if the seller is in Maine.

**National advantages:**
- Largest buyer pool
- Highest possible price for rare items
- Best for collectors and specialists

**National disadvantages:**
- Shipping cost (often 15-30% of item price)
- Packing labor and risk of damage
- Longer time to receive payment

## Maine / New England Specific Patterns

LegacyLoop's seller base is concentrated in Maine. Maine has specific market quirks you must internalize:

1. **Antiques and primitives are STRONG** — coastal Maine has high-density antique tourism. Local pickup prices for primitives, hooked rugs, ship-related items, and 18th-19th century country furniture are often HIGHER than national average.

2. **Mid-century modern is WEAK locally** — Maine doesn't have the design-conscious urban buyer base. MCM furniture sells better shipped to Brooklyn, Portland OR, or Atlanta than picked up locally.

3. **Tools and outdoor gear move FAST** — Maine has strong demand for hand tools, hunting/fishing gear, marine items, and farm equipment. These move quickly local pickup at fair prices.

4. **Electronics depreciate fast everywhere** — no regional advantage. Always recommend national shipping or quick local sale.

5. **Seasonal patterns are extreme** — summer tourist season (June-September) doubles foot traffic for antiques. Winter is dead for in-person sales.

## How to Adjust Comp Data for Geography

When you pull comps from a national source like eBay, you see prices that reflect the national average — which may not match the seller's local reality.

### Adjustment Multipliers (rough)

| Region | Antiques | MCM Furniture | Electronics | Tools | Decor |
|---|---|---|---|---|---|
| NYC / Brooklyn | 1.4× | 1.6× | 1.0× | 0.9× | 1.3× |
| LA / SF | 1.3× | 1.5× | 1.0× | 0.9× | 1.2× |
| Coastal Maine | 1.2× | 0.7× | 1.0× | 1.1× | 1.0× |
| Rural Maine | 0.8× | 0.5× | 0.9× | 1.0× | 0.8× |
| Rural Midwest | 0.7× | 0.5× | 0.9× | 1.0× | 0.7× |

These are RELATIVE multipliers vs national average. Use them to translate national comp data into a realistic local-pickup price for the seller.

## The Local Pickup Premium / Discount

When you recommend a price, ALWAYS distinguish:
- **National shipping price:** what the item would fetch with full national exposure
- **Local pickup price:** what the seller can realistically get from a buyer driving to them

For most items, local pickup is 10-20% lower than national shipping but 100% guaranteed and instant. Tell the seller both numbers.

## Output Format

In market_dynamics or pricing recommendations, include:
- **"National shipping median: $X (high exposure, 2-4 wk sell time)"**
- **"Local pickup recommended: $X (10-15% below national, instant cash, 1-2 week sell time)"**
- **"Regional adjustment applied: -15% for rural Maine market"**

Tell the truth about geography. The seller's reality is local.
