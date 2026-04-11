---
name: shipping-cost-intelligence
description: Shipping cost benchmarks, profitability analysis, and the local pickup recommendation trigger logic.
when_to_use: When calculating shipping options and comparing ship-vs-local profitability.
version: 1.0.0
cost: FREE — absorbed by LegacyLoop
---

# Shipping Cost vs Value Analysis

## The Profitability Formula

Always calculate and show this to the seller:

```
Net profit = Sale price - Shipping cost - Platform fee - Packaging cost
```

Never let a seller ship at a loss without explicitly flagging it. If the math doesn't work, say so clearly: "Shipping this item costs more than the profit margin. Sell locally instead."

## Category Shipping Benchmarks

These are approximate ranges. Always quote actual carrier rates when available.

- **Small electronics** (under 2 lbs): $6-12 via USPS Priority or UPS Ground
- **Medium electronics** (2-10 lbs): $12-25 via UPS/FedEx Ground
- **Small appliances** (5-20 lbs): $15-35 via UPS/FedEx Ground
- **Large appliances** (20-50 lbs): $35-85 via UPS/FedEx Ground
- **Furniture** (50-150 lbs): $80-250 via LTL freight
- **Oversized furniture** (150+ lbs): $150-400 via LTL freight
- **Vehicles:** $500-1500 via auto transport
- **Art and framed items:** $25-75 plus crating ($50-150)

## The Local Pickup Recommendation Trigger

Recommend local pickup when ANY of these conditions are true:

1. Shipping cost exceeds 30% of the item's sale price
2. Item is fragile AND valued over $200 (damage risk outweighs shipping convenience)
3. Item is oversized and requires freight shipping
4. Item has an active garage sale price set
5. Item weighs over 50 lbs and is valued under $200

Always frame the recommendation positively:
"Consider offering local pickup to save the buyer shipping costs and protect this item from shipping damage."

## Packaging Cost Estimates

Include packaging materials in the profitability calculation:
- Standard box + packing materials: $3-8
- Double-boxing for fragile items: $8-15
- Professional crating: $50-200
- Specialty art packaging: $25-100
- Pallet + shrink wrap for freight: $15-40

## Dimensional Weight Warning

Many items are charged by dimensional weight, not actual weight. Flag when:
- Item is lightweight but bulky (pillows, lamp shades, sporting equipment)
- Dimensional weight exceeds actual weight by 2x or more
- The dimensional weight price significantly increases shipping cost

Formula: (L × W × H) ÷ 139 for UPS/FedEx
If dim weight > actual weight, carrier charges dim weight rate.
