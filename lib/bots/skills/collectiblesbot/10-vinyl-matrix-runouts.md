---
name: vinyl-matrix-runouts
description: How to identify vinyl pressings by matrix number / runout etchings. First-press vs repress identification. Goldmine grading scale for vinyl and sleeves. Test pressings, promos, and regional variants. Discogs as the vinyl database of record.
when_to_use: Any scan in the vinyl records, LP, 45, or audiophile sub-market. Matrix numbers are the vinyl equivalent of a first-edition issue point.
version: 1.0.0
---

# Vinyl Records — The Matrix Is The First-Press Tell

Vinyl value hinges on pressing identification. A first-press Beatles "Please Please Me" with the correct matrix is a different object than a 1970s reissue that looks identical from the front cover. The matrix — etched into the dead-wax (the smooth band between the last track and the label) — is the first-press fingerprint. Learning to read the matrix is the core skill of vinyl authentication.

## What Is The Matrix / Runout?

Every vinyl pressing has identifying information etched or stamped into the runout groove (the blank area around the label). This includes:
- **Matrix number** — the lacquer/cutting identifier (e.g., "XEX 421-1" for Beatles UK Parlophone)
- **Stamper number** — the specific stamper used to press the record
- **Mother number** — the metal "mother" that created the stamper
- **Cutting engineer signature** — initials or symbol from the mastering engineer (e.g., "RL" for Robert Ludwig, "TH" for Bob Ludwig, "PORKY" for Porky Peckham)
- **Label code** — pressing plant identifier

The matrix number alone often pins the pressing within a specific window. For example, Beatles "Sgt. Pepper's" UK Parlophone first press has matrix "YEX 637-1" side A and "YEX 638-1" side B. Any "-2" or higher is a repress.

## First Press vs Repress vs Reissue

- **First press** — the earliest pressing, from original masters, in the original sleeve and label design
- **Second press / repress** — same era, usually the original label, but later matrix
- **Reissue** — reprinted years later, often with different label art and remastered audio
- **Audiophile reissue** — premium reissue on 180g or 200g vinyl (MoFi, Analogue Productions, Classic Records) — valuable in its own right, NOT first-press

A first-press Pink Floyd "Dark Side of the Moon" UK Harvest with solid blue triangle is ~$500 in NM. A 1978 repress with the same cover is ~$40. An Audiophile MoFi One-Step is ~$250 despite being a reissue. These are three different markets.

## The Goldmine Grading Scale (Record)

| Grade | Code | Meaning |
|---|---|---|
| Mint | M | Sealed, unplayed. Rare and hard to verify without opening. |
| Near Mint | NM or M- | Looks unplayed, one careful play allowed. Full gloss. |
| Very Good Plus | VG+ | Light surface marks, no audible noise during playback. |
| Very Good | VG | Marks audible as light crackle, doesn't interrupt play. |
| Good Plus | G+ | Heavy surface noise, groove wear visible. |
| Good | G | Plays through with significant noise. |
| Fair | F | Skips, plays badly — reference only. |
| Poor | P | Damaged beyond useful play. |

Mint is rarely assigned — it requires the record to be sealed or effectively so. Most "new" records are Near Mint.

## Sleeve Graded Separately

The jacket (sleeve) is graded on the same Goldmine scale but evaluated independently. A "NM/VG+" is Near Mint record with Very Good Plus sleeve. Common sleeve defects:
- **Ring wear** — circular impression from the record inside
- **Seam splits** — common on Beatles, Dylan, Hendrix albums that saw heavy use
- **Water damage** — sleeve warping from humidity
- **Writing** — prior owner's name on the back
- **Price stickers** — often remove paint from the sleeve when peeled

For valuable records, the sleeve can be worth more than the record if the record is common and the sleeve is rare (e.g., Beatles "Yesterday and Today" butcher cover first state).

## Inner Sleeves and Inserts

Original inner sleeves are surprisingly important. A "complete" first press includes:
- **Original inner sleeve** (printed, sometimes with lyrics or credits)
- **Original poster** (common on double albums — White Album, Dark Side)
- **Lyric sheet** or **insert card**
- **Promotional slip** (rare)

Missing inserts can reduce value 10–25 percent on collector-tier albums.

## Test Pressings and Promos

- **Test pressing** — pressed before the commercial release for quality control. Usually white label, sometimes hand-written matrix. Produced in very small quantities (5–50 copies). Huge premium (5–20x) for confirmed test pressings of famous albums.
- **White label promo** — sent to radio stations and press, marked "PROMOTIONAL COPY — NOT FOR SALE." Varies in value. Some collectors pay premium for mono promos of albums released in stereo.
- **Cut-out / Corner-cut** — normal records with a notch cut in the jacket corner to mark them as deleted stock. Sells at 10–25 percent discount unless the album is otherwise scarce.

## Audiophile Pressings Have Their Own Market

- **Mobile Fidelity Sound Lab (MoFi)** — Original Master Recording series, audiophile bible
- **Analogue Productions** — Kevin Gray masterings
- **Classic Records** — 200g reissues, 1990s–2000s
- **Music Matters** — Blue Note jazz reissues
- **Impex** — high-end reissues

These reissues trade in their own premium market. A sealed MoFi "One-Step" of a popular album can be $200–$500 new.

## Discogs Is The Database

Discogs.com is the vinyl industry's central database. Every pressing should be cross-referenced there before grading:
- Search by matrix number to identify exact pressing
- Compare against photographs of labels and sleeves
- Check the median sold price ("Last Sold" + "Median" data)
- Verify issue country (US, UK, German pressings differ in audio quality and value)

For comparable sales, always use Discogs median sold — not the "Lowest" (which is a seller's asking price).

## Output

In `identification.item_type`, state the pressing country and matrix ("UK Parlophone first press, matrix YEX 637-1"). In `condition_notes`, state both record and sleeve Goldmine grades ("NM/VG+"). In `graded_values`, show first-press NM, VG+, VG tiers and any premium-reissue tier if applicable. In `selling_strategy`, recommend Discogs for most sales, eBay for collector-tier rarities, and specialty auction (Records Collector, Record Finder) for high-end.
