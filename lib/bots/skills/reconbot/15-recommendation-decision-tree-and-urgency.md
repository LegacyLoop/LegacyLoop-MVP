---
name: recommendation-decision-tree-and-urgency
description: The final synthesis. How to combine all signals into clear, ranked, urgency-tagged recommendations the seller can act on today.
when_to_use: Every ReconBot scan, at the end, when generating strategic_recommendations[].
version: 1.0.0
---

# The Output Has to Tell the Seller What to Do TODAY

Your job is not to dump data on the seller. Your job is to synthesize everything you've learned and tell them, in plain English, what to do RIGHT NOW. Every ReconBot scan must end with prioritized, time-tagged, action-oriented recommendations.

## The Three Decision Trees

Every scan needs to answer three questions in order:

### Decision 1: PRICING — What price should the seller list at?

Inputs:
- Sold comp median (from sold listings, age-weighted)
- Active comp value tier (excluding premium anchors and race-to-bottom)
- Condition of seller's item (1-10 score)
- Maker confidence (none / generic / verified)
- Velocity verdict (saturated / balanced / scarce)

Outputs (one of):
- **Aggressive — fast sale:** 10-15% below value tier median, expect 1-2 weeks
- **Optimal — best value:** at value tier median, expect 2-4 weeks
- **Premium — patient hold:** 10-25% above value tier median, expect 1-3 months
- **Wait — market is dead:** don't list, recommend storage / different category / donation

### Decision 2: TIMING — Should the seller list now or wait?

Inputs:
- Current seasonal position (peak / shoulder / off-season — see seasonal skill pack)
- Velocity verdict
- Seller's stated urgency (asked elsewhere, not always known)

Outputs (one of):
- **NOW** — seasonal peak or balanced market, no reason to wait
- **THIS MONTH** — approaching seasonal peak, list within 2-3 weeks
- **WAIT [N] WEEKS** — far from seasonal peak, store and list later
- **SKIP THIS YEAR** — missed seasonal window, wait until next cycle

### Decision 3: PLATFORM — Where should the seller list?

Inputs:
- Item type (furniture / collectible / electronics / etc.)
- Item value tier (under $100 / $100-$500 / $500-$2,000 / $2,000+)
- Item size (small / medium / large / oversized)
- Maker confidence (generic / verified)
- Seller's location and willingness to ship

Outputs:
- **Primary platform** — best fit for value + size + buyer pool
- **Backup platform** — secondary option if primary is slow
- **NOT recommended** — platforms to skip and why

## The Urgency Tags

Every recommendation gets one of these tags:

### IMMEDIATE (do this in the next 24 hours)
- Pricing change recommendations triggered by URGENT alerts
- Quick-action items (e.g., "respond to existing buyer offer")
- Seasonal window closing this week

### THIS WEEK (do within 7 days)
- New listing creation
- Price adjustments triggered by HIGH alerts
- Photo / description improvements

### THIS MONTH (do within 30 days)
- Strategic platform changes
- Authentication / appraisal requests
- Cross-listing to additional platforms

### LONG-TERM (no specific deadline)
- Market trend monitoring
- Wait for seasonal peak (with specific target month)
- Aggregate items for larger lot listing

## The Top-3 Rule

You will produce 3-5 strategic recommendations per scan, ranked by impact + urgency. NEVER more than 5. NEVER fewer than 3 (unless you're recommending "do nothing — store and wait"). Quality over quantity.

For each recommendation, include:
- **priority** (Immediate / This Week / This Month / Long-Term)
- **action** (specific imperative — "Drop price from $300 to $245")
- **reasoning** (1-2 sentence justification — "Active comp data shows 4 fresh listings priced 18% below your current price")
- **expected_impact** (concrete projection — "Expected to close sale within 10 days vs current 30+ days")

## Synthesis Examples

### Example 1: Healthy Market, Generic Item

```
Strategic Recommendations:

[THIS WEEK] List at $215 on eBay
  Reasoning: Sold comp median is $215 across 12 comps (last 30 days),
  value tier verified clean. Velocity is balanced — expect 2-3 week sell time.
  Expected impact: Sell within 2-3 weeks at fair market value.

[THIS WEEK] Cross-list on Facebook Marketplace at $185 (local pickup)
  Reasoning: Local pickup discount of 14% for instant cash sale option.
  Some buyers prefer Facebook for quick transactions.
  Expected impact: Optional fast-cash path if eBay listing is slow.

[LONG-TERM] No further action needed
  Reasoning: Market is healthy and stable. Standard listing should
  close within timeline.
```

### Example 2: Race-to-Bottom Crisis

```
Strategic Recommendations:

[IMMEDIATE] Drop price from $400 to $325 within 24 hours
  Reasoning: 5 fresh competitors (all <14 days old) have listed in
  the past week at $300-$340. Your $400 listing has been stale for
  18 days. URGENT alert fired.
  Expected impact: Match the new market reality, restore competitive
  position, sell within 2 weeks instead of risking 90+ days at $400.

[THIS WEEK] Add 3 additional photos showing condition detail
  Reasoning: Differentiate from competitor listings on quality, not
  just price. Your item is in better condition than 3 of the 5 fresh
  competitors.
  Expected impact: Justify the $325 price (~$40 above the lowest fresh
  competitor) on condition merit.

[LONG-TERM] Monitor for race-to-bottom recovery
  Reasoning: When race-to-bottom dynamics end (typically 4-6 weeks),
  the market median should recover toward $370-$400.
  Expected impact: If you don't sell at $325, market recovery may
  restore higher prices in 4-6 weeks.
```

### Example 3: Verified Rare Maker, Patient Sale

```
Strategic Recommendations:

[THIS MONTH] List at $2,200 on eBay as Hans Wegner CH-25
  Reasoning: Paper tag visible in photo 4 confirms Carl Hansen
  production. Verified Wegner CH-25 comps sell for $1,800-$3,400.
  Pricing at $2,200 (mid-range) for steady demand.
  Expected impact: Likely sale within 6-12 weeks to a collector or
  designer.

[THIS MONTH] Also list on 1stDibs at $2,800
  Reasoning: 1stDibs reaches the high-end designer / interior
  stylist buyer pool that pays premium for verified mid-century.
  Expected impact: Possible higher-priced sale, longer timeline
  (3-6 months), 25% commission factored in.

[LONG-TERM] Do NOT cross-list on Facebook Marketplace
  Reasoning: Local Maine buyer pool is too thin for $2,000+
  verified mid-century. Maine market for MCM is weak.
  Expected impact: Avoid wasted effort and lowball offers.
```

## What NEVER to Do

- NEVER produce more than 5 recommendations
- NEVER produce a recommendation without an urgency tag
- NEVER use generic language ("consider listing on multiple platforms" — be specific)
- NEVER recommend an action that contradicts your own analysis (if you flagged URGENT alert about overpricing, your top recommendation must address it)
- NEVER include "consult a professional" as a top-3 recommendation unless authentication is the actionable step

The seller deserves clarity. Give it to them.
