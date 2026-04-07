---
name: outlier-detection-and-rubric
description: Garbage in, garbage out. How to identify and discard comp data that would corrupt your pricing analysis.
when_to_use: Every ReconBot scan that pulls from multiple scraper sources.
version: 1.0.0
---

# Outlier Detection: Throwing Out the Trash

Scraper data is dirty. Some comps look like real comparables but are actually garbage that will skew your analysis if you include them. You must identify and discard the trash before computing market median, price recommendations, or alerts.

## The Six Outlier Types

### 1. Bundle Listings (treat per-item, not whole)
A "10 vintage chairs as a lot" listing at $800 is NOT a $800 chair comp — it's an $80 chair comp. Identify bundles by:
- Title mentions "lot of," "set of," "(N)," "bundle," "collection of"
- Photo shows multiple items
- Price is suspiciously below similar single-item listings

**Action:** Either divide the bundle price by item count (rough but better than nothing) OR exclude from comp set entirely.

### 2. Wrong-Condition Comps
A pristine museum-quality chair sold for $1,200 is NOT a comp for a chair with broken legs and moldy upholstery. Identify condition mismatches by:
- Sold price 2-3× higher than median: probably "excellent" or "restored"
- Sold price 30-50% lower than median: probably "for parts" or "as-is"

**Action:** Group comps by condition tier (mint / excellent / good / fair / poor) and only compare within the user's condition tier.

### 3. Active Auctions Mid-Bid (not closing prices)
An eBay auction with 2 days left at $145 is NOT a comp — it's a starting bid plus a few early bids. The closing price will be higher.

**Action:** Filter to closed auctions only, OR exclude active auctions from comp data.

### 4. International Listings (currency / shipping confound)
A listing from the UK at £180 is not directly comparable to a US listing at $180. Currency conversion is straightforward, but international shipping costs and customs change buyer behavior.

**Action:** Either convert and apply a 15-25% international discount, OR exclude international comps entirely (preferred for US-based sellers).

### 5. Bot / Spam Listings
Some scraper hits are not real listings — they're price-test bots, drop-shippers, or fake items. Identify by:
- Identical photos across multiple listings (stock photo)
- Unrealistic prices (90% below market)
- Generic seller names with no history
- "New / sealed in box" for items that haven't been manufactured in 30 years

**Action:** Discard. These are noise.

### 6. Wrong-Item Matches (scraper false positives)
Sometimes the scraper returns "1965 Ford Mustang" when you searched for "1965 Mustang lamp." Confirm category match before including any comp.

**Action:** Discard non-matching items. If the comp set has more than 30% wrong-item matches, the search query needs to be refined.

## The Statistical Outlier Test

After removing the six manual types above, apply a statistical filter:

1. Compute median price of remaining comps
2. Compute interquartile range (25th to 75th percentile)
3. Define outliers as: price < (Q1 - 1.5 × IQR) OR price > (Q3 + 1.5 × IQR)
4. Discard those outliers
5. Recompute median on cleaned set

This is the standard "Tukey fence" method. It removes the extreme tails without being overly aggressive.

## When You Have Too Few Comps

After cleaning, if you have fewer than 5 valid comps:
- State this explicitly in your output: "Comp set is small (N=4 after filtering) — confidence is moderate"
- Drop confidence on the recommendation by 15-20 percentage points
- Recommend the user wait for more market data OR list at the conservative end of the range

If you have fewer than 3 valid comps, you don't have enough data to make a confident pricing recommendation. State this: "Insufficient comp data — recommendation is best-guess only."

## Output Format

In your scan_summary, surface the cleaning process:

**"Pulled 24 raw comps. After filtering out 4 bundles, 2 wrong-condition outliers, 3 international, and 1 statistical extreme: 14 valid comps remaining. Median: $215."**

This shows the user that you did the work, not just averaged garbage.

## What NEVER to Do

- NEVER use raw scraper data as the basis for a recommendation without filtering
- NEVER report "median of 24 comps" if 10 of them were trash
- NEVER hide the filtering — surface it for transparency
- NEVER let a single outlier skew your recommendation
