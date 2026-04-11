---
name: intel-panel-signals
description: Alert signals, trigger conditions, and notification rules for the Intelligence Panel. Defines when to flag sellers and what to recommend.
when_to_use: When evaluating item state changes, market movements, and timing opportunities.
version: 1.0.0
---

# Intelligence Signals and Trigger Conditions

## Price Alerts

**PRICE_TOO_HIGH:** Listing price exceeds 120% of current market value. Action: suggest price reduction with data.
**PRICE_TOO_LOW:** Listing price is below 80% of market value. Action: suggest price increase — seller may be undervaluing.
**PRICE_OPTIMAL:** Listing price is 100-110% of market value. Action: confirm good pricing with confidence note.
**PRICE_DROPPING:** Market comparables have dropped more than 10% in the last 30 days. Action: alert seller, suggest selling soon or adjusting price.
**PRICE_RISING:** Market comparables have risen more than 10% in the last 30 days. Action: suggest holding or increasing price.

## Readiness Alerts

**MISSING_PHOTOS:** Item has fewer than 3 photos uploaded. Action: "Add more photos — listings with 4+ photos sell 2x faster."
**LOW_QUALITY_PHOTOS:** PhotoBot assessment score below 6/10. Action: suggest retaking photos with PhotoBot enhancement.
**NO_DESCRIPTION:** Listing description is empty or minimal (under 50 characters). Action: "Run ListBot to generate a professional listing."
**MISSING_DOCS:** Document score below 2/5 on items valued over $50. Action: "Upload a receipt or manual to increase buyer confidence."

## Timing Alerts

**STALE_LISTING:** Item has been active for more than 60 days without a sale or serious inquiry. Action: suggest price reduction, channel change (online → garage sale), or listing refresh.
**PRIME_SEASON:** Current period is high-demand for this item's category. Action: "This is peak season for [category] — consider listing now for maximum value."
**GARAGE_SALE_SEASON:** Spring (April-June) or fall (August-October) peak garage sale periods. Action: "Garage sale season is here — this item could sell quickly at your next sale."

## Garage Sale Specific Alerts

**GARAGE_SALE_READY:** Item characteristics (weight, size, value bracket) make it well-suited for in-person selling. Include garage sale price prominently.
**QUICK_WIN:** Low-value item ($1-20) that should be priced to move fast. Suggest bundling with similar items.
**LOCAL_EVENT:** User has an upcoming garage sale or neighborhood sale event. Action: include this item in sale preparation.
**ANTIQUE_FLAG:** Item identified as antique or collectible — do NOT recommend garage sale pricing. Flag: "This item holds value — price at online rates even at in-person sales."
**HIGH_VALUE_ALERT:** Item estimated at $500 or above. Trigger enhanced analysis and suggest professional appraisal if no appraisal document exists.
