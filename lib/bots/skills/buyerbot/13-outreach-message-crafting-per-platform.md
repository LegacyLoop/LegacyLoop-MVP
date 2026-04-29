---
name: outreach-message-crafting-per-platform
description: Craft outreach messages that get responses, customized per platform culture and buyer type. v1.1.0 adds Specificity Floor — Action Completability section ported from inline route prompt.
when_to_use: After producing hot_leads[], generate personalized outreach for each.
version: 1.1.0
---

# Outreach Is the Difference Between Finding a Buyer and Getting a Sale

Finding a real buyer is half the work. Reaching out so they respond is the other half. Get platform culture right, response rate doubles.

## The Universal 4-Sentence Anatomy

**1. Specific reference**
"Hey, saw your post in [specific group/sub] about looking for a [specific item]..."
Proves you're not spam.

**2. The match**
"I have one — [year/maker/spec] in [condition]."
What you have, briefly.

**3. The action**
"Photos and price here: [link]. Happy to answer questions."
Easy click.

**4. Soft close**
"No worries either way — just thought I'd reach out since it sounded like a great match."
Lower pressure.

**Total: 4 sentences. Maybe 5. Never 6+.**

## Platform-Specific Rules

### Reddit DM
- Reddit distrusts bots
- Lead with Reddit-context ("saw your post in r/...")
- Casual language
- NO external links in first message (Reddit auto-flags). Say "happy to share photos"
- 3-4 sentences max
- "Cheers" not "Best regards"

**Sample:**
Hey! Saw your WTB post in r/MCMFurniture looking for a Hans Wegner CH-25. I have one — 1958, original paper cord, brass tag visible. Asking $2,200 (room to discuss). Happy to send photos if interested. Cheers!

### Facebook Messenger
- More casual than Reddit
- Photos in first message OK
- "Hi" or "Hey" not "Hello"
- Mention group name explicitly
- One emoji OK
- 4-6 sentences OK

**Sample:**
Hi Sarah! Saw your post in Vintage MCM Furniture New England about looking for a teak credenza. I have one that fits — 1965 Hundevad, 60 inches, original condition (photos attached). Asking $1,500, local pickup in Maine or delivery to Cambridge for $50. Let me know if you'd like more info, no rush!

### Instagram DM
- Visual-first
- Lead with photo
- Reference where you saw them
- 2-3 sentences max
- One emoji if natural
- No formal language

**Sample:**
Hey! Saw you commenting on @midcenturyloves about loving teak credenzas — I have one (photo attached). 1965 Hundevad, original condition, $1,500. Let me know if you'd like more pics.

### Forum PM
- Most formal
- Full sentences, proper grammar
- Reference specific thread/subforum
- Detail on condition, provenance, history
- Forum tenure if applicable
- 5-7 sentences normal

**Sample:**
Hello [Username],

I noticed your WTB thread in the Vintage Marantz subforum looking for a 2270 in working condition. I have one that might fit — original 1973, fully working, recently serviced by [shop], all original tubes, cosmetic 8/10 (minor top scratches, no major issues).

Asking $1,500, fair given recent WTS comparables. Maine location, ship CONUS at cost or local pickup in New England.

Photos attached. Happy to provide more details or audio recordings if helpful.

Best,
[Seller]

### Email (dealers)
- Most formal
- Subject: "[Item type] available — [key spec]"
- Greeting + intro
- Details + condition
- Price + flexibility
- Photos attached
- Signature with phone

**Sample:**
Subject: Vintage Hundevad teak credenza available — 60-inch, 1965, original

Hello Tom,

I'm reaching out regarding a teak credenza I'm liquidating from a Maine estate. Based on your shop's focus on mid-century New England estates, thought it might interest you.

Details:
- Hundevad (Denmark), 1965
- 60 inches wide, 18 deep, 30 tall
- Original teak finish, no refinishing
- Original brass hardware
- Cosmetic 8/10 — minor surface wear
- Provenance: Maine estate, single-owner since 1968

Asking $900 to dealer (vs ~$1,800 retail). Open to bundle pricing on other estate items.

Photos attached. Brunswick pickup or hold for visit.

Best regards,
[Seller]
(207) 555-XXXX

### Phone Call (dealers, high-value)
- Older dealers prefer phone
- Scripted: item, source, price
- Offer photo follow-up via text/email
- Under 2 minutes

## Per-Lead Personalization

Generic templates are spam. Personalize every outreach:
- Reference their EXACT words
- Match their tone (formal vs casual)
- Adjust to buyer type (skill 09)
- Match platform culture

## Output

In outreach_strategies[] or per-lead, generate custom script for top 3-5 leads only. Include lead_id, platform, outreach_script (full message), send_method, best_send_time.

## Specificity Floor — Action Completability

Ported from the legacy inline route prompt (CMD-BUYERBOT-V2-EXTRACT-INLINE, Apr 2026). Every outreach strategy must clear the **Action Completability Floor**: a 70-year-old seller can complete the action in under 2 minutes without follow-up questions.

### What "specific enough to act on" looks like

Each outreach strategy must include a concrete action the seller can take **right now**, not "post on Facebook" or "reach out to dealers." Use one of these patterns:

- **Facebook group:** "Join the Facebook group `[GROUP NAME]` (URL) and post your item with these photos."
- **Reddit:** "Search Reddit `r/[SUBREDDIT]` for 'WTB [ITEM]' posts from the last 30 days and reply to user `u/[handle]`."
- **Dealer email:** "Email `[DEALER NAME]` shops in `[AREA]` (e.g. Coastal Antiques of Maine, Brunswick) using the template above."
- **Instagram:** "Message `@[HANDLE]` on Instagram — they post `[CATEGORY]` items regularly. Lead with the photo."
- **Forum:** "Post in `[FORUM NAME] > [SUBFORUM]` (URL) replying to thread `[THREAD TITLE]`."

### Parametric requirements

Message templates must include the **actual** values from item context, not placeholders:
- ITEM NAME (the real `itemName`, not `[ITEM]`)
- PRICE (the real `midPrice` or `listPrice`, not `$X`)
- CONDITION (the real `condLabel`, not `[CONDITION]`)
- LOCATION (Maine, the seller's town if available, not `[LOCATION]`)

Generic placeholders are spam-quality. Personalized templates with real values are sales-quality.

### URLs, names, handles — never invent

Include specific URLs, group names, subreddit names, and Instagram handles **only when the scraper data, web search, or your verified knowledge confirmed they exist**. Do not invent group names, subreddits, dealer shops, or handles to make the output look richer. Skill 01's hallucination prohibition (Mistake 3) applies to this skill too.

### The 2-minute test

Before shipping any `outreach_strategy`, ask:
- Can the seller copy this message into the named platform without editing?
- Is the destination (group, sub, handle, email address) verifiable?
- Will the recipient understand who is contacting them and why, in one read?

If any answer is no, rewrite or skip. Better fewer outreach strategies that work than many that fail the test.
