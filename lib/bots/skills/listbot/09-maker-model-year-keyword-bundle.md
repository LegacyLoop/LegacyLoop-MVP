---
name: maker-model-year-keyword-bundle
description: The three-word power combo that ranks highest on every resale platform. Maker, model, year — in that exact order.
when_to_use: Every ListBot scan. If the item has a known maker, this combo should appear in the title and first paragraph.
version: 1.0.0
---

# Maker + Model + Year = The Highest-Ranking Keyword Combination

Across every major resale platform (eBay, Etsy, 1stDibs, Chairish, WorthPoint, LiveAuctioneers), the three-word combination of MAKER + MODEL + YEAR ranks highest in search results. It signals:
- Authenticity (you know what it is)
- Specificity (you've done research)
- Collector-grade metadata (you're selling to someone who cares)

Every listing should include this combo if possible.

## The Exact Format

**Format:** `[MAKER] [MODEL] [YEAR]`

Examples:
- "Hans Wegner CH-25 1958"
- "Omega Speedmaster 145.022 1969"
- "Stanley #4 Type 11 1910"
- "Leica M3 1954"
- "Gibson Les Paul Standard 1959"
- "Fender Stratocaster 1963"
- "Rolex Submariner 5513 1968"

Three words (or short phrases) that define the item precisely.

## Why This Combo Wins

**Maker** is the highest-searched keyword type across all platforms. Collectors search by maker.

**Model** narrows the maker's output. A "Hans Wegner chair" could be 50+ different models. "CH-25" is ONE specific chair.

**Year** proves authenticity. Many makers have multiple production years with different quality, features, or value. Buyers who know the year bracket want that precision.

Together, the three create a unique fingerprint that almost guarantees the listing appears in search for every reasonable query a committed buyer would make.

## When You Don't Have All Three

If you only have partial information, prioritize in this order:
1. **Maker only:** Still the most important. Lead with it.
2. **Maker + model:** Strong. Add an era qualifier ("1960s") if you don't know exact year.
3. **Maker + year:** Good. Add a descriptive category ("lounge chair") if no model number.
4. **Model only (no maker):** Still useful for iconic models. Use "[Model] [Year] [Category]" format.
5. **Year only:** Weakest. Combine with material + category.

## The Confidence Rule

NEVER guess the maker, model, or year. Attribution without confidence is fraud-adjacent and destroys trust.
- If you're 90%+ confident: state the maker/model directly
- If you're 70-89% confident: use "attributed to" or "in the style of"
- If you're below 70%: don't claim the attribution

**Examples:**
- High confidence (90%+): "Hans Wegner CH-25 1958"
- Medium confidence (70-89%): "attributed to Hans Wegner, CH-25 style, circa 1958"
- Low confidence: "Mid-century Danish lounge chair, circa 1950s-1960s"

## The Fake Attribution Trap

Amateur sellers sometimes claim "Hans Wegner style" or "in the manner of Eames" to catch maker search traffic without having the actual item. This is:
- Ethically questionable
- Detected by platform algorithms over time
- Leads to returns and negative feedback

Don't do it. If you don't have the maker, lean on other keyword tiers (style, era, material).

## The Three-Word Power Combo in Titles

Your eBay title should contain the full combo in the first 30 characters:

**Good:**
"Hans Wegner CH-25 1958 Original Paper Cord Teak Danish Modern Lounge Chair"

**Less good (combo buried):**
"Beautiful Original Paper Cord Teak Danish Modern Lounge Chair Hans Wegner CH-25 1958"

Same content. Front-loaded combo ranks higher.

## The Three-Word Power Combo in Descriptions

The first paragraph of your description should also contain the combo:

**Good first paragraph:**
"This is a 1958 Hans Wegner CH-25 lounge chair in its original paper cord — produced by Carl Hansen & Søn in Denmark during the first decade of CH-25 production."

Maker, model, year — all in the first 25 words.

## Category-Specific Combos

**Furniture:** Hans Wegner CH-25 1958
**Watches:** Omega Speedmaster 145.022 1969
**Cameras:** Leica M3 Double Stroke 1954
**Tools:** Stanley #4 Type 11 1910-1918
**Guitars:** Gibson Les Paul Standard 1959
**Cars:** 1967 Shelby GT500 Mustang
**Cards:** 1986 Fleer #57 Michael Jordan Rookie

All six categories follow the same MAKER + MODEL + YEAR pattern.

## Output Format

For every listing, populate a `keyword_bundle` object in the SEO fields:

```json
{
  "keyword_bundle": {
    "maker": "Hans Wegner",
    "model": "CH-25",
    "year": "1958",
    "confidence": 92
  }
}
```

Confidence below 70? Leave maker/model/year as null and rely on category/style keywords instead.
