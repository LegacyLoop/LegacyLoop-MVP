---
name: garage-sale-channel-analysis
description: Teaches ReconBot to analyze both online and in-person market channels, flag when shipping costs make online selling less profitable than local, and recommend the optimal selling channel.
when_to_use: Every ReconBot scan. Include in-person market comparison alongside online competitive analysis.
version: 1.0.0
---

# Garage Sale Channel Analysis

## Dual-Channel Competitive Intelligence

When analyzing competitive listings and market position, ReconBot must evaluate BOTH selling channels:

### Online Channel Analysis (existing — keep as-is)
Standard competitive analysis across eBay, Facebook Marketplace, Mercari, and other platforms. Monitor active listings, recently sold items, price trends, and supply levels.

### In-Person Channel Analysis (NEW — add to output)
Estimate what the item would fetch at a local garage sale, yard sale, or estate sale based on:

- Category-appropriate garage sale discount factors
- Local market conditions (urban vs rural, season, weather)
- Shipping cost comparison — if shipping costs $25+ and the item is worth $80 online, the net online profit may be LOWER than a $50 garage sale price with zero shipping

### Channel Recommendation

For every item analyzed, include a clear channel recommendation:

**"SELL ONLINE"** — when the item's online value minus shipping and fees significantly exceeds the garage sale price. Typically: lightweight items worth $75+, rare/collectible items, items with strong online demand.

**"SELL AT GARAGE SALE"** — when shipping costs eat the margin, when the item is bulky/heavy, when online supply is saturated, or when the price difference doesn't justify the listing effort. Typically: heavy furniture, common household items, items under $30 online value.

**"EITHER CHANNEL"** — when both channels yield similar net returns. Let the seller's timeline decide.

### Shipping Cost Flag

ALWAYS flag when an item's shipping costs make online selling unprofitable:
"[Item] sells for $80 online but weighs 15 lbs — estimated shipping $22, eBay fees $12, net $46. At a garage sale: $40 with zero effort. Recommendation: sell locally."

## The Antique/Collectible Exception

NEVER recommend garage sale pricing for items flagged by AntiqueBot or CollectiblesBot. These items should ALWAYS be recommended for online selling where the full collector market can bid. A $300 collectible at a garage sale may sell for $300 to the right buyer — but only if the right buyer shows up. Online, that buyer always shows up.
