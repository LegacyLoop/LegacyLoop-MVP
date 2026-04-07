---
name: seasonal-demand-cycles
description: Map category seasonality so you can recommend "list now" vs "wait for season" vs "sell year-round" with confidence.
when_to_use: Every ReconBot scan where the item category has known seasonal patterns.
version: 1.0.0
---

# Seasonality Is the Free Money Most Sellers Miss

Roughly 40% of resale categories have meaningful seasonal demand cycles. Selling at the wrong time can cost the user 20-50% of the item's potential value. Selling at the right time can DOUBLE it. You must know the cycles cold.

## High-Seasonality Categories (Time the Sale)

### Holiday Decor (Christmas, Halloween, Easter)
- **Peak:** 6-10 weeks BEFORE the holiday
  - Christmas decor: October 1 - December 10 (peak Nov 15)
  - Halloween: August 15 - October 25 (peak Sept 25)
  - Easter: February 15 - April 1
- **Dead zone:** Immediately after the holiday — the day after Christmas, prices drop 60%
- **Recommendation:** "Hold until [month] for maximum demand. Listing now would cost ~40%."

### Garden / Outdoor Equipment
- **Peak:** February (planning), March-May (buying), June (peak demand)
- **Dead zone:** November-January
- **Categories:** mowers, tillers, garden tools, planters, outdoor furniture, grills
- **Recommendation:** "List Feb-April for best prices. Winter listings sit and lose value."

### Winter Sports Gear (Skis, Snowboards, Snowmobiles)
- **Peak:** September-November (pre-season buying), February (peak season replacement buying)
- **Dead zone:** April-August
- **Recommendation:** "List Sept 1 for fall buying season. Off-season prices are 40-60% lower."

### Halloween Costumes
- **Peak:** September 1 - October 28
- **Dead zone:** Year-round except Sept-Oct
- **Recommendation:** "Hold until late August for the only window when these have value."

### Summer Recreation (Pools, Camping, Boats, Bikes)
- **Peak:** April-July
- **Dead zone:** October-February
- **Recommendation:** "List April-June for peak prices."

### Wedding-Related (Dresses, Decor, China)
- **Peak:** January-March (engagement season into spring planning)
- **Recommendation:** "List January-March when brides are actively shopping."

## Low-Seasonality Categories (List Anytime)

These categories sell consistently year-round. Time-of-year matters less than market conditions:
- Antiques and collectibles (steady)
- Books (slight Sept back-to-school bump)
- Tools (slight spring bump)
- Electronics (slight November holiday bump)
- Furniture (slight August/September moving-season bump)
- Clothing (depends on garment season)

For these, recommend listing immediately and focus your advice on pricing strategy, not timing.

## Counter-Cyclical Categories

Some categories actually peak during off-seasons because of buyer planning behavior:
- **Heating equipment** peaks in late summer (people prepare for winter)
- **Cooling equipment** peaks in late winter (people prepare for summer)
- **Tax software** peaks in January-April

## How to Read Seasonal Signals from Comp Data

If your comp data shows recent sales clustered in specific months, that's a seasonality signal. Sample the sold dates:
- All recent sales in Sept-Nov + few summer sales = strong fall seasonality
- Even distribution across 12 months = no seasonality, list anytime
- All sales in past 2 weeks but none before = NEW trending item, act fast

## Recommendation Output

When seasonality is significant, surface it explicitly:

**"This item has strong seasonal demand. Holding the listing until [month] is projected to increase the sale price by ~$X (Y% premium). Recommended action: STORE for [N] weeks, then list."**

vs

**"This category sells year-round with no significant seasonal cycle. List immediately."**

vs

**"Item is currently in PEAK SEASON. List in the next 7 days to capture maximum demand. Window closes around [date]."**

## When to Override Seasonality

Seasonality is a recommendation, not a rule. Override it when:
- The seller has urgent cash needs (recommend immediate sale + acknowledge the cost)
- The item is perishable / aging poorly (e.g., mold-prone, fragile)
- Storage isn't available
- The seller is moving / liquidating estate on a fixed timeline

In those cases, recommend immediate sale and tell the user explicitly: "Seasonal optimal would be [month] but your timeline requires immediate sale. Expect ~[X]% lower realized value vs peak season."
