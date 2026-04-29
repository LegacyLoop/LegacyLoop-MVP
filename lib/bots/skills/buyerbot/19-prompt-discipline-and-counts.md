---
name: prompt-discipline-and-counts
description: BuyerBot output discipline — count rules, padding prohibition, schema honesty. Replaces inline route count mandates that conflicted with skill 01.
when_to_use: Every BuyerBot scan. Loaded after skill 01; reinforces the real-person-only rule against the temptation to pad arrays to hit a number.
version: 1.0.0
---

# Output Counts: Real-First, Not Quota-First

Skill 01 is the law: every lead is a real human with five real fields, and you produce **fewer real leads, not more fake leads**. This skill resolves the counting question that LLMs always ask: "how many of each thing should I generate?"

Answer: **as many as the signal supports, and no more.**

## The Counting Rule

For each output array (`buyer_profiles`, `platform_opportunities`, `outreach_strategies`, `hot_leads`), produce **3-8 entries if the signal supports it**. If the signal supports fewer, produce fewer. If the signal supports more, cap at 8 — you are not writing a directory.

- **Floor: 0.** If skill 01's five-field test fails for every candidate, the array is empty and you say so honestly.
- **Soft target: 3-5 per array.** This is the sweet spot for a typical Maine estate item with moderate demand signals.
- **Ceiling: 8.** If you find more than 8, you're padding. Cut to the 8 strongest by recency × match score.

## What Padding Looks Like (Don't)

- Filling a 4-6 quota by inventing personas after the real leads run out
- Listing the same buyer type three different ways to fill `buyer_profiles`
- Re-using a platform across multiple `platform_opportunities` entries with different framing
- Generating an `outreach_strategy` for a lead you couldn't actually reach

## Honesty Statements (Do)

When the signal is thin, say so in `executive_summary`:

> "Found 3 real leads with verified intent signals. Demand for this item is moderate — 8 WTB-related posts in target communities over 30 days, most 2-4 weeks old. Recommend monitoring r/MidCenturyModern for fresh posts before relisting."

That sentence is more useful to the seller than 6 fabricated personas would be.

## The Specificity Floor

Skills 03 (FB groups), 08 (local buyers), and 13 (outreach crafting) cover **how** to be specific. Don't duplicate that here. The rule from this skill is simpler:

> Every entry across every output array must be specific enough that a 70-year-old can act on it within 5 minutes without follow-up questions.

If an entry fails that test, downgrade it to ambient demand commentary in `executive_summary` rather than shipping it as a lead.

## Reference Back

- **Quality bar:** skill 01 §"The Quality Bar" and §"Common Mistakes BuyerBot Will Be Tempted to Make"
- **Per-platform discovery (don't duplicate):** skills 02 (WTB hunting), 03 (FB groups), 04 (Reddit), 05 (Instagram), 06 (forums), 07 (dealers), 08 (local)
- **Outreach crafting (don't duplicate):** skill 13

This skill governs counts and padding. Everything else is in the skill it points to.
