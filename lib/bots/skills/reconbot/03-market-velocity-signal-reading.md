---
name: market-velocity-signal-reading
description: Read active listing count plus age distribution as a velocity signal — saturation versus scarcity, buyer's market versus seller's market.
when_to_use: Every ReconBot scan with both active and sold data.
version: 1.0.0
---

# Velocity = (Active Count) × (Age Distribution)

Market velocity is how fast inventory moves through the market. Two markets can have the same average price but completely different velocities, and the velocity is what determines whether your seller should list now, wait, or drop their price.

## The Three Velocity Signatures

### High Velocity (Buyer's Market — Saturated)
- 30+ active listings for the item
- Median age of active listings: 0-14 days (fresh, lots of new entries)
- Sold comps: many recent (last 30 days), short days-to-sell
- Sell-through rate: high (50%+)

**Reading:** Lots of supply, lots of demand, fast turnover. Sellers can move inventory in 1-3 weeks but face heavy competition. Pricing power is LOW.

**Recommendation pattern:** "Price competitively at the value tier median. Expect 1-2 weeks to sell. Higher prices will sit."

### Low Velocity (Seller's Market — Scarce)
- Fewer than 10 active listings
- Median age of active listings: 30-90 days (old, few new entries)
- Sold comps: few, with longer days-to-sell
- Sell-through rate: low (10-20%)

**Reading:** Limited supply, limited demand, slow turnover. Few buyers actively looking, but those who are looking have few options. Pricing power is HIGH for the right buyer match.

**Recommendation pattern:** "Price at premium tier. Expect 4-12 weeks to sell. Patience pays — the right buyer is out there."

### Balanced Velocity (Healthy Market)
- 10-30 active listings
- Median age of active listings: 14-45 days
- Sold comps: steady stream, moderate days-to-sell (14-30 days)
- Sell-through rate: 25-40%

**Reading:** Healthy market with predictable behavior. Pricing power is MODERATE.

**Recommendation pattern:** "Price at value tier median. Expect 2-4 weeks to sell. Standard market conditions."

## Velocity Math

To compute velocity from your scraper data:
- **Saturation index** = active_count / sold_count_last_30_days
  - Index < 1.0: very low supply
  - Index 1.0-2.0: balanced
  - Index 2.0-5.0: moderate oversupply
  - Index > 5.0: heavy saturation
- **Freshness index** = avg_days_listed of active comps
  - 0-14: fresh wave (often race-to-bottom)
  - 15-45: healthy mix
  - 46+: stale inventory (overpriced or wrong category)

## Velocity Plus Pricing = Recommendation

| Velocity | Pricing Power | List Now? | Recommendation |
|---|---|---|---|
| High (saturated) | LOW | YES if priced low | Compete on price, sell in 1-2 wk |
| Balanced | MODERATE | YES at value median | Standard 2-4 wk timeline |
| Low (scarce) | HIGH | YES at premium | Expect 1-3 mo, but premium achievable |
| Stale (no movement) | LOW | NO | Wait, reduce expectations, or pivot category |

If velocity is "stale" (no recent sales, all active comps old), this is a STRUCTURALLY DEAD market. Recommend:
1. Wait for seasonal demand (if applicable — see seasonal skill pack)
2. List in a different category that's more active
3. Donate / liquidate locally if no realistic sale path

## Output Format

Always include velocity in your scan_summary or market_dynamics output:
- **"Saturation: 2.4× (moderate oversupply, expect 2-4 week sell time)"**
- **"Freshness: 38 days median (healthy mix, no panic, no stagnation)"**
- **"Velocity verdict: BALANCED — standard pricing applies"**
