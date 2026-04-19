# ListBot Skill Pack 19 — Sale Method Local Platform Filter (V10)

**Added:** CMD-BOT-ENGINE-CANONIZE-SALE-METHOD (April 18, 2026)
**Engine bump:** V9 → V10
**Supersedes nothing.** Packs 01-18 preserved. This pack governs
how ListBot filters platform recommendations and writes listing
copy when the seller has set `saleMethod=LOCAL_PICKUP`.

## Policy

When the seller context contains `Sale method: LOCAL_PICKUP`:

### Platform filter — KEEP (local-capable):
- Facebook Marketplace (local listing, not national reach)
- Craigslist
- Uncle Henry's (Maine region, via geo-resolver)
- OfferUp (local filter enabled)
- Nextdoor

### Platform filter — DROP (national / ship-required):
- eBay
- Mercari
- Etsy
- Reverb
- Poshmark
- StockX
- TCGplayer
- Heritage Auctions
- Ruby Lane

### Listing copy rules:
- Emphasize local pickup, no shipping required.
- Preferred payment language: cash / Venmo / Zelle / local-meetup.
- Include neighborhood or nearest town in the title when it fits.
- Remove any shipping-cost line items.
- The `asking_price` on a LOCAL_PICKUP listing should reflect the
  local-market number — NOT a shipping-adjusted national price.

## Preservation

- V9 Intelligence-anchored listing price (recommended `listing_price`
  reads `pricingIntel.premiumPrice`) is unchanged — anchor resolution
  is orthogonal to `saleMethod`.
- GarageSale tier data flows remain canonical.
- Listing copy generation for `BOTH` / `ONLINE_SHIPPING` items
  unchanged.
- `best_platforms` ordering inside the retained set is unchanged —
  this pack filters, not reorders.

## Layered defense

1. **Data layer:** PriceBot's Local Enthusiast tier (V10) feeds
   ListBot the local-scoped price.
2. **Prompt layer:** ListBot route injects a dynamic LOCAL_PICKUP
   filter block into the model context.
3. **Runtime layer:** ListBot's post-process can drop platforms from
   the model output that violate this policy. (Current ship relies on
   the LLM following the skill pack; runtime enforcement banked as
   CMD-LISTBOT-LOCAL-PICKUP-RUNTIME-FILTER.)

## Telemetry

`LISTBOT_RUN` event payload already carries `saleMethod` for V1e
segmentation.

## Why this matters

A Dean guitar listed as LOCAL_PICKUP should NEVER recommend Reverb
or eBay — those platforms force shipping. ListBot must respect what
the seller decided about how they want to sell.

## One-line summary

**Local sellers get local platforms. No national reach, no shipping platforms.**
