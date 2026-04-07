---
name: platform-policy-compliance
description: Every platform has prohibited keywords, categories, and practices. Violating them gets listings removed or accounts banned. Know the rules before you write.
when_to_use: Every ListBot scan. Compliance is mandatory, not optional.
version: 1.0.0
---

# Listings That Get Removed Don't Sell

Every major platform has policies that restrict what you can list, how you can list it, and what language you can use. Violating these policies gets listings removed at best, accounts banned at worst. ListBot must know these rules cold.

## eBay VERO (Verified Rights Owner) Program

VERO is eBay's intellectual property enforcement system. Certain brands and manufacturers have filed with eBay to automatically flag listings using their trademarks without authorization.

**VERO-protected brands (partial list — assume trademarked brands are protected):**
- Apple, Microsoft, Sony, Nintendo (electronics)
- Nike, Adidas, Under Armour (athletic wear)
- Louis Vuitton, Gucci, Prada, Chanel (luxury)
- Disney, Marvel, Lucasfilm (entertainment IP)
- Rolex, Omega, Patek Philippe (watches)

**Rules:**
- You CAN list authentic used items from these brands
- You CANNOT use the brand's logo, product photos, or marketing copy
- You CANNOT claim "NEW" unless it's sealed original packaging
- You CANNOT list counterfeits (obviously)

**Safe language:** "Authentic vintage [brand] [model]" + your own photos + accurate condition description

**Unsafe language:** "Brand new [brand]," "official [brand] photos," "straight from [brand] factory"

## Etsy's Vintage 20-Year Rule

Etsy's "vintage" category requires items to be at least 20 years old (as of listing date). This is non-negotiable and enforced.
- 2026 listing: item must be from 2006 or earlier to be "vintage"
- 2026 listing: item must be from 1926 or earlier to be "antique"

Items 1-19 years old are "pre-owned" or "used," not "vintage." Misusing "vintage" gets listings removed.

## Facebook Marketplace Community Standards

Facebook Marketplace prohibits:
- Weapons (even legal ones)
- Alcohol, tobacco, firearms ammunition
- Animals (even rehoming pets)
- Adult content
- Medical items and services
- Recalled items
- Digital content and services
- Items lost/found
- Real estate (mostly — some exceptions)

Facebook Marketplace also has VAGUE rules about "counterfeit or unauthorized" items that get enforced unpredictably. Don't use brand names in titles without clarification ("vintage Coach" instead of "Coach").

## Craigslist Flagging Rules

Craigslist has community-driven flagging. Common reasons listings get flagged:
- All caps in title
- Posting in wrong category
- Spam-like language ("WOW," "MUST SELL," "BEST PRICE")
- Multiple similar postings in short time
- Mentioning competitor platforms ("also on eBay")
- External links in description
- Phone numbers in title

Keep it factual, follow the category, and post each listing once per week maximum.

## Prohibited Keywords Across All Platforms

These words often trigger review or removal:
- "Guaranteed authentic" (unverifiable claim, use "authentic" instead)
- "Investment grade" (financial advice implication)
- "Will appreciate in value" (financial advice)
- "Brand new" (unless literally new)
- "Limited edition" (unless provable)
- "Rare" (unless provable)

Use evidence-based language: "Rare — only 47 documented examples" instead of "rare."

## The Safe Substitution Rules

| Risky phrase | Safe substitution |
|---|---|
| "Brand new" | "New in original packaging" or "Unused" |
| "Rare" | "Limited production" + specific evidence |
| "Authentic" | "Original [maker name]" + provenance |
| "Guaranteed" | "Verified by [source]" |
| "Investment grade" | "Collector quality" |
| "Will appreciate" | "Growing collector interest" |

## Category-Specific Restrictions

### Vintage Clothing
- No counterfeit designer items
- Leather products from endangered species (crocodile, elephant) prohibited
- Fur items allowed but flagged in some regions

### Watches
- Counterfeit "homage" watches prohibited
- Replacement parts (dials, hands) must be disclosed
- "Frankenwatches" (assembled from mixed parts) must be disclosed

### Cameras
- Lens mold must be disclosed
- Film camera "guaranteed working" requires recent test roll photo
- Digital camera sensor cleaning history requested

### Tools
- Counterfeit Snap-On / Matco tools prohibited
- Electrical tools must state cord/plug condition
- Pneumatic tools must state pressure test history

### Jewelry
- Precious metal marks must match actual metal
- Gemstone claims must be verifiable
- "Diamond" vs "diamond-like" matters legally

## The Provenance Disclosure Rule

For any item over $500, include a provenance statement:
- "From a Maine estate, owned since 1968"
- "Single-owner since new, original paperwork included"
- "Purchased from [dealer name] in 2010"

Provenance builds trust and preempts authenticity questions.

## Output Format

For every listing, populate a `compliance_check` field:

```json
{
  "compliance_check": {
    "vero_safe": true,
    "platform_keyword_violations": [],
    "prohibited_claims": [],
    "provenance_statement": "From a coastal Maine estate, single owner since 1968",
    "safe_language_used": true
  }
}
```

If any compliance issues are found, list them explicitly so the seller can correct them BEFORE publishing.
