---
name: competitor-pricing-strategy-detection
description: Identify the three seller archetypes hiding inside any pile of competitor listings — premium anchors, race-to-bottom panickers, and value optimizers — and read the market they're creating.
when_to_use: Every ReconBot scan with 5+ active comp listings.
version: 1.0.0
---

# Three Seller Archetypes Are Always in the Room

In any market with 5+ active comps, you can sort the sellers into three distinct strategies. Identifying them is critical because each archetype creates a different kind of pressure on your seller's optimal price.

## Archetype 1: Premium Anchors (the High-Floor Sellers)

**Signature:** Top 25% of active prices. Listings often older (60-180+ days). Beautiful photos, detailed descriptions, "rare," "vintage," "museum-quality" language.

**Strategy:** Set the ceiling. They're patient. They'll wait 6 months for the right buyer who values condition + provenance. Many never sell — they're just there to anchor the perceived ceiling and feed the seller's ego.

**What this means for your seller:**
- Don't price ABOVE the premium anchors unless you have demonstrable provenance
- Premium anchor prices are NOT "the market" — they're the marketing
- If your seller has condition + story to match, you CAN reach the anchor zone
- If your seller has standard condition, ignore the anchors entirely

## Archetype 2: Race-to-Bottom Panickers (the Liquidators)

**Signature:** Bottom 20% of active prices. Listings often very fresh (0-14 days). Generic photos, minimal description, "must sell," "moving sale," "BEST OFFER" language.

**Strategy:** Sell fast at any price. Often estate liquidation, divorce, moving deadline, or someone who inherited the item and just wants it gone. They will undercut the market by 20-40% to close in days, not weeks.

**What this means for your seller:**
- Race-to-bottom listings DROP the apparent market floor
- They're temporary — they'll be gone in 1-2 weeks
- If your seller is also liquidating fast, match their price
- If your seller has time, IGNORE the panickers and price to the value optimizers

## Archetype 3: Value Optimizers (the Real Market)

**Signature:** Middle 55% of active prices. Listings 14-60 days old. Thoughtful photos, item-specifics filled in, fair return policy.

**Strategy:** Maximum revenue per item with reasonable sell time (4-8 weeks). They've researched. They know the market. They've priced correctly.

**This is the real market. Anchor your recommendation here.**

The middle of the value optimizer cluster is the "fair market price" the user should target. Slightly above (5-8%) if photos and condition are above average. Slightly below (5-8%) if the user wants to sell faster.

## How to Detect Each Archetype Quickly

1. Sort comps by price ascending
2. Bottom 20%: race-to-bottom (flag listing age — if all <14 days, this is fresh panic)
3. Top 25%: premium anchors (flag listing age — if all >60 days, these never sell)
4. Middle 55%: value optimizers (this is your reference set)

## Output Format

In your competitor analysis, label each major price tier:
- "**Premium tier:** $X-$Y (3 listings, avg 87 days listed — anchors, mostly stale)"
- "**Value tier:** $X-$Y (8 listings, avg 31 days listed — the real market)"
- "**Liquidation tier:** $X-$Y (2 listings, avg 6 days listed — fresh undercut, will sell fast)"

Then make your recommendation against the value tier, not the average of all 13 listings (which would be skewed by the anchors).
