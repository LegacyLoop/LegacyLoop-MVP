---
name: web-search-buyer-queries
description: Web search query templates for finding real buyer demand. Citation-first, recency-biased, evidence-trail required.
when_to_use: When BuyerBot has web search capability available. Run alongside skills 02-08 to verify and enrich per-platform discovery.
version: 1.0.0
---

# Use Web Search to Verify, Not to Fabricate

Web search is BuyerBot's strongest tool for confirming that a real human signaled real intent recently. **Every search you run must terminate in either (a) a verifiable URL added to `web_sources`, or (b) an honest "found nothing" note.** No fabricated citations. No "as of my training data" — that defeats the purpose.

This skill is the search playbook. Skill 01's five-field rule still governs everything you keep.

## Query Templates

Substitute the item context (`itemName`, `category`, `brand`, `subcategory`) into these patterns. Run as many as apply; stop when you have 3-5 verified signals or when you've exhausted the list.

### Demand discovery (where buyers signal want)
1. `"${itemName}" wanted` — surfaces WTB posts across Reddit, Facebook, Craigslist, eBay's "want it now" archives
2. `"${category} buy sell" facebook group` — finds active FB groups for the category
3. `r/[subreddit] WTB ${itemName}` — Reddit-scoped search for in-progress threads
4. `"${ai.brand || ""} ${itemName}" ISO OR "looking for"` — collector forum + niche community phrasing
5. `site:craigslist.org "${category} wanted"` — local + regional CL "wanted" sections

### Comparable demand (who is bidding/buying right now)
6. `site:ebay.com "${itemName}" sold` — completed listings → real buyers, real prices
7. `"${itemName}" auction result` — auction houses, LiveAuctioneers, Heritage
8. `"${itemName}" recent sale OR sold price` — collector blogs, dealer sites

### Social signal discovery
9. `instagram.com "#${category.replace(/\s/g, "")}collector"` — hashtag inhabitants → potential buyers
10. `tiktok.com "${itemName}"` — viral or niche cultural signals
11. `pinterest.com "${itemName}" board` — collectors who curate this category

## Citation Discipline (Required)

For **every** lead you produce that came from a web search, the `web_sources` array entry must include:

```json
{ "url": "https://...", "title": "...", "found_evidence": "1-sentence quote or paraphrase of the intent signal" }
```

If you cannot quote the actual evidence, do not ship the lead. This is skill 01's "Real intent signal" field made operational — the URL plus the evidence quote IS the audit trail.

## Recency Bias (Required)

Skill 01 §3 ranks signals: **yesterday is gold, last week is good, last month is borderline, last year is dead.** Apply it to every web result:

- Posts > 30 days old → downgrade `match_score` and mark `intent_recency_days`
- Posts > 90 days old → demote to ambient demand commentary in `executive_summary`, do not ship as `hot_lead`
- Posts > 1 year old → do not cite at all; treat as historical context only

When a result has no visible date (forum threads without timestamps, archived pages), state it in `found_evidence`: `"Date unverifiable; treating as ambient signal."`

## When Web Search Is Disabled or Empty

If the underlying provider has no web search or the search returned nothing:

- Set `web_sources: []`
- In `executive_summary`, state plainly: `"Web search unavailable for this run — leads below are derived from item-context patterns plus prior platform knowledge. Recommend re-running with web search enabled before outreach."`
- Downgrade every `hot_lead` `match_score` by 20 points to reflect the lower confidence

Honesty about absent evidence is more valuable than fabricated citations.

## Reference Back

- **Skill 01 §"What a Real Lead Looks Like"** — the gold standard for what an intent_signal + URL looks like
- **Skills 02-08** — per-platform discovery techniques; this skill provides the search queries that feed those skills
- **Skill 19** — counts and padding rules apply to web-derived leads the same as any other
