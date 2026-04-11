---
name: garage-sale-consensus
description: Teaches the MegaBot 4-AI consensus engine to evaluate all three price tiers across all four AI engines and build agreement on garage sale pricing.
when_to_use: Every MegaBot consensus run. Ensure all 4 AIs evaluate online, garage sale, and quick sale prices.
version: 1.0.0
---

# MegaBot Garage Sale Consensus

## Three-Tier Consensus Requirement

When running 4-AI consensus analysis, ALL FOUR AI engines must independently evaluate three price tiers:

1. **Online Marketplace Value** — the standard marketplace price across platforms
2. **Garage Sale Price** — what in-person buyers will realistically pay at a weekend sale
3. **Quick Sale Price** — gone-today, no-negotiation pricing for immediate disposal

Consensus must reflect agreement across all three tiers, not just the online price. A consensus that agrees on $135 online but ranges from $20 to $80 on the garage sale price is NOT consensus — it indicates genuine uncertainty about the in-person market that should be communicated to the seller.

## Disagreement Protocol for Garage Sale Pricing

If the four AI engines disagree on garage sale pricing by more than 40% spread:
- Report the full range honestly
- Explain WHY the disagreement exists (category ambiguity, condition interpretation, regional market variation)
- Default to the median of the four estimates
- Recommend the seller test the price and adjust at the sale

Agreement within 25% spread = high confidence recommendation.
Agreement within 40% spread = moderate confidence with range.
Disagreement beyond 40% = low confidence, report as range with seller guidance.

## The Antique/Collectible Override

If ANY of the four AI engines flags the item as antique, collectible, or high-value art, the garage sale and quick sale tiers should reflect VALUE-HOLDING pricing (70-90% of online) rather than standard discount factors. One collector-aware AI engine outranks three that don't recognize the item's significance.

This is the MegaBot's unique advantage — catching what a single AI might miss.
