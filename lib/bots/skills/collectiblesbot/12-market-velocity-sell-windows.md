---
name: market-velocity-sell-windows
description: When to grade, when to sell, when to hold. The grading ROI math. Time-to-liquidity by category. Seasonal sell windows (card shows, Goldin Elite auctions, holiday toy demand, auction season for watches). How to tell a cresting wave from a durable climb.
when_to_use: Every CollectiblesBot scan produces a grading_recommendation and a selling_strategy. Pack 12 is the decision framework behind both.
version: 1.0.0
---

# Market Velocity — Knowing When To Act

A great collectible sold at the wrong time loses money. A mediocre collectible sold at the right time beats its ceiling. Timing matters as much as grade in the collector market. This pack teaches the three timing frameworks: grading ROI, liquidity windows, and market wave detection.

## The Grading ROI Formula

Before recommending grading, run the math:

```
Expected Grade Premium = (Estimated Graded Value × P_grade)
                       - (Raw Value × (1 - P_grade))
                       - Grading Cost
                       - Opportunity Cost of Time
                       - Risk of Lower Grade Than Expected

Grade IF: Expected Grade Premium > Raw Value × 0.25
```

Plain English: grade only if the expected uplift AFTER costs and risks is at least 25 percent of the raw value.

Typical grading costs (2026 rates):
- **PSA Value Service** ($25/card, 6+ months turnaround)
- **PSA Regular** ($50/card, 3 months)
- **PSA Express** ($150/card, 2 weeks)
- **CGC comics value** ($22, 4+ months)
- **CGC comics modern** ($36, 2 months)
- **PCGS coins** ($20-50 depending on value tier)
- **WATA video games** ($75-200 depending on tier)
- **AFA toys** ($50-300 depending on size)

For cards under $150 raw: grading is usually net-negative unless you are confident of PSA 10.

For cards $150-$500 raw: grade if you are confident of PSA 9+.

For cards over $500 raw: grading is usually ROI-positive at PSA 8+.

## The Grade Probability Estimate

Before running ROI, estimate P_grade honestly. If the card is going for PSA 10 and you are 70 percent confident, P(PSA 10) = 0.7. But P(PSA 10) is multiplied by grade-specific probability:
- "90 percent confident it's a 9 or 10, but 50/50 on which" → P(PSA 10) = 0.45, P(PSA 9) = 0.45, P(PSA 8) = 0.10
- "Confident 8 or 9, possible 10 on a lucky day" → P(PSA 10) = 0.15, P(PSA 9) = 0.55, P(PSA 8) = 0.30

Then compute expected value:
```
EV = P(10) × Value(10) + P(9) × Value(9) + P(8) × Value(8) - Grading Cost
```

If EV > Raw Value, grade. Otherwise sell raw.

## Time To Liquidity By Category

Different categories sell at different speeds. Liquidity affects both urgency and pricing strategy:

| Category | Fast (days) | Medium (weeks) | Slow (months) |
|---|---|---|---|
| Sports cards (modern) | StockX Trading Cards, eBay Fixed | eBay Auction | PWCC 60-day listings |
| Sports cards (vintage) | — | Goldin, Heritage weekly | Goldin Elite, Heritage Spring/Fall |
| Trading cards (Pokemon) | TCGPlayer, eBay | — | — |
| Comics (modern) | eBay | MyComicShop | — |
| Comics (key issues) | — | ComicConnect, Heritage | Heritage Signature |
| Coins (bullion-tier) | APMEX, dealer | — | — |
| Coins (collector) | — | GreatCollections | Heritage, Stack's Bowers |
| Watches (popular refs) | Chrono24, Bob's Watches | — | Phillips, Christie's |
| Watches (rare/vintage) | — | — | Phillips, Christie's seasonal |
| Sneakers (hyped) | StockX (48 hours) | GOAT, Flight Club | — |
| Sneakers (grails) | — | StockX premium | Sotheby's luxury |
| Rare books | — | AbeBooks, Biblio | Heritage, Sotheby's, PBA |
| Jewelry | 1stDibs dealer | — | Heritage, Sotheby's |

A seller who needs cash in 7 days should not be consigning a vintage watch to Phillips (6-month timeline). Route to Bob's Watches or Chrono24 Trusted Seller for fast liquidity, even at a 10-15 percent discount.

## Seasonal Sell Windows

Some categories have dramatic seasonal cycles:

- **Sports cards**: peak demand at Spring Training and Opening Day (February-April) for baseball, August for football, October for basketball. Key shows: National Sports Collectors Convention (late July), local card shows (weekly).
- **Comics**: stable year-round but peak at San Diego Comic-Con (July) and around major MCU/DC releases.
- **Coins**: peak demand around tax refund season (February-April) and year-end (November-December for gift buyers).
- **Watches**: spring auction season (March-June at Phillips, Christie's, Sotheby's) and Geneva Watches Days (September) are peak consignment windows.
- **Toys / Video games**: November-December holiday buying season, secondary peak around Free Comic Book Day (May).
- **Sneakers**: stable year-round, minor peaks around back-to-school (August) and holiday (November-December).
- **Books**: no strong seasonality; specialty book fairs throughout the year.

For items with seasonal sensitivity, mention the window in `selling_strategy.timing`.

## The Wave Detection Framework

Collectibles prices move in waves. Distinguishing a wave from a durable climb is the art of market reading.

**Signs of a cresting wave (sell now):**
- Prices up 50 percent+ in 6 months
- New entry buyers (TikTok, influencer-driven demand)
- "Can't miss" narrative circulating in the niche
- Historic high seen in comparable data
- Production volume increasing (for modern)

**Signs of a durable climb (hold):**
- 5-15 percent annual appreciation over 5+ years
- Established collector base (not new speculators)
- Limited supply with no new production
- Secular trend (aging wealthy collectors, nostalgia cycles)
- Auction results expanding into higher tiers

**Signs of a cooling market (wait or discount):**
- Median sold prices declining for 3+ months
- Auction listings pulling back to low estimate
- Subreddit / collector forum sentiment negative
- Cross-category cooling (overall card market, overall watch market)

In 2026: sports cards are ~18 months into a cool-down from the 2022 peak. Vintage watches are stable. Pokemon WOTC Base Set is still climbing. Modern video games (WATA graded) are volatile — down 40 percent from 2021 peak but rebounding.

## The Hold vs Sell Decision

For each item, compute:
```
Expected 12-month appreciation (AI-estimated) = A
Opportunity cost of capital (seller-specific) = O
Grading and selling frictions (cost tier) = F

SELL IF: A < O + F
HOLD IF: A > O + F × 1.5
WAIT AND RE-EVALUATE IF: within the margin
```

For a typical estate seller: O ≈ 5-8 percent annual. F ≈ 15-25 percent. So SELL IF appreciation is below 20-33 percent expected over 12 months. HOLD only if you are confident in 30 percent+ appreciation.

## Output

In `grading_recommendation`, apply the ROI formula and state the expected EV calculation. In `investment.verdict`, state one of: Sell Now, Grade and Sell, Hold Short-Term (3-6 mo), Hold Long-Term (12+ mo). In `selling_strategy.timing`, name the specific window or "No seasonal sensitivity — list immediately."
