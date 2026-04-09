---
name: collectiblesbot-megabot-cross-market-intel-weighting
description: Protocol for triangulating Beckett, PSA Auction Prices Realized, and PriceCharting data in MegaBot collectibles analysis. Defines source hierarchy, conflict resolution rules, and confidence scoring when price sources disagree. Covers cards, watches, vinyl, and other collectible categories.
when_to_use: "MegaBot scans only. CollectiblesBot MegaBot lane."
version: 1.0.0
---

# Cross-Market Intelligence Weighting

## Purpose

A MegaBot collectibles analysis draws on at least three independent price sources before publishing a value range. This skill defines how to weight those sources against each other, how to resolve conflicts, and how to communicate uncertainty when sources diverge. The goal is a single defensible value range with an explicit confidence score, not an average of incompatible data points.

---

## The Three Primary Sources

### Beckett

Beckett publishes high and low book values for graded and ungraded cards. Their pricing is updated periodically but lags real-time market conditions, especially in volatile categories like modern rookies, sealed wax, and hobby-specific inserts. Beckett values are widely recognized and function as a baseline reference that buyers and sellers both understand.

Beckett's primary strength is breadth — they cover obscure sets and parallel variations that eBay may have too few sold comps to price reliably. Their primary weakness is lag. In a hot market, Beckett can be 30 to 60 percent below actual realized prices. In a cooling market, they can be 20 to 40 percent above.

Use Beckett as an anchor for baseline legitimacy and as a floor check, not as a ceiling. When Beckett is significantly below realized comps, cite the discrepancy explicitly.

### PSA Auction Prices Realized

PSA's APR database records every auction result for graded PSA slabs submitted through Heritage, PWCC, Goldin, eBay, and participating auction houses. This is the most authoritative source for graded card pricing because it reflects actual transactions, not asking prices.

PSA APR data is grade-specific. A PSA 9 and a PSA 10 are different entries with different price histories. When using APR data, always cite the specific grade being referenced. APR data more than 18 months old should be flagged as potentially stale for any card with active market participation. For truly vintage or ultra-rare items, older APR data may be the only data available and should be cited with its date.

PSA APR is the highest-authority source for graded modern and vintage sports cards. When APR data is available and recent, it overrides Beckett.

### PriceCharting

PriceCharting tracks sold prices for video games, trading cards, comics, and some other collectibles by aggregating eBay sold listings and other marketplace data. Their strength is raw volume — they process a high number of sold comps across ungraded and graded items. Their weakness is that they do not always differentiate condition within their raw category, and they include listing-level noise (damaged items, misidentified variations, incomplete lots).

PriceCharting is most valuable for video games, where it is the dominant pricing reference, and for ungraded card raw values, where it aggregates enough eBay sold data to produce reliable medians. For graded slabs, defer to PSA APR over PriceCharting.

---

## Source Hierarchy

The hierarchy is not fixed — it is category and data-freshness dependent. The general order of priority is:

1. Recent sold comps (eBay sold, Heritage realized, PWCC realized) — always highest authority
2. PSA APR (graded cards and select other items) — authoritative for graded slabs
3. PriceCharting (ungraded cards, video games) — reliable median for high-volume categories
4. Beckett (all cards) — baseline reference, use as floor or anchor only

When sources disagree, the conflict resolution rules below apply.

---

## Conflict Resolution Rules

### Rule 1: Sold Beats Asking

A completed sale at any price is worth more than any asking price, book value, or list price. If a card is listed for $500 on eBay but the last three sold comps are $280, $295, and $310, the value range is $280-310 with $500 flagged as an unrealized aspirational ask.

Do not include unsold listings in any value range calculation. Do not use "current eBay listings" as a proxy for value.

### Rule 2: Graded Beats Raw

Graded values from authenticated third-party services are not comparable to raw (ungraded) values without an explicit conversion step. A PSA 9 price cannot be applied to an ungraded card. When the only available comps are graded, the output must apply a raw discount — typically 40 to 70 percent of the graded value depending on category, set, and era — and label that discount explicitly.

The graded-to-raw discount is itself a range, not a fixed number. For modern cards in sets where most high-grade examples are submitted, the raw discount is severe (ungraded Prizm rookies often trade at 20-30 percent of their PSA 10 equivalent). For vintage cards where most examples are ungraded, the gap is narrower.

### Rule 3: Recent Beats Stale

Price data older than 12 months should be flagged. Price data older than 24 months in any actively traded category should be labeled stale and used only as a baseline anchor, not as a current value reference. For modern cards (issued in the last 5 years), price data older than 6 months in active categories may already be unreliable.

When all available data is stale, the output must say so explicitly and widen the confidence interval rather than presenting stale data as current.

### Rule 4: When Sources Disagree — Cite the Disagreement

Do not resolve source disagreements by averaging. If Beckett says $150, PSA APR says $320, and PriceCharting says $280, do not publish $250 as the value. Instead, publish the range ($280-320 based on realized comps, with Beckett at $150 flagged as likely stale or lagging) and name the reason for the divergence.

Common reasons for source divergence: recent market movement not yet reflected in Beckett, grade-specific premium not captured in PriceCharting, condition-specific issue depressing a subset of comps.

---

## Raw vs. Graded Price Gap Calculation

The raw-to-graded gap is one of the most important calculations in collectibles pricing. It determines whether grading submission makes financial sense, and it affects how to price an ungraded item when graded comps dominate the market.

To calculate the gap:

Step 1: Identify the PSA 9 and PSA 10 realized prices from APR for the specific card and set.

Step 2: Identify the raw (ungraded) recent sold comps from eBay or PriceCharting.

Step 3: Calculate the raw-to-PSA-9 multiplier (PSA 9 price divided by raw price) and the raw-to-PSA-10 multiplier.

Step 4: Apply the inverse to the current raw card to derive the implied PSA value if it grades 9 or 10. Then subtract grading fees, expected turnaround cost, and selling fees to determine whether submission has a positive expected value.

For any item where the grading ROI calculation is favorable, the output must include the grading recommendation with the math shown explicitly.

---

## Market Velocity Signals from Pop Report Changes

PSA and BGS publish population reports that show how many copies of a given card have been graded at each grade level. Changes in the pop report are market signals:

- Rapid pop increases at PSA 10 (many new high-grade copies entering the market) put downward pressure on prices. If the PSA 10 pop doubles in 12 months, expect price compression.
- Low and stable pop at top grade with increasing transaction volume signals supply scarcity and can support price appreciation.
- Sudden pop spikes sometimes indicate a hoard discovery — a large collection being submitted all at once. These events can crash a market that was previously dominated by scarcity premium.

When MegaBot has access to comparative pop data (current vs. historical), this signal must be incorporated into the confidence score. A card with a stable, low top-grade pop warrants a tighter value range and higher confidence. A card with a rapidly growing pop warrants a wider range and a specific flag.

---

## Auction House Weighting

Not all auction results are equal. Different platforms attract different buyer pools, which affects realized prices:

- Heritage Auctions: premium buyers, premium results. Heritage realized prices often represent the ceiling for serious collectors. These are the right comps for rare, high-value items.
- PWCC: professional platform with broad collector reach. PWCC results are reliable mid-market comps for investment-grade cards.
- Goldin: high-profile lots, strong results for elite graded material.
- eBay: the broadest market, the most comps, but also the most noise. eBay realized prices are appropriate as the primary comp source for common to mid-range items.

For any item where Heritage or PWCC data is available, cite it separately from eBay data and note the platform. Premium auction results should not be averaged with eBay comps — they should be presented as the ceiling with eBay providing the floor and mid-range.

---

## Category-Specific Source Application

### Cards (Sports and Non-Sports)

Primary: PSA APR for graded, PriceCharting and eBay sold for raw. Beckett as secondary anchor.

### Comics

CGC does not have a direct equivalent to PSA APR. Heritage auction results are the primary authoritative source for high-grade keys. GoCollect tracks realized prices across auction platforms and is the closest equivalent to APR for comics. Beckett does not cover comics. GPA (Grade Pricing Analysis) is a useful secondary source.

### Coins

PCGS CoinFacts and NGC Price Guide are the primary value references. Heritage is the authoritative auction source. Greysheet (dealer wholesale) provides the buy-side floor. For modern coins, eBay sold is an appropriate primary source.

### Watches

Chrono24 sold listings are the primary market reference for watch comps. WatchCharts provides historical price trend data useful for assessing whether a reference is appreciating or depreciating. Hodinkee market reports provide directional context. eBay sold is appropriate for entry-level and mid-range watches.

### Vinyl

Discogs is the authoritative primary source. Discogs median of recent sold copies in the specific pressing and condition grade is more reliable than any other source. eBay sold comps are a useful secondary check, particularly for sealed or graded copies.

### Video Games

PriceCharting is the primary source. eBay sold is a reliable secondary check. For graded copies (WATA or VGA), Heritage and eBay graded-specific sold comps apply.

---

## Communicating Confidence When Sources Disagree

The output confidence score must directly reflect the degree of source agreement:

- All three sources within 15 percent of each other: high confidence, tight price range.
- Two sources agree, one outlier: moderate-high confidence, cite the outlier and the reason it was down-weighted.
- All three sources more than 25 percent apart: low-moderate confidence, widen the range, name each source and explain the divergence.
- Only one source available: low confidence, state the limitation explicitly, recommend additional research before listing.

Never present a single-source price as a confident range. Never omit source disagreements from the output.
