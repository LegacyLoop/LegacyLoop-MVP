---
name: listing-age-vs-price-correlation
description: How listing age and price interact to reveal the real market — fresh undercuts versus stale anchors.
when_to_use: Every ReconBot scan with active listings that have days_listed metadata.
version: 1.0.0
---

# Age-Weight Every Active Listing

Two listings at the same price tell completely different stories depending on how long they've been active. A $200 listing posted yesterday is a competitive threat. A $200 listing that's been up for 90 days is a price ceiling that nobody is willing to pay. You must read both.

## The Age-Price Decay Curve

Active listings follow a predictable pattern over time:

### Days 1-7: Fresh (full weight)
- Seller is testing the market
- May be priced aggressively (low) for fast sale OR aggressively (high) hoping
- Behavior: actively monitored, often promoted, accepts offers
- **Weight in your analysis: 1.0×**

### Days 8-30: Active (full weight)
- Standard market participation
- Most healthy listings live in this zone
- Prices reflect realistic expectations
- **Weight in your analysis: 1.0×**

### Days 31-60: Aging (moderate weight)
- Hasn't sold despite a fair window
- Either overpriced OR niche item with small buyer pool
- Seller may start dropping price
- **Weight in your analysis: 0.7×**

### Days 61-120: Stale (low weight)
- Significantly overpriced or wrong category
- Active price is essentially fictional — nobody will pay it
- Seller has likely given up checking
- **Weight in your analysis: 0.3×**

### Days 121+: Dead (discard)
- Item has effectively delisted itself
- Price is meaningless
- **Weight in your analysis: 0.0× — exclude from analysis**

## The Stale Anchor Trap

Amateur sellers see a $500 stale listing and think "the market is $500." They're wrong. The market REJECTED $500 — that's why it's still listed after 90 days. The real market is whatever the recent SOLD comps show, not the active failures.

When you compute "market average" for active comps, ALWAYS apply age weighting. A simple average of all active prices is meaningless if half of them are stale anchors.

## The Fresh Undercut Threat

Conversely, if you see 3 fresh listings (all 0-14 days old) priced 25% below the user's listing, that IS a real market shift, not random noise. Fresh undercuts predict where the market is HEADING in the next 30 days.

When you detect a fresh-undercut pattern:
- Fire a HIGH severity alert (per alert-severity-tiers skill pack)
- Recommend the user adjust their price within 5-10 days or risk missing the sale window
- Quote the specific fresh listings as evidence

## Aging Decay Patterns by Category

Different categories age differently:
- **Fast-aging (electronics, fashion):** 30 days max before stale
- **Standard (furniture, decor):** 60 days before aging, 90+ stale
- **Slow-aging (antiques, collectibles, art):** 120+ days before aging, 6 months+ before stale
- **Glacial (rare/specialty):** 1 year+ is normal, age weighting doesn't apply

For glacial-category items, ignore listing age entirely and focus on sold comp recency instead.

## How to Compute Age-Weighted Median

When you have active comps with days_listed:

```
weighted_total = 0
weight_sum = 0
for each comp:
  if days_listed <= 30: weight = 1.0
  elif days_listed <= 60: weight = 0.7
  elif days_listed <= 120: weight = 0.3
  else:                   weight = 0.0
  weighted_total += comp.price × weight
  weight_sum += weight

age_weighted_avg = weighted_total / weight_sum
```

This gives you the active market price as it currently exists, not as it existed 4 months ago.

## Output Format

When reporting active comp data, ALWAYS include the age weighting:

- **"Active median (raw): $245 across 12 listings"**
- **"Active median (age-weighted): $215 — 4 stale anchors discounted"**
- **"Most relevant active comps: $180-$240 (8 listings, all <60 days old)"**

And in the recommendation:
- **"Recommended price anchored to age-weighted average ($215), not raw average ($245)."**

The user deserves the real number, not the fiction.
