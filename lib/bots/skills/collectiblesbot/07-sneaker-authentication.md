---
name: sneaker-authentication
description: How to grade sneakers as a category where authentication is more important than condition. DS/VNDS/Used scale. OG All packaging. StockX Verified, GOAT Verified, CheckCheck. Replica red flags. Size liquidity. Box condition grading.
when_to_use: Any scan in the sneakers or streetwear sub-market. Sneakers have no service grade — value is driven by authenticity, condition tier, and platform.
version: 1.0.0
---

# Sneaker Grading — Authentication First, Condition Second

The sneaker market is fundamentally different from cards, coins, or comics. There is no universal grading service. Instead, the market runs on a condition hierarchy and a small number of trusted authentication platforms. A fake pair of Jordan 1s in "Deadstock" condition is worth zero. An authenticated pair of heavily-worn Jordan 1s from a legendary colorway is worth thousands. Authentication beats condition every time.

## The Condition Hierarchy

| Tier | Meaning | Value retention |
|---|---|---|
| DS (Deadstock) | Never worn, original box, all accessories, factory fresh | 100% |
| OG All | DS plus everything that came in the box (extra laces, tags, promo cards, hangtags) | +5–10% over DS |
| VNDS (Very Near Deadstock) | Tried on, no wear visible, sometimes "store try-on" | 80–90% of DS |
| 9/10 | Light wear, minimal creasing, clean uppers | 60–75% |
| 8/10 | Clear wear, minor creasing, sole wear acceptable | 45–60% |
| 7/10 and below | "Used" — heavy wear, visible damage | 15–40% |
| Beaters | Worn destroyed, often still wearable | 5–15% |

## The Box Matters More Than You Think

Sneaker boxes are graded separately:
- **OG Box** — original box the pair shipped in, correct model number on the side label, factory sticker intact
- **OG Box with shelf wear** — correct box, visible handling
- **OG Box replaced** — a real OG box from a different pair (common with resellers)
- **Repro box** — fake box, reseller-printed — value killer
- **No box** — 25–40 percent reduction from equivalent condition with OG box

The box label should match the pair exactly: colorway, size, release year, country code. Mismatched label = pair swap risk = authentication flag.

## Accessories (The "OG All" Multiplier)

Full original accessories add 5–10 percent to Deadstock value:
- Extra laces (multiple lace sets common on Jordans)
- Hangtag / wing tag (Air Max, running lines)
- Promo card (limited releases, collaborations)
- Jordan wings tag (Jordan 1s)
- Dust bags (luxury collabs — Dior, Off-White)
- Authentication cards (StockX green tag, GOAT yellow)
- Original shopping bag (rare — some releases only)

## Authentication Platforms

The market trusts four platforms for authentication:

1. **StockX Verified** — post-2016 authentication is generally trusted. StockX green tag attaches to the shoe and the certificate. StockX uses ML pattern matching plus human inspectors. For hyped releases (Yeezy, Jordan 1 Retro, Travis Scott), StockX authentication failure rate has been publicly scrutinized. For most drops, it is the gold standard.

2. **GOAT Verified** — similar model, slightly stricter on vintage (pre-2016) pairs. Yellow tag. GOAT has stronger coverage of European and Asian exclusives.

3. **Flight Club** — consignment model, physical NYC and LA locations. Physically inspected by their in-house team. Higher prices, higher authentication confidence.

4. **CheckCheck / Legit Check app** — community-driven, app-based. Free basic check, paid detailed report. Useful as a first pass but not a substitute for service authentication.

## Authentication Red Flags (The Common Fakes)

- **Jordan 1 Retro Chicago** — most faked pair in history. Check: toe box shape, wing logo stitch count, inside tongue label font, midsole paint line.
- **Yeezy 350 Boost** — boost sole quality, pattern alignment.
- **Off-White x Nike** — stitching on zip-ties, tag authenticity, box tag font.
- **Travis Scott Jordan 1** — reversed swoosh quality, stitching.
- **Dunk Low Panda** — mass-produced fakes, toe box shape is the tell.

Red flags that work across all categories:
- **Glue residue** visible on the upper — factory glue is minimal
- **Stitching count** off from authentic reference (count per inch)
- **Tag fonts** — compare to authenticated reference
- **Size tag language** — authentics have region-specific tag text
- **Sole print quality** — fakes often have blurry or off-center sole prints
- **Box label typos** — authentic Nike/Adidas labels have exact spec format

## Size Liquidity

Not every size sells equally. Men's US sizes 9–12 are the most liquid. Smaller than 9 and larger than 13 sit longer and sell at 10–25 percent discount from median. Women's sizes have their own market with different size curve (6.5–8.5 liquid).

## Yellowing And Boost Degradation

Midsole yellowing affects all post-1985 Jordan midsoles and is a value killer on pairs that should be "icy." Rewhitening services exist but pro-level jobs cost $100–$300 and cannot fully restore a badly-yellowed pair. Yeezy Boost yellowing on the boost foam is irreversible — downgrade affected pairs heavily.

## Collaboration Premiums

Collabs command premiums over standard retro releases:
- **Travis Scott Jordan 1** — 5–10x retail
- **Dior Jordan 1** — 20–40x retail
- **Off-White x Nike (The Ten)** — 3–8x retail
- **Sacai x Nike** — 2–5x retail
- **Fragment x Jordan** — 4–10x retail
- **Union x Jordan** — 3–7x retail

## Output

In `visual_grading`, state the condition tier (DS / VNDS / 9/10 / 8/10 / etc.). In `authentication_services`, recommend StockX or GOAT as the default. In `grading_recommendation`, state whether authentication is essential (it usually is for resale). In `selling_strategy`, name StockX for instant liquidity, GOAT for broader reach, or Flight Club for high-value consignment. Always note box condition and accessory completeness in `condition_notes`.
