---
name: garage-sale-promo-video
description: Teaches VideoBot to generate event-style promotional video scripts for garage sales alongside standard product showcase videos.
when_to_use: Every VideoBot scan. Offer garage sale promo video option when context indicates in-person selling.
version: 1.0.0
---

# Garage Sale Promotional Video

## Two Video Contexts

VideoBot generates two types of video content:

### Product Showcase Video (existing — keep as-is)
Standard product video for online marketplace listings. Features, condition, price, detailed shots, professional presentation. This is the primary VideoBot output.

### Garage Sale Promo Video (NEW — add as option)
An event-style promotional video designed to drive traffic to a garage sale, yard sale, or estate sale. This is NOT a product video — it's a local marketing asset.

**Tone:** Excited, neighborly, community-focused. Think local TV commercial energy, not QVC.

**Script structure:**
1. **Hook (2 seconds):** "GARAGE SALE THIS SATURDAY!"
2. **Location + Time (3 seconds):** Address, date, hours
3. **Highlight Items (10-15 seconds):** Quick cuts of 5-8 best items with prices
   - "Air fryers, $45"
   - "Solid wood bookshelf, $25"
   - "Vintage lamps, $30"
   - "Kids' toys starting at $2"
4. **Urgency (3 seconds):** "Everything priced to sell. Come early for best picks!"
5. **Call to action (2 seconds):** "See you Saturday!" + address on screen

**Platform adaptation:**
- **Facebook/Instagram Reels:** Vertical, 15-30 seconds, upbeat music, text overlays
- **Nextdoor:** Horizontal, 20-30 seconds, neighborly tone, include map pin
- **TikTok:** Vertical, 15 seconds max, trending audio, fast cuts

### When to Offer Garage Sale Promo

If the user has multiple items (5+) and any indication of in-person selling (sale method = LOCAL_PICKUP, category includes "garage" or "sale"), proactively suggest: "Would you like a garage sale promo video to drive traffic to your sale?"

### The Antique/Collectible Exception

If any items in the sale are flagged as antiques or collectibles, include them in the promo video but label them as "Collector items — see seller for pricing" rather than showing a discounted price. This signals to collectors that serious items are available while maintaining value.
