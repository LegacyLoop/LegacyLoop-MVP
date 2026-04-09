---
name: scope-aware-market-tiers
description: The 4-tier pricing framework PriceBot must produce on every scan. Covers LOCAL, REGIONAL, NATIONAL, and BEST MARKET tiers, how saleMethod controls which tiers apply, and how to compute and present net-to-seller for each tier.
when_to_use: "Every PriceBot scan."
version: 1.0.0
---

# Scope-Aware Market Tiers

## Why Four Tiers Exist

A single price is not enough information for a seller to make a rational listing decision. The same item has different correct prices depending on who is buying it, how far they are, and on what platform the transaction occurs. PriceBot is required to surface all applicable tiers on every scan, labeled clearly, with net-to-seller figures where shipping is involved.

The four tiers are not competing answers. They are complementary views of the same object in different market contexts. Present them as options, not as a ranking from wrong to right.

## Tier 1: LOCAL

Definition: A buyer within saleRadiusMi of the seller's ZIP code. No shipping required. Typically transacted via Facebook Marketplace, Craigslist, local buy-sell-trade groups, or in-person estate sale.

Pricing inputs:
- National baseline price for the item category and condition.
- Market multiplier for the seller's ZIP prefix (from lib/pricing/market-data.ts).
- Local buyer pool depth based on saleRadiusMi and population density.
- Category-specific local demand (furniture and large items favor local; small collectibles favor national).

Adjustments:
- In a high-demand ZIP (multiplier greater than 1.10), local price may meet or exceed national baseline.
- In a low-demand ZIP (multiplier less than 0.90), local price may be 20 to 40 percent below national baseline.
- Apply a negotiation buffer of 10 to 15 percent above target for Craigslist listings, where OBO negotiation is culturally expected.

Net to seller: Full listing price minus zero shipping cost. Note any applicable platform fees (Facebook Marketplace local = 0%, Craigslist = 0%).

Present as: "Local pickup price range: $X to $Y. If you list locally, you keep the full sale price with no shipping costs."

## Tier 2: REGIONAL

Definition: A buyer within 100 to 300 miles of the seller. May involve meetup at a midpoint, buyer-arranged courier, or uShip freight for large items. This tier captures nearby metro demand without full national shipping logistics.

When this tier applies:
- Seller ZIP is within 100 to 300 miles of a higher-demand metro area.
- The item category benefits from direct inspection (furniture, art, large ceramics, vehicles, instruments).
- Shipping the item is impractical or disproportionately expensive relative to item value.

Pricing inputs:
- Local baseline price.
- Nearest metro multiplier, weighted by distance. A seller 50 miles from Boston captures more of the Boston premium than a seller 250 miles away.
- Distance decay formula: apply 75% of the metro premium differential at 100 miles, 40% at 200 miles, 15% at 300 miles.

Net to seller: Full listing price minus any meetup cost or courier arrangement. No standard shipping cost.

Present as: "Regional price (buyers within 200 miles): $X to $Y. Buyers from [nearest major city] frequently purchase this category."

## Tier 3: NATIONAL

Definition: The item ships to any buyer in the continental US. Priced for national platforms: eBay, Etsy, 1stDibs, Ruby Lane, Mercari, Poshmark. Buyer pool is orders of magnitude larger than local.

Pricing inputs:
- National baseline from recent sold comps on eBay, Etsy, or equivalent.
- Condition adjustment applied to baseline (see skill 04 for condition multipliers).
- Shipping cost estimate from lib/shipping/metro-estimates.ts or Shippo estimate.
- Platform fee deducted to produce net-to-seller.

Net-to-seller calculation example:
- National listing price: $180
- Shipping cost (seller pays): $22
- eBay final value fee (13.25%): $23.85
- Net to seller: $134.15

Always show this math explicitly. Sellers frequently overlook platform fees and shipping costs when estimating what they will receive.

Present as: "National listing price: $160 to $195. After shipping and platform fees, you would net approximately $125 to $155."

## Tier 4: BEST MARKET

Definition: The single platform-and-audience combination that maximizes seller net for this specific item. This is a recommendation, not just a price — it includes the platform, the target buyer type, and any listing optimization notes.

This tier is the highest-value output PriceBot produces. It answers the question: "If I could only do one thing, what would it be?"

How to identify the best market:
1. Identify the item's primary buyer type: collector, decorator, craftsperson, casual buyer, institutional buyer.
2. Match that buyer type to the platform where they concentrate: collectors on eBay, decorators on 1stDibs and Chairish, craftspeople on Etsy, casual buyers on Facebook Marketplace.
3. Compute net-to-seller for each candidate platform at its expected price point.
4. Select the platform with the highest net-to-seller that the item is genuinely likely to sell on within 60 days.

Do not recommend a platform that would generate a high gross price with low probability of sale. A $400 listing on 1stDibs that never sells is worse than a $200 listing on eBay that sells in two weeks.

Present as: "Best market recommendation: List on [platform] targeting [buyer type]. Expected listing price $X to $Y. Estimated net to seller after fees and shipping: $Z to $W. Rationale: [two to three sentences]."

## Which Tiers Apply by saleMethod

saleMethod = LOCAL_PICKUP:
- Tiers 1 and 2 apply.
- Tier 3 and Tier 4 are suppressed unless the seller explicitly asks for national comparison.
- Note in the output: "Your listing is set to local pickup only. National pricing is not shown. Consider enabling shipping to access a larger buyer pool."

saleMethod = ONLINE_SHIPPING:
- Tiers 3 and 4 dominate the output.
- Tier 1 is shown as context only, not as a primary recommendation.
- Tier 2 is suppressed unless the item is freight-class (furniture, large appliances, art over 36 inches).

saleMethod = BOTH:
- All four tiers are shown.
- Present a net comparison table:

  Scenario | Listing Price | Est. Fees | Est. Shipping | Net to Seller
  Local pickup | $X | $0 | $0 | $X
  National eBay | $Y | $Y x 13.25% | $Z | $net

  Let the seller see the math and decide. Do not make the decision for them, but do highlight which option produces the best net.

## Handling Items Where Local Outperforms National

For large, heavy, or fragile items, shipping cost can consume so much of the national price premium that local pickup produces a better net:

Example: A marble-topped Victorian dresser.
- Local pickup price: $350
- National eBay price: $550
- Estimated freight shipping: $180
- eBay final value fee: $72.88
- Net from national sale: $297.12

In this case, local pickup nets $350 and national nets $297. PriceBot should clearly flag this inversion: "For this item, local pickup produces a better net return than national shipping due to freight costs. We recommend prioritizing local sale."

## Handling Items Where National Dramatically Outperforms Local

For small, lightweight, high-value-density items (jewelry, coins, watches, vintage cameras, first edition books), national listing almost always produces a dramatically better outcome:

Example: A working vintage Leica M3 camera.
- Local price in rural Vermont: $280
- National eBay price: $620
- Shipping cost: $14 (padded flat rate box)
- eBay final value fee: $82.15
- Net from national: $523.85

PriceBot should flag this clearly: "Shipping this item nationally could increase your net return by approximately $244 compared to local sale. This item has strong collector demand nationally."

## Presenting the Tier Output

Every PriceBot scan outputs the tier summary in a consistent format:

- Tier 1 (Local): [price range] — [platform suggestion] — [net note]
- Tier 2 (Regional): [price range] — [metro reference] — [applies / not applicable]
- Tier 3 (National): [listing price range] — [estimated net after fees and shipping]
- Tier 4 (Best Market): [platform] — [buyer type] — [estimated net] — [rationale]

If a tier does not apply due to saleMethod, state "Not applicable for this listing configuration" rather than omitting the row, so the seller understands what is possible if they change their settings.
