---
name: asking-price-presentation
description: How to present the asking price across different platforms. Round numbers vs .99 vs firm pricing. When to enable Best Offer.
when_to_use: Every ListBot scan generating listing prices across multiple platforms.
version: 1.0.0
---

# The Asking Price Is a Message, Not Just a Number

The price you list affects how buyers PERCEIVE the item. $2,200 and $2,199 communicate different things even though they're $1 apart. $1,995 communicates different things than $2,000. The presentation of the number matters as much as the number itself.

## The Round Number vs .99 Rule

**Round numbers** ($2,200, $1,500, $800) signal:
- Confidence
- Fair market pricing
- Professional seller
- Negotiable (but at your level)

**".99 prices"** ($2,199, $1,499, $799) signal:
- Retail/commercial pricing
- Algorithmic (eBay Best Match ranking slightly prefers .99 endings)
- Bargain-hunting appeal

**"Odd-round" prices** ($2,150, $1,450, $750) signal:
- Negotiation already baked in
- Precise market research
- Willing to haggle

## When to Use Each

### Use Round Numbers When:
- Item is high-value ($1,000+)
- You're targeting collectors or decorators
- Platform is Etsy, 1stDibs, Chairish, or forum marketplaces
- You want to signal "fair price, not a race to bottom"

### Use .99 Prices When:
- Item is mid-value ($50-$500)
- Platform is eBay (slight algorithmic advantage)
- You're targeting bargain hunters
- Item competes with similar listings at round numbers

### Use Odd-Round Prices When:
- Item is $500-$2,000
- You expect negotiation
- You want the buyer to feel they got a deal
- Platform is Facebook Marketplace or Craigslist (haggle cultures)

## Platform-Specific Price Conventions

### eBay (auction or Buy It Now)
- Buy It Now: use .99 endings (slight algorithmic boost)
- Auction: start low, set reserve (or no reserve for drama)
- Best Offer: enable for items $100+ with 15% negotiation floor

### Etsy
- Round numbers only — Etsy buyers distrust .99 pricing
- No Best Offer system — price is firm
- Include "OBO considered" in description for flexibility

### Facebook Marketplace
- Round numbers or odd-rounds
- Expect 10-20% negotiation below asking
- Mark "firm" if you truly won't negotiate (rare)

### Craigslist
- Round numbers preferred
- Always include price in title
- "OBO" in description if flexible

### 1stDibs / Chairish
- Round numbers in thousands ($2,400, $1,800)
- Never .99 endings (looks cheap)
- Professional price presentation mandatory

### Mercari
- .99 endings work
- Smart Pricing feature (auto-reduces over time) is algorithmic advantage
- Enable Offer button

## The "Best Offer" Psychology

Enable Best Offer (eBay) or OBO (other platforms) when:
- Item is $100+ (not worth negotiating on cheap items)
- You have a clear floor price in mind
- You're willing to respond to offers quickly (within 24 hours)
- You want maximum reach (enabling offers boosts eBay search visibility)

Don't enable Best Offer when:
- Item is rare and buyers would pay full price
- You're not available to respond to offers
- The price is already at market floor

## The Floor Price Rule

ALWAYS have a private floor price in mind before listing. The asking price should be 10-25% ABOVE your floor, giving you room to negotiate.

**Example:**
- Floor price: $1,800 (your true minimum)
- Asking price: $2,200 (floor × 1.22)
- Best Offer floor: $1,900 (floor + $100 buffer for negotiation drama)

If a buyer offers $1,800 directly, you can accept knowing you hit your floor. If they offer $1,950, you counter at $2,050 and split the difference.

## The Negotiation Room Formula

| Asking Strategy | Floor Multiplier | Expected Close |
|---|---|---|
| Firm pricing | Floor × 1.0 | At asking |
| Mild negotiation | Floor × 1.10 | 5-10% below |
| Standard negotiation | Floor × 1.20 | 10-15% below |
| Aggressive negotiation | Floor × 1.30 | 15-25% below |

Most LegacyLoop sellers should use **standard negotiation (Floor × 1.20)** for most items. Firm pricing only works for rare items with proven demand.

## The "Priced to Sell" Trap

AVOID phrases like "priced to sell" or "below market value." These:
- Invite lowballs ("if it's below market, it's still too high")
- Signal desperation
- Attract bargain hunters not fair-value buyers
- Undermine your own pricing

Price fairly and let the number speak.

## Output Format

For every listing, populate platform-specific pricing with strategy notes:

```json
{
  "pricing_strategy_per_platform": {
    "ebay": {
      "asking": 2199,
      "best_offer_floor": 1900,
      "strategy": "Buy It Now with Best Offer enabled"
    },
    "etsy": {
      "asking": 2400,
      "strategy": "Round number, no OBO, premium pricing for decorator buyers"
    },
    "facebook_marketplace": {
      "asking": 2000,
      "firm": false,
      "strategy": "Odd-round for local negotiation, expect $1800 close"
    },
    "craigslist": {
      "asking": 2000,
      "firm": false,
      "strategy": "Cash only, expect 10-15% negotiation"
    }
  }
}
```

Each platform gets its own price to match its convention. Don't list $2,199 on Etsy or $2,400 on Facebook.
