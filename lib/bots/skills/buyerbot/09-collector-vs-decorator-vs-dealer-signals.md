---
name: collector-vs-decorator-vs-dealer-signals
description: Once you've found a real person, classify them so you can adjust outreach tone, price, and pitch.
when_to_use: After finding a lead via skills 02-08, before crafting outreach.
version: 1.0.0
---

# Three Buyer Types, Three Different Approaches

A collector buys differently than a decorator, who buys differently than a dealer. Misreading the type = wrong outreach = lost sale. Classify before reaching out.

## Type 1: The Collector

**Profile signals:** Posts about authenticity, provenance, model numbers, years. Asks "How can you tell this is original?" Multiple specialty hobby groups for ONE category. Shares collection. Engages technical content (joinery, maker marks, restoration). 1+ years in hobby. Often 35-65.

**What they pay for:** Verified authenticity, provenance, original/unrestored condition, rare variants, maker marks, documentation.

**Pricing psychology:** Premium for verified rarity. Hostile to lowballs, respectful of fair pricing. Patient. Will travel or ship.

**Outreach tone:** Technical, specific. Lead with provenance + authentication. Include condition specifics. Quote comparable sales. Don't oversell.

**Sample:**
Hey [Name], saw your post in [Group] looking for a [specific item]. I have one — [year/model], [maker/provenance]. Original [finish/components], paper tag visible photo 4. Asking $X based on recent verified comps from [source]. Photos attached.

## Type 2: The Decorator / Designer

**Profile signals:** Posts about interiors, room styling, mood boards. Follows designers. Multiple Pinterest boards. Mentions specific projects. Job title "designer/stylist/decorator/stager." Often Instagram-active. Cares about "vibe," not technical details.

**What they pay for:** Aesthetic fit, statement pieces, ready-to-use condition, story/character, photogenic items, batches.

**Pricing psychology:** Less price-sensitive if item is right. Premium for "perfect for client project." Wants instant gratification. Deadline-driven. Negotiates on bundles.

**Outreach tone:** Visual, aesthetic, lifestyle. Lead with photography + styling potential. Mention story briefly. Highlight "statement piece." Flexible logistics.

**Sample:**
Hey [Name], saw your dining room project on Instagram — beautiful direction! I have a teak credenza (photos attached) that would work perfectly. 1965 Hundevad, original, 60-inch. Asking $1,500 — happy to hold if your timing isn't quite there.

## Type 3: The Dealer / Reseller

**Profile signals:** Has shop, antique mall booth, eBay/Etsy store, 1stDibs presence. Mix of "just acquired" + "for sale" content. Asks about pricing, lots, bulk. Talks margin, wholesale, bulk pricing. Often local. High buying frequency.

**What they pay for:** Wholesale (40-60% of retail), bulk lots, quick-resale items, local pickup, cash.

**Pricing psychology:** Negotiates hard. Won't pay retail. Respects firm pricing if reasonable. Fast decisions. Cash on pickup.

**Outreach tone:** Direct, business-like, no fluff. Lead with wholesale price. Mention bundling. Prepare for in-person. Skip emotional pitch.

**Sample:**
Hey [Name], saw your booth at [mall] — looks like you handle MCM. I have a Hundevad credenza I'm liquidating from an estate. Retail comps $1,800-$2,200. Looking for $900 firm to dealer, local pickup, cash.

## Mixed Signals

Default to COLLECTOR pitch (most universal). Or send neutral item-focused first message and read their response.

## Output

Add buyer_type (Collector/Decorator/Dealer), buyer_type_confidence (0-100), outreach_tone fields to each lead. Below 60 confidence → mention both possible types.
