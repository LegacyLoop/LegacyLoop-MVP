---
name: reddit-buyer-mining
description: How to mine Reddit for real buyers using subreddit hunting and user-history analysis.
when_to_use: Every BuyerBot scan for collectibles, hobbyist items, niche categories.
version: 1.0.0
---

# Reddit Is the Largest Self-Identifying Collector Database in the World

Reddit users self-segregate into hyper-specific hobby communities. A vintage Stanley hand plane collector is in r/handtools. A mechanical keyboard collector is in r/MechanicalKeyboards. Communities are named after what people collect.

## Step 1: Find the Right Subreddits

**Furniture:** r/MidCenturyModern, r/MCMFurniture, r/Antiques, r/FurniturePorn, r/Restoration

**Tools:** r/handtools, r/woodworking, r/whatisthisthing

**Watches:** r/Watches, r/Watchexchange, r/Rolex, r/OmegaWatches

**Cameras:** r/AnalogCommunity, r/photomarket, r/Hasselblad, r/leica

**Vintage Audio:** r/vintageaudio, r/audiophile, r/AVexchange, r/turntables

**Vinyl:** r/vinyl, r/VinylCollectors

**Toys/Figures:** r/ActionFigures, r/StarWarsToys, r/Transformers

Note: subscriber count, posts per day, WTB allowed?

## Step 2: Search for WTB Posts (per skill 02)

Within each subreddit: "WTB [item]", "looking for [item]", "ISO [item]", "[item] for sale". Filter past 30 days. Active WTB = hot lead.

## Step 3: User History Mining (the secret weapon)

This is where Reddit shines.

**Scan recent threads for active commenters.** Pull usernames who commented multiple times on category threads.

**Visit each user's profile** (reddit.com/user/whatever) — Comments tab shows all recent comments. Filter past 90 days. Count category-related comments.

**20+ category comments in 90 days = serious enthusiast.** Warm lead even without active WTB.

**Example flow:**
1. Search r/handtools for "Stanley plane"
2. Top thread: "Just acquired a Type 11 Stanley #4"
3. u/oldtoolworkshop has 4 detailed comments in the thread
4. Visit u/oldtoolworkshop profile
5. Past 90 days: 47 comments about vintage hand tools
6. Verdict: Serious buyer. Lead.

This is the "warm lead" path — their behavior screams "I buy this category constantly."

## Step 4: New Listing Comment Mining

When someone posts "look at my new acquisition" in a hobby sub:
- "where did you find that?" → warm leads
- "I've been hunting for one of these" → hot leads
- "How much did it cost?" → buyer-curious

Pull their handles.

## Step 5: Reddit DM Etiquette

1. Reference where you found them (the post, the comment)
2. Be specific about your item
3. Mention price or "fair market"
4. Keep it 3-4 sentences
5. Provide easy out — "If not, no worries"

**Sample DM:**
Hey u/teakcollector — saw your post in r/MCMFurniture last week looking for a CH-25. I have one in original paper cord. Asking $2,200, would consider $2,000 firm. Pickup in Maine or shipping at cost. Let me know if it's a fit, no worries either way!

## Output

Each Reddit lead populates the standard schema: platform (specific subreddit), identifier (u/username), intent_signal (WTB quote or user-history pattern), intent_recency_days, contact_path (Reddit DM link), match_score, match_reason.

Aim for 4-7 Reddit leads per scan when active subreddits exist.
