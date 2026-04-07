---
name: alert-severity-tiers-and-triggers
description: Four-tier alert framework with explicit triggers. Prevents alert fatigue by reserving urgent for actually urgent.
when_to_use: Every ReconBot scan when generating the alerts[] array.
version: 1.0.0
---

# Alert Severity Tiers

You have FOUR severity levels to choose from. Choosing the right one is the difference between a useful tool and a noisy distraction. Most amateur monitoring tools fire URGENT alerts for everything. You will not.

## URGENT (red — immediate action this hour)

Reserved for events that DEMAND action within the hour or the seller loses real money. Examples:
- A direct competitor just listed the same item at 30%+ below the user's price
- The user's listing is the highest priced of 8+ active comps and has been stale for 21+ days
- A confirmed bot/scraper is targeting the user's listing (price-tracking buyer behavior)
- A duplicate of the user's exact item just sold for 2× the user's asking price (your seller is severely underpriced)

**Trigger:** Time-sensitive AND reversible if acted on immediately.

**Cap:** Maximum 1 urgent alert per scan. If multiple urgents fire, escalate the most critical and demote the others.

## HIGH (orange — action within days)

Significant change that affects the user's pricing strategy. Action within 2-3 days. Examples:
- 3+ new competitors listed in the past 7 days
- Average sold price dropped 15%+ in the past 30 days
- User's listing is now the most expensive of 5+ comps
- A new sold comp closed at a price that contradicts the user's recent valuation

**Trigger:** Material change in market position, not yet critical.

**Cap:** 1-2 HIGH alerts per scan.

## MEDIUM (yellow — action this week)

Notable trend that affects long-term strategy. Action within the week. Examples:
- Market is shifting from buyer's to seller's market (or vice versa)
- A new platform is showing strong sales for this item type (e.g., Etsy is suddenly selling vintage furniture better than eBay)
- Seasonal demand is approaching (e.g., 3 weeks until peak season for this category)
- A specific buyer persona (collector, dealer, decorator) appears active in recent sales

**Trigger:** Strategic insight that helps the user plan, not panic.

**Cap:** 2-3 MEDIUM alerts per scan.

## LOW (blue — informational, no action required)

Background context that's interesting but not actionable today. Examples:
- A famous auction house just sold a similar item (provenance reference)
- A new trend article was published about this category
- A celebrity or influencer mentioned the item type
- General market sentiment data

**Trigger:** Educational value, builds the seller's intuition over time.

**Cap:** 1-2 LOW alerts per scan.

## The Total Cap

**Maximum 5 alerts per scan, maximum 1 URGENT.**

If you would generate more than 5, prioritize by severity, then by time-sensitivity. The goal is signal, not noise.

## When NOT to Fire an Alert

- When the underlying data is older than 14 days (the market may have already moved)
- When confidence in the data is below 60%
- When the alert would just restate something already in the scan_summary
- When firing it would cause the user to act in a way that hurts them (e.g., panic-dropping price based on a single outlier comp)

## Required Fields per Alert

Every alert MUST include:
- **type** (PRICE_DROP / NEW_COMPETITOR / SIMILAR_SOLD / MARKET_SHIFT / OPPORTUNITY / UNDERCUT_ALERT / SEASONAL_WINDOW)
- **severity** (LOW / MEDIUM / HIGH / URGENT)
- **title** (8-12 words, action-oriented)
- **message** (2-3 sentences, plain English, what changed and why it matters)
- **suggested_action** (1 specific step the user should take)
- **data** (the underlying numbers — comp count, price delta, days, etc.)

If you can't fill all 5 fields, you don't have enough signal to fire the alert. Skip it.
