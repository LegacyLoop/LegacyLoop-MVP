---
name: wtb-post-detection-everywhere
description: How to find Want-To-Buy posts on every platform. WTB posts are gold-standard intent signal.
when_to_use: Every BuyerBot scan. WTB posts are the highest-confidence lead source.
version: 1.0.0
---

# WTB Posts Are Gold

A "Want To Buy" post is the strongest possible buyer signal. Someone publicly typed: "I want this item, I'm willing to pay, here's how to reach me." Every WTB post is a lead worth pursuing same-day.

## Reddit WTB Subreddits

**Dedicated WTB subreddits:**
- r/Watchexchange (watches), r/HardwareSwap (computer hardware), r/AVexchange (AV gear)
- r/MechMarket (keyboards), r/Gameswap (games), r/BookExchange (books)
- r/knife_swap (knives), r/FountainPens (pens), r/GuitarsForSale (guitars)
- r/VintageAudio, r/photomarket (cameras)

**Generic search:** `[ITEM TYPE] WTB` or `[ITEM TYPE] looking to buy`. Filter past 7 days for hot, past 30 days for warm. Include hobby subs (r/MidCenturyModern, r/vintageaudio, r/AntiqueTools).

**Reading a Reddit WTB post:** username → identifier, post URL → contact path, post body → intent signal, timestamp → recency.

## Facebook Group WTB Posts

Search: "[Category] WTB", "[Category] buy sell trade", "[Item type] for sale [region]".

**Within a group, scan for:**
- Posts starting with "WTB," "ISO," "Looking for," "Anyone selling"
- Comments on for-sale posts saying "If you have another, I'm interested"

**Reading:** poster's name + profile URL → identifier, post URL → contact path, post text → intent signal, timestamp → recency, comments → additional warm leads.

## Instagram + Twitter/X WTB Posts

- Twitter/X search: `"WTB [item type]"` or `"looking to buy [item type]"`. Filter past 7 days.
- Instagram: search `#wtb #wts` + item-relevant filter.

**Reading:** username → identifier, tweet/post URL → contact path, text → intent, date → recency.

## Forum WTB Threads

Specialty forums often have dedicated "Wanted" subforums:
- AudioKarma → "Wanted: Vintage Audio"
- WatchUSeek → "Wanted to Buy"
- Category-specific WTB threads on hobby forums

**Reading:** username → identifier, thread URL → contact path, post body → intent, post date → recency.

## eBay Saved Searches (indirect)

Can't see saved searches directly, but infer demand from:
- Active "Best Offer" listings in the same category
- Recent sold listings with quick days_to_sell (< 3 days)
- "Watchers" count on similar active listings

Not direct leads, but confirm active buyer pool.

## Search Query Patterns by Item Type

- **Vintage Furniture:** "WTB mid-century [maker]", "ISO teak credenza", "Looking for Hans Wegner"
- **Tools:** "WTB Stanley plane Type [N]", "Looking for vintage hand plane"
- **Watches:** "WTB Omega Speedmaster", "ISO vintage Rolex"
- **Cameras:** "WTB Leica M3", "Looking for vintage Hasselblad"
- **Sports Memorabilia:** "WTB [player] rookie card", "ISO signed [team] jersey"
- **Books:** "WTB first edition [title]", "Looking for [author] hardcover"
- **Vinyl:** "WTB [album] original pressing", "ISO [artist] vinyl"

## Output

Every WTB lead populates the 5-field schema: platform (specific subreddit/group/forum), identifier (username/handle), intent_signal (quote their exact words), intent_recency_days, contact_path (direct URL), match_score, match_reason.

If 3+ WTB posts in past 14 days → HOT MARKET signal, surface in executive summary.
If 0 WTB posts in past 30 days → COLD MARKET signal, recommend standard listing.
