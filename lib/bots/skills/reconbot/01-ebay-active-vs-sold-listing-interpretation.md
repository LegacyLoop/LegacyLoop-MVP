---
name: ebay-active-vs-sold-listing-interpretation
description: How to read eBay active listings versus sold comps as fundamentally different signals.
when_to_use: Every ReconBot scan that touches eBay data.
version: 1.0.0
---

# eBay: Active vs Sold — Two Different Markets

eBay shows you two completely different things: ACTIVE listings (items currently for sale) and SOLD comps (items that closed within the last 90 days). Most resellers conflate these. You will not. They tell you opposite things about the market and you must use them differently.

## Active Listings = Asking Price (Hopes)

An active listing is a seller's WISH. It's the price they hope someone will pay. Active listings are systematically inflated for three reasons:

1. **Anchor bias** — sellers price 15-30% above what they expect, leaving room to negotiate or accept a Best Offer
2. **No skin in the game** — there is zero cost to listing high; the worst case is the item doesn't sell
3. **Survivor bias** — the listings you see today are the ones that DIDN'T sell yet, often because they're overpriced

**Use active listings to gauge:**
- Supply level (how many people are trying to sell this right now)
- Price ceiling (what sellers think the absolute top is)
- Listing freshness (median days_listed across active comps)
- Seller confidence (are people listing aggressively or hesitantly)

**NEVER use active listings as the basis for a recommended sale price.** That's the #1 mistake amateur resellers make. You will not make it.

## Sold Listings = Real Money Changed Hands (Truth)

A sold listing is a TRANSACTION. A real buyer paid a real price. Sold comps are the only data that actually proves market value.

**Use sold listings to determine:**
- Market median (the 50th percentile of recent sale prices)
- Realistic price range (25th to 75th percentile)
- Sell-through rate (how often listings actually close)
- Days-to-sell (how fast inventory moves at each price tier)

When asked to recommend a listing price, you anchor your recommendation to the sold comps median, NOT the active listings average. Active listings inform supply context. Sold listings drive the actual price recommendation.

## The 30/60/90 Decay Rule

Sold comps lose freshness fast. Weight them by recency:
- **0-30 days:** full weight (1.0×) — current market
- **31-60 days:** moderated (0.7×) — still relevant
- **61-90 days:** stale (0.4×) — historical context only
- **>90 days:** discard — obsolete signal

If you only have stale comps (>60 days old), state this explicitly in your output: "Most recent sale was 47 days ago — market conditions may have shifted." Confidence on the recommendation drops to 60% or lower.

## When Active and Sold Disagree

If active listings are 30% above sold median, that's a SUPPLY GLUT — sellers are stuck waiting because they overpriced. Recommend: list at sold median, don't chase the inflated active prices.

If active listings are 20% BELOW sold median, that's a RACE TO BOTTOM — newer sellers are panicking and undercutting. Sold median is still valid, but warn the user that downward pressure is real and they may need to act soon.

If active listings and sold median are within 10%, the market is BALANCED. Confidence on your recommendation is highest in this scenario.

## Output Format

When reporting eBay findings, ALWAYS distinguish:
- **"Active median: $X (N listings, avg Y days listed)"**
- **"Sold median: $X (N comps, last 30 days)"**
- **"Recommended price: $X (anchored to sold median, X% confidence)"**

Never report a single "eBay average" — that's meaningless and you know better.
