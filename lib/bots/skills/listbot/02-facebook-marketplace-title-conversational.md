---
name: facebook-marketplace-title-conversational
description: Facebook Marketplace titles follow completely different rules from eBay. Shorter, conversational, mobile-friendly, local-keyword-aware.
when_to_use: Every ListBot scan generating a Facebook Marketplace listing.
version: 1.0.0
---

# Facebook Marketplace Is Not eBay

Facebook Marketplace buyers don't search like eBay buyers. They browse. They scroll. They decide in 2 seconds whether to stop on your listing or keep going. A 75-character keyword-stuffed eBay title will look like spam on Facebook and get scrolled past.

Facebook Marketplace needs a DIFFERENT title style. Write for the scroll, not the search.

## The 100-Character Limit (practical ceiling)

Facebook technically allows longer titles, but titles over 100 characters get truncated on mobile (which is where 80% of Facebook Marketplace browsing happens). Aim for 60-90 characters — short enough to read in one glance.

## The Scroll-Stop Rule

Your title's job is to make someone STOP scrolling. That means:
- Lead with the most visually interesting detail (not the maker name)
- Mention something specific that makes it feel real (year, material, "from grandma's estate," "barely used")
- Use natural language (not keyword-stuffed)
- Avoid ALL CAPS (reads as spammy)

## Good vs Bad Facebook Titles

**Bad (eBay-style, feels like spam):**
"Hans Wegner CH-25 Lounge Chair 1958 Original Paper Cord Teak Danish Modern"

**Good (conversational, scroll-stopping):**
"1958 Hans Wegner lounge chair - original paper cord, barely used"

Same item. The second one feels like a real person selling a real thing. The first one feels like a dealer spamming the feed.

## The Local Keyword Strategy

Facebook Marketplace is hyper-local. Buyers often include location in their searches:
- "vintage furniture Portland Maine"
- "tools near me"
- "estate sale finds Brunswick"

You don't need to mention the city in the title (Facebook auto-tags location), but you CAN use local-friendly language:
- "Local pickup only" — filters out shippers, attracts locals
- "Moving sale" — signals urgency and negotiation room
- "Estate clearance" — signals real provenance

## Category-Specific Patterns

**Vintage Furniture:**
"[Year/era] [category] - [key detail], [condition/pickup note]"
"1958 Danish lounge chair - original condition, Brunswick Maine"

**Tools:**
"[Brand] [category] - [key feature], [price context]"
"Stanley hand plane - vintage, restored, great shape"

**Furniture (modern):**
"[Category] [color/material] - [brand/price context]"
"Oak dining table - seats 6, $400 firm"

**Electronics:**
"[Brand] [category] [condition] - [key spec]"
"Sony vintage receiver - working, great sound"

## Forbidden Facebook Title Moves

- ALL CAPS ("VINTAGE CHAIR FOR SALE")
- Excessive emojis (1 is fine, 5 is spam)
- "$$$" or price-tag symbols
- "FREE" when item is not actually free (clickbait)
- "WOW," "LOOK," "MUST SEE"
- Multiple exclamation points
- "Best offer" in the title (put that in description)

## The Conversational Tone

Facebook buyers want to feel like they're buying from a neighbor, not a store. Write titles like you're posting for a friend:
- "1958 teak credenza - original condition, moving sale" ← friendly
- "HANS WEGNER CH-25 TEAK DANISH MODERN LOUNGE CHAIR!!" ← avoid

## Output Format

Populate `listings.facebook_marketplace.title` with a conversational, 60-90 character title that would stop a scrolling buyer.

**Example:**
```json
{
  "title": "1958 Hans Wegner lounge chair - original condition, local pickup"
}
```

64 characters, conversational, local-friendly, scroll-stopping. Ship that.
