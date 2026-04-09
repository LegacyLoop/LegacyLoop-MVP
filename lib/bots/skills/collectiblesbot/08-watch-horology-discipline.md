---
name: watch-horology-discipline
description: How to read reference numbers, date by serial, identify frankenwatches, assess full-set completeness, and navigate the box-and-papers premium. The Chrono24 + Hodinkee + WatchCharts price triangulation. Vintage Rolex, Patek, Omega, and modern grails.
when_to_use: Any scan in the watches, horology, timepieces, or luxury-watch sub-market. Watches have no universal grade — value is driven by reference, condition, completeness, and provenance.
version: 1.0.0
---

# Watch Grading — Reference Number Is The Identity

A watch without its reference number is an unidentifiable object. Reference numbers are stamped on the case (usually between the lugs under the bracelet), on the caseback, and documented on the papers. Always ask for the reference before estimating. "A Rolex Submariner" is not enough — 16610 and 116610 are different watches with different markets. "An Omega Speedmaster" is not enough — 145.022, 3570.50, 311.30.42.30.01.005 are different generations.

## Reference Number Basics

- **Rolex**: 4-digit (vintage, pre-1988), 5-digit (1988–2008), 6-digit (2008+). Example: 1675 GMT-Master (vintage), 16710 GMT-Master II (5-digit), 116710 GMT-Master II (6-digit).
- **Omega**: hyphenated format. 145.022 (classic Speedmaster), 311.30.42.30.01.005 (modern Moonwatch).
- **Patek Philippe**: 4 or 5 digit reference. 5711 Nautilus, 5167 Aquanaut, 3970 Perpetual Calendar.
- **Audemars Piguet**: 15202ST (Jumbo Royal Oak), 15500ST, 15400ST — the suffix (ST = steel, OR = rose gold) matters.
- **Tudor**: modern 79030N (Black Bay 58), vintage 7928 (Submariner).
- **Seiko**: SBGA029 (Grand Seiko), 6139-6002 (vintage Pogue Chronograph).

State the reference number as the FIRST line of `identification.item_type`. If the photos do not show it, request a close-up of the case between the lugs.

## Serial Number Dating

Serial numbers date the watch within a production window:
- **Rolex**: serial chart widely available; 5-digit references cross-reference to 6-digit dates. Random serials 2010+.
- **Omega**: 8-digit serial, documented chart, accurate to month.
- **Patek**: serial lookup via manufacturer or documented references.

State the production year (or window) in `identification.year`. If the serial is not visible, request a photo of the caseback or between the lugs.

## Full Set — The Box And Papers Premium

"Full set" means different things at different price points:
- **Minimum full set**: box + warranty papers (guarantee card) + instruction manual + hangtags
- **Extended full set**: minimum + extra links + service receipts + outer box + polishing cloth
- **Archives full set**: Extended + manufacturer archive confirmation certificate

The premium math:
- Box and papers (full set): 20–40 percent over watch-only
- Papers only: 10–15 percent
- Box only: 5–10 percent
- Neither: baseline

For high-end references (Patek, vintage Rolex), full set can be 50–100 percent premium. A vintage Rolex Submariner 5513 at $25,000 watch-only becomes $50,000–$75,000 with a matching box, papers, and service history.

## The Frankenwatch Problem

A frankenwatch has parts from different watches combined into a single case. Common with vintage Rolex, Omega, and Heuer. Red flags:
- **Dial** does not match the reference era (e.g., tritium dial on a non-tritium reference)
- **Hands** do not match the dial (lume color mismatch)
- **Bezel** replacement (fat font vs thin font, incorrect era)
- **Case** with mismatched caseback (different reference)
- **Movement** does not match the reference (wrong caliber)
- **Crown** replacement (non-period correct)

Frankenwatches sell at 50–80 percent discount to all-matching examples. A "Rolex Submariner 5513 with service dial" is a different object than an original tropical dial 5513. Name the replacement explicitly.

## The Tropical And Patina Premium

Certain aging patterns add value instead of subtracting:
- **Tropical dial** — dial that has faded to brown from UV exposure. Highly collectible on vintage Rolex.
- **Ghost bezel** — faded GMT or Submariner bezel. Premium for evenly-faded examples.
- **Creamy patina** — lume that has aged to cream or pumpkin. Adds character and value on vintage.
- **Honest wear** — unpolished case with original case geometry preserved. Sharp lugs and preserved chamfers are prized.

NEVER recommend polishing a vintage watch. Polishing rounds off the case lugs and chamfers — an irreversible loss that can cost 30–50 percent of value.

## Service History

For watches over 20 years old, service history is a value driver:
- **Manufacturer service** (Rolex RSC, Patek factory, Omega boutique) at documented intervals = full premium
- **Authorized service center** service = small discount
- **Independent watchmaker** service = larger discount unless the watchmaker is famous (Rolf Studer, Archer, Rob Montana)
- **No service history + running** = unknown — priced conservatively
- **Not running / needs service** = service cost ($500–$3,000) deducted from buyer's offer

## Authentication Services For Watches

There is no universal watch grading service. Authentication comes from:
- **Chrono24 Authentication** (buyer-side) — post-purchase inspection at Chrono24 facility
- **WatchCSA** — consignment authentication for high-value
- **Hodinkee H Shop** — in-house authentication for resale
- **Phillips Watches** — in-person specialist review for consignment
- **Bob's Watches** — Rolex-specific buy + authenticate model
- **Watchfinder & Co.** — UK-based, inspect + refurbish + resell

## Price Triangulation

Triangulate three sources:
1. **Chrono24** — largest listing site, global supply
2. **WatchCharts** — data aggregation of completed sales
3. **Phillips / Christie's / Sotheby's / Antiquorum archives** — auction records for high-end

For a vintage Patek or AP at $50k+, consult Phillips Watches specifically. For a common Rolex Submariner at $10k, Chrono24 median is the anchor.

## Output

In `identification.item_type`, lead with the reference number. In `condition_notes`, state case condition (unpolished vs polished), dial condition (original vs service dial), and movement condition. In `graded_values`, show values at: Watch Only, Box+Papers, Full Set, NOS. In `selling_strategy`, recommend Chrono24 for standard pieces, Phillips for vintage, Bob's Watches for common Rolex quick-sell. Always ask for the reference if not visible — it is the single most important diagnostic.
