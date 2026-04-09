---
name: buyer-premium-net-math
description: The arithmetic of auction fees. Buyer's premium, seller's commission, insurance, photography, shipping, and sales tax add up to 25-40 percent friction between hammer price and what the seller puts in their bank. This pack teaches the net-to-seller math at each venue tier.
when_to_use: Every AntiqueBot scan where a specific venue is recommended. Populates valuation.fair_market_value, dealer_buy_price, and selling_strategy.venue_options with honest net math.
version: 1.0.0
---

# Buyer Premium Net Math — What The Seller Actually Gets

Auction pricing is riddled with fees that estate sellers routinely miss. A "great auction result" of $10,000 hammer becomes $6,800 in the seller's bank by the time insurance, commission, photography, shipping, and sales tax settle. Sellers who do not understand this math are disappointed, angry, or feel cheated. AntiqueBot's job is to do the arithmetic honestly up front and surface the net number the seller will actually see.

## The Two-Sided Fee Structure

Auction houses charge BOTH the buyer and the seller. These are two separate fees on the same transaction.

**Buyer's premium** — added to the hammer price, paid by the buyer on top of the hammer. Does not affect the seller directly, but it affects bidding behavior (bidders bid lower on pieces with higher BP to keep the total the same).

**Seller's commission** — deducted from the hammer price, paid by the seller. This is the direct seller cost.

## Buyer Premium By Venue Tier

| Venue | Buyer's Premium |
|---|---|
| Christie's, Sotheby's (top lots) | 26-28% on first tranche, stepping down on high-value lots |
| Christie's, Sotheby's (standard) | 26% on items under approximately $1M |
| Bonhams | 27.5% on items under $250k |
| Phillips | 27-28% |
| Skinner / Hindman / Doyle / Heritage | 25-28% |
| Freeman's | 25-28% |
| Regional houses (Pook, Brunk, Evans, Garth's) | 18-25% |
| LiveAuctioneers third-party | plus 3-5% internet surcharge on top of house BP |
| Invaluable third-party | plus 3-5% internet surcharge on top of house BP |

## Seller Commission By Venue Tier

Negotiable at top tier, fixed at regional. Typical rates:

| Venue | Seller Commission | Notes |
|---|---|---|
| Christie's / Sotheby's | 0-15% | Negotiable, 0% on blue-chip consignments, 10-15% standard |
| Mid tier specialists | 10-20% | Negotiable, higher on lower-value |
| Regional houses | 15-25% | Usually fixed, rarely negotiated |
| Online direct (eBay) | 13.25% + listing fees | Post-2023 eBay managed payments |
| 1stDibs | 15-50% depending on membership tier | |
| Ruby Lane | 9.9% + fixed monthly fee | |

## Hidden Fees

Beyond commission, expect:

- **Insurance (in-transit and in-gallery)** — 1-1.5% of hammer value. Sometimes waived on high-value consignments at top tier.
- **Photography / cataloging** — $50-$500 per lot at top tier, often free at regional houses but rolled into commission.
- **Marketing / catalog inclusion** — usually bundled, sometimes a la carte for premium lots.
- **Unsold lot fee** — if the lot does not meet reserve, 5-10% of low estimate at some houses.
- **Shipping / packing** — 2-5% of hammer, highly category-dependent (large furniture is expensive to ship).
- **Storage** — if the house holds the piece between consignment and sale, sometimes $1-$5 per day.
- **Sales tax on buyer's side** — does not affect seller but affects buyer's total invoice and thus bidding behavior.

## The Net-To-Seller Formula

For a top tier consignment:

```
Hammer             = 10,000
- Seller commission 10%  = -1,000
- Insurance 1%           = -100
- Photography            = -150
- Shipping to house      = -200
───────────────────────────────
Seller net         =  8,550
```

That is an 85.5% retention on top tier. Mid tier drops to about 78-82%. Regional is 72-78%. Online direct can retain 85-90% but loses the specialist audience.

## The Buyer Side (For Context Only)

The buyer writes a check that is much bigger than the hammer:

```
Hammer                  = 10,000
+ Buyer's premium 26%   = + 2,600
+ Sales tax 7%          = +   882  (applied to hammer + BP)
+ Shipping to buyer     = +   250
─────────────────────────────────
Buyer total check       =  13,732
```

Why does this matter to the seller? Because bidders bid against the total check they will write. A bidder with $10,000 to spend will stop bidding at $7,800 hammer (because $7,800 + 26% BP + tax + shipping ≈ $10,000). Higher buyer premiums suppress hammer prices.

## The Dealer Buy-Back Math

When AntiqueBot populates valuation.dealer_buy_price, use this rule: dealer buy price is typically 40-60 percent of the auction hammer low estimate. Dealers must mark up 2-3x to retail, cover overhead, and take inventory risk. A piece that hammers at $10,000 auction will get a dealer offer of $4,000-$6,000 on buy-back. The seller gets cash faster but loses 30-50 percent of auction net.

## Output

Populate valuation.fair_market_value (auction hammer range). Populate valuation.dealer_buy_price (40-60% of FMV low). Populate valuation.auction_estimate with realistic hammer range (NOT the seller net — hammer is what the industry quotes). In selling_strategy.venue_options, each venue's expected_return field must be NET TO SELLER after all fees, not gross hammer. In valuation.valuation_methodology, show the net math explicitly so the seller understands what they will see in their bank.
