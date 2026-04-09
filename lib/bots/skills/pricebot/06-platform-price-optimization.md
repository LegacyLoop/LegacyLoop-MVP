---
name: platform-price-optimization
description: Platform-specific pricing for maximum seller net. Covers fee structures, buyer pools, median sell times, and net-to-seller math for eBay, Etsy, Facebook Marketplace, Craigslist, 1stDibs, Ruby Lane, and Poshmark. Best-net logic included.
when_to_use: "Every PriceBot scan."
version: 1.0.0
---

# Platform Price Optimization

## Core Principle: Gross Price Is Not Net Price

The listing price a seller sets is not the amount they receive. Every platform extracts fees, and most categories require the seller to pay shipping. PriceBot must always compute net-to-seller figures and present them alongside gross listing prices. A seller who sees "$180 on eBay" without seeing "$134 net after fees and shipping" is making an uninformed decision.

The best platform for a given item is defined as the one that produces the highest net-to-seller within a reasonable sell-time window (typically 60 days). It is not always the platform with the highest gross listing price.

## eBay

Fee structure:
- Final value fee: 13.25 percent of the total sale amount (item price plus shipping charged to buyer) for most categories. Jewelry: 15 percent. Books and media: lower rates. Collectibles: varies.
- Fixed portion of final value fee: $0.30 per order.
- Insertion fee: $0.35 per listing after the free monthly allowance (typically 250 free listings for casual sellers).
- Promoted Listings fee: optional, 2 to 15 percent additional, increases visibility.
- Payment processing: included in the final value fee since 2021 (no separate PayPal fee).

Buyer pool characteristics:
- Largest single resale marketplace in the US by transaction volume.
- Strong collector base for nearly every category.
- Auction format works well for genuinely rare items and items with uncertain value.
- Fixed price (Buy It Now) works well for items with clear comparable pricing.
- International buyer access available, which can be significant for niche collectibles.

Median sell time:
- Competitively priced fixed-price listings: 7 to 21 days.
- Auction listings: 7 days to end of auction.
- Overpriced listings: 90 to 180 days or never.

Net-to-seller calculation:
Listing price: $200
Final value fee (13.25% of $200 + $15 shipping charged to buyer): $28.48
Fixed fee: $0.30
Shipping cost paid by seller: $15.00
Net to seller: $156.22

When to recommend eBay: Almost any category. Strongest for electronics, vintage toys, sports cards and memorabilia, coins, jewelry, vintage cameras, china and glass, books, tools.

## Etsy

Fee structure:
- Listing fee: $0.20 per item (renews with each sale).
- Transaction fee: 6.5 percent of total price including shipping charged to buyer.
- Payment processing fee: 3 percent plus $0.25.
- Optional Etsy Ads fee: variable.

Buyer pool characteristics:
- Buyers seek handmade, vintage (defined as 20 years or older), and craft supply items.
- Strong aesthetic sensibility: buyers respond to photography and presentation.
- Higher average order values for vintage jewelry, textiles, ceramics, and mid-century home goods.
- Less price-sensitive than eBay buyers in certain categories — buyers are buying an aesthetic, not just a commodity.

Median sell time:
- Well-photographed, competitively priced vintage: 14 to 45 days.
- Niche or unusual items: 60 to 180 days.
- Items without strong visual presentation: significantly longer regardless of price.

Net-to-seller calculation:
Listing price: $85
Transaction fee (6.5% of $85 + $12 shipping): $6.31
Payment processing fee (3% + $0.25): $2.80
Listing fee: $0.20
Shipping cost paid by seller: $12.00
Net to seller: $63.69

When to recommend Etsy: Vintage jewelry, vintage clothing, ceramics and pottery, handmade or artisan objects, mid-century home decor, vintage textiles, vintage books with aesthetic appeal, craft supplies.

## Facebook Marketplace

Fee structure:
- Local pickup sales: 0 percent fee.
- Shipped sales: 5 percent fee on total transaction (minimum $0.40).

Buyer pool characteristics:
- Largest local buyer pool in most US markets.
- Buyers are geographically constrained — they buy what they can pick up or receive locally.
- Less collector sophistication on average — buyers respond to "good deal" framing.
- Strong for furniture, appliances, large items, common household goods, everyday vintage.
- Weak for high-value collectibles where authentication and provenance matter.

Median sell time:
- Well-priced common items: 1 to 5 days.
- Specialty or higher-priced items: 7 to 21 days.
- Overpriced items: no sale (buyers skip without engaging).

Net-to-seller calculation (local pickup):
Listing price: $65
Fee: $0
Shipping: $0
Net to seller: $65.00

When to recommend Facebook Marketplace: Furniture, appliances, large framed art, household goods, tools, garden equipment, exercise equipment, baby items, common vintage decor. Also strong for quick liquidation when speed matters more than maximum return.

## Craigslist

Fee structure:
- Free for most categories (no listing or transaction fees).
- Some categories in some cities have small listing fees ($5 to $10).
- Payment is typically cash at pickup — no platform payment processing.

Buyer pool characteristics:
- Local only, no national reach.
- Buyers expect to negotiate. Craigslist culture is OBO (or best offer) by default.
- Higher risk of no-shows and time-wasters compared to other platforms.
- No buyer feedback or rating system, which creates friction for higher-value items.
- Strong for vehicles, furniture, large tools, and items that require local pickup regardless.

Pricing guidance:
- List 15 to 20 percent above actual target to leave room for negotiation.
- Never show a bottom price in the listing — let buyers make offers.
- Include "firm" only if genuinely not negotiable, and only for items with strong comparable prices.

Net-to-seller calculation:
Target price: $120
List at: $140 to $145
Expected negotiated sale: $115 to $125
Fee: $0
Net to seller: $115 to $125

When to recommend Craigslist: Large items with high shipping costs (furniture, appliances, farm equipment), vehicles, items where in-person inspection is critical, quick local liquidation when Facebook Marketplace has not produced results.

## 1stDibs

Fee structure:
- Commission varies: 15 percent for dealer subscribers up to 50 percent for non-subscriber one-off listings.
- Annual dealer membership: $3,600 to $9,600 depending on tier.
- Not appropriate for individual sellers without a business account. Individual sellers may use their consignment model.

Buyer pool characteristics:
- Highest-end buyer pool in online resale. Interior decorators, institutional buyers, high-net-worth collectors.
- Average transaction values are significantly higher than any other platform.
- Buyers are educated and sophisticated. Misrepresentation leads to returns and reputational damage.
- Listings require professional photography and detailed, accurate descriptions.
- Long sell times are common and expected — buyers are deliberate.

Median sell time:
- 30 to 180 days for correctly priced items.
- Items on 1stDibs are not expected to sell quickly. The platform is for patient sellers seeking maximum price.

When to recommend 1stDibs: High-quality antiques, significant mid-century designer pieces (Eames, Nakashima, Bertoia, Prouve), important paintings, fine silver and jewelry. Not appropriate for items under $500 or items without documented quality and provenance. For LegacyLoop sellers, note that 1stDibs requires a dealer account and may not be accessible for individual listings — recommend Chairish or EBTH as accessible alternatives with similar buyer profiles.

## Ruby Lane

Fee structure:
- Monthly maintenance fee: $25 for up to 80 items, scaling up for larger shops.
- Transaction fee: 9.9 percent, capped at $250 per transaction.
- Payment processing: approximately 3 percent.

Buyer pool characteristics:
- Specialist antique and vintage collector market.
- Buyers are educated and expect accurate descriptions and grading.
- Strong for fine china, glassware, silver, jewelry, dolls, vintage textiles, and decorative antiques.
- Smaller buyer pool than eBay but buyers have higher intent and higher average spend.

When to recommend Ruby Lane: High-quality antiques and vintage collectibles where the Ruby Lane buyer pool (educated specialist collector) matches the item. Not appropriate for common items or items under $30.

## Poshmark

Fee structure:
- Items under $15: flat fee of $2.95.
- Items $15 or more: 20 percent commission.
- Buyer pays shipping via Poshmark prepaid label ($7.97 flat rate priority mail up to 5 pounds).

Buyer pool characteristics:
- Dominant platform for fashion, accessories, shoes, and handbags.
- Strong for brand-name vintage and contemporary clothing.
- Buyer pool skews younger and female.
- Social features (sharing, following) make visibility management important — inactive sellers see reduced traffic.
- Category focus is tight: clothing and accessories perform well, home goods and collectibles do not.

Net-to-seller calculation:
Listing price: $45
Poshmark commission (20%): $9.00
Shipping: buyer pays
Net to seller: $36.00

When to recommend Poshmark: Brand-name vintage clothing, designer accessories, shoes, handbags, jewelry that fits the fashion aesthetic. Not appropriate for household goods, furniture, or most collectible categories.

## Presenting the Platform Comparison

For every PriceBot scan, present a platform comparison table when multiple platforms are relevant:

Platform | Expected Listing Price | Est. Fees | Est. Shipping (Seller) | Net to Seller | Median Sell Time
eBay | $X | $Y | $Z | $net | 7-21 days
Etsy | $X | $Y | $Z | $net | 14-45 days
Facebook Local | $X | $0 | $0 | $net | 1-5 days

Then make a single best-net recommendation with rationale. The recommendation should account for sell time: if two platforms produce similar net figures but one sells in 5 days and the other in 60, the faster platform is typically the better recommendation unless the seller has signaled that maximizing price matters more than speed.
