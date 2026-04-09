---
name: comic-specific-grading
description: How CGC grades comics on the 10-point scale. Structural sub-dimensions (spine, cover, staples, pages). The key-issue value driver. Restoration detection (purple label) and Signature Series (yellow label). Why CBCS and PGX trade at a discount to CGC.
when_to_use: Any scan where the category is comics, comic books, graphic novels, or magazine-format collectibles.
version: 1.0.0
---

# Comic Grading — The CGC 10-Point Scale

Unlike cards (four sub-dimensions with an anchor composite), CGC grades comics on a holistic 10-point scale with half points. Graders assess the entire book, weigh defects, and assign a composite. Understanding how the defects weigh will let you estimate a grade from photos accurately.

## The Scale Tiers (CGC / CBCS Universal)

| Grade | Label | What It Means |
|---|---|---|
| 10.0 | GEM MINT | Theoretical perfection. Modern books only. |
| 9.9 | MINT | Effectively perfect — 1 in thousands. |
| 9.8 | NEAR MINT / MINT | Practical ceiling. Minimal wear, full luster. |
| 9.6 | NEAR MINT+ | Tiny flaws, possibly one minor stress line. |
| 9.4 | NEAR MINT | Clean book, minor spine stress acceptable. |
| 9.2 | NEAR MINT- | Minor surface wear or small blemishes. |
| 9.0 | VERY FINE/NEAR MINT | Transitional — light wear throughout. |
| 8.5 | VERY FINE+ | Clean but clear reading wear. |
| 8.0 | VERY FINE | Above-average, multiple minor defects. |
| 7.5 | VERY FINE- | Noticeable wear. |
| 7.0 | FINE/VERY FINE | Clean but used. |
| 6.5 | FINE+ | Moderate wear. |
| 6.0 | FINE | Significant wear, collector floor for keys. |
| 5.0 | VERY GOOD/FINE | Reading copy. |
| 4.0 | VERY GOOD | Heavy wear. |
| 3.0 | GOOD/VERY GOOD | Complete but worn. |
| 2.0 | GOOD | Detached staples possible. |
| 1.0 | FAIR | Damaged but complete. |
| 0.5 | POOR | Heavily damaged, may have missing content. |

## The Defect Hierarchy (Weighted By Severity)

From lightest to heaviest impact on grade:

1. **Corner stress** — tiny crease at corner, no color break
2. **Spine tick** — small spine stress, no color break
3. **Light reading crease** — across cover, no color loss
4. **Spine roll** — cover shifted creating curved spine
5. **Color break** — crease with visible interior white
6. **Cover detachment** — one staple pulled through
7. **Piece missing** — corner torn off
8. **Writing / stamp** — price written, owner stamp
9. **Tape** — kills grade hard, often Qualified label
10. **Restoration** — purple label, 30–70% value discount

## Cover Sub-Dimensions (Not Official But How Graders See It)

- **Front cover** — gloss, color, defects, alignment
- **Spine** — ticks, stress, roll, color breaks
- **Back cover** — often more worn (often face-down on stacks)
- **Staples** — rust, skew, detachment, replaced
- **Pages** — white > off-white-white > off-white > cream > tan > brown > brittle

## Page Quality Matters

Page quality is stated on the label: "White Pages," "Off-White to White," "Off-White," "Cream to Off-White," "Cream," "Light Tan," "Tan," "Brown," "Brittle." A same-grade book with white pages sells for a 15–30 percent premium over cream or tan. Brittle pages are a red flag — the book is decaying and will not hold its grade long-term.

## Key Issues Drive Everything

Comics are a key-issue market. Unlike cards (where every card in a set has its own PSA pop tier), comics collect value around specific issues:
- **First appearance** of a character
- **First cover appearance**
- **Origin issue**
- **Death of a character**
- **First title**
- **Key creator debut**

Amazing Fantasy #15 (first Spider-Man), Tales of Suspense #39 (first Iron Man), Incredible Hulk #181 (first Wolverine full appearance), Fantastic Four #1, Showcase #4 (first Silver Age Flash), Detective Comics #27 (first Batman) — these are the bluest of blue chips. A non-key issue from the same era at the same grade may sell for 1/100th the value.

**Always identify the key status.** State what makes the issue a key. If it is not a key, say so.

## Newsstand vs Direct

From the mid-1980s through the early 2000s, comics were published in two versions:
- **Direct Edition** — sold in comic shops, barcode in the corner is the logo
- **Newsstand Edition** — sold in grocery stores and newsstands, barcode is UPC

Newsstand copies had a lower print run (20–30 percent of total) and fewer survived in high grade. CGC labels them separately, and newsstand copies at 9.8 typically sell for a 2–5x premium over direct at the same grade for key issues.

## Label Colors

- **Blue (Universal)** — standard grade, unrestored, unaltered
- **Yellow (Signature Series)** — witnessed signature, CGC rep was present
- **Purple (Restored)** — restoration detected; grades like "Slight (B-1)" to "Extensive (C-4)" reduce value 30–70 percent
- **Green (Qualified)** — a specific defect (married cover, missing page, tape) disqualifies the Universal grade
- **Red (Restored with Qualified)** — combination label

Purple label (restoration) is often the hardest call for estate sellers. A book worth $5,000 unrestored might sell for $1,500 restored. Color touch on the cover, piece replacement on a missing corner, interior tape repair — all trigger purple. If the book was restored decades ago and the seller did not know, that is a common estate story.

## CBCS and PGX Discount

CBCS generally trades at parity with CGC for common books, slight discount for keys. PGX trades at 15–30 percent discount at every grade — the market does not trust PGX grading consistency. If the seller has a PGX-graded book, mention the discount explicitly in `value_reasoning`.

## Output

In `visual_grading`, populate: spine condition, cover condition, page quality estimate, key-issue status, label color estimate. In `graded_values`, estimate values at 9.8, 9.6, 9.4, 9.0, and 7.0 tiers. In `value_reasoning`, cite the specific defects you observed and the key-issue premium (or absence). Always name the service recommendation (CGC default, CBCS acceptable, PGX discouraged).
