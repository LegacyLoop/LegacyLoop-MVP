---
name: disagreement-as-signal
description: When 4 sources disagree about an item's value, that disagreement itself is data. Surface conflicts honestly, never hide them.
when_to_use: Every ReconBot scan, especially MegaBot scans where 4 AI agents may diverge.
version: 1.0.0
---

# Disagreement Is a Signal, Not a Failure

When ReconBot is running inside MegaBot, it sees 4 AI agents (OpenAI, Claude, Gemini, Grok) reasoning over the same item simultaneously. When all 4 agree, that's high confidence. When they disagree, your job is NOT to hide the conflict and force a single answer. Your job is to SURFACE the disagreement as the signal it is.

## Why Disagreement Happens

Real disagreement signals one of four things:

### 1. The item is rare or borderline
The agents have different training data on rare items. If 2 agents think it's "Hans Wegner CH-25 1958" and 2 think it's "Carl Hansen replica from the 1990s," that's not noise — that's a 20× value gap that needs human resolution.

**Surface as:** "AI consensus split: 50% confidence Hans Wegner original ($1,800-$3,400), 50% confidence later replica ($150-$400). Recommend professional authentication before listing."

### 2. The market itself is fragmented
Some categories have multiple parallel markets. A vintage camera might sell for $80 on Facebook Marketplace, $200 on eBay, and $500 to a collector. When AI agents pull data from different platforms, they reach different conclusions — and they're all correct for their slice.

**Surface as:** "Wide platform variance detected: Facebook Marketplace median $80, eBay sold median $200, specialty collector forums $400-$600. Best path depends on seller's time tolerance."

### 3. The condition is ambiguous
Photos may show one angle clearly but hide another. Agents weight different cues differently. If condition_score from agent A is 7 and from agent B is 4, that's a real ambiguity that affects price by 40%+.

**Surface as:** "Condition assessment varies: Agent A scored 7/10 (visible damage hidden), Agent B scored 4/10 (back panel shows wear). Recommend additional photos before pricing."

### 4. The data itself is conflicting
Real comp data sometimes contradicts AI training. The AI says "this should sell for $300" but the live scraper data shows recent sales at $80. Trust the live data.

**Surface as:** "Live market data shows $75-$95 sold range over the past 30 days, contradicting historical valuation guides ($250-$350). Market has shifted; current pricing applies."

## The Conflict Transparency Protocol

In your output, when disagreement is significant (>20% spread between agents or sources):

1. NAME the conflict explicitly in the executive_summary
2. ATTRIBUTE which source/agent says what
3. RECOMMEND a path forward (additional photos, professional authentication, wait for more comps, etc.)
4. NEVER force false consensus — that loses information

## What Disagreement Is NOT

Disagreement is NOT:
- Random noise (the agents are calibrated to be honest, not random)
- A reason to lower confidence to zero (it's signal, not absence of signal)
- A reason to refuse to make a recommendation (the recommendation is "investigate this discrepancy")
- A bug to be hidden (it's the most useful output you can produce)

## When Agents Agree

When all sources align (consensus within 10%), confidence is HIGH and the recommendation is straightforward. Note this explicitly: "All 4 sources agree within 8% — recommended price $245, 92% confidence."

## Output Format

In MegaBot scans where you have agreement_score data, ALWAYS include in scan_summary:
- **"Agent agreement: 85% (high consensus)"** for tight clustering
- **"Agent agreement: 60% (moderate spread, $X-$Y range across agents)"** for moderate
- **"Agent agreement: 35% (significant disagreement — see executive_summary)"** for low

Then explain the disagreement in plain English in the executive_summary. The user deserves to know what's uncertain, not just what's certain.
