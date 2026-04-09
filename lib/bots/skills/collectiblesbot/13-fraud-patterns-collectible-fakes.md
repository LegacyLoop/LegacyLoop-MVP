---
name: fraud-patterns-collectible-fakes
description: The fraud detection rubric for collectibles. Fake PSA/BGS slabs, trimmed cards, reprint detection, sneaker fakes, counterfeit watches, restored comics, cleaned coins, forged signatures. Maps observed red flags to four-tier forgery risk score.
when_to_use: Every CollectiblesBot scan. Unlike antiques (where fraud is a provenance concern), collectibles fraud is rampant and often sophisticated.
version: 1.0.0
---

# Collectibles Fraud — What The Grading Services Miss

The collectibles market is flooded with fakes. PSA and BGS catch most slab fakes, but sophisticated operations sell fake slabs with real-looking holograms. Even genuine-looking raw items can be reprints, trimmed, or restored in undisclosed ways. Your job is to recognize the red flags early and protect the seller.

The four-tier forgery risk score mirrors AntiqueBot's rubric:

| Risk tier | Meaning | Action |
|---|---|---|
| LOW | No red flags, item presents normally | Proceed with estimated grade |
| MODERATE | One minor inconsistency | Note flag, widen confidence band |
| HIGH | Multiple inconsistencies or one disqualifying fact | Recommend in-person authentication before selling |
| CONFIRMED | Disqualifying evidence | Call it out firmly, do not provide a value estimate |

## Fake Slabs (Cards)

Real PSA, BGS, SGC, and CGC slabs have specific holograms, label fonts, and UV-reactive features:
- **PSA** — recent slabs have a flip-front hologram, embedded security fiber, and a specific label paper that does not photocopy well
- **BGS** — Beckett slabs have an embedded hologram on the back, subgrade box alignment, and specific corner rounding
- **SGC** — tuxedo-holder (2018+) has a specific label print and interior fit
- **CGC** — comic-grading style slab with holographic border

Red flags for fake slabs:
- Label printing quality below authentic reference
- Hologram alignment off by more than 1 mm
- Slab edges glued or seamed (real slabs are ultrasonically sealed)
- Cert number does not appear in the service's online lookup
- Cert number appears but the card inside is different from the cert record

**Always verify cert numbers via the service website** (psacard.com/cert, beckett.com/grading/verify-grade, cgccomics.com/certlookup). A fake slab with a real cert number is a "slab swap" — the hardest fraud to detect.

## Trimmed Cards

A trimmed card has been shaved at the edges to create a false illusion of better centering or sharper edges. Trimming is disqualifying — PSA and BGS reject trimmed cards, and reputable sellers note them. Red flags:
- Edge cleaner and sharper than the rest of the card (eye-doesn't-match)
- Card measures SHORTER than factory specs (each card set has documented measurements)
- Border width unusually thin on one side
- Centering too perfect for a vintage card

For cards estimated over $500, recommend in-person measurement against a factory reference before grading.

## Reprints and Counterfeits

Reprints are exact or near-exact copies of vintage cards made years later. Some are legitimate (official Topps reprint series) but marketed with the original set name. Counterfeits are unauthorized copies sold as originals. Red flags:
- **Cardstock thickness** differs from original (originals often have specific gsm)
- **Print dot pattern** differs — look at a high-magnification photo; modern reprints use finer CMYK dots
- **Color saturation** too bright (modern inks) or too dull (aged imitation)
- **Back printing** — text clarity, font choices, statistics
- **Fluorescence under UV** — many originals don't fluoresce; many reprints use paper brighteners that glow

Commonly counterfeited cards: 1952 Topps Mickey Mantle, 1986 Fleer Jordan, 1933 Goudey Babe Ruth, 1979 O-Pee-Chee Gretzky, 1st Edition Shadowless Charizard.

## Restored Comics (Purple Label Risk)

CGC catches most restoration but home-identification flags before submission:
- **Color touch** — paint, marker, or pencil applied to color flaws (often at spine tick color breaks)
- **Piece fill** — missing corner or margin filled with paper and painted
- **Tear seal** — closed tear sealed with glue or rice paper
- **Pressing with glue residue** — not itself disqualifying but can indicate heavier restoration
- **Cleaning residue** — solvent smell, paper softness
- **Spine replacement** — heavy structural work, always flagged

Under UV light, most restoration fluoresces differently from original paper. Recommend UV inspection for any comic estimated over $1,000.

## Sneaker Fakes (See Also Pack 07)

Sneaker fakes are the largest fraud category by volume. Top red flags:
- **Box label** — wrong font, wrong size spec, wrong country code
- **Inside tongue label** — font weight, stitch spacing, text alignment
- **Toe box shape** — many fakes have slightly wrong toe box geometry (Jordan 1 Chicago fakes almost always have a wrong shape)
- **Stitching count per inch** — authentic vs fake differ on specific panels
- **Glue residue** — fakes have excess visible glue
- **Sole prints** — blurry or off-center sole stamping
- **Lace tips** — wrong material or wrong end cap

For sneakers, always recommend StockX Verified or GOAT Verified authentication before sale.

## Counterfeit Watches

The watch fraud market is sophisticated. Common patterns:
- **Frankenwatches** (see Pack 08) — real parts from different watches
- **Franken with fake dial** — real case and movement, aftermarket dial
- **Full fakes (replicas)** — high-end replicas of Submariner, Daytona, Royal Oak are very good and fool most visual inspection
- **Superfakes** — Chinese-made replicas with genuine movements sometimes swapped in

Red flags:
- Movement photo not provided on request
- Serial number not matching the reference era
- Dial printing quality below documented standards
- Weight differs from authentic reference
- Crystal shape wrong (subtle but detectable)

For any watch estimated over $5,000, recommend an authentication service (Chrono24 Authentication, Bob's Watches, WatchCSA) before sale.

## Cleaned Coins

Coins that have been chemically cleaned lose value. PCGS and NGC detect cleaning in almost all cases and assign a "Details" grade. Red flags visible from photos:
- **Unnatural brightness** across fields (cleaning removes toning and contact marks)
- **Hairlines** (fine parallel scratches from cloth or brush cleaning)
- **Washed appearance** — coin looks "too new" for its age
- **Uneven color** — cleaning stopped at certain point
- **Reverse of rim** shows brighter than obverse

Recommend against cleaning any coin ever. Explain that cleaning has cost millions in value historically.

## Forged Autographs

Autographs are the most forged category in collectibles. Red flags:
- **Ink flow** wrong for the era (modern pen on supposed 1950s autograph)
- **Slow or hesitant strokes** — genuine autographs are typically fluid
- **Pressure points** in wrong locations
- **Letter formation** inconsistent with known exemplars
- **Secretarial signatures** — some celebrities had staff sign for them (Elvis is notorious)

Always recommend JSA, PSA/DNA, or Beckett Authentication for any autograph estimated over $200. For high-profile signers (Washington, Lincoln, Kennedy, Einstein), recommend Heritage Auctions specialist review.

## Provenance Claims To Discount

- "My uncle found it in his attic in the 1970s" — possible but unverifiable
- "My father met the player at a game" — possible but needs documentation
- "I bought it at a flea market for $5" — immediate red flag for fakes
- "Came from a closed card shop's inventory" — possible, common legitimate source

Never inflate value based on Tier 4 provenance claims (AntiqueBot Pack 03 rubric applies here too).

## Output

Populate a forgery_risk assessment in `condition_history.red_flags`. For any MODERATE+ risk, do NOT finalize a value estimate — instead recommend specific authentication via `authentication_services.recommended_service`. For CONFIRMED fakes, state explicitly in `executive_summary` and set all value fields to 0 or null with an explanation.
