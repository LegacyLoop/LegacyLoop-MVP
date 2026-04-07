---
name: listing-readiness-score-rubric
description: The official LegacyLoop 100-point Listing Readiness Score rubric. Locks the exact formula ListBot uses to tell sellers if their listing is ready to publish.
when_to_use: Every ListBot scan. Every listing gets a Readiness Score before shipping to the seller.
version: 1.0.0
---

# The Listing Readiness Score Is LegacyLoop's Quality Gate

Every listing ListBot generates gets a Readiness Score from 0-100. This score tells the seller, at a glance, whether the listing is ready to publish or needs more work. The rubric is locked — it's the same for every item, every scan, every bot run.

## The 100-Point Formula (LOCKED)

Every listing earns points across six categories. The total is 100.

| Category | Max Points | Weight |
|---|---|---|
| Photos | 25 | 25% |
| Keywords | 20 | 20% |
| Description | 20 | 20% |
| Price Anchor | 15 | 15% |
| Condition Honesty | 10 | 10% |
| Compliance | 10 | 10% |
| **TOTAL** | **100** | **100%** |

## Photos (25 points max)

Scoring:
- **0 points:** Zero photos or all photos unusable
- **5 points:** 1-2 photos, basic quality
- **10 points:** 3-4 photos, acceptable quality
- **15 points:** 5-6 photos with hero + details
- **20 points:** 7-9 photos with hero + details + scale + flaw
- **25 points:** 10+ photos with full coverage (hero + three-quarter + details + scale + flaws + provenance)

Deductions:
- -5 if photos are blurry or poorly lit
- -5 if photos are all the same angle
- -5 if no scale reference for items >12 inches
- -5 if flaws are not documented (for high-value items)

## Keywords (20 points max)

Scoring:
- **0 points:** No keyword research, generic title
- **5 points:** Basic keywords, title includes category only
- **10 points:** Title includes maker OR model, decent coverage
- **15 points:** Title includes maker + model + year (or partial combo)
- **20 points:** Full maker + model + year + style + era, long-tail keywords in description

Deductions:
- -5 if keyword stuffing detected (density >20%)
- -5 if title is under 30 characters (underusing space)
- -5 if title has no keywords at all

## Description (20 points max)

Scoring:
- **0 points:** No description or single sentence
- **5 points:** Basic description, 100-200 words, minimal structure
- **10 points:** 200-500 words, some structure, covers basic facts
- **15 points:** 500-1000 words, five-section structure (hook/features/story/social proof/close)
- **20 points:** 1000+ words, complete five-section structure, category-appropriate length, social proof with comparables

Deductions:
- -5 if description has spelling/grammar errors
- -5 if description uses forbidden trigger words ("must sell," "need gone," "OBO in description")
- -5 if description is all one paragraph (no structure)

## Price Anchor (15 points max)

Scoring:
- **0 points:** No price or arbitrary price
- **5 points:** Price set but no comparables cited
- **10 points:** Price set within market range (from ReconBot comps)
- **15 points:** Price set with explicit comparable sales cited + platform-specific pricing strategy

Deductions:
- -5 if price is 30%+ above market range (overpriced)
- -5 if price is 30%+ below market range (underpriced)
- -5 if same price used on every platform (no platform-specific strategy)

## Condition Honesty (10 points max)

Scoring:
- **0 points:** No condition mentioned OR condition claim contradicts photos
- **3 points:** Basic condition stated ("used")
- **6 points:** Detailed condition assessment (cosmetic + functional)
- **10 points:** Detailed condition + flaw photos + honest disclosure of any repairs/restoration

Deductions:
- -10 if condition claim is false or photos contradict claim
- -5 if restoration/repairs not disclosed
- -3 if no functional condition note (for working items)

## Compliance (10 points max)

Scoring:
- **0 points:** Multiple compliance violations (prohibited keywords, VERO issues, category violations)
- **3 points:** Minor compliance issues (one or two risky phrases)
- **6 points:** No major violations, some risky language
- **10 points:** Full compliance — no VERO issues, no prohibited keywords, accurate category, provenance statement included

Deductions:
- -10 for any VERO violation
- -5 for platform category mismatch
- -3 for each prohibited keyword

## The Score Thresholds

Based on total score, the listing gets a readiness tier:

| Score | Tier | Recommendation |
|---|---|---|
| 90-100 | GOLD | Publish immediately |
| 75-89 | SILVER | Publish with minor tweaks (list the tweaks) |
| 60-74 | BRONZE | Revise before publishing (list the revisions needed) |
| 40-59 | NEEDS WORK | Significant improvements needed |
| 0-39 | NOT READY | Do not publish — major gaps |

## The Score Calculation Example

**Item:** 1958 Hans Wegner CH-25 lounge chair, $2,200 asking, 7 photos, 800-word description

Scoring:
- Photos: 20/25 (7 photos with hero, details, scale, but no flaw shot)
- Keywords: 20/20 (full maker + model + year + era combo)
- Description: 20/20 (five-section structure, 800 words, social proof from Wright auction)
- Price Anchor: 15/15 (price within comps, different per platform)
- Condition Honesty: 8/10 (detailed condition but no explicit repair disclosure)
- Compliance: 10/10 (no violations)

**Total: 93/100 — GOLD tier. Publish immediately.**

## Output Format

For every listing, populate a `listing_readiness_score` object:

```json
{
  "listing_readiness_score": {
    "total": 93,
    "tier": "GOLD",
    "breakdown": {
      "photos": 20,
      "keywords": 20,
      "description": 20,
      "price_anchor": 15,
      "condition_honesty": 8,
      "compliance": 10
    },
    "recommendation": "Publish immediately",
    "improvements_needed": [
      "Add a flaw shot for full 25/25 on photos",
      "Explicitly disclose no repairs/restoration in description"
    ]
  }
}
```

This is the locked rubric. Every listing gets this exact breakdown.
