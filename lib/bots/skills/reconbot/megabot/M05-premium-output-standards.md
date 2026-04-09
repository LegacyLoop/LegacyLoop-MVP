---
name: reconbot-megabot-premium-output-standards
description: >
  Defines what a professional market intelligence report looks like in the
  MegaBot ReconBot lane. Specifies the exact structure of a premium scan output,
  language standards for data-driven seller communication, and the distinction
  between generic AI market analysis and specialist competitive intelligence.
when_to_use: "MegaBot scans only. ReconBot MegaBot lane."
version: 1.0.0
---

# ReconBot MegaBot Skill M05: Premium Output Standards
## What a Professional Market Intelligence Report Looks Like

---

## Purpose

A competitive intelligence system is only as valuable as the quality of its
output. A technically sophisticated analysis communicated poorly is nearly
worthless to a seller who needs to make a real pricing decision in the next
24 hours. This skill defines the exact structure, language standards, and
content requirements for a premium MegaBot ReconBot output — the format that
sellers and investors trust because it is specific, honest, and actionable.

---

## The Structural Anatomy of a Premium MegaBot ReconBot Report

Every premium output contains the following sections in the following order.
Sections may not be omitted unless there is an explicit data reason (for
example, the sold tracker section requires sold comp data; if no sold comps
exist, the section is replaced with a data scarcity notation, not silently
omitted).

---

### Section 1: Scan Summary

One paragraph. Identifies the item, the scan date, the number of platforms
covered, the total comp count, the comp quality tier distribution, and the
overall data freshness rating. Ends with the confidence score.

The scan summary is the first thing a seller reads. It must give them an
accurate expectation of how much weight to place on the rest of the report
before they read a single data point.

Example of acceptable scan summary language:
"This competitive scan analyzed [item description] across 6 platforms including
LiveAuctioneers, Ruby Lane, 1stDibs, eBay, ShopGoodwill, and live Gemini
grounding data. We identified 14 cleared-transaction comps: 4 Tier 1 auction
results, 3 Tier 2 dealer sold records, and 7 Tier 3 eBay sold listings. Comp
ages range from 4 to 87 days, with a freshness-adjusted score of 0.72. The
four-agent analysis produced partial consensus (3 of 4 agents in agreement).
Overall confidence: 74%."

---

### Section 2: Competitor Listings

A structured table of current active competing listings. Each entry includes:
platform, seller type (dealer, private, institution), asking price, condition
description as stated, days currently listed, and a brief one-line analysis
of competitive relevance.

The competitor listings section establishes the supply side of the competitive
landscape. Sellers need to know exactly what they are competing against before
they set a price and choose a platform.

Entries are sorted by competitive relevance to the seller's item, not by price.
A listing that is a close condition match and recently posted is more relevant
than a listing at a similar price but with superior condition or recent price
reductions.

---

### Section 3: Price Intelligence

The core pricing output. Includes three values: median cleared-transaction
price (freshness-weighted across all tiers), low-end range anchor
(10th percentile of comp set), and high-end range anchor (90th percentile).
Accompanied by a trend line: upward, stable, or declining, with the time
period over which the trend is measured.

The price intelligence section must distinguish between the clearing price
(what items actually sell for) and the asking price landscape (what sellers
hope for). These two numbers are frequently different, and sellers who confuse
them set prices that do not clear.

---

### Section 4: Market Dynamics

Three measurements: demand level (high/moderate/low with supporting evidence),
supply level (tight/balanced/oversupplied with current active listing count),
and velocity (fast-moving/normal/slow-moving with average days-to-sell). These
three measurements in combination produce a market position characterization.

High demand and tight supply is a seller's market. Price at the high end of
the range and expect competitive buyer behavior. High demand and oversupply
is a competitive market. Price at the median and differentiate on condition
and listing quality. Low demand regardless of supply is a patient seller's
market. Price accurately, list on the right platform, and allow adequate time.

---

### Section 5: Platform Breakdown

A per-platform summary of what was found on each platform scanned. Includes
comp count per platform, price range per platform, and platform-specific
demand signal metrics (eBay watch count average, 1stDibs save count,
auction bid count average). Identifies which platform produced the most
relevant comps for this specific item and why.

The platform breakdown tells sellers where their buyers are concentrated.
An item with 11 of its 14 comps on eBay and 2 on Ruby Lane is likely an
eBay item. An item with its highest prices and strongest demand signals on
Invaluable belongs in an auction room.

---

### Section 6: Alerts

Structured alert list with three categories. Underpriced alerts identify items
in the current supply that are priced significantly below the comp median and
represent immediate competitive context — if a close match exists at 60% of
the comp median, the seller must know before setting their own price. Overpriced
alerts identify relisted, slow-moving items that are anchoring seller
expectations unrealistically high. New comp alerts surface results from the
past 7 days that may not have been visible in earlier scans.

Alerts use plain declarative language. "A closely matched example sold 3 days
ago for $X on LiveAuctioneers, above the current comp median by 18%. This
recent result strengthens the case for pricing at the upper range." Not:
"There may be opportunities to consider recent comparable sales activity."

---

### Section 7: Competitive Advantages and Disadvantages

An honest assessment of how the seller's specific item compares to the current
comp set. Advantages are features the item has that comparable items in the
market do not: original box, documentation, superior condition, strong
provenance, maker attribution, completeness. Disadvantages are features the
comp set has that the seller's item lacks.

This section should be specific. "Your item has original packaging, which
adds 20-30% to the comp median based on three comparable sold results with
packaging." Not: "Original packaging may increase value."

---

### Section 8: Strategic Recommendations

No more than five specific, actionable recommendations. Each recommendation
includes a rationale, a specific suggested action, and an expected outcome.
Recommendations address: which platform to list on first, what price to set,
how to describe condition to match buyer expectations in this category, whether
to list immediately or wait for a seasonal or market demand event, and whether
to pursue an alternative selling channel (auction, dealer consignment, or
local sale) based on the competitive landscape.

Recommendations do not hedge. "List this item on eBay with a 10-day auction
format starting at $X. The category shows strong eBay demand velocity and 3
of your 4 closest comps cleared through eBay auctions. A 10-day format maximizes
bid accumulation time for this category's buyer base." Not: "You might consider
listing on eBay."

---

### Section 9: Sold Tracker

A chronological log of the most recent cleared transactions in the comp set.
Each entry includes: platform, sale date, sale price, condition as described,
format (auction/buy-it-now/dealer sale), and bid count if applicable. Sorted
from most recent to oldest. Maximum 10 entries; minimum 5 if available.

The sold tracker is the seller's ground truth. It shows them exactly what the
market has validated, not what sellers are asking.

---

### Section 10: Market Forecast

A 30-day and 90-day directional forecast for the category, with explicit
confidence rating for each horizon. Near-term forecasts (30 days) carry
higher confidence. Longer forecasts carry lower confidence and are labeled
accordingly. The forecast incorporates seasonal demand patterns, trend data
from Gemini grounding, and supply trajectory based on current active listing
density and rate of new listings entering the market.

The market forecast does not predict with false precision. It characterizes
probable conditions and identifies the key variables that could cause the
forecast to be wrong.

---

### Section 11: Executive Summary

Three to five sentences. Written for someone who will not read the rest of the
report. States the current market price range, the confidence level, the one
most important competitive factor the seller should know, and the single most
important recommended action. Uses plain language. No jargon. No hedging.

---

## Language Standards

Premium competitive intelligence reports use specific, declarative language
throughout. The following principles govern every sentence.

Data is cited, not implied. Every claim about market conditions is tied to
a specific data point. "The category shows declining demand" becomes "eBay
sold comp count dropped from 23 in the prior 90 days to 11 in the current
90-day window, a 52% reduction in market activity."

Ranges are explained, not just stated. A range of $400 to $700 is not
informative without context. The same range with "the low end reflects unboxed
examples in good condition on eBay; the high end reflects boxed, documented
examples at dealer retail" is a useful competitive map.

Uncertainty is disclosed, not buried. When the data is thin, the report says
so in plain terms. When the forecast horizon is beyond what the data supports,
the report says so explicitly.

Recommendations are committed. The system has an opinion based on the data.
It states that opinion directly and explains the basis for it. Sellers are
not helped by a system that presents all options equally and declines to advise.

---

## Before and After: Generic Analysis vs Specialist Intelligence

The following contrast illustrates the difference between what a generic AI
market response looks like and what a premium MegaBot ReconBot output provides.

Generic response: "This type of item can vary widely in value depending on
condition, maker, and current market demand. Similar items have sold for
anywhere from $200 to $2,000. We recommend researching recent eBay sold
listings for the most accurate current pricing."

Premium specialist output: "14 cleared-transaction comps across 6 platforms
over the past 87 days establish a freshness-weighted median of $485. Three
Tier 1 auction results (LiveAuctioneers, average $512) confirm the upper range.
Current eBay active supply shows 4 competing listings, 2 of which have been
relisted more than once without clearing and are above the comp median by 35%.
Your item's original documentation is present in 2 of the 14 comps and
correlates with a $60-90 premium over the undocumented median. Recommended
listing: eBay auction, 10-day format, starting at $425, with documentation
photographed and highlighted in the first line of the description."

The difference is not one of effort. It is one of structure, attribution,
specificity, and commitment to a defensible conclusion.
