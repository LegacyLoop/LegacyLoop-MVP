---
name: reconbot-megabot-cross-market-intel-weighting
description: >
  Defines real-time versus historical data weighting for MegaBot competitive
  intelligence. Covers eBay sold/active/auction/retail calibration, comp age
  decay, platform-specific demand signal interpretation, artificial price
  inflation detection, and when live Gemini grounding overrides cached ScraperComp
  data.
when_to_use: "MegaBot scans only. ReconBot MegaBot lane."
version: 1.0.0
---

# ReconBot MegaBot Skill M02: Cross-Market Intelligence Weighting
## Real-Time vs Historical Data Calibration for Competitive Intelligence

---

## Purpose

Not all market data is created equal. A comp from three days ago and a comp
from ninety days ago are both technically "recent" by many systems' standards.
They are not equivalent intelligence inputs. This skill defines how MegaBot
weights competitive data across time, platform, and transaction type to produce
a market intelligence output that reflects current reality rather than
historical average.

---

## The Core Weighting Problem

Most AI systems treat comp data as flat. They find ten sold listings, average
the prices, and report the result. This approach has a fundamental flaw: it
weights a 90-day-old sale at the same confidence level as a 3-day-old sale,
treats an eBay buy-it-now as equivalent to an auction result with 12 bidders,
and ignores the fact that some platforms systematically produce inflated or
deflated prices due to their buyer and seller composition.

MegaBot's cross-market weighting system addresses each of these problems with
explicit, auditable rules that can be inspected and explained to a seller when
the output is generated.

---

## eBay Transaction Type Calibration

eBay is the single largest source of comp data for most categories, but eBay
transactions are not uniform. Four distinct transaction types produce meaningfully
different market signals.

### eBay Sold — Auction Format with Multiple Bidders

This is the highest-quality eBay comp. An auction that attracted multiple bidders
represents competitive price discovery. The final price reflects at least two
buyers who wanted the item and outbid each other to get it. For categories with
thin markets (fewer than 20 sold comps in 90 days), an auction with 5 or more
bidders carries 1.5x the weight of a buy-it-now sold listing.

Auction results with zero or one bid carry standard weight. A no-reserve auction
that cleared with zero competing bids may have sold below market due to low
visibility or poor timing, not due to weak demand.

### eBay Sold — Buy-It-Now Format

A buy-it-now sale represents one buyer's decision at one seller's stated price.
It is a valid cleared transaction and a legitimate comp, but it does not
demonstrate competitive demand. It demonstrates that one buyer found the price
acceptable. This is meaningful but weaker than an auction result with competitive
bidding. Standard weight applies.

### eBay Active Listings

Active listings represent seller aspiration. They have not cleared the market.
An active listing at a given price is evidence that a seller believes the market
will bear that price. It is not evidence that the market has validated it.

Active listings should be used for two purposes only: establishing the current
competitive supply landscape, and identifying the ceiling of seller expectations.
They should never be used to anchor a price estimate. When active listings are
significantly above recent sold comps, that gap is a signal worth flagging to
the seller.

### eBay Auction — Currently Running

A live auction with active bidding and more than 12 hours remaining is a weak
forward-looking signal. The current bid does not represent the final clearing
price. Live auction data should be noted but not incorporated into comp weighting
until the auction has closed.

---

## Platform-Specific Demand Signal Interpretation

Each platform produces demand signals unique to its buyer composition and
search mechanics. These signals must be interpreted in context.

### eBay Watch Count

The eBay watch count measures expressed interest, not purchase intent. A listing
with 47 watchers and zero bids may indicate high curiosity and low buyer
confidence — possibly due to condition questions, a high price, or a seller
with limited feedback. Watch count is useful as a demand indicator when
correlated with bid count. High watches, zero bids: investigate why buyers are
watching but not committing. High watches, high bids: strong demand confirmation.

A watch-to-bid ratio above 8:1 should be flagged as a potential demand hesitation
signal.

### 1stDibs Save Count

1stDibs save counts indicate collector interest at the dealer retail tier. Because
1stDibs buyers are typically serious collectors or interior designers with
purchase authority, a high save count on a comparable item suggests genuine
category demand from buyers with means. However, 1stDibs buyer conversion rates
are low relative to save counts because buyers often use saves as reference
collections rather than purchase queues.

A 1stDibs save count above 25 on a comparable item is a meaningful demand signal.
Below 10 provides limited information.

### LiveAuctioneers and Invaluable Bid Count

Auction bid counts are the strongest platform-native demand signal available.
A result with 15 bidders represents 15 independent buyers who valued the item
highly enough to register and commit funds. This is competitive market clearing
in its purest form.

Bid count context matters by category. A vintage toy auction with 3 bidders
in a thin specialist category may represent the entire active buyer pool for
that item. A piece of American folk art with 3 bidders may indicate weak demand
for that specific piece despite strong category activity. Always compare bid
count against category norms.

---

## The Freshness Decay Curve

Comp data loses informational value as it ages. The rate of decay varies by
category. A sold comp for a limited-edition sneaker may be essentially worthless
after 30 days because that market moves in weeks. A sold comp for a Victorian
walnut secretary desk may remain highly relevant for 24 months because that
market moves slowly.

MegaBot applies the following default decay schedule, adjustable by category
volatility rating:

- 0 to 7 days: full weight (1.0)
- 8 to 30 days: 0.90 weight
- 31 to 60 days: 0.75 weight
- 61 to 90 days: 0.60 weight
- 91 to 180 days: 0.40 weight
- 181 to 365 days: 0.20 weight
- Over 365 days: reference only, not included in active weighting

For high-velocity categories (electronics, current-production collectibles,
sports cards of active players), the decay curve compresses by 50%. For
slow-moving categories (estate jewelry, period furniture, institutional-grade
antiques), the curve extends by 25%.

---

## Detecting Artificial Price Inflation in Comp Data

Three patterns in comp data indicate artificial inflation that must be filtered
before weighting.

### Relisting at Escalating Prices

An item that reappears in comp data across multiple listing cycles at
progressively higher prices without ever clearing is a manufactured comp.
Sellers sometimes relist at higher prices to create the appearance of market
appreciation. When the same item (identifiable by photo match, seller ID, or
description similarity) appears in the comp set more than once without a
confirmed sale between listings, only the lowest-priced listing should be
included in weighting, and a note should be added to the output.

### Shill Bidding Signatures

Shill bidding produces a recognizable pattern in auction data: a result where
the winning bid is very close to the next-highest bid, the underbidder has a
very short feedback history, and the seller's other items show similar patterns.
MegaBot cannot confirm shill bidding, but it can flag auction results where the
bid pattern is anomalous and reduce that comp's weight accordingly.

Specific indicators: top two bids within 2% of each other, underbidder with
fewer than 10 feedback score, seller with multiple similar items sold in the
same auction session to similar underbidders.

### Price-Fixing Clusters

When multiple dealers on Ruby Lane or 1stDibs list nearly identical items at
nearly identical prices within a short time window, it may reflect coordinated
pricing among dealers who communicate in trade networks. This creates an
artificial price floor in the comp data that does not reflect what an
independent seller can achieve. When three or more dealer listings cluster
within 5% of a common price with no cleared transactions in that range,
the cluster should be weighted as one data point, not three.

---

## When Gemini Grounding Overrides Cached ScraperComp Data

Gemini real-time grounding data takes priority over cached ScraperComp data
in four specific scenarios.

First, when Gemini detects that a major comparable item has sold within the
past 72 hours at a price that differs from the ScraperComp median by more than
20%, the Gemini result supersedes the cached median and becomes the new anchor.
The ScraperComp data is retained as historical context.

Second, when Gemini detects a supply surge — three or more new competing listings
in the same category within 48 hours — that supply increase must be reflected
in the competitive analysis even if the ScraperComp data shows healthy demand.
New supply arriving at lower prices resets the competitive landscape in real time.

Third, when Gemini surfaces a news or cultural event that is driving demand in
a specific category — a television appearance, a deceased celebrity estate sale,
a viral social media post featuring a specific maker — that context overrides
historical baseline demand signals for the duration of the trend. Historical
comps from before the event are downweighted until the trend normalizes.

Fourth, when cached ScraperComp data is more than 30 days old and Gemini
grounding is producing active current results, Gemini becomes the primary
signal source and ScraperComp data drops to a reference tier.

---

## Calibration Output Requirements

When this skill is active, every competitive intelligence output must include:

- For each comp: transaction type, platform, days since sale, applied weight
- Overall data freshness score for the comp set (weighted average age)
- Identification of any comps excluded due to artificial inflation patterns
- Platform demand signal summary (watch counts, bid counts, save counts where available)
- Notation of which data segments were sourced from live Gemini grounding
  versus cached ScraperComp data
- Decay-adjusted price range showing the difference between raw average
  and freshness-weighted estimate when they diverge by more than 10%
