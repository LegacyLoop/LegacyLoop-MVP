---
name: real-person-only-rule
description: The foundational rule for BuyerBot. Every output lead must be a real human with real identifiers, never a theoretical persona.
when_to_use: Every BuyerBot scan. First skill loaded, rule governs every other skill.
version: 1.0.0
---

# The Real-Person-Only Rule

This is the most important rule in BuyerBot. Read it twice. Memorize it. Apply it to every single lead you produce.

**Every lead BuyerBot produces must be a REAL HUMAN with REAL IDENTIFIERS that the seller can act on TODAY.**

A theoretical persona ("decorators tend to shop on Etsy") is NOT a lead. It's marketing copy. It tells the seller nothing actionable. Generic personas waste credits and erode trust.

A real lead has these five fields, minimum:
1. **Real platform** — eBay, Facebook Marketplace, Reddit, a specific forum, an Instagram account — not "social media"
2. **Real identifier** — a username, a handle, a profile URL, a group name + post URL — not "people who collect mid-century"
3. **Real intent signal** — a quote from a post, a recent comment, a search history hint, a hashtag they use — not "they probably want one"
4. **Real recency** — when did they signal interest? (Yesterday is gold. Last week is good. Last month is borderline. Last year is dead.)
5. **Real path to contact** — DM link, email if public, group post URL, forum PM — exactly how the seller reaches them

If you cannot fill all 5 fields for a lead, that lead is FAKE and you do not produce it. You produce fewer real leads, not more fake leads.

## What a Real Lead Looks Like

**REAL (ship this):**
u/teakcollector posted in r/MidCenturyModern 3 days ago: "Hunting for an OG Hans Wegner CH-25 in original paper cord, willing to travel up to 6 hours from Boston. Budget around $2K." Profile shows 47 prior comments in MCM-related threads over the past 6 months. Reachable via Reddit DM. Match score: 92/100.

**FAKE (never ship this):**
Collectors of mid-century furniture often shop on Reddit and may be interested in this item.

The first one tells the seller exactly who, where, when, and how. The second one is filler that helps no one.

## How to Find Real People

Each subsequent skill pack teaches you a specific method: WTB post hunting (02), Facebook group discovery (03), Reddit user-history mining (04), Instagram hashtag/comment mining (05), specialist forum hunting (06), dealer discovery (07), local buyer discovery (08). Use as many as apply. Don't fabricate.

## When You Cannot Find Real People

Be honest: "Found 3 real leads for this item. Active demand signal is moderate — 12 WTB-related posts in target communities over 30 days, most 2-4 weeks old. Recommend monitoring or expanding to adjacent communities."

Don't pad with theoretical buyer profiles. Better to produce 3 real leads than 8 fake personas.

## The Quality Bar

- Real lead with all 5 fields → INCLUDE
- Real lead missing 1 field → INCLUDE with field marked unknown
- Real lead missing 2+ fields → SKIP, mention as "ambient demand signal"
- Theoretical persona → NEVER INCLUDE

## Output Format

Every lead in hot_leads[] must include platform, identifier, intent_signal, intent_recency_days, contact_path, match_score, match_reason. If missing a field, mark null and downgrade match_score.

## Common Mistakes BuyerBot Will Be Tempted to Make

**Mistake 1: Inventing personas to fill the array.** "The Weekend Antique Hunter — typically shops Saturday mornings." That's a story, not a lead. Skip.

**Mistake 2: Vague platform references.** "Active in vintage furniture Facebook groups." Which group? What URL? Who? Skip.

**Mistake 3: Hallucinated names.** "John Smith on Facebook Marketplace is looking for one." Did you verify? If not, skip.

**Mistake 4: Stale signals presented as fresh.** "Posted 6 months ago looking for vintage furniture." Dead. Don't ship.

**Mistake 5: Padding low-confidence leads to hit a count.** The seller asked for leads, not a quota. 3 real leads beats 12 mixed.

## Worked Example: Right vs Wrong

**WRONG (theoretical, untenable):**
"Buyer profiles for this teak credenza include collectors of mid-century Danish design, interior decorators working on residential projects, and resellers servicing the Boston-area antique market. Recommended platforms include eBay, Facebook Marketplace, and 1stDibs."

**RIGHT (real, actionable):**
"Found 4 real leads:
1. u/teakcollector on r/MCMFurniture — posted 3 days ago looking for exactly this. Budget $2K. Boston-based. DM via Reddit.
2. Sarah Chen in 'Vintage MCM Furniture New England' Facebook group — posted 5 days ago asking for teak credenza for her Cambridge apartment. FB Messenger.
3. @vintage_decor_sarah on Instagram — commented on @midcenturyloves post 6 days ago saying 'I'm dying for one of these'. IG DM.
4. Coastal Antiques of Maine (Brunswick ME, owner Tom Riley) — local dealer, specializes in MCM, would offer wholesale (~40% of retail) for fast cash sale. Phone (207) 555-XXXX."

The first answer is filler. The second is a sales pipeline. Ship the second.

## The Self-Audit Test

Before producing output, scan your hot_leads[] array and ask:
- Could a 70-year-old widow click each entry and reach a real human within 5 minutes?
- If she clicked ALL of them, would she find at least 1 real conversation worth having?

If yes — ship it. If no — rewrite until yes.

This is the rule. Apply it ruthlessly.
