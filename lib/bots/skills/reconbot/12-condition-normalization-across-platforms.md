---
name: condition-normalization-across-platforms
description: Standardize condition terminology across eBay, Facebook, Mercari, Etsy, Craigslist into a unified 1-10 scale for honest comp comparison.
when_to_use: Every ReconBot scan that pulls comps from multiple platforms with different condition labels.
version: 1.0.0
---

# Every Platform Lies About Condition Differently

Each platform uses its own condition vocabulary, and the same physical item gets labeled differently depending on where it's listed. A "good" rating on Facebook Marketplace is closer to "fair" on eBay. You must translate everything to a unified scale before comparing prices.

## The Platform Condition Label Mess

### eBay (most rigorous)
- **New** — never used, original packaging
- **New (Other)** — new but no original packaging or tags
- **Manufacturer Refurbished** — restored to like-new by manufacturer
- **Seller Refurbished** — restored by seller, may have minor cosmetic issues
- **Used** — has visible wear consistent with use
- **For Parts or Not Working** — broken / incomplete

For collectibles / antiques:
- **Mint** — no flaws, museum quality
- **Excellent** — minor cosmetic flaws only
- **Very Good** — small visible wear
- **Good** — moderate visible wear, fully functional
- **Acceptable** — significant wear, may need repair
- **Poor** — major damage

### Facebook Marketplace (least rigorous)
- **New** — usually means "barely used" not actually new
- **Like New** — light use
- **Excellent** — moderate use (lower than eBay's "excellent")
- **Good** — well-used but functional
- **Fair** — significant wear
- **Used** — generic catch-all

### Mercari
- **Like New** — minimal wear
- **Good** — visible wear, functional
- **Fair** — significant wear
- **Poor** — heavy wear or damage

### Etsy
- **Vintage** (the umbrella term — implies 20+ years old, expected wear)
- **Antique** (100+ years old)
- Plus subjective descriptors: "lovingly worn," "patina," "character"

### Craigslist
- No standard condition labels
- Description-based ("works great," "needs TLC," "as-is")
- Buyer beware

## The Unified 1-10 Scale

Use this scale for all internal calculations:

| Score | Description | Maps to eBay | Maps to FB | Maps to Mercari |
|---|---|---|---|---|
| 10 | Mint, museum-quality, original packaging | New | New | Like New |
| 9 | Excellent, minor flaws barely visible | Very Good | Like New | Like New |
| 8 | Very Good, small visible wear | Good | Excellent | Like New |
| 7 | Good, moderate wear, fully functional | Good | Good | Good |
| 6 | Above average for age, all function | Acceptable | Good | Good |
| 5 | Average / typical age-appropriate wear | Acceptable | Fair | Fair |
| 4 | Below average, visible damage | For Parts | Used | Fair |
| 3 | Significant damage, partial function | For Parts | Used | Poor |
| 2 | Major damage, may not function | For Parts | Used | Poor |
| 1 | Broken / for parts only | For Parts | Used | Poor |

## How to Apply Normalization to Comp Data

When pulling comps:
1. Read each comp's condition label
2. Translate using the table above to a 1-10 score
3. Group comps by score band (1-3, 4-6, 7-8, 9-10)
4. Compare the user's item ONLY to the matching band
5. Adjust price expectations within the band

## The Condition Premium

Within a category, condition affects price approximately:
- **Score 10 vs 7:** +50-100% premium
- **Score 9 vs 7:** +25-50% premium
- **Score 7 (baseline):** market median
- **Score 5 vs 7:** -25-40% discount
- **Score 3 vs 7:** -50-75% discount
- **Score 1 vs 7:** -80-95% discount (parts value only)

These multipliers vary by category — antiques tolerate more wear than electronics, for example. Adjust based on category-specific knowledge.

## When Photos Contradict the Listed Condition

Sellers often optimistically rate their items. If you can see the photos in the comp data, trust the photos over the label:
- Listed "excellent" but photos show chips and stains: treat as score 5-6
- Listed "fair" but photos show pristine condition: treat as score 8-9 (some sellers are too modest)

## Output Format

When reporting comp data, normalize and surface the score:

**"5 comps in your condition band (score 6-7): median $215"**

vs the amateur version:
- "5 comps: median $215" (which mixes condition tiers and is misleading)

Always show the user that you compared apples to apples.
