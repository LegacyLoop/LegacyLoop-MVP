LEGACYLOOP — COMMAND TEMPLATE v8
Edit Item Form Upgrade — Match New Item Upload Depth
Updated: March 18, 2026 | Use this for EVERY build command

Copy everything below this line into Claude Code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

READ BEFORE MAKING ANY CHANGES:

This app has an established design system: sleek, elegant, high-tech —
inspired by Tesla, SpaceX, and Grok.
Dark theme with teal (#00bcd4) accents, glass morphism cards, subtle animations,
generous whitespace, premium typography. Senior-friendly.

All styles inline style={{}} — NO Tailwind. NO external CSS.
NO className for styling. ONLY inline style={{}}.

LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'OPENAI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL backend lib files — LOCKED.
ALL bot files — LOCKED.
ALL other UI files — LOCKED.
globals.css, vercel.json — LOCKED.
prisma/schema.prisma — READ ONLY (already has all needed fields)

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/items/[id]/edit/EditItemForm.tsx — UNLOCKED (add missing form fields to match new item upload)
app/items/[id]/edit/page.tsx — UNLOCKED (pass new fields in initial prop)
app/api/items/update/[itemId]/route.ts — UNLOCKED (accept and save new fields)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All bot AI logic, output formats, MegaBot, antique/collectible detection,
shipping, offers, credits, billing, subscriptions, marketplace, bundles,
trade proposals, sold price tracking, message center, data pipelines.

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment, Upload system, Light Mode Rounds 1-4,
  Item Control Center V1+V2, Camera upload fix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Flag all missed data collection opportunities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

For this command: Form field additions + API update. Adds new fields to the
edit form that already exist in the database schema. No schema migration needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY: Improve beyond spec, make it beautiful, match the new item upload quality.
You MAY NOT: Touch locked files, change bot logic, add packages, change schema.

DESIGN REFERENCE: Look at the NEW ITEM page (app/items/new/page.tsx) for the
section headers, card styles, input styles, and field layout. The edit form
should use the SAME visual structure:
  - Section headers with emoji + uppercase label (📋 ITEM DETAILS, etc.)
  - Card containers with dark glass style
  - Input grid layouts (2-column, 3-column where appropriate)
  - Same condition options as the new item page
  - Same field groupings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env. Admin bypasses all gates. TO GO LIVE: set false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Upgrade Edit Item Form to Match New Item Upload Depth

The Edit Item form is missing critical fields that the New Item upload has.
Users who want to update their item details can't add category, brand,
model, year/era, story, or item condition details. This makes the edit
experience feel incomplete and limits the data available for AI analysis.

The database schema (prisma/schema.prisma lines 300-399) already has ALL
the fields we need. The update API route just needs to accept them.

FIELDS TO ADD TO EDIT FORM (all exist in schema, all optional):

Section: ITEM DETAILS
  - category (String?) — dropdown matching new item page categories
  - brand (String?) — text input
  - maker (String?) — text input (if different from brand)
  - era (String?) — text input (year/era)
  - material (String?) — text input
  - itemStyle (String?) — text input
  - countryOfOrigin (String?) — text input

Section: DESCRIPTION & EVALUATION
  - description (String?) — ALREADY EXISTS but needs its own textarea (currently "Notes")
  - story (String?) — textarea for provenance/story

Section: CONDITION & HISTORY
  - condition — EXPAND options to match new item page:
    New, Like New, Excellent, Very Good, Good, Fair, Below Average, Poor, For Parts
  - numberOfOwners (String?) — select: 1, 2, 3, 4+, Unknown
  - approximateAge (String?) — text input
  - worksProperly (String?) — select: Yes, No, Not sure, N/A
  - knownDamage (String?) — textarea
  - hasOriginalPackaging (String?) — select: Yes, No, Partial, Unknown

Section: LISTING & SALE (already exists, keep as-is)
  - saleMethod, saleZip, saleRadiusMi — KEEP
  - listingPrice — ADD (starting/listing price input)

Section: SHIPPING (already exists, keep as-is)
  - weight, dimensions, fragile, preference — KEEP

THE FORM SECTIONS SHOULD MATCH THE NEW ITEM PAGE LAYOUT:
  📷 ITEM PHOTOS (already done — UploadModal from Part B)
  📋 ITEM DETAILS (category, brand, maker, era, material, style, origin)
  📝 DESCRIPTION & EVALUATION (description, story)
  ⚙️ CONDITION & HISTORY (condition, owners, age, works, damage, packaging)
  🏷️ LISTING & SALE (selling method, ZIP, radius, listing price)
  📦 SHIPPING DETAILS (weight, dimensions, fragile, preference)
  💰 PURCHASE HISTORY (purchase price, purchase date)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/items/[id]/edit/EditItemForm.tsx — FULL file
   Find: Line 11-27 — Initial type (needs new fields added)
   Find: Lines 100-168 — onSubmit payload construction (needs new fields)
   Find: Lines 293-445 — form fields section (needs new fields added)

2. Read app/items/[id]/edit/page.tsx — FULL file (68 lines)
   Find: Lines 27-45 — initial object construction (needs new fields passed)

3. Read app/api/items/update/[itemId]/route.ts — FULL file (107 lines)
   Find: Lines 49-75 — body parsing (needs new fields parsed)
   Find: Lines 77-95 — prisma.item.update data (needs new fields saved)

4. Read prisma/schema.prisma — Lines 300-399 (Item model — READ ONLY)
   Confirm fields exist: category, brand, era, material, maker, itemStyle,
   countryOfOrigin, story, numberOfOwners, approximateAge, worksProperly,
   knownDamage, hasOriginalPackaging, listingPrice

5. Read app/items/new/page.tsx — Lines 470-830 (READ ONLY — visual reference)
   Note: section headers, card styles, input layouts, category list, condition options

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Update the Server Page to Pass New Fields

File: app/items/[id]/edit/page.tsx

In the initial object (lines 27-45), ADD these fields after shippingPreference:

    // New fields for upgraded edit form
    category: (item as any).category ?? "",
    brand: (item as any).brand ?? "",
    maker: (item as any).maker ?? "",
    era: (item as any).era ?? "",
    material: (item as any).material ?? "",
    itemStyle: (item as any).itemStyle ?? "",
    countryOfOrigin: (item as any).countryOfOrigin ?? "",
    story: (item as any).story ?? "",
    numberOfOwners: (item as any).numberOfOwners ?? "",
    approximateAge: (item as any).approximateAge ?? "",
    worksProperly: (item as any).worksProperly ?? "",
    knownDamage: (item as any).knownDamage ?? "",
    hasOriginalPackaging: (item as any).hasOriginalPackaging ?? "",
    listingPrice: (item as any).listingPrice ?? null,

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Update the Edit Form Component

File: app/items/[id]/edit/EditItemForm.tsx

STEP 1: Update the Initial type (lines 11-27) to include all new fields:

Add after shippingPreference: string;

  category: string;
  brand: string;
  maker: string;
  era: string;
  material: string;
  itemStyle: string;
  countryOfOrigin: string;
  story: string;
  numberOfOwners: string;
  approximateAge: string;
  worksProperly: string;
  knownDamage: string;
  hasOriginalPackaging: string;
  listingPrice: number | null;

STEP 2: Add the CATEGORIES constant (same as new item page):

const CATEGORIES = [
  "Furniture", "Antiques", "Electronics", "Clothing & Accessories",
  "Art & Collectibles", "Kitchen & Dining", "Tools & Hardware",
  "Books & Media", "Jewelry & Watches", "Toys & Games",
  "Sports & Outdoors", "Home Decor", "Vehicles & Parts",
  "Musical Instruments", "Coins & Currency", "Pottery & Glass",
  "Textiles & Linens", "Militaria", "Other",
];

STEP 3: Restructure the form body (lines 293-445) into organized sections
matching the new item page layout. Keep existing fields, ADD new ones.

Use inline style={{}} with section headers like:
  <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.75rem",
    display: "flex", alignItems: "center", gap: "0.5rem" }}>
    📋 Item Details
  </div>

SECTION: 📋 ITEM DETAILS
  Row 1: Item name (full width) — EXISTING, keep
  Row 2: Category (dropdown) + Condition (dropdown, expanded options) — 2-column
  Row 3: Brand/Maker + Model/Series + Year/Era — 3-column
  Row 4: Material + Style + Country of Origin — 3-column (optional, collapsible)

SECTION: 📝 DESCRIPTION & EVALUATION
  Row 1: Description / Notes (textarea, 4 rows) — EXISTING, rename label
  Row 2: Provenance / Story (textarea, 3 rows) — NEW

SECTION: ⚙️ CONDITION & HISTORY
  Row 1: Number of owners (select) + Approximate age (text) — 2-column
  Row 2: Works properly (select) + Has original packaging (select) — 2-column
  Row 3: Known damage / repairs (textarea, 2 rows) — full width

SECTION: 🏷️ LISTING & SALE
  Row 1: Selling method + Listing price — 2-column
  Row 2: ZIP + Search radius — 2-column

SECTION: 📦 SHIPPING DETAILS — EXISTING, keep as-is

SECTION: 💰 PURCHASE HISTORY
  Row 1: Purchase price + Purchase date — 2-column — EXISTING, keep

Condition options (expanded to match new item page):
  New, Like New, Excellent, Very Good, Good, Fair, Below Average, Poor, For Parts

STEP 4: Update the onSubmit payload (around line 135-168) to include new fields:

After the existing fields, add:

      category: String(form.get("category") || "").trim() || null,
      brand: String(form.get("brand") || "").trim() || null,
      maker: String(form.get("maker") || "").trim() || null,
      era: String(form.get("era") || "").trim() || null,
      material: String(form.get("material") || "").trim() || null,
      itemStyle: String(form.get("itemStyle") || "").trim() || null,
      countryOfOrigin: String(form.get("countryOfOrigin") || "").trim() || null,
      story: String(form.get("story") || "").trim() || null,
      numberOfOwners: String(form.get("numberOfOwners") || "").trim() || null,
      approximateAge: String(form.get("approximateAge") || "").trim() || null,
      worksProperly: String(form.get("worksProperly") || "").trim() || null,
      knownDamage: String(form.get("knownDamage") || "").trim() || null,
      hasOriginalPackaging: String(form.get("hasOriginalPackaging") || "").trim() || null,
      listingPrice: (() => {
        const raw = String(form.get("listingPrice") || "").trim();
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      })(),

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — Update the API Route to Accept New Fields

File: app/api/items/update/[itemId]/route.ts

STEP 1: After the existing body parsing (line 55), add parsing for new fields:

  const category = asNullableString(body.category);
  const brand = asNullableString(body.brand);
  const maker = asNullableString(body.maker);
  const era = asNullableString(body.era);
  const material = asNullableString(body.material);
  const itemStyle = asNullableString(body.itemStyle);
  const countryOfOrigin = asNullableString(body.countryOfOrigin);
  const story = asNullableString(body.story);
  const numberOfOwners = asNullableString(body.numberOfOwners);
  const approximateAge = asNullableString(body.approximateAge);
  const worksProperly = asNullableString(body.worksProperly);
  const knownDamage = asNullableString(body.knownDamage);
  const hasOriginalPackaging = asNullableString(body.hasOriginalPackaging);
  const listingPriceVal = asNullableNumber(body.listingPrice);

STEP 2: Add to the prisma.item.update data object (after line 93):

      ...(category !== undefined && { category }),
      ...(brand !== undefined && { brand }),
      ...(maker !== undefined && { maker }),
      ...(era !== undefined && { era }),
      ...(material !== undefined && { material }),
      ...(itemStyle !== undefined && { itemStyle }),
      ...(countryOfOrigin !== undefined && { countryOfOrigin }),
      ...(story !== undefined && { story }),
      ...(numberOfOwners !== undefined && { numberOfOwners }),
      ...(approximateAge !== undefined && { approximateAge }),
      ...(worksProperly !== undefined && { worksProperly }),
      ...(knownDamage !== undefined && { knownDamage }),
      ...(hasOriginalPackaging !== undefined && { hasOriginalPackaging }),
      ...(listingPriceVal !== undefined && { listingPrice: listingPriceVal }),

STEP 3: Update the EventLog payload to include new fields for data collection:

In the EventLog create (line 101), expand the payload:

  payload: JSON.stringify({
    saleMethod, saleZip, saleRadiusMi,
    fieldsUpdated: Object.keys(body).filter(k => body[k] != null && body[k] !== ""),
  }),

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A reads completed: yes / no
EDIT PAGE (page.tsx):
3. All new fields passed in initial object: yes / no
EDIT FORM (EditItemForm.tsx):
4. Initial type updated with all new fields: yes / no
5. CATEGORIES constant added: yes / no
6. Category dropdown added: yes / no
7. Brand/Maker/Era/Material/Style/Origin fields added: yes / no
8. Story textarea added: yes / no
9. Condition options expanded (9 options): yes / no
10. Number of owners select added: yes / no
11. Approximate age input added: yes / no
12. Works properly select added: yes / no
13. Has original packaging select added: yes / no
14. Known damage textarea added: yes / no
15. Listing price input added: yes / no
16. All new fields in onSubmit payload: yes / no
17. Section headers match new item page style: yes / no
18. Form organized into logical sections: yes / no
API ROUTE (update route):
19. All new fields parsed from body: yes / no
20. All new fields saved to prisma.item.update: yes / no
21. EventLog payload expanded: yes / no
QUALITY:
22. Photo management (UploadModal) UNCHANGED: yes / no
23. Lightbox UNCHANGED: yes / no
24. Save + Re-run flow UNCHANGED: yes / no
25. All inline style={{}}: yes / no
26. Light + dark mode both look correct: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — Edit page passes new fields: [fixed / issue]
Fix C — Edit form upgraded with all fields: [fixed / issue]
  - New field count: [X fields added]
  - Section headers added: [list]
  - Condition options: [count — should be 9]
Fix D — API route accepts new fields: [fixed / issue]
  - Fields parsed: [count]
  - Fields saved: [count]

PHOTO MANAGEMENT UNCHANGED: [Confirm UploadModal still works]
SAVE + RE-RUN FLOW UNCHANGED: [Confirm]
LIGHT + DARK MODE: [Both correct]

FLAGS: [Any gaps]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Edit Item Form Upgrade
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
