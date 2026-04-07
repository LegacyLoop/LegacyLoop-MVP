---
name: etsy-title-seo-playbook
description: Etsy titles are 140 characters and follow long-tail keyword SEO rules. Completely different from eBay or Facebook. Etsy's search algorithm rewards specificity.
when_to_use: Every ListBot scan generating an Etsy vintage listing.
version: 1.0.0
---

# Etsy Titles Are an SEO Game

Etsy buyers are HUNTING for specific items. They type long, descriptive search queries like "mid century modern teak credenza with brass handles" — not just "credenza." Your title needs to match these long-tail queries.

Etsy gives you 140 characters. Use them all.

## The Long-Tail Keyword Strategy

Long-tail keywords are 3-5 word phrases buyers actually type. They convert MUCH better than short keywords because the buyer already knows what they want.

**Short-tail (high competition, low conversion):**
- "credenza" — 50,000 listings compete
- "vintage chair" — 200,000 listings compete

**Long-tail (low competition, high conversion):**
- "mid century modern teak credenza with brass handles"
- "1950s Danish modern lounge chair original paper cord"

Your Etsy title should contain 2-3 long-tail phrases, stacked.

## The Etsy 140-Character Formula

`[Long-tail phrase 1] | [Long-tail phrase 2] | [Style tag] | [Era tag]`

**Example (140 characters):**
"Mid Century Modern Teak Credenza | Danish Modern Sideboard 1960s | Hans Wegner Style | Vintage Home Decor | Original Condition"

Each pipe-separated section is a different long-tail query this listing could match.

## The Three-Tag Rule

Every Etsy title should include:
1. **Primary keyword phrase** (what the item IS)
2. **Era/style qualifier** (vintage, antique, mid-century, Victorian, etc.)
3. **Use-case qualifier** (home decor, office, dining, gift, etc.)

Why: Etsy's search algorithm uses all three to match different buyer intents.

## Capitalization Rules

Etsy buyers trust Title Case listings more than ALL CAPS or lowercase:
- **Good:** "Mid Century Modern Teak Credenza"
- **Bad:** "MID CENTURY MODERN TEAK CREDENZA"
- **Bad:** "mid century modern teak credenza"

Title Case signals professionalism.

## Forbidden Etsy Title Moves

- ALL CAPS — Etsy explicitly warns against this in their seller guidelines
- Excessive punctuation (!!!, ???)
- Symbols (*, ✨, 🌟) in the title — allowed in description only
- Vague descriptors ("Cool," "Amazing," "Must See")
- Keyword stuffing without pipes — looks like spam

## Category-Specific Patterns

**Vintage Furniture:**
"[Era] [Style] [Material] [Category] | [Decade] [Style Tag] | [Use Case] | Vintage [Category]"
"Mid Century Modern Teak Credenza | 1960s Danish Modern Sideboard | Vintage Living Room Furniture | Mid Century Storage"

**Vintage Jewelry:**
"[Era] [Material] [Item Type] | [Style Tag] | [Gift Use Case] | [Decade] Vintage Jewelry"
"1950s Sterling Silver Brooch | Art Deco Flower Pin | Vintage Gift for Her | Mid Century Jewelry"

**Vintage Clothing:**
"[Era] [Category] [Material] | [Style] | [Size/Condition] | Vintage Fashion"
"1970s Boho Leather Vest | Hippie Fringe Top | Size Medium Excellent | Vintage 70s Clothing"

## The Seller Tier Impact on Search

Etsy's search algorithm also considers seller history — newer sellers need BETTER SEO to compete with established shops. For LegacyLoop sellers (typically new to Etsy), the title alone has to carry the weight.

## Output Format

Populate `listings.etsy.title` with a 130-140 character pipe-separated long-tail keyword string.

**Example:**
```json
{
  "title": "Mid Century Modern Teak Credenza | Danish Modern Sideboard 1960s | Hans Wegner Style | Vintage Home Decor"
}
```

107 characters, 4 long-tail phrases, Title Case, pipe-separated. Ship that.
