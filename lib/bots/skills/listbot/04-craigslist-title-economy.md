---
name: craigslist-title-economy
description: Craigslist titles are brutally short (70 characters ideal). Must avoid spam triggers that cause auto-flagging. Scannable. Factual.
when_to_use: Every ListBot scan generating a Craigslist listing.
version: 1.0.0
---

# Craigslist Is a Text-Only Old-School Platform

Craigslist was built in 1995 and hasn't fundamentally changed. No algorithm to game, no SEO to optimize. Just a chronological list of titles. Your title has 2 seconds to grab attention before the scroll.

Keep it SHORT. Keep it FACTUAL. Keep it FLAG-FREE.

## The 70-Character Rule

Craigslist technically allows longer titles but anything over 70 characters gets truncated on the listing grid. Aim for 50-70 characters.

## The Price-In-Title Convention

Craigslist users EXPECT the price in the title. Listings without a price in the title get lower click-through. Use this pattern:

**Format:** `[Item] - $[Price]`

- "Vintage Teak Credenza - $1500"
- "Stanley Hand Plane Set - $200"
- "Danish Modern Lounge Chair - $2200"

The hyphen + dollar sign is standard Craigslist grammar.

## Craigslist Spam Triggers (DO NOT USE)

Craigslist has aggressive auto-flagging. These words/patterns cause listings to be hidden or removed:
- "FREE" (unless the item is actually free)
- "$$$," "$$$$" (multiple dollar signs)
- ALL CAPS (entire title)
- "MUST SELL," "URGENT," "CASH ONLY" (red flags for scams)
- Multiple exclamation points (!!!)
- "NO LOWBALLERS," "SERIOUS INQUIRIES ONLY" (signals difficult seller)
- "BRAND NEW" (often triggers resale-not-allowed flags)
- "EBAY," "AMAZON," "FACEBOOK" (mention competitor platforms = flag)
- Phone numbers in title (put in description only)

## The Craigslist Scannable Format

Craigslist users scan a list of 50-100 titles at a time. Your title needs to be scannable in half a second:

**Bad (unscannable):**
"Selling my beautiful vintage teak credenza that I got from my grandmother who got it in 1960"

**Good (scannable):**
"Vintage Teak Credenza 1960 - $1500"

The second one tells the buyer everything in 34 characters.

## Category-Specific Patterns

**Furniture:**
"[Era/Material] [Category] - $[Price]"
- "Vintage Teak Credenza - $1500"
- "1960s Lounge Chair - $800"

**Tools:**
"[Brand] [Category] - $[Price]"
- "Stanley Hand Plane Set - $200"
- "Milwaukee Drill Kit - $150"

**Vehicles:**
"[Year] [Make] [Model] - $[Price]"
- "1968 Ford Mustang - $12000"
- "2015 Toyota Camry - $8500"

**Electronics:**
"[Brand] [Category] [Condition] - $[Price]"
- "Sony Vintage Receiver Working - $300"
- "Marantz 2270 Recently Serviced - $1500"

## The Hyphen vs En-Dash Rule

Use a simple hyphen (-), not an en-dash (–) or em-dash (—). Craigslist's old search treats them differently and hyphens are safest.

## Output Format

Populate `listings.craigslist.title` with a 50-70 character, price-included, spam-free title.

**Example:**
```json
{
  "title": "1958 Hans Wegner Lounge Chair Teak - $2200"
}
```

43 characters, price included, scannable, zero spam triggers. Ship that.
