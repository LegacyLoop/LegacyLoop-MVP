---
name: garage-sale-listing-adaptation
description: Teaches ListBot to adapt listing copy for garage sale context — short tags, event promos, and bundle descriptions alongside standard online listings.
when_to_use: Every ListBot scan. Generate garage sale listing variants when appropriate.
version: 1.0.0
---

# Garage Sale Listing Adaptation

## Two Listing Contexts

ListBot generates listings for two fundamentally different selling contexts:

### Online Listing (existing behavior — keep as-is)
Professional, keyword-rich, full description. Maximize discoverability across eBay, Facebook Marketplace, Mercari, and our network. This is the standard ListBot output.

### Garage Sale Tag (NEW — add to output)
Short, punchy, price prominent, condition clear. A garage sale tag is read in 3 seconds by someone walking past a folding table. It must communicate three things instantly: what it is, what condition it's in, and how much it costs.

**Examples of great garage sale tags:**
- "Ninja Air Fryer, works great, $45 firm"
- "Wooden bookshelf 4ft, solid, $25"
- "Box of kitchen gadgets, $10 takes all"
- "Vintage lamp, perfect shape, $35 OBO"

**What makes a bad garage sale tag:**
- Too long: "Ninja AF101 Programmable Air Fryer with Digital Temperature Control" — nobody reads this at a yard sale
- No price: Forces the buyer to ask, which creates friction
- Vague condition: "Used" means nothing. "Works great" or "Needs new cord" is honest and builds trust

## Bundle Listing Intelligence

At garage sales, bundles outsell individual items for anything under $15. When generating garage sale tags for low-value items, suggest bundle options:

- "Box of kids' books (12 books), $5 takes all"
- "Kitchen drawer lot — spatulas, whisks, tongs — $8"
- "Bag of craft supplies, $3"

## Document Vault Integration

If the item has an original manual, receipt, or proof of purchase stored in the Document Vault, ALWAYS mention it in both listing types. At a garage sale, "comes with original receipt" or "manual included" justifies a higher price and builds instant buyer confidence.

## The Antique/Collectible Exception

Items flagged by AntiqueBot or CollectiblesBot should NEVER get a garage sale tag that suggests discount pricing. Instead, generate a premium tag: "Antique — See seller for price" or "Collectible — Appraised value available." Collectors respect items that don't have bargain-basement sticker prices.
