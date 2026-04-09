---
name: mileage-impact-analysis
description: How mileage affects vehicle value. The expected-mileage formula. Mileage-by-segment curves. The low-mileage premium vs the high-mileage discount. When high mileage is fine (diesels, trucks) and when it's catastrophic. Odometer fraud detection.
when_to_use: Every CarBot scan. Mileage is the second-largest value lever after condition. Pack 08 calibrates the mileage math.
version: 1.0.0
---

# Mileage — The Second-Largest Value Lever

After condition, mileage is the biggest driver of vehicle value. But mileage impact varies dramatically by vehicle type. 200,000 miles on a Cummins diesel is mid-life. 200,000 miles on a BMW 7-Series is a project. Get the segment right or get the mileage math wrong.

## The Expected Mileage Formula

US average annual mileage = **12,000-15,000 miles per year**. The quick math:

```
Expected Mileage = (Current Year - Model Year) × 13,500
```

A 2018 vehicle in 2026 has an expected mileage of (2026-2018) × 13,500 = 108,000 miles.

| Actual vs Expected | Category | Value Impact |
|---|---|---|
| 50-70% of expected | Low mileage | +10-25% premium |
| 70-90% of expected | Below average | +5-10% premium |
| 90-110% of expected | Normal | Baseline |
| 110-130% of expected | Above average | -5-10% discount |
| 130-150% of expected | High mileage | -10-20% discount |
| Over 150% of expected | Very high mileage | -20-35% discount |

A 2018 vehicle with 60,000 miles is 55% of expected — low mileage, premium. A 2018 vehicle with 180,000 miles is 167% of expected — very high mileage, discount.

## The Sweet Spots By Segment

Different vehicle segments have different mileage expectations:

### Economy Cars (Civic, Corolla, Sentra, Elantra, Accent, Fit)
- Expected life: 200,000-300,000 miles with maintenance
- Low-mileage sweet spot: under 60,000 miles → premium
- Typical buyer: commuter, first-time, student
- Over 200,000 miles: significant discount (wholesale territory)

### Mid-Size Sedans (Accord, Camry, Altima, Fusion, Malibu)
- Expected life: 200,000-250,000 miles
- Sweet spot: 60,000-120,000 miles
- Buyer resistance: 150,000+ miles
- Strong performers: Camry, Accord hold value highest in segment

### Compact Luxury (3-Series, C-Class, A4, TLX)
- Expected life: 150,000-200,000 miles before major service costs
- Sweet spot: under 60,000 miles → premium (CPO territory)
- Buyer resistance kicks in HARD at 100,000 miles
- Over 150,000 miles: dramatic discount (maintenance costs catch up)

### Full-Size Luxury (5-Series, E-Class, A6, LS, GS)
- Expected life: 150,000 miles before major expenses
- Sweet spot: under 80,000 miles
- 150,000+ miles: 40-60% discount from low-mileage price
- Specific models age worse: Mercedes S-Class, BMW 7-Series, Audi A8

### Pickup Trucks (F-150, Silverado, Ram 1500)
- Expected life: 250,000-350,000 miles
- Sweet spot: under 100,000 miles
- Still desirable at 200,000 miles with service history
- High-mileage discount less steep than sedans

### Heavy Duty Diesels (F-250/350, Silverado 2500/3500, Ram 2500/3500)
- Expected life: 400,000-600,000 miles
- 200,000 miles is considered mid-life
- No significant discount until 300,000+ miles
- Service history weighs more than raw mileage

### Classic Cars (25+ years old)
- Mileage matters less than condition and originality
- Very low mileage (under 30,000) on a classic = premium for "survivor" status
- Normal classic mileage is irrelevant once the car is in tier #2 or #3 condition

### SUVs By Body Type
- Body-on-frame (Suburban, Tahoe, 4Runner, Sequoia): truck curves apply
- Unibody crossover (CR-V, RAV4, Explorer): sedan curves apply

## The Low-Mileage Premium Math

Low-mileage vehicles command premiums because:
1. Remaining life is perceived as longer
2. Maintenance required is less
3. Components have less wear
4. "Garage queen" story suggests loving ownership

But the premium caps out. A vehicle at 20% of expected mileage doesn't command 3x premium — it caps at 20-30% over baseline because:
- Buyers worry about "why so low" (issue? flood? stored?)
- Components can degrade from disuse (tires flat-spot, seals dry out, fuel varnishes)
- Very-low-mileage cars still depreciate by calendar year

A 2018 Corvette with 8,000 miles in 2026 is NOT worth double a 2018 Corvette with 50,000 miles. The low-mileage premium is 25-40% at most.

## The High-Mileage Discount Math

High-mileage vehicles lose value because:
1. Remaining life is shorter
2. Major services coming up (timing belt, transmission, head gaskets)
3. Buyer segment narrows
4. Warranty almost certainly expired
5. Insurance may cost more

But high mileage has a FLOOR. A 300,000-mile Corolla with complete service history is not worthless — it hits the "reliable beater" floor at $2,000-$4,000. That's the segment minimum.

## Service History Overrides Mileage

A 200,000-mile vehicle with complete dealer service history is worth more than a 150,000-mile vehicle with no records. Buyers pay for known maintenance. The documentation hierarchy:

1. **Complete dealer records** — best, typically 10-15% premium over no-records
2. **Complete independent specialist records** (known shops) — 5-10% premium
3. **Complete DIY records with receipts** — 3-8% premium
4. **Partial records with gaps** — baseline
5. **No records** — 10-15% discount

## Odometer Fraud Detection

Odometer rollback is illegal but happens. Red flags:
- Mileage claimed lower than title history (check CARFAX or AutoCheck)
- Wear inconsistent with claimed mileage (worn pedals + steering wheel on "low mileage" car)
- Digital dash tampering (hard to detect without scan tool)
- Mismatch between door jamb sticker state inspection and current odometer
- Recent odometer "replacement" (always a red flag)

For any vehicle where claimed mileage seems inconsistent with wear, recommend a CARFAX/AutoCheck pull before purchase.

## The "TMU" Market (True Mileage Unknown)

When an odometer has been disconnected, replaced, or exceeded its digit limit, the title is branded "TMU" or "not actual mileage." TMU vehicles sell at 20-40% discount from same-condition known-mileage equivalents. Mention TMU status explicitly if the title shows it.

## Classic Car Mileage

Classics break all the normal rules:
- **Under 10,000 original miles**: "time capsule" premium, can be 50-100% over driver-grade
- **Under 30,000 original miles**: "low mileage survivor" premium, 30-50%
- **30k-75k miles**: "lightly used" — normal classic premium
- **Over 100,000 miles on a classic**: driver-grade, not show-grade

For classics, mileage AND originality matter more than raw number.

## Output

In `identification.mileage`, state the actual and the expected (as a percentage). In `condition.mileage_category`, pick one of: Very Low / Low / Normal / Above Average / High / Very High. In `value_drivers`, state the mileage impact as a percentage adjustment from baseline. In `value_reasoning`, cite the expected-mileage formula and the segment-specific curve.
