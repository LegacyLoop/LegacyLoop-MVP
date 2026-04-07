---
name: facebook-group-buyer-discovery
description: How to find the right Facebook groups and identify active members who buy in the seller's category.
when_to_use: Every BuyerBot scan, especially for furniture, decor, antiques, vehicles, and local-pickup items.
version: 1.0.0
---

# Facebook Groups Are Where Local Buyers Live

Facebook is the largest marketplace for in-person, local-pickup items in the US. The buyers don't browse Marketplace; they live in dedicated groups.

## Group Discovery Search Patterns

For each item type, search Facebook for:
- "[ITEM CATEGORY] Buy Sell Trade [REGION]" — e.g., "Vintage Furniture Buy Sell Trade New England"
- "[ITEM CATEGORY] Collectors" — e.g., "Mid-Century Modern Furniture Collectors"
- "[ITEM CATEGORY] Enthusiasts" — e.g., "Vintage Tool Enthusiasts"
- "[REGION] Estate Sale Hunters" — e.g., "Maine Estate Sale Hunters"
- "[ITEM CATEGORY] Restoration" — for restored categories (furniture, cars, watches)
- "[BRAND] Owners Group" — e.g., "Stickley Furniture Owners"

Filter candidate groups for:
- Member count > 1,000
- Posts per day > 3
- Public or "Closed with request" (Secret groups can't be searched)

## Identifying Active Buyers Within a Group

Scan recent posts (past 30 days) for:

1. Direct WTB posts (skill 02)
2. Comments on for-sale posts saying "Where else do you have? I'm collecting these"
3. Active question-askers ("Is this a real Stickley? I'm looking to buy one")
4. Posts showing recent acquisitions ("Just picked this up at an estate sale!")
5. Negotiation threads showing active buying behavior

Each produces a real-person lead. Pull username + profile URL.

## The 5-Lead Quality Filter

- Posted/commented past 30 days (active)
- Multiple posts about category over 90 days (genuine interest)
- Profile shows location reasonably close OR mentions shipping
- Profile shows real human (not business/spam)
- Buyer-like engagement (asks questions, comments on prices)

4+ matches = real lead. 3 = borderline. 2 or fewer = noise.

## Group Etiquette + Cold Outreach Rules

1. **NEVER spam-blast members** — gets seller banned
2. **Comment first, DM second** — engage genuinely in their post first
3. **Mention group context** — "I saw you looking for [X] in [Group Name]"
4. **Respect group rules** — some forbid DMs unless buyer asks
5. **Don't reach out to multiple members at once**

Buyer discovery is finding people. Outreach is reaching them respectfully (skill 13).

## Reading a Facebook Profile for Buyer Signals

Scan for:
- Recent posts about the category (last 90 days)
- Group memberships (other related groups = stronger signal)
- Profile photo style (collector vibes)
- Cover photo (hobby indicator)
- Bio mentions of the hobby
- Location (local pickup relevance)

Profile with 5+ category posts in 6 months = much stronger lead.

## Marketplace vs Groups

Facebook Marketplace = passive browsing bargain hunters.
Facebook Groups = active hobby buyers at fair prices.

For LegacyLoop sellers, GROUPS usually fit better unless item is common (Marketplace scale) or bulky/cheap (Marketplace reach).

## Output

Each Facebook group lead populates the standard hot_leads schema: platform (specific group name + member count), identifier (buyer name + profile URL), intent_signal (quote post text), intent_recency_days, contact_path (post URL), match_score, match_reason.

Aim for 3-5 Facebook group leads per scan when category matches. Fewer if data isn't there. Never fabricate.
