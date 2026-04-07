---
name: auction-vs-buynow-weighting
description: Auction final prices and Buy It Now prices are different signals — auction fever inflates sale prices, BIN reflects steady-state demand.
when_to_use: Every ReconBot scan that pulls comp data from eBay or auction-style platforms.
version: 1.0.0
---

# Auctions Lie Differently Than Fixed Prices

A $400 final auction price and a $400 BIN sale price look identical in your data, but they tell completely different stories about the market. Auctions are emotional events. BIN sales are rational transactions. You must weight them differently.

## Auction Final Price = Real + Auction Fever

When two bidders compete in the final minutes of an auction, prices climb beyond rational market value. This is "auction fever" — the bidding feels like winning, and bidders pay premiums they would never accept on a fixed-price listing.

**Typical auction fever premium:**
- Generic items: +5-10% over fair market value
- Collectible items: +15-30% over fair market value
- Rare / one-of-a-kind: +30-100% over fair market value (can be unlimited at the top end)

**This means:** Auction final prices systematically OVERSTATE the true sustainable market value. If you compute market median from auction comps only, you'll recommend prices that won't sell on a BIN listing.

## BIN (Buy It Now) Sale = Steady-State Demand

A BIN sale at $400 means a buyer rationally decided $400 was a fair price and clicked the button. No competitive pressure. No fever. No deadline.

BIN sale prices REFLECT the true market value the user can expect to achieve in a fixed-price listing. They're more conservative than auction prices but more reliable.

## How to Weight Each Type

When you have a mix of auction and BIN comps in your dataset:

| Listing Type | Weight | Use Case |
|---|---|---|
| BIN sold (last 30 days) | 1.0× | Anchor — most reliable |
| BIN sold (31-60 days) | 0.7× | Still relevant |
| Auction final (last 30 days) | 0.6× | Apply -15% adjustment for fever |
| Best Offer accepted (last 30 days) | 0.9× | Slightly below BIN, very real |
| Active listings (any) | 0.0× | Not actual sales |

When you compute the market median, weight each comp by its weight factor.

## When Auction Comps Are All You Have

Sometimes the only available comps are auction sales. In that case:
1. Use them, but discount the final prices by 15-20% to remove fever
2. State explicitly in your output: "Comp data is auction-heavy; reported market median is BIN-equivalent (auction prices discounted 18% for fever)"
3. Recommend the user list at the BIN-equivalent price, not the raw auction average

## When BIN Comps Are All You Have

You're in great shape. BIN comps are the cleanest signal. Use them at full weight.

## The Reserve Price Trap

Some auction listings have reserve prices (a hidden minimum the seller will accept). When the auction ends below reserve, the item DOESN'T SELL — but it shows as a comp anyway in some scrapers.

**Rule:** A "didn't meet reserve" auction is NOT a sale and should NOT be included in sold comp data. Filter these out.

## Auction-Style Platforms vs Fixed-Price Platforms

Different platforms lean different ways:
- **eBay:** mix of auction and BIN — both common
- **eBay (newer years):** mostly BIN (auction format declining)
- **LiveAuctioneers / Invaluable / Heritage Auctions:** auction-only
- **Facebook Marketplace / Craigslist / Mercari / Etsy:** BIN-only
- **1stDibs / Chairish / Ruby Lane:** BIN-only

When pulling comps from auction-only platforms, apply the auction discount (-15-20%) before integrating with BIN comps from other sources.

## Auction Fever in High-Value Items

For items above $1,000, auction fever can be EXTREME — sometimes doubling the realistic market price. A Stickley desk that sells at auction for $3,400 might list as BIN for $1,800. The auction price isn't wrong, it's just a different transaction type — a rare item meeting a serious collector at the right moment.

**Recommendation:** For high-value items, recommend the user choose between:
- **Auction listing:** higher ceiling, lower predictability, longer time
- **BIN listing:** lower ceiling, higher predictability, faster sale

Tell them both options clearly. Don't push them toward one without explaining the trade-off.

## Output Format

When reporting comp data, ALWAYS distinguish:

**"BIN sold median: $185 (8 comps, last 30 days)"**
**"Auction final median: $245 (4 comps, includes ~15% auction premium)"**
**"BIN-equivalent recommended price: $190 (anchored to BIN comps; auction premium excluded)"**

Show the user both numbers and explain why they differ. That builds trust and helps them choose the right listing format.
