---
name: modification-impact
description: How aftermarket modifications affect value. When mods add value (tasteful factory-option-style), when they subtract (cheap DIY), and when they destroy (engine swaps, cut fenders). Tuner cars, show cars, restomods, and the return-to-stock premium.
when_to_use: Any scan where photos show aftermarket wheels, suspension mods, exhaust mods, interior swaps, engine swaps, body kits, wraps, audio systems, or visible customization.
version: 1.0.0
---

# Modifications — The Asymmetric Value Driver

Aftermarket modifications rarely add value and often subtract. The seller who spent $8,000 on suspension + wheels + exhaust + tune almost never recovers that money. But there are exceptions — specific mods on specific platforms do add value, and the ability to identify them separates CarBot from a generic valuation tool.

## The Default Rule: Mods Subtract Value

For 80% of modified vehicles, the modifications reduce private-party value. Reasons:
1. **Narrows the buyer pool** — a lifted truck appeals only to lift enthusiasts
2. **Implies hard use** — modified cars are assumed to have been driven harder
3. **Removes warranty coverage** — most mods void factory powertrain warranty
4. **Introduces reliability questions** — tune quality, install quality, compatibility
5. **Buyer discount for return-to-stock cost** — many buyers want stock

The default assumption: a modified vehicle sells for 5-20% LESS than the same vehicle stock. The exceptions are specific and well-documented.

## When Modifications ADD Value

### Factory-Style Upgrades (The Safe Zone)
Modifications that match factory quality and aesthetic can add value:
- **Genuine OEM performance option retrofitted** (Porsche Sport Chrono on a non-Chrono car, M Performance parts on a non-M BMW)
- **Period-correct upgrades on classics** (performance cam + headers on a muscle car are "period correct" and can add value)
- **Quality tuner packages with provenance** (Alpina BMW, Dinan, Brabus Mercedes, Novitec Ferrari) — these tuner brands have their own collector market
- **Factory race car builds** (Porsche GT3 Cup car with documented race history)

### Bolt-On Power That's Reversible
Minor bolt-ons with no permanent modification can retain value if done well:
- Cat-back exhausts (easily returned to stock)
- Quality cold air intakes (easily returned to stock)
- Piggyback tunes (flash back to stock)
- High-quality coilovers (can be removed, original suspension sold separately)

These mods don't necessarily ADD value, but they don't SUBTRACT as much as irreversible work.

### Period-Correct Classic Modifications
On classic muscle cars, restomods and period-correct builds have their own market:
- **Restomod** (modern drivetrain in classic body): high-end restomods by known shops (Ringbrothers, Singer, Icon) sell for significant premiums
- **Pro Touring builds**: modernized suspension + brakes on classics, strong collector market
- **Period-correct race cars**: documented vintage race history adds value

Amateur restomods by anonymous builders rarely retain their investment.

## When Modifications DESTROY Value

### The Killers (30-70% value loss)
- **Engine swap** (not matching original block): -30 to -70% on a classic, -20 to -40% on a modern
- **Cut fenders** for clearance on lifted trucks or wide tires: permanent, -20 to -40%
- **Welded differentials** ("welded diff") for drift cars: -30 to -60% — resellable only to drift buyers
- **Roll cage installation** on a street car: -20 to -40% — turns street car into race car buyer segment only
- **Body kit cut into factory panels**: permanent, -15 to -30%
- **Interior gutted** for weight reduction: -30 to -50%
- **Harness anchors drilled into factory rollover bar**: -20 to -40%

### Cheap DIY Red Flags
- **eBay body kits** with visible gaps and misaligned panels: assume installer was amateur
- **Automotive tape wraps** (not professional vinyl): sign of budget mods
- **Aftermarket gauges drilled into dashboard**: permanent dash damage
- **Loud exhaust with resonator removed**: indicates tuner-kid ownership, buyer resistance
- **Excessive bumper stickers** or Japanese imported cosmetics: niche buyer appeal
- **Stretched tires** (narrow tires on wide wheels) for stance culture: -15 to -25%

## Wheels And Tires

Wheels are a special case:
- **Factory wheels from higher trim** (M-Sport wheels on a base BMW, AMG wheels on a base Mercedes): 0 to +5%
- **Quality aftermarket wheels in good condition** (BBS, HRE, Forgeline, Enkei): baseline to -5%
- **Replica knock-off wheels**: -5 to -15%
- **Curb-rashed wheels**: -5 to -15% regardless of brand
- **Aggressive offset / hellaflush / stance**: niche buyer, -10 to -25%

Tire condition matters more than brand. Matching quality tires with 60%+ tread are baseline. Mismatched tires with under 40% tread = -5% deduction on top of the wheel grade.

## Tuner Car Specific Markets

Some platforms have active tuner markets where specific mod combinations add value:
- **Honda Civic Type R / Si**: JDM parts, Spoon Sports, Mugen — organized collector market
- **Nissan GT-R (R35)**: Mine's, Mcchip, HKS tuning — tuner car culture
- **BMW M3 E46 / E92**: Dinan, ESS, Supersprint — tuner-appreciated
- **Subaru WRX / STI**: Cobb tunes, Perrin parts — active modification community
- **Ford Mustang (S550, S650)**: supercharger kits, Roush tuning
- **Dodge Hellcat / Demon**: factory mods and Mopar performance parts
- **Volkswagen Golf R / GTI**: APR, Unitronic tunes — organized market

For these platforms, identify the specific tuner brand and evaluate the mod in the context of the platform's community. Anonymous mods = discount. Brand-name professional mods = baseline to slight premium.

## The Wrap Question

Vinyl wraps are their own category:
- **Quality wrap over perfect original paint**: +$500 to +$2,000 (wrap protects paint, buyer gets two colors)
- **Wrap over damaged paint**: flag — wrap may be hiding repairs, -$1,000 to -$3,000
- **Old failing wrap** (peeling, faded, adhesive damage): -$500 to -$2,000 — requires removal
- **Specialty wrap (matte, satin, chrome)**: niche buyer, 0 to -$1,000

Wraps are generally removable but imperfect removal can pull paint. For high-value cars, a wrap is a red flag until proven otherwise.

## The Return-To-Stock Premium

For many modded cars, the buyer wants to return to stock. If the seller has the ORIGINAL stock parts in boxes in the garage, that's a premium. "I still have all the original wheels, suspension, exhaust, and tune" can add 5-15% over the same modified car without stock parts.

Always ask: "Do you have the original parts that were replaced?"

## Output

In `modifications`, populate a list of visible or disclosed modifications with three fields each: `type` (exhaust, wheels, suspension, etc.), `quality_tier` (OEM, professional aftermarket, quality DIY, cheap DIY, unknown), and `value_impact` (+/- percentage or absolute dollar estimate). In `value_drivers`, note the net modification impact. In `selling_strategy.presentation_tips[]`, recommend the seller gather the original stock parts if they still have them.
