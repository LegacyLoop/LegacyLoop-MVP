---
name: population-reports-scarcity
description: How to read population reports, print runs, and scarcity data across all grading services. Pop reports are the second-biggest value lever after grade. A PSA 10 with a population of 3 is a different object than a PSA 10 with a population of 12,000.
when_to_use: Every CollectiblesBot scan where the item is graded or gradeable. Pop reports drive "key card" vs "common" distinction at every numeric grade.
version: 1.0.0
---

# Population Reports — The Scarcity Signal

A grade is only half the story. The other half is how many OTHERS exist at that grade. PSA, BGS, CGC, and WATA all maintain population reports showing how many of each item they have graded at each grade level. These reports are free, public, updated live, and they are where the smart money looks before bidding.

A PSA 10 with a population of 3 (a "Pop 3") is a different object than a PSA 10 with a population of 12,000. Same grade, same rubric — wildly different markets.

## Where To Find Pop Reports

- **PSA**: psacard.com → search card → "Pop Report" tab
- **BGS / Beckett**: beckett.com/services/grading/population-report
- **CGC** (cards + comics + video games): cgccomics.com, cgccards.com, cgcvideogames.com
- **CBCS**: cbcscomics.com
- **WATA**: watagames.com/population-reports
- **NGC**: ngccoin.com → Census
- **PCGS**: pcgs.com → Pop Report
- **AFA**: toygrader.com (pop transparency is weaker on AFA — smaller sample)

CollectiblesBot does not query live pop reports in this round, but it MUST reference them in reasoning when the item is of sufficient value to warrant them. "Based on PSA pop report as of last check, this card has approximately X at the requested grade" is a legitimate reasoning anchor.

## The Pop vs Grade Matrix

| Grade | Pop 1–10 | Pop 11–100 | Pop 101–1,000 | Pop 1,000+ |
|---|---|---|---|---|
| PSA 10 | Investment tier, record potential | Strong key card | Solid collector tier | Common modern |
| PSA 9 | Strong scarcity premium | Collector tier | Baseline market | Discounted |
| PSA 8 | Meaningful if vintage | Baseline | Discount | Floor |
| PSA 7 | Vintage only | Vintage only | Vintage only | Sub-floor |

The key insight: **pop context is everything at PSA 10.** A 1986 Fleer Jordan PSA 10 is Pop ~330 → routinely $200,000+. A modern Pokemon PSA 10 from a 2020 release might be Pop 50,000 → $40 raw, $80 graded. Same grade, 2,500x value difference.

## The Pop Inversion (Hidden Money)

Sometimes lower grades are rarer than higher grades. This happens when:
- A card was mass-graded at release, most landed PSA 10
- Only damaged copies from circulation were graded at 5 or 6
- The PSA 5 pop is 20 and the PSA 10 pop is 4,000

A "Pop 20 PSA 5" of a key card may actually hammer higher than a "Pop 4,000 PSA 10" — because set builders who need every grade for a registry set cannot find them at the lower grade. Pop inversion is where grading-savvy collectors find alpha.

## Print Runs vs Pop Reports

Print run ≠ pop report. A card with a 10,000 print run might have only 200 graded at PSA, and only 3 at PSA 10. The print run sets the absolute ceiling; the pop report shows what has actually been submitted and graded.

For modern cards:
- **Print run stated** (numbered /25, /50, /99, /150, etc.): use the printed number as the ceiling.
- **Print run unstated** (base cards, most vintage): rely on pop report as a proxy for "known graded population."

For vintage cards, print runs are rarely documented. A 1952 Topps Mickey Mantle had a large but undocumented print run — pop report is the only scarcity signal.

## Comics Pop Reports

Comics pop reports work the same but with a few wrinkles:
- Key issues (first appearance, origin story, death) drive both pop and value
- Signature Series (yellow label) is tracked separately from Universal (blue label)
- Newsstand vs Direct edition variants — newsstand typically rarer = premium
- CGC Signature Series with specific signers (e.g., signed by Stan Lee) create sub-pops

A key issue like Amazing Spider-Man #300 (first Venom) has a pop report in the tens of thousands at CGC 9.8. The raw print run was in the hundreds of thousands. Scarcity is relative — at 9.8, it is still the benchmark condition for that book.

## Video Game Pop Reports

WATA pop reports are new (service founded 2018) and still filling in. A sealed Super Mario 64 at 9.8 A++ might be Pop 15 globally. A Pop 1 at that seal rating is auction-record territory ($1M+ has happened).

Seal rating creates a matrix: 9.8 box × A++ seal is different from 9.8 box × A seal. WATA pop reports display both axes.

## Coins

PCGS and NGC both publish "Pop" counts at every grade. Key numbers:
- **CAC (Certified Acceptance Corporation)** green sticker adds ~10–20 percent premium at the same grade
- **CAC gold sticker** indicates high-end-for-grade — rarer and more valuable
- **Designations** (FBL, FS, FH) create sub-pops within the main grade

## Watches and Vintage Watches

No formal pop reports — scarcity is assessed via:
- Reference number production years
- Known surviving examples tracked by community forums (VRF, Rolex Forums, OmegaForums)
- Auction house archive frequency (Phillips, Christie's, Sotheby's specialty watch sales)

A "transitional reference" made for only 6 months has inherent scarcity even without a numeric pop. Name the reference and the production window when possible.

## Rare Books

Print runs are often documented in bibliographies. First editions have known issue points. Scarcity is tracked through:
- **ABPC / Rare Book Hub** auction records
- **Goodbooks bibliographies** (Hemingway, Faulkner, Fitzgerald by specific bibliographers)
- **Kelly Collection** reference standards for certain authors

## Output

When citing scarcity, populate `collection_context.set_name` and `collection_context.is_key_card`. In `price_history.catalyst_events` mention pop report movement if known. In `value_reasoning` state the pop tier: "This card is estimated to sit at approximately Pop [X] at the requested grade — [scarcity tier]." Never fabricate a pop number. If unknown, say "pop report should be consulted before consignment."
