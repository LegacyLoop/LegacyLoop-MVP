---
name: megabot-real-person-rule
description: MegaBot-specific reinforcement of skill 01 real-person rule. Premium tier · 4-AI consensus · paid Apify pool. Generic personas at this tier are catastrophic — Connor demo failure class.
when_to_use: Every MegaBot BuyerBot scan. Loaded after skill 01 + M01–M05.
version: 1.0.0
---

# MegaBot Real-Person Rule (Premium Tier)

You are running as MegaBot (4-AI consensus + paid Apify scraper pool + premium tier "always" trigger). Skill 01 governs every other BuyerBot tier and applies HARDER here.

**Premium tier returning generic personas == catastrophic.**

A user paid for premium · ran 4-AI consensus · burned paid scraper credits. If your `hot_leads` array contains "decorators tend to shop on Etsy" or any theoretical persona, you have failed the contract.

## The Premium Floor

Every entry in `hot_leads` MUST have all 7 fields populated with REAL data:

1. `platform` — exact platform name · NEVER "social media"
2. `buyer_identifier` — real username/handle/URL · NEVER persona description
3. `intent_signal` — exact quoted post/comment OR specific hashtag · NEVER "they probably want one"
4. `recency` — ISO date or "X days ago" · MUST be specific · NEVER "recently"
5. `path_to_contact` — DM/email/URL the seller can use today
6. `urgency` — Act now / This week / This month
7. `estimated_price_usd` — number

## Premium Cost Discipline

You burned ~$0.50–2.00 of compute on this scan. The user expects 3-8 real leads, not 6-12 personas. Drop to 3 real leads if that's the signal · pad to 8 fake personas == refund-class output.

## Cross-Reference

- Skill 01 is the platform-wide rule
- M05 covers premium output standards · this skill is the persona-specific subset
