# PriceBot Skill Pack 17: Garage Sale V8 Engine

## Three-Number Pricing System

V8 replaces the V2 range-based output with three actionable numbers:

### LIST Price (Sign Price)
The price on the tag. Anchored 10-20% above ACCEPT to create perceived value.
- Standard items: 20% above ACCEPT
- Value-holding items (antiques, collectibles, jewelry): 10% above ACCEPT
- Buyers expect to negotiate down from this number

### ACCEPT Price (Deal-Close Target)
The real target price. Where the deal should close. This is the fair garage sale price.
- Derived from V2 midpoint (garageSalePrice)
- Location-adjusted, condition-adjusted, brand-aware
- This is what the seller should mentally target

### FLOOR Price (Walk-Away Minimum)
Below this, keep the item or donate it. The honest minimum.
- Derived from V2 quick-sale price
- Demand-adjusted: hot items have higher floors, cold items have lower floors
- Seller should never accept below this unless clearing out

## Psychology-Aware Rounding
- Items under $20: whole dollars ($3, $7, $12)
- Items $20-$100: nearest $5 ($25, $45, $80)
- Items $100-$500: nearest $10 ($120, $250, $380)
- Items $500+: nearest $25 ($525, $750, $1,250)
- Garage sale buyers respond to round numbers. Precise pricing signals "negotiable."

## Sale-Type Awareness
- LOCAL_PICKUP: emphasize foot traffic psychology, round to $5 increments, skip online recommendations
- ONLINE_SHIPPING: emphasize marketplace fee math, factor shipping costs, precise pricing acceptable
- BOTH: provide both framings, recommend the best channel based on item value

## Location Intelligence
The V8 engine generates a 1-sentence location context note explaining how local market conditions affect pricing. Examples:
- "Strong market (ZIP 100xx): local demand runs 21% above national average."
- "Rural/lower-density market (ZIP 049xx): prices typically 18% below national average. FLOOR adjusted accordingly."
- "Average market (ZIP 606xx): pricing at national baseline."

## Channel Recommendation
Based on ACCEPT price + category + location + saleMethod:
- Under $15: "Garage sale or bundle lot" (not worth shipping)
- $15-$50: "Garage sale with online backup" (list locally first)
- $50-$200: "Online marketplace (eBay, Mercari, FB)" (best price-to-effort)
- $200-$500: "Specialty platform" (targeted audience)
- $500+: "Auction or consignment" (maximize return)
- Antiques/Collectibles: always "Specialist dealer or auction"
- LOCAL_PICKUP items: local recommendations only
- FREIGHT_ONLY items: "Estate sale or local consignment"

## Data Collection
Every V8 calculation logs to EventLog with eventType GARAGE_SALE_V8_CALC:
- LIST, ACCEPT, FLOOR prices
- Channel recommendation + reasoning
- Location note + tier + multiplier
- Sale type used
- Market price input

This data feeds future model accuracy and regional pricing intelligence.
