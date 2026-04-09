---
name: reconbot-megabot-competitive-intel-confidence-amplifier
description: >
  Defines how four AI agents validate competitive positioning in MegaBot and
  how confidence is amplified or reduced based on comp data quality, agent
  agreement, recency decay, and market velocity signals. Covers tier weighting,
  cross-agent consensus rules, contradiction handling, and the role of days-to-sell
  and bid count in modifying the final confidence score.
when_to_use: "MegaBot scans only. ReconBot MegaBot lane."
version: 1.0.0
---

# ReconBot MegaBot Skill M04: Competitive Intelligence Confidence Amplifier
## How Four Agents Validate and Calibrate Confidence in Competitive Positioning

---

## Purpose

Confidence in a market intelligence output is not binary. It exists on a
spectrum, and the position on that spectrum must be explicitly earned through
the quality, quantity, recency, and internal consistency of the underlying
comp data. This skill defines how MegaBot constructs, amplifies, and reduces
confidence scores based on the full competitive data picture assembled by
four agents working in parallel.

When the system's confidence is high, it says so — and it explains why. When
confidence is degraded, it reports the degradation and the specific cause.
Sellers deserve an honest accounting of how much weight to place on the system's
conclusions.

---

## Comp Data Quality Tiers

Not all comp data earns equal confidence weight. MegaBot uses a four-tier
quality classification that applies to every individual comp in the data set
before it is incorporated into the confidence calculation.

### Tier 1: Auction House Cleared Results

Auction results from recognized auction houses — LiveAuctioneers, Invaluable,
Christie's, Sotheby's, Heritage Auctions, Rago, Skinner, Freeman's, Bonhams,
and Bring a Trailer for vehicles — represent the highest-quality comp inputs.
These results reflect competitive bidding among authenticated buyers with
demonstrated purchase capacity. The auction house has typically vetted the item,
provided expert attribution, and accepted responsibility for the accuracy of the
description. Tier 1 comps carry a base confidence weight of 1.00.

### Tier 2: Dealer Sold Records

Sold records from established specialty dealers on platforms like Ruby Lane and
1stDibs, or from dealer websites with documented sold galleries, represent
expert-priced transactions that cleared in a buyer-facing retail environment.
The dealer's pricing reflects professional expertise and authentication. Tier 2
comps carry a base confidence weight of 0.80.

### Tier 3: eBay Sold Listings

Completed eBay sold listings represent the broadest available market data set.
They reflect real transactions at real prices across the full range of buyer
sophistication. They do not reflect professional authentication or expert
pricing. Condition representation varies widely. Tier 3 comps carry a base
confidence weight of 0.65 for auction-format results and 0.55 for buy-it-now
results.

### Tier 4: Active Asking Prices and Peer-to-Peer Listings

Active listings on any platform have not cleared the market. They represent
seller expectations. Peer-to-peer listings on Craigslist, Facebook Marketplace,
and similar platforms have no validation mechanism. Tier 4 data carries a base
confidence weight of 0.30 and is used for range bounding only, never for
median estimation.

---

## Cross-Agent Consensus: The Amplification Mechanism

When four agents pulling from different platform sets independently arrive at
overlapping price ranges, that agreement is itself evidence of market validity.
The more independent the data sources that converge on the same conclusion,
the narrower the appropriate price band and the higher the justified confidence.

### Full Consensus: All Four Agents Agree

When all four agents produce price ranges that overlap at the midpoint — meaning
the midpoint of each agent's range falls within the other agents' ranges — the
system applies a consensus amplifier of 1.25 to the base confidence score.
The price band narrows to the interquartile range of the four midpoints. This
is the highest confidence state the system can achieve.

Full consensus is meaningful precisely because it is rare. Four agents drawing
from independent data sources — auction results, dealer records, eBay comps,
and live Gemini grounding — are unlikely to agree by accident. When they do
agree, the market is sending a clear signal.

### Partial Consensus: Three of Four Agents Agree

When three agents produce overlapping ranges and the fourth produces a range
that does not overlap with the majority, the dissenting agent's range is
preserved as a notation but is not included in the primary estimate. The system
applies a mild consensus amplifier of 1.10 to the base confidence score. The
dissenting range is noted with an explanation of which data source it represents
and why it may differ.

Common causes of single-agent dissent include platform-specific demand
concentration (an item that has strong demand on 1stDibs but weak eBay demand
will produce a Tier 2 agent that is high and a Tier 3 agent that is low),
recency differences (one agent's data is significantly older than the others),
or category-specific condition sensitivity that one agent captured and others did not.

### No Consensus: Agents in Disagreement

When fewer than three agents produce overlapping ranges, the confidence amplifier
is removed and a confidence penalty of 0.75 is applied to the base score. The
system reports all four ranges individually. The output enters a wide-band
state with explicit notation that agent disagreement prevents a narrow consensus.

No-consensus states should be investigated before reporting rather than
mechanically reported. The system should identify why agents disagreed and
whether the disagreement reflects genuine market ambiguity or a data artifact
that can be resolved.

---

## The Recency Decay Formula Applied to Confidence

Confidence degrades as comp data ages. The decay formula works as follows.

The freshness-adjusted confidence score is the base confidence score multiplied
by the weighted average freshness factor of the comp set. The freshness factor
for each comp is derived from the decay schedule defined in M02.

When the weighted average freshness factor for the full comp set falls below
0.60, the confidence score is additionally penalized by 0.85 to reflect the
systemic staleness of the data. When it falls below 0.40, the penalty is 0.70.

The practical effect: a confidence score of 0.80 derived from comps averaging
75 days old (freshness factor approximately 0.65) produces a freshness-adjusted
confidence of 0.80 multiplied by 0.65, then multiplied by 0.85 for falling below
the 0.60 threshold, yielding an adjusted confidence of approximately 0.44. This
is reported as a low-confidence output, not a high-confidence one.

---

## Market Velocity as a Confidence Modifier

Market velocity — how quickly items in this category are selling, as measured
by days-to-sell, bid count on auction results, and view count on platform
listings — modifies confidence in two directions.

### High Velocity: Confidence Amplification

A category where comparable items are clearing in fewer than 14 days on eBay,
attracting 7 or more bids per auction on LiveAuctioneers, and generating more
than 40 watchers per active listing is a high-velocity market. In a high-velocity
market, even moderately recent comps remain highly informative because the
market is actively clearing and price discovery is continuous.

High-velocity confirmation adds a market activity amplifier of 1.15 to the
confidence score. The output notes that the category shows strong buyer activity
and that comps remain relevant despite their age.

### Low Velocity: Confidence Reduction

A category where comparable items have been listed for more than 60 days without
clearing, are attracting fewer than 5 watchers per listing, and show auction
results with 2 or fewer bidders is a low-velocity market. In a low-velocity
market, price estimates carry inherently lower confidence because the market is
not producing frequent price discovery events. Each comp may be the result of
unusual circumstances rather than representative market conditions.

Low-velocity detection applies a market activity penalty of 0.85 to the
confidence score. The output notes that the category shows limited buyer activity
and that sellers should expect longer time-to-sale at standard pricing.

---

## Days-to-Sell as a Confidence Modifier

Days-to-sell is distinct from market velocity in that it measures a single
dimension of market behavior: how long a successfully sold item was listed before
it cleared. This metric is most useful when the comp set includes listing date
and sale date for individual comps.

When the average days-to-sell across the comp set is under 14 days, the price
estimate is reinforced by time-to-sale confidence: buyers are not waiting for
price reductions, which means the market-clearing price is close to the listing
price.

When the average days-to-sell exceeds 45 days, the comp prices likely reflect
the final accepted price after one or more reductions from the original listing
price. This means the comp prices may understate the seller's initial ask and
overstate the market's resistance. In this scenario, the recommended listing
price should be set 10-15% above the comp median to allow room for negotiation
to the true market-clearing price.

---

## Bid Count as a Confidence Modifier

For auction-format comps, bid count is a direct measure of competitive demand.
The following bid count thresholds modify comp weight and confidence:

- 1 bid: the item sold at reserve or floor. This is a weakly validated price.
  Weight reduced to 0.50 of base tier weight.
- 2 to 4 bids: modest competition. Standard tier weight applies.
- 5 to 9 bids: meaningful competition. Weight increased to 1.15 of base tier weight.
- 10 or more bids: strong competition. Weight increased to 1.30 of base tier weight.
  This comp receives Tier 1 treatment regardless of original platform classification
  if the platform is recognized and the sale was authenticated.

---

## Reporting Confidence Scores

Every MegaBot competitive intelligence output must include an explicit confidence
score. The score is expressed as a percentage and accompanied by a plain-language
explanation of the three factors that most significantly influenced it: comp
quality tier distribution, agent consensus level, and freshness-adjusted comp
recency.

The confidence score is not a prediction of sale success. It is a measure of
how well the available market data supports the price range and competitive
assessment in the output. A 90% confidence score means the data is strong,
recent, and internally consistent. A 45% confidence score means the seller
should treat the output as directional guidance rather than validated market
intelligence and should seek additional data before making final pricing decisions.
