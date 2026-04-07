---
name: ebay-title-character-optimization
description: The 80-character eBay title is the most valuable real estate in resale. This playbook teaches how to front-load keywords, use pipe separators strategically, and write for eBay's search algorithm.
when_to_use: Every ListBot scan that generates an eBay listing. eBay titles are search-algorithm-driven and character-constrained.
version: 1.0.0
---

# The 80-Character eBay Title Is the Most Valuable Real Estate in Resale

eBay gives you exactly 80 characters for the title. Every character counts. The title is what the search algorithm ranks, what buyers scan, and what determines whether your listing even gets seen. Most amateur sellers waste 30-40% of those characters on filler. You will not.

## The Front-Loaded Keyword Rule

eBay's search algorithm weights the FIRST words in the title more heavily than the last. A buyer searching "Hans Wegner CH-25 teak chair" is more likely to find your listing if "Hans Wegner" is the first two words, not buried at position 40.

**Rule:** Put the most-searched keyword FIRST. The most-searched keyword is usually the maker, model, or brand name.

**Bad (buried keyword):**
"Beautiful Vintage Danish Modern Teak Lounge Chair by Hans Wegner CH-25 1958"

**Good (front-loaded):**
"Hans Wegner CH-25 Lounge Chair 1958 Original Paper Cord Teak Danish Modern"

Same 74 characters. Completely different search performance.

## The Keyword Hierarchy (in priority order)

1. **Maker / Brand** (Hans Wegner, Stickley, Rolex, Leica) — highest search value
2. **Model / Model Number** (CH-25, #4 plane, Submariner, M3) — buyers search exact models
3. **Year / Era** (1958, mid-century, vintage, antique) — narrows results
4. **Material** (teak, oak, sterling, leather) — secondary filter
5. **Condition** (original, restored, working, mint) — trust signal
6. **Style / Category** (lounge chair, hand plane, diver watch, rangefinder) — final filter

Stack them in that order. Don't waste characters on filler words ("beautiful," "stunning," "rare," "must-see") — those don't rank in search and eat your 80-character budget.

## The Pipe Separator Strategy

For longer titles, use pipe separators (|) or hyphens to visually break sections:

"Stickley #634 Morris Chair 1905 Original Leather Oak Arts Crafts Signed"

vs

"Stickley #634 Morris Chair | 1905 | Original Leather | Oak | Signed"

Pipes help mobile buyers scan faster but cost 2 characters each. Use them only if the title is already 70+ characters and buyers need visual separation.

## Forbidden Character Wastage

These words rank LOW in search and waste characters:
- "Beautiful," "Stunning," "Gorgeous," "Amazing"
- "WOW," "LOOK," "MUST SEE," "RARE"
- "L@@K," "NR," "WOW" (all-caps attention grabbers)
- "&," "+" (use "and" sparingly or omit)
- "NEW" unless item is literally new-in-box
- Excessive punctuation (!!!, ???)

These words trigger eBay's spam filter in some categories and get listings deprioritized.

## Category-Specific Title Patterns

**Vintage Furniture:**
[Maker] [Model] [Era/Year] [Material] [Condition] [Category]
Example: "Hans Wegner CH-25 1958 Original Paper Cord Teak Excellent Lounge Chair"

**Watches:**
[Brand] [Model/Ref #] [Year] [Material] [Condition]
Example: "Omega Speedmaster 145.022 1969 Steel Original Tritium Dial"

**Tools:**
[Brand] [Model #] [Type Number/Era] [Condition] [Category]
Example: "Stanley #4 Type 11 1910-1918 User Condition Sweetheart Iron Hand Plane"

**Cameras:**
[Brand] [Model] [Year/Era] [Lens/Spec] [Condition]
Example: "Leica M3 1954 Double Stroke Collapsible Summicron 50mm Working"

**Collectibles (cards, figures, coins):**
[Year] [Set/Series] [Player/Subject] [Condition/Grade]
Example: "1986 Fleer #57 Michael Jordan Rookie Card PSA 8 NM-MT Centered"

## The 75/80 Rule

Aim for 75 characters, not 80. Leaving 5 characters of slack gives you room for:
- Future edits
- Auto-truncation safety on mobile displays
- Visual breathing room

Listings that hit exactly 80 often look cramped and unprofessional.

## Character Counting

Always count characters BEFORE finalizing. Good tools: eBay's built-in title character counter, VS Code character count in status bar, or manual count by groups of 10.

## Output Format

When generating an eBay title, populate the `listings.ebay.title` field with a front-loaded, keyword-dense string under 80 characters. Follow the hierarchy: maker → model → year → material → condition → category.

**Example output:**
```json
{
  "title": "Hans Wegner CH-25 Lounge Chair 1958 Original Paper Cord Teak Excellent"
}
```

74 characters, 7 keyword phrases, zero filler. Ship that.
