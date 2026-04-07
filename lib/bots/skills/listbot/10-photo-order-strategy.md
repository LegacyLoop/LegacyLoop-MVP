---
name: photo-order-strategy
description: Photo order is as important as photo quality. The five-slot hierarchy that converts browsers into buyers.
when_to_use: Every ListBot scan generating photo recommendations and listing photo order.
version: 1.0.0
---

# Photo Order Is a Conversion Weapon

The best photo in the wrong position converts worse than an average photo in the right position. Every major platform (eBay, Etsy, Facebook Marketplace) uses a grid layout where buyers see the FIRST photo most prominently. That first photo determines whether they click.

But the second, third, and fourth photos determine whether they BUY.

## The Five-Slot Photo Hierarchy

Every listing should follow this photo order:

### Slot 1: The Hero Shot
**Purpose:** Stop the scroll. Earn the click.

The hero shot is the single most beautiful photo of the item. It should:
- Show the item IN CONTEXT (styled, not floating on white)
- Be shot with natural daylight if possible
- Show the item from its most flattering angle
- Fill the frame (no wasted space)
- Match platform conventions (square for Instagram, landscape for eBay, portrait for Pinterest)

The hero shot is NOT a catalog photo. It's a lifestyle or mood photo that makes the buyer imagine the item in THEIR space.

### Slot 2: The Three-Quarter View
**Purpose:** Show the full item, clearly, with proportions.

The three-quarter view (item rotated 20-30° from front) shows:
- The overall shape and proportions
- Multiple sides at once
- The item's volume and presence

This photo should be clean, well-lit, and clearly show the item's dimensions. Consider including a ruler or common object for scale reference.

### Slot 3: The Detail Shot
**Purpose:** Prove quality. Show the craftsmanship that justifies the price.

The detail shot is a close-up of the BEST feature of the item:
- For furniture: joinery, hardware, wood grain
- For watches: dial detail, crown, caseback
- For cameras: lens, rangefinder, shutter speed dial
- For clothing: stitching, label, fabric texture
- For jewelry: hallmarks, gemstones, setting detail

This photo says "this item is real and it's high quality."

### Slot 4: The Scale Shot
**Purpose:** Help the buyer imagine the item in their space.

The scale shot shows the item relative to a known reference:
- A coin on a watch dial
- A ruler next to a small tool
- A person standing next to furniture
- A hand holding a small collectible

Without scale, buyers can't imagine the item's real size. Scale shots reduce returns and cancelled orders.

### Slot 5: The Flaw Shot
**Purpose:** Build trust. Preempt returns.

The flaw shot is a close-up of any visible damage, wear, or imperfection:
- A scratch on a frame
- A small chip on a ceramic piece
- A worn spot on leather
- A repair or restoration detail

Showing flaws INCREASES conversion and decreases returns. Buyers trust sellers who are honest about condition. Hiding flaws invites bad feedback and refund requests.

## The Bonus Slots (6-10)

After the mandatory 5, use remaining slots for:
- **Slot 6:** Alternate angle (back view, underside, inside)
- **Slot 7:** Another detail shot (different feature)
- **Slot 8:** Provenance photo (paper tag, signature, maker's mark)
- **Slot 9:** Styled context shot (item in a room, worn, or in use)
- **Slot 10:** Packaging or documentation (original box, receipt, COA)

Most platforms allow 12-24 photos. Use them all for high-value items. Use 8-10 for mid-value. Use 5-6 for low-value.

## Platform-Specific Photo Conventions

### eBay
- 24 photos allowed
- First photo must be on white or neutral background (per eBay policy for many categories)
- Use all slots for $100+ items
- Zoomable images rank higher

### Etsy
- 10 photos allowed
- First photo should be styled (Etsy buyers want lifestyle, not catalog)
- Video allowed — use it for high-value items

### Facebook Marketplace
- 10 photos allowed
- First photo should be clear and bright (mobile-first)
- Styled photos work better than catalog shots
- Avoid clutter in background

### Instagram
- 10 photos per post (carousel)
- First photo is the hook — most important
- Use carousel to tell a story: hero → details → context → CTA

### 1stDibs / Chairish
- Unlimited photos for premium listings
- Professional, catalog-style photography preferred
- Multiple angles mandatory for furniture

## The Photography Quality Rule

If you only have phone photos, ensure they are:
- **Sharp** (not blurry)
- **Well-lit** (natural light preferred, no harsh shadows)
- **In focus on the item** (not the background)
- **Horizontal or square** for most platforms (vertical for Instagram/Pinterest)
- **Clean background** (no clutter)
- **Color-accurate** (no weird filters or saturation)

Bad phone photos kill conversions faster than almost anything.

## The "Needs More Photos" Flag

If ListBot analyzes an item and sees fewer than the minimum recommended photos for the category, it should flag this in the `photo_strategy.needed_additions` field. Examples:
- "Needs a scale shot — can you add a photo with a ruler or common object for size reference?"
- "Needs a flaw shot — is there any visible wear you can document for buyer trust?"
- "Needs a maker mark photo — do you see a signature, stamp, or tag on the underside?"

## Output Format

In the ListBot JSON output, populate `photo_strategy` with:

```json
{
  "photo_strategy": {
    "hero_choice": "photo_2 (styled context shot)",
    "recommended_order": ["photo_2", "photo_4", "photo_1", "photo_5", "photo_3"],
    "needed_additions": [
      "Scale shot with ruler or coin for size reference",
      "Flaw shot of minor wear on front leg"
    ],
    "editing_tips": [
      "Photo 1 needs brightness increase",
      "Photo 4 has slight color cast — adjust white balance"
    ]
  }
}
```

Always recommend the optimal order, not just any order.
