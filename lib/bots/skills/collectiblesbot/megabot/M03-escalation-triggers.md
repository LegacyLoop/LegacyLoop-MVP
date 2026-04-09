---
name: collectiblesbot-megabot-escalation-triggers
description: Defines when MegaBot must recommend professional grading submission, specialist authentication, or human review rather than publishing a value estimate. Covers photo inspection limits, population report red flags, autograph authentication, 1-of-1 handling, and how to communicate the cost-benefit case for PSA submission.
when_to_use: "MegaBot scans only. CollectiblesBot MegaBot lane."
version: 1.0.0
---

# Escalation Triggers: When MegaBot Defers to Specialists

## Purpose

Four AI agents analyzing a collectible in parallel are collectively powerful but not omniscient. There are specific conditions under which publishing a value estimate would be irresponsible — either because the required information cannot be obtained from photographs alone, or because the item's characteristics place it in a category where specialist handling changes the outcome dramatically. This skill defines those conditions, specifies the escalation response, and provides the language to communicate the deferral clearly and helpfully.

---

## Category 1: Physical Inspection Limits of Photography

### Surface Assessment for Chrome and Foil Cards

Chrome-process cards (Topps Chrome, Bowman Chrome, Prizm, Select, Optic, and related products) have reflective surfaces that photograph poorly under typical seller conditions. Holo scratches, print lines, surface bubbles, and silvering are frequently invisible in flat overhead photography. These defects can mean the difference between a PSA 10 and a PSA 8 — often a 60 to 90 percent difference in realized price.

Escalation trigger: Any chrome, prizm, or foil-surface card being evaluated for a grade above 8 must carry an explicit disclaimer that surface assessment requires physical inspection under direct light at multiple angles. The MegaBot output must not publish a confident 9 or 10 estimate for a chrome card based on photographs alone.

### Centering Verification

Centering as photographed is not the same as centering as measured. Lens distortion, camera angle, and photo cropping all affect how centering appears in an image. PSA centering standards are measured as percentage ratios on physical cards. What appears to be 55/45 centering in a photo could measure 65/35 on a physical card.

Escalation trigger: Any card where centering is close to the threshold for the next grade up (within visual tolerance of a grade break) must carry a note that physical measurement is required to confirm. Do not publish a confident high-grade estimate when centering appears marginal.

### Pre-War and Vintage Card Texture

Cards manufactured before 1970 often have surface textures, paper stocks, and print characteristics that affect grade in ways that are not photographically detectable. Toning, paper brittleness, and surface clarity of early Topps, Bowman, and regional issues require hands-on inspection under controlled lighting. T206, E-era, and pre-war tobacco cards in particular have a range of surface conditions that look similar in photographs but grade very differently.

Escalation trigger: Any pre-war or pre-1970 card with a potentially significant value (any card with a PSA 9 or 10 value above $500 based on comp data) should include a professional grading submission recommendation.

---

## Category 2: Population Report Red Flags

### Ultra-Low Population Items (Pop 1-5)

When PSA, BGS, or CGC population data shows fewer than 5 copies of an item in a given grade or higher, the item is in specialist territory. The value curve for ultra-low-pop items is not linear — each additional copy in the pop can have a measurable price impact, and pricing based on standard comp methods is unreliable.

Escalation trigger: Any item with a reported population of 5 or fewer in top grade must be flagged as requiring specialist handling. MegaBot should provide a wide value range (minimum 2x spread between low and high), explain the pop scarcity explicitly, and recommend engagement with a specialist dealer or major auction house rather than direct eBay listing.

### Sudden Pop Anomalies

A pop that has grown dramatically in a short period (e.g., more than doubling in 12 months for a previously low-pop item) may indicate a hoard discovery, set submission, or fraud event. Pop anomalies that are recent and not explained by a known market event (a player's career milestone, a major auction, a set release anniversary) should be flagged for investigation before pricing.

Escalation trigger: If comparative pop data shows a pop increase of more than 100 percent in 12 months for any top-grade designation, flag this in the output and withhold high-confidence pricing until the cause is understood.

### Items with No Population Data

Some items have legitimately never been submitted to a grading service — rare regional issues, promotional items, test prints, and proof cards among them. If an item appears to match a known card but has no population data, there are two possibilities: it is genuinely rare and has simply never been submitted, or it is a variation, counterfeit, or misidentified item.

Escalation trigger: Any item with no PSA or BGS population data for its apparent identity must include a specific note that unsubmitted status creates unusual pricing uncertainty, and the item should be authenticated before a value is published.

---

## Category 3: Autograph Authentication

### Third-Party Authentication Requirement

Signed cards, comics, photos, and memorabilia require third-party autograph authentication before any value estimate above the unsigned item value should be published. JSA (James Spence Authentication), PSA/DNA, and Beckett Authentication Services are the primary authentication authorities.

An unverified autograph — regardless of how genuine it appears in photographs — should never be priced as authenticated. The difference in value between a verified and unverified signature on a significant piece can exceed 80 percent.

Escalation trigger: Any item with a signature that is not encased in an authenticated graded holder (PSA/DNA slab, Beckett Authentication slab, or JSA certified) must be valued at unsigned item value with an explicit note that authentication would unlock additional value and that the current estimate does not include any signature premium.

### In-Person Signatures and COAs

Certificates of Authenticity from sellers, private dealers, or non-accredited sources do not substitute for third-party authentication. A COA from an unknown source has zero market weight with sophisticated buyers.

Escalation trigger: If a seller presents a private COA as the basis for an autograph premium, the output must note that the COA does not represent third-party authentication and that the estimate treats the item as unsigned. Include the expected value uplift from authentication (JSA or PSA/DNA) so the seller understands the financial incentive.

---

## Category 4: 1-of-1 and Printing Plate Items

### Logistical Super-Rarities

1-of-1 cards (SSP parallels labeled 1/1), printing plates, and similar unique items require individualized auction strategy, not standard market comps. There are no direct comps for a 1/1 by definition. Value is determined by the player, the year, the set, current market conditions, and the specific buyer pool at auction.

Escalation trigger: Any confirmed 1-of-1 or printing plate must be escalated to major auction platform recommendation (Heritage, Goldin, PWCC) rather than standard marketplace pricing. MegaBot should provide a contextual value estimate based on comparable unique items at auction but label it as a reference range, not a reliable market price.

### Variation and Error Cards

Short print variations, type A/type B distinctions, and print error cards require positive identification before pricing. Many cards have look-alike variations where the difference between a common and a rare short print is a small difference in background image, color tone, or character pose. Misidentification of a variation as a base card (or vice versa) can result in a value estimate that is off by 10x.

Escalation trigger: Any card suspected of being a short print variation must include a specific note to verify the variation designation against a reliable set checklist before pricing.

---

## Category 5: AI Grading Confidence Threshold

### Minimum Confidence to Publish

MegaBot should not publish a specific grade estimate when its aggregate confidence score across four agents falls below 50 percent. Below 50 percent confidence, the output should instead provide a condition description and a wide value range corresponding to the plausible grade range.

A consensus of four agents that spans more than two full grade points (e.g., Agent 1 says 7, Agent 2 says 8, Agent 3 says 8.5, Agent 4 says 9) represents a dispersion that should trigger a broad range output rather than a point estimate.

Escalation trigger: When four-agent grade consensus spans more than 1.5 points, publish a range output labeled "conditional on grade," showing what the item is worth at each plausible grade level, and recommend submission for definitive grading.

---

## Communicating the PSA Submission Recommendation

When MegaBot recommends professional grading submission, the recommendation must include the financial case in concrete terms. Abstract recommendations to "consider grading" are not useful.

### The Submission Cost-Benefit Format

Present the following structure:

Current estimated value (raw, ungraded): [low] to [high]
Estimated value if grades PSA 9: [value from APR]
Estimated value if grades PSA 10: [value from APR]

PSA standard service fee (current): [published fee at time of analysis]
Expected grading turnaround: [current published turnaround]

Break-even grade: PSA [X] — the card must grade at least [X] for submission to have positive expected value

Upside scenario (grades PSA 10): net gain of approximately [dollar amount] after fees
Downside scenario (grades PSA 8 or below): net loss of approximately [dollar amount] after fees, though the graded slab may be easier to sell and represents verified authenticity

### Risk Language

Do not use the submission recommendation to promise a specific grade outcome. The recommendation must include language acknowledging that grading outcomes are uncertain, that the break-even analysis assumes a specific grade result, and that the seller accepts the risk of a lower grade.

---

## Escalation Language Reference

When communicating an escalation decision to a seller, the tone must be informative and decisive — not apologetic or vague.

Appropriate language: "Physical inspection is required before a reliable grade estimate can be given for this chrome surface. Based on the available photos, the card photographs well, but holo scratches and surface defects that affect grade are not reliably visible in photographs of this type. We recommend submitting to PSA before pricing."

Inappropriate language: "It's hard to tell from photos." "We're not sure what this would grade." "You might want to consider getting it graded."

The escalation should explain the specific reason, the specific threshold that triggered it, and the specific next step the seller should take.
