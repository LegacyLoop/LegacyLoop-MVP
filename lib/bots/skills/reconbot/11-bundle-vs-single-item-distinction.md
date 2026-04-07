---
name: bundle-vs-single-item-distinction
description: Identifying multi-item bundles in comp data and extracting per-item value without poisoning the analysis.
when_to_use: Every ReconBot scan where comp listings might include multi-item lots.
version: 1.0.0
---

# Bundles Are a Trap

A bundle listing (multiple items sold together at one price) looks like a comp but is actually a different transaction type. Treating a bundle as a single-item comp will skew your analysis by 50-200%. You must identify bundles and handle them separately.

## How to Detect a Bundle

A listing is a bundle if ANY of these are true:

### Title Signals
- Contains "lot of," "set of," "(N)," "bundle," "collection of," "matching pair," "x4," "x10"
- Lists multiple item types ("chair AND table AND lamp")
- Includes count words ("eight," "ten," "dozen," "pair of")

### Photo Signals
- Multiple identical items in one photo
- Multiple different items in one photo (estate lot)
- Items arranged grid-style (catalog photo)

### Price Signals
- Price is significantly higher than similar single items (could be a 10-pack at 6× single price)
- Price is significantly lower than similar single items (estate lot pricing)
- Price has unusual ending (e.g., $475 instead of $50, suggesting per-item × N count)

### Description Signals
- "Includes:" followed by a list
- "All shown" or "everything pictured"
- "Matching set"
- "Estate lot"
- "Buyer to pick up everything"

## How to Handle a Bundle Comp

Once identified, you have three options:

### Option A: Estimate Per-Item Value
If the bundle contains identical items at a clearly stated count:
- "Lot of 8 vintage Mason jars - $80" → per-item: $10
- Use the per-item value as the comp data point

### Option B: Discard Entirely
If the bundle is heterogeneous (different items mixed) or count is unclear:
- Discard from the comp set
- Note in the analysis: "Excluded N bundle listings from comp set"

### Option C: Treat as Liquidation Signal
If 3+ bundle listings appear in your scraper results, that's a SIGNAL — the market is over-supplied and sellers are trying to liquidate fast. This affects your recommendation:
- Note the liquidation pattern in market_dynamics
- Recommend the user list quickly OR price aggressively OR wait for market to clear

## When the User's Item IS a Bundle

If the user is asking ReconBot to scan a bundle (e.g., "estate lot of 30 vintage tools"), you reverse the logic:
1. Find single-item comps for each item type in the bundle
2. Compute per-item market values
3. Sum them with a bundle discount (15-30% off because bulk buyers expect a deal)
4. Present both: "Per-item value: $480 retail. Bundle pricing: $336-$408 (30-15% bulk discount)."

## Output Format

In scan_summary or competitor_listings, ALWAYS distinguish:
- **"$X (single item)"** for individual comp
- **"$X bundle of N (~$Y per item)"** for identified bundles
- **"$X estate lot — excluded from per-item analysis"** for heterogeneous lots

Never silently include a bundle in a single-item comp set. The user can't trust your analysis if you mix transaction types.

## Bundle Pricing Psychology

Buyers approach bundles differently than single items:
- Bundle buyers want a 15-40% discount vs. buying items individually
- Bundle buyers are usually resellers, dealers, or volume hobbyists
- Bundle listings move slower than singles (smaller buyer pool) but at higher absolute prices

When the user is selling a bundle, recommend:
- Listing on eBay or Craigslist (bundle-friendly platforms)
- NOT on Etsy or Facebook Marketplace (single-item markets)
- Including total item count, condition range, and itemized inventory in the description
