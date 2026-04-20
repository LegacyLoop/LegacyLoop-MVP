---
name: photobot-megabot-escalation-triggers
description: >
  Defines when MegaBot PhotoBot must escalate beyond scoring and
  recommend re-shoot, specific missing-angle capture, or seller
  clarification. Covers focus and exposure failures, missing primary
  angles, watermark/stock-image provenance flags, trust-signal
  weighting, maker-mark and serial-number capture requirements, and
  the musical-instrument-specific escalation triggers (truss-rod
  cover, neck joint, finish-checking photography). Aligns with
  MEGA_PHOTO priorityAction + secondaryActions + missingShots.
when_to_use: "MegaBot scans only. PhotoBot MegaBot lane."
version: 1.0.0
---

# PhotoBot MegaBot Skill: Escalation Triggers

## Purpose

MegaBot PhotoBot does not return "add more photos" as a generic
instruction. It returns specific, named, actionable escalations
— the priorityAction field of MEGA_PHOTO demands the single
highest-impact change the seller should make RIGHT NOW, and
secondaryActions returns exactly three next-most-important
follow-ups. This skill defines what triggers each escalation and
how to name the specific re-shoot or missing-angle request so
the seller knows exactly what to do.

A specialist-grade PhotoBot output never says "please improve
lighting." It says: "Re-shoot photo 3 with the window to your
left instead of behind you — the current backlighting is hiding
the headstock logo that Reverb buyers search for."

---

## The Escalation Hierarchy

Escalations in PhotoBot fall into five tiers by severity. Each
tier has a specific treatment in the output:

1. **Listing-blocker** — the listing cannot publish successfully
   with these photos. Goes into priorityAction with mandatory
   language.
2. **Conversion-damaging** — listing will publish but will
   underperform by 20-40 percent. Goes into priorityAction or
   first secondaryAction.
3. **Competitive-gap** — listing is below category median for
   top-quartile performance. Goes into secondaryActions.
4. **Polish-opportunity** — minor improvement for premium
   presentation. Goes into secondaryActions or trustSignals
   commentary.
5. **Information-only** — observation that doesn't require
   action. Noted in competitiveEdge or buyerEmotionalTrigger.

The priorityAction must be the single highest-impact change. If
there are multiple listing-blockers, the one with highest sales
impact goes in priorityAction; the rest distribute into
secondaryActions and missingShots.

---

## Tier 1: Listing-Blockers (priorityAction candidates)

### Blur and focus failure

When ANY photo in the set shows motion blur, significant out-
of-focus softness, or camera shake, the listing is effectively
disabled on most marketplaces. Buyer hesitation skyrockets
when they cannot see the item clearly.

**Specific trigger:**
- Subject plane softer than 60 percent of what a modern phone
  can deliver under good light
- Motion trail visible on any edge
- Double-vision effect from shake

**priorityAction output format:**
"Re-shoot photo [N] — the subject is out of focus. Use your
phone's tap-to-focus by tapping on the [specific feature,
e.g. 'headstock logo'] before pressing the shutter. Hold the
phone with both hands and brace your elbows against your
body to eliminate shake."

### Severe under-exposure or over-exposure

When exposure is so extreme that condition details are lost
entirely — blown whites where you can't see wood grain, or
crushed shadows where you can't see hardware — the photo
fails its purpose.

**Specific trigger:**
- Blown highlights: more than 15 percent of the subject is
  pure white (255,255,255)
- Crushed shadows: more than 15 percent of the subject is
  pure black (0,0,0)
- Exposure compensation appears to be off by more than 1.5
  stops in either direction

**priorityAction output format:**
"Re-shoot photo [N] with the lighting changed. The current
photo has blown-out bright areas where we can't see the
[specific feature, e.g. 'finish detail']. Move the item away
from direct sunlight and shoot in indirect daylight near a
large window."

### Missing primary angle on required category

For categories where primary angles are non-negotiable (MI
headstock, antique furniture back elevation, jewelry
hallmark, vehicle VIN), a listing without that angle is
listing-blocking.

**Specific trigger:**
- Category has a mandatory angle per M01 photo-count table
- That angle is absent from the photo set

**priorityAction output format:**
"Add a photo of the [specific missing angle]. For a Dean
electric guitar, buyers on Reverb expect to see a close-up
of the headstock showing the logo and serial number before
they'll consider making an offer. Shoot this from about 18
inches away with even lighting."

### Watermark or stock image detected

A resale listing with watermarked or manufacturer product
imagery is a scam signal that many platforms block
automatically.

**Specific trigger:**
- Visible watermark from stock photo services
- Manufacturer product shot (transparent background, studio
  lighting too clean for a resale)
- Reverse-image-search hit on public catalog imagery

**priorityAction output format:**
"CRITICAL: Photo [N] appears to be a stock image or
manufacturer product shot, not an in-hand photo of your
actual item. Before this listing can publish, you need to
take new photos of the exact item in your possession.
Buyers and platforms both flag stock imagery as a scam
signal."

---

## Tier 2: Conversion-Damaging (priorityAction or first
secondaryAction)

### Single-angle-only on multi-angle-required category

A musical instrument listing with only a full-body front
photo is listing-blocking under Tier 1. But a furniture
listing with front + back + one detail (only 3 photos where
8 are warranted) is conversion-damaging without being fully
blocking.

**Specific trigger:**
- Photo count below category minimum (per M01 table) but
  above 1-2 photos

**priorityAction output format:**
"Add [specific count] more photos. Antique furniture
listings convert 2-3x better with full angle coverage. At
minimum: back, left side, right side, and one joinery
close-up."

### Obstructed view on hero shot

Primary subject partially obscured by hand, cord, ribbon,
tag, other item.

**Specific trigger:**
- Defining feature (logo, mark, hardware) partially blocked
  in hero shot

**Response format:**
"Re-frame the hero shot. Your hand is covering the top-right
corner of the item, which hides [specific element]. Set the
item on a table and photograph from 3-4 feet away instead of
hand-held."

### Background clutter on hero shot

Buyers scrolling feeds scan the first photo in 0.3 seconds.
A cluttered background sends the "didn't care" signal that
reduces click-through by 15-25 percent on feed-based
platforms.

**Specific trigger:**
- Background contains 3+ unrelated items
- Background signals "in the middle of a move" or "garage
  before cleanup"
- Pet, child, partner visible

**Response format:**
"Re-shoot the hero photo against a clean backdrop. A white
bedsheet taped to a wall works fine. The current background
is showing [specific element, e.g. 'laundry basket and
children's toys'] which is distracting buyers from the
item."

### Inconsistent lighting across set

Mixed white balance, some photos in daylight and others in
tungsten, creates visual incoherence that suggests the
photos may not all be of the same item.

**Specific trigger:**
- Color cast varies by more than 500K between photos
- Some photos are blue-cast and others are orange-cast
- Exposure varies by more than 1.5 stops across the set

**Response format:**
"Re-shoot the set under consistent lighting. Pick one
location (window, daylight, same time of day) and shoot all
angles in one session. The current set has mixed lighting
that makes the photos feel disconnected."

---

## Tier 3: Competitive-Gap (secondaryActions)

### No scale reference

Missing scale reference is not listing-blocking, but it
leaves buyers guessing on size. Common on small items
(jewelry, ceramics, electronics).

**Specific trigger:**
- No scale reference in any photo
- Category is one where size is not obvious from context

**Response format:**
"Add one scale reference photo. Place a common object
(ruler, quarter, your hand, a sheet of printer paper) next
to the item so buyers can tell the actual size."

### No damage close-up despite visible damage

A photo set that shows damage in a wide shot but doesn't
dedicate a close-up undermines trust. Buyers who spot the
damage in the wide shot wonder what else is being hidden.

**Specific trigger:**
- Damage visible in 1+ wide shot
- No close-up of that damage in the set

**Response format:**
"Add a dedicated close-up of the [specific damage, e.g.
'dent on the upper rail']. Documenting condition issues
openly is a top trust signal for vintage and used item
buyers — it shows you're honest about what you're selling."

### Maker mark or serial number not readable

Category-specific trust signal. Required for MI, watches,
jewelry, many antiques.

**Specific trigger:**
- Category expects maker mark / serial / hallmark visibility
- No photo shows this clearly readable

**Response format:**
"Add a close-up of the [specific mark location]. For a Dean
MLX, the serial number on the back of the headstock is the
key authentication signal buyers check. Shoot this close-up
with indirect lighting to avoid glare on the stamp."

### Missing context shot for category where it matters

Some categories (furniture, home decor, lifestyle items)
sell better with one in-environment shot that helps buyers
visualize ownership.

**Response format:**
"Add one context shot showing the [item] in a room setting.
For furniture, buyers often want to see the item next to a
known-size reference (door, chair, window) to understand
scale and proportion."

---

## Tier 4: Polish-Opportunity (secondaryActions tail or
trustSignals)

### Slight background improvement available

- Home environment photo could be made cleaner with 5-minute
  prep
- Visible wrinkle in backdrop cloth
- Minor distraction at edge of frame

### Warmer lighting available

- Photos shot under cool daylight where the category (Etsy
  vintage, antique furniture) would benefit from golden-hour
  or indoor warm light

### Additional detail shot available

- One more close-up (pickup on MI, drawer dovetail on
  furniture, clasp on jewelry) would push the listing into
  top 10 percent of category

---

## Tier 5: Information-Only

Observations that inform competitiveEdge, buyerEmotionalTrigger,
or trustSignals commentary but don't demand seller action:

- Photo set quality is already above category median
- Specific hero-shot choice is aligned with platform-
  specific best practice
- Condition documentation is transparent and builds trust
- Seller has clearly invested in photography quality

---

## Special Case: Provenance Red Flags

Beyond watermark and stock-image detection, other provenance
flags that warrant escalation:

### Modern-looking photos on claimed vintage item

When a seller lists a claimed "vintage 1970s" item but the
photos show modern white seamless background with studio
lighting, the mismatch raises authentication questions.

**Response format:**
"The photos are studio-grade which is great — but because
this is a claimed vintage item, buyers will also want to
see at least one in-hand 'as-found' photo to verify
authenticity. Add one wider shot showing the item in your
home environment."

### Warehouse-looking photos on individual-seller listing

When photos show what appears to be a retail or warehouse
environment (fluorescent lighting, industrial shelving,
commercial tile floor) on an individual-seller listing,
buyers wonder whether the seller is actually a reseller or
dealer.

**Response format:**
"Context — is this item from a personal collection or a
business inventory? If personal, consider re-shooting in
your home for a more authentic 'individual seller' feel. If
this is from a business, that's fine, but mention it in
your description so the warehouse-style photos make sense."

### Photos that don't match each other

When different photos in the set appear to be of different
items (slightly different color, different wear patterns,
different accessories), raise the red flag.

**Response format:**
"Photos 2 and 4 appear to show items with slightly different
[specific feature, e.g. 'finish color']. If these are both
the same item, re-shoot under consistent lighting so the
item reads as one. If they're different items, make sure
you're only photographing the specific item you're listing."

---

## Musical-Instrument-Specific Escalations

The canonical Dean MLX test fixture surfaces MI-specific
escalations the 4-AI team should recognize.

### Missing headstock logo close-up

**Trigger:** Dean, Fender, Gibson, Epiphone, or other major
brand where logo authentication matters, and no close-up of
the headstock logo in the set.

**Response:** "Add a close-up of the headstock logo. For a
2008 Dean MLX, the Dean 'D' logo shape, decal quality, and
logo position are all authentication signals that
collectors and Reverb buyers verify."

### Missing serial number close-up

**Trigger:** Musical instrument in the set with no readable
serial number anywhere.

**Response:** "Add a close-up of the serial number, usually
on the back of the headstock. This serves as the primary
authentication reference for Reverb buyers."

### Missing neck joint (heel) shot

**Trigger:** Electric guitar or bass with no photo of the
heel / neck joint.

**Response:** "Add a photo of the neck joint (the heel,
where the neck meets the body). This shows whether the
guitar is set-neck, bolt-on, or through-neck construction
— a major value signal for collectors."

### Missing pickup close-up(s)

**Trigger:** Electric instrument with no close-up of
pickups.

**Response:** "Add close-up photos of each pickup. Pickup
configuration (stock vs swapped, single-coil vs humbucker
vs active) affects price by 15-25 percent. Buyers want to
see pickups clearly before offering."

### Missing truss-rod cover detail

**Trigger:** Applicable MI with no close-up of truss-rod
cover.

**Response:** "Add a close-up of the truss-rod cover on
the headstock. Some MLX reissues have collector-relevant
markings or matching serial numbers on the cover."

### Missing fret close-up on claimed "player grade" or
condition-sensitive listing

**Trigger:** Claimed player-grade or condition-significant
MI with no fret close-up.

**Response:** "Add a close-up photo of the frets. Fret wear
is the primary condition signal for player-grade MI
pricing. Missing this photo keeps buyers guessing and
reduces offers."

### Missing finish-checking documentation on vintage

**Trigger:** Claimed pre-1980 or vintage MI with no close-
up of finish checking or crazing.

**Response:** "If this guitar has finish checking or crazing,
photograph it openly — collectors VALUE period-appropriate
finish checking as authenticity evidence. Don't hide it."

---

## How Escalations Compose Into MEGA_PHOTO Output

### priorityAction

Single highest-impact Tier 1 or strongest Tier 2 escalation.
Written as specific step-by-step instruction.

### secondaryActions (exactly 3)

Next three highest-impact escalations from Tier 2 and Tier 3.
Ordered by sales impact (high to medium).

### missingShots (up to 12)

Every Tier 2 and Tier 3 missing-angle request. Each populated
with shotName, why, howToShoot, salesImpact, platformsThatNeedIt.

### purchaseBarriers

Any Tier 1 or Tier 2 issues that would make a buyer hesitate.
These are phrased from the buyer's perspective rather than as
seller instructions.

### trustSignals

Tier 5 information-only observations about what the photo set
does well, plus positive framing of any Tier 3 damage close-
ups (transparency = trust).

---

## Framing the Escalation to the Seller

Escalation communication matters. The senior-friendly tone
established in existing PhotoBot base pack 15 applies here
even within MegaBot output.

### Correct framing

"Your photos are doing [specific good thing]. To take the
listing to the next level, the highest-impact change is
[specific action]. Here's exactly how to do it: [step-by-
step]."

### Incorrect framing

"Your photos need work. Add more photos and fix the
lighting."

The correct framing acknowledges effort, names the specific
gap, and provides a concrete action. The incorrect framing
is vague and discouraging.

### The 2:1 encouragement ratio from base pack 15

For every one improvement suggestion, PhotoBot coaching
includes at least two specific compliments. This discipline
applies at the MegaBot tier too — priorityAction opens with
what works, then names the improvement. trustSignals pulls
out 3-5 genuine positives that the seller has already
earned.

The discipline is not flattery — it is communication strategy
that increases the likelihood the seller acts on the
coaching.
