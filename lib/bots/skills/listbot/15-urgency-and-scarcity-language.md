---
name: urgency-and-scarcity-language
description: Legitimate scarcity language that converts without being spammy. When to use it, when to avoid it.
when_to_use: Every ListBot scan generating listing copy, especially for rare or time-sensitive items.
version: 1.0.0
---

# Urgency and Scarcity Work — When They're Real

Legitimate urgency and scarcity are powerful conversion tools. They tell the buyer "this won't be here long, act now." Fake urgency is also effective — in the short term — but destroys long-term trust and gets listings flagged.

ListBot should use LEGITIMATE urgency and scarcity language. Never fake it.

## Legitimate Scarcity Signals

These are always true (for the right items):

### "Only X documented examples exist"
Use when: Rare items with auction databases confirming rarity.
**Example:** "Only 47 documented examples of the 1958 CH-25 with original paper cord have been sold at auction in the past decade."

### "One of [small number] made"
Use when: Production numbers are verifiable.
**Example:** "One of approximately 2,500 CH-25 chairs produced between 1958-1962."

### "First-generation production"
Use when: Item is from initial production run, verifiable by paper tag, mold, or serial number.
**Example:** "First-generation 1958-1962 production, confirmed by the paper tag under the seat."

### "Original [part] never replaced"
Use when: Original component is unusual for the item's age.
**Example:** "Original paper cord seat, never replaced — extremely rare for a CH-25 of this age, since most have been re-corded at least once."

### "Last of its kind"
Use when: Production has genuinely ended and no modern equivalents exist.
**Example:** "Made by Carl Hansen & Søn during their original CH-25 production run — modern reissues use different cord and joinery techniques."

## Legitimate Urgency Signals

These create honest time pressure:

### "Moving sale"
Use when: Seller genuinely has a deadline.
**Example:** "Moving sale — need to sell by end of month."

### "Estate clearance"
Use when: Item is from an estate being liquidated.
**Example:** "Part of an estate clearance — all items must be sold within 30 days."

### "Listing one day only" (auction)
Use when: Short auction format.
**Example:** "24-hour auction — starts $500, no reserve."

### "Will relist at higher price"
Use when: Truly willing to hold item.
**Example:** "Current price reflects fast-sale discount. Will relist at $2,500 next month if no interest at $2,000."

### "Subject to local sale"
Use when: Item is also being offered locally.
**Example:** "Available online but subject to local sale — may be sold to a Maine buyer this weekend."

## Forbidden Fake Urgency

NEVER use these (they're dishonest and often detected):

### "Only 1 left!"
...when you have a unique item. Every item is "1 left" if it's one-of-a-kind. Using this phrase is manipulative.

### "Price increases tomorrow"
...unless you actually plan to raise the price. Fake deadlines destroy trust.

### "High demand — act fast"
...without evidence. If demand is real, show it (auction comps, number of watchers, recent inquiries).

### "Limited time offer"
...without a real reason. What time limit? Why? Without a real answer, this is spam.

### "Everyone is asking about this"
...fabricated social proof is fraud-adjacent.

### "Won't last long"
...without evidence. Commitment-phobic buyers see through this.

## The Evidence-Based Urgency Framework

Every urgency/scarcity claim should have EVIDENCE:

| Claim | Evidence required |
|---|---|
| "Rare" | Number of documented examples + source |
| "One of few" | Production data + source |
| "Original parts" | Visual confirmation (photo) + comparison |
| "Last of kind" | Production history + date |
| "Moving sale" | Deadline date |
| "Estate clearance" | Estate context |
| "Will relist higher" | Specific new price + date |

If you can't provide evidence, don't make the claim.

## The Social Proof Integration

Legitimate scarcity pairs well with social proof:

**Weak:**
"This is rare."

**Strong:**
"Wright Auctions sold a comparable 1958 CH-25 in original paper cord for $3,400 in March 2026. Only 6 documented examples in original condition have sold at major auction in the past 5 years."

The second version gives the buyer verifiable confidence.

## The Avoidance of Pressure Tactics

Even legitimate urgency can be delivered too aggressively:

**Too aggressive:**
"ACT NOW — this won't last! BUY IMMEDIATELY!!"

**Professional:**
"Given the rarity and documented comparable sales, I expect this to move quickly. Message me with questions."

The second version is more effective because it respects the buyer's intelligence.

## Platform-Specific Urgency Tolerance

### eBay
- Low tolerance for hype
- Use "auction ends soon" or "Buy It Now price expires [date]" sparingly
- Never use multiple exclamation points

### Etsy
- Very low tolerance for urgency tactics
- Focus on scarcity (one-of-a-kind, rare) not urgency
- Never "act now" language

### Facebook Marketplace
- Medium tolerance
- "Moving sale" and "estate clearance" acceptable
- Avoid "must sell" (invites lowballs)

### Craigslist
- Medium tolerance
- "Moving" or "must go" acceptable if true
- Keep it factual

### 1stDibs / Chairish
- Zero tolerance for urgency/scarcity language
- Professional tone only — let the item speak

## Output Format

When generating listing copy, check every urgency/scarcity claim against the evidence rule:

```json
{
  "scarcity_claims": [
    {
      "claim": "Original paper cord seat, never replaced",
      "evidence": "Visual confirmation in photos 3-5, no replacement stitching visible",
      "confidence": 92
    },
    {
      "claim": "Only 47 documented CH-25 chairs with original cord sold at auction",
      "evidence": "Wright Auctions archive 2015-2025",
      "confidence": 85
    }
  ],
  "urgency_claims": []
}
```

If a claim has no evidence, strip it from the listing. Never ship unsupported scarcity or urgency language.
