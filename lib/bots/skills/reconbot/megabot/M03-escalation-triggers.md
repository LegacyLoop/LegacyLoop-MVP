---
name: reconbot-megabot-escalation-triggers
description: >
  Defines when MegaBot must flag market anomalies and escalate to special output
  states. Covers price spike detection, comp data thinness thresholds by category,
  how to communicate data scarcity honestly to sellers, and the conditions under
  which all four agents disagreeing on market trend direction triggers a market
  uncertain flag.
when_to_use: "MegaBot scans only. ReconBot MegaBot lane."
version: 1.0.0
---

# ReconBot MegaBot Skill M03: Escalation Triggers
## When MegaBot Must Flag Market Anomalies and Communicate Uncertainty

---

## Purpose

Not every item has enough market data to support a confident competitive
analysis. Not every price signal is real. Not every category moves predictably.
This skill defines the conditions under which MegaBot must escalate its output
state — moving from a standard market intelligence report to an explicit
anomaly flag, a data scarcity warning, or a market uncertain declaration.

Escalation is not a failure state. It is an honest output. Sellers are better
served by a system that tells them the data is thin than by one that manufactures
false confidence from inadequate evidence.

---

## Price Spike Detection

A price spike is defined as a recent sale or active listing that is more than
40% above the trailing 90-day median for condition-matched comps in the same
category. Price spikes must be investigated before they are incorporated into
the competitive analysis. They are either a genuine demand signal or a data
artifact.

### Indicators of a Real Demand Spike

A real demand spike typically presents with multiple corroborating signals.
Multiple buyers competed for the item (auction with 5+ bidders). The spike
occurred on a platform known for authentic price discovery (major auction house,
LiveAuctioneers, Invaluable). The spiking item has a condition, provenance, or
completeness advantage over the comp set median. Gemini grounding reveals a
cultural or news event that plausibly explains the demand increase. Other items
in the same subcategory are also showing elevated results within the same
time window.

When two or more corroborating signals are present, the spike is treated as
a genuine demand event and the price band is adjusted upward with an explicit
notation of the spike and its probable cause.

### Indicators of a Manipulation or Artifact

A manipulation pattern presents differently. The spiking result is a single
sale with no competing bids. The seller has limited feedback or is newly
registered. The sold item has no condition advantage over the comp set.
No other items in the category show any movement. Gemini grounding finds no
external explanation for the price increase.

When a spike fails the corroboration test, it is flagged as a potential
artifact and excluded from the weighted price estimate. A notation is added
to the output explaining that an outlier result was detected and the reason
it was excluded.

A spike that cannot be confirmed as real and cannot be dismissed as an artifact
is classified as unresolved and flagged for manual review, with the unweighted
price range shown alongside the spike-excluded estimate.

---

## The 5-Comp Minimum Rule

MegaBot requires a minimum of five condition-matched, cleared-transaction comps
before it will produce a primary price estimate with standard confidence. This
rule exists because price averages derived from fewer than five data points
are statistically unstable. A single outlier result in a three-comp set can
move the average by 30%.

When the comp count is below five, MegaBot does not produce a primary estimate.
It produces a market scarcity report with a guidance range and an explicit
confidence downgrade.

The guidance range in a scarcity situation is constructed from the available
cleared comps plus two structural reference points: the floor established by
the lowest-condition sold comp and the ceiling established by the highest-quality
dealer asking price for a similar item. This range is wider than a standard
comp-derived estimate and is labeled accordingly.

---

## Category-Specific Comp Thresholds

Different categories require different comp depths before analysis reaches
acceptable confidence. The following thresholds represent the minimum cleared-
transaction comp count for standard confidence output.

### Antiques and Estate Items

Minimum 5 auction-grade cleared comps from recognized auction houses or
established antique dealer sold records. eBay sold results supplement but do
not substitute for auction-grade comps in this category. The 90-day window
applies. Items with provenance claims require comps from similarly provenanced
items; generic comps without provenance cannot anchor a provenanced item's value.

Sub-threshold behavior: guidance range with high uncertainty notation, explicit
recommendation to pursue professional appraisal before listing.

### Sports Cards and Trading Cards

Minimum 10 PSA or BGS graded sold comps at the same grade level, or 15 raw
sold comps with condition notes. Card values are highly grade-sensitive; a
PSA 8 and a PSA 9 of the same card are different markets. Comps must be
grade-matched. Population report data (total graded examples at each grade level)
is a required supplementary data point for all graded card analysis.

Sub-threshold behavior: guidance range with explicit grade-sensitivity warning,
notation of population data if available, recommendation to obtain professional
grading before listing if card is ungraded and condition is borderline.

### Vehicles

Minimum 8 private-party sold comps from verified completed sales. Dealer retail
asking prices are reference-only for vehicles and carry 40% of the weight of
private-party cleared transactions. The comp set must include at least 3 comps
within 200 miles of the seller's location because vehicle markets are regional
in a way that most collectible markets are not.

For classic and collector vehicles, auction results from Barrett-Jackson, Mecum,
or Bring a Trailer carry full weight. eBay Motors completed auctions carry
standard weight. Private-party asking prices on Craigslist or Facebook
Marketplace carry 30% weight and are used for floor estimation only.

Sub-threshold behavior: wide guidance range, strong emphasis on regional market
variation, recommendation to consult marque-specific specialists before pricing.

### Jewelry and Precious Metals

Minimum 5 comps from dealer sold records or auction results with comparable
metal content, stone quality, and maker attribution. For signed pieces
(Tiffany, Cartier, Verdura, etc.), all comps must be signed. For unsigned
pieces, signed-piece comps are excluded from the weighted estimate but may
be cited as ceiling references.

Metal spot price fluctuation must be noted. A comp from 90 days ago for a
gold piece may be materially different from today's value if gold has moved
significantly. Metal content estimates must be recalculated at current spot.

Sub-threshold behavior: base metal value floor provided, guidance range with
explicit notation of limited comparable sale evidence.

---

## Communicating Data Scarcity to Sellers

When comp data is insufficient to support a confident analysis, the language
used to communicate this to the seller must be direct, specific, and useful.

The following represents acceptable scarcity communication:

"The market for this item is thin. We found 3 sold comps in the past 90 days,
which is below the 5-comp threshold required for a confident price estimate.
Based on available data, the guidance range is $X to $Y, but this range carries
high uncertainty. We recommend waiting for additional market data before listing,
or consulting a specialist dealer in this category who may have access to private
sale records not visible in the public comp set."

The following represents unacceptable scarcity communication:

"Based on market analysis, this item is estimated at $X." (When the estimate
is based on fewer than 5 comps and this is not disclosed.)

Sellers who make pricing decisions based on thin data deserve to know the data
is thin. Obscuring data scarcity behind confident-sounding language produces
poor seller outcomes and undermines trust in the system.

---

## The Market Uncertain Flag

When all four MegaBot agents independently analyze the same comp data and
produce divergent conclusions about market trend direction — one agent seeing
upward momentum, another seeing stable conditions, a third seeing declining
demand, and the fourth seeing insufficient data to characterize trend direction —
the system must not manufacture a consensus that does not exist.

The market uncertain flag is triggered when:

- Three or more agents produce trend direction assessments that do not agree
- The range between the highest and lowest agent price estimates exceeds 50%
  of the median estimate (e.g., estimates of $400, $500, $600, $850 trigger
  the flag because $850 is more than 50% above the $550 median)
- Gemini grounding data contradicts the historical comp set on trend direction
  without providing enough recent data to replace it

When the market uncertain flag is triggered, the output must:

- Explicitly state that trend direction is unclear and the four analysis agents
  produced divergent assessments
- Report each agent's trend conclusion separately rather than averaging them
- Show the full price range across all four agents without compressing it
  to a false consensus range
- Provide the seller with the specific data gaps that are preventing consensus
  (insufficient recent comps, conflicting platform signals, etc.)
- Recommend specific actions to resolve uncertainty (wait for additional
  auction results, consult a specialist, have the item professionally appraised)

---

## Escalation Output States

MegaBot operates in three output states. Normal output is the default.
Escalation moves the system into one of two alternative states.

Standard State: Sufficient comp data, agents in reasonable agreement,
no anomalies detected. Full competitive intelligence report produced.

Anomaly State: Triggered by price spike detection or data manipulation patterns.
Full report produced with explicit anomaly flags and excluded comp notations.
Price estimate is shown with and without the anomalous data points.

Uncertain State: Triggered by sub-threshold comp counts or multi-agent trend
divergence. Guidance range replaces price estimate. Explicit uncertainty
disclosures replace confidence ratings. Actionable recommendations replace
strategic advice until uncertainty resolves.
