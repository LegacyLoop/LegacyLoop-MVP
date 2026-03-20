LEGACYLOOP — COMMAND TEMPLATE v9
Sold Price Widget Light Mode Fix + Post-Sale Shipping Bridge + Shipping Center Data Sync
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

Copy this entire command into Claude Code. Never skip sections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

  All styles inline style={{}} — NO Tailwind. NO external CSS.
  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
  ELON MUSK STANDARD: This must feel like a $1B product.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- SoldPriceWidget ---'
  grep -n '#fff\|rgba(207,216,220\|rgba(0,0,0,0.3)' app/items/\[id\]/SoldPriceWidget.tsx
  echo '--- Shipping Center API ---'
  grep -n 'shippingWeight\|shippingLength\|shippingWidth\|shippingHeight\|isFragile' app/api/shipping/center/route.ts | head -5
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/items/[id]/SoldPriceWidget.tsx — UNLOCKED (fix light mode, improve UX)
  app/api/shipping/center/route.ts — UNLOCKED (add shipping dimensions + AI data to response)
  app/shipping/ShippingCenterClient.tsx — UNLOCKED (display item shipping profiles, quote-to-label flow)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTIONS 4-11 — Same as all previous commands. All features locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Three critical fixes in one command:

  1. SOLD PRICE WIDGET LIGHT MODE: The "What did this sell for?" widget
     uses hardcoded dark-mode colors (#fff, rgba(207,216,220,...), rgba(0,0,0,0.3))
     on a THEME-AWARE surface. In light mode, the text is INVISIBLE.
     This is NOT an always-dark panel — it renders on the item dashboard.
     Fix ALL hardcoded colors to CSS variables.

  2. SHIPPING CENTER DATA ENRICHMENT: The /api/shipping/center endpoint
     returns items but does NOT include the AI-suggested shipping dimensions
     (shippingWeight, shippingLength, shippingWidth, shippingHeight, isFragile)
     or the item's packaging type. The Shipping Center page needs this data
     to show item shipping profiles and enable quote-to-label conversion.

  3. SHIPPING CENTER QUOTE-TO-LABEL BRIDGE: When a user gets a shipping
     estimate in the Pre-Sale tab, the estimate data (carrier, service, price,
     weight, box size) should carry forward. When the item is sold and moves
     to Ready to Ship, the previously quoted data should pre-fill the label
     generation — NOT hardcoded mock data.

  RYAN'S LOGISTICS REQUIREMENT:
  "This needs to be a real Transportation Management System. All the AI
  information and saved information needs to transfer smoothly. We need
  to flow from quoting into label generation easily. If we quote something,
  we need to take that quote and change it into a label and a shipment."

SURGICAL UNLOCK: 3 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/items/[id]/SoldPriceWidget.tsx — FULL (130 lines)
   Find: Lines 57-69 — hardcoded colors: "#fff", "rgba(207,216,220,...)", "rgba(0,0,0,0.3)"
   Find: Lines 77-84 — more hardcoded colors in select element
   Find: Lines 96 — hardcoded button colors
   Find: Lines 103-124 — result display with hardcoded colors
   These are ALL on a theme-aware card (ghost-bg background). They MUST use CSS variables.

2. Read app/api/shipping/center/route.ts — FULL file
   Find: What data the API currently returns for each item
   Find: What's MISSING: shippingWeight, shippingLength, shippingWidth,
   shippingHeight, isFragile, saleMethod, category, aiData shipping suggestions

3. Read app/shipping/ShippingCenterClient.tsx — FULL file (555+ lines)
   Find: ReadyToShipTab (line 175) — the generateLabel function uses
   HARDCODED mock data: carrier "USPS", service "Priority Mail", weight 5,
   rateAmount 8.95, etc. This is the BROKEN quote-to-label flow.
   Find: PreSaleTab — the estimates are fetched but not stored/reused
   Find: ItemRow — what data is displayed per item (currently no dimensions)

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — FIX SOLD PRICE WIDGET LIGHT MODE

File: app/items/[id]/SoldPriceWidget.tsx (130 lines)

This widget renders on the item dashboard which is THEME-AWARE.
It currently uses hardcoded dark-mode colors that are invisible in light mode.

Replace ALL hardcoded colors with CSS variables:

  Line 57: color: "#fff" → color: "var(--text-primary)"
  Line 58: color: "rgba(207,216,220,0.6)" → color: "var(--text-muted)"
  Line 61: color: "rgba(207,216,220,0.7)" → color: "var(--text-muted)"
  Line 69: background: "rgba(0,0,0,0.3)" → background: "var(--input-bg, var(--ghost-bg))"
           color: "#fff" → color: "var(--input-color, var(--text-primary))"
  Line 77: color: "rgba(207,216,220,0.7)" → color: "var(--text-muted)"
  Line 81: background: "rgba(0,0,0,0.3)" → background: "var(--input-bg, var(--ghost-bg))"
           color: "#fff" → color: "var(--input-color, var(--text-primary))"
  Line 96: color: "#000" → color: "#fff" (button text on teal — keep as white)
  Line 103: color: "#4caf50" → keep (green is intentional for "Sale recorded")
  Line 106: color: "rgba(207,216,220,0.5)" → color: "var(--text-muted)"
  Line 107: color: "#fff" → color: "var(--text-primary)"
  Line 112: color: "rgba(207,216,220,0.6)" → color: "var(--text-muted)"
  Line 124: color: "#00bcd4" → keep (accent color intentional)

  Scan the ENTIRE file for any remaining hardcoded colors.

  ALSO: The SoldPriceWidget should be more prominent and professional.
  Consider upgrading the UX:
  - Better header: "💰 Record Your Sale" instead of just "What did this sell for?"
  - Add the fee split info: "After 1.75% seller fee, you'll keep ~$X"
  - The "How did it sell?" dropdown should include: "Accepted Offer", "Direct Sale",
    "Trade/Barter", "Sold on External Platform", "Auction", "Other"
    (Currently has 5 options — add "Auction" if missing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ENRICH SHIPPING CENTER API RESPONSE

File: app/api/shipping/center/route.ts

The API currently returns items for the Pre-Sale, Ready to Ship, and
Shipped tabs. But it does NOT include the item's shipping dimensions,
weight, fragile status, or AI-suggested packaging.

ADD these fields to the item select in the Prisma query:

  For the preSale items query:
    shippingWeight, shippingLength, shippingWidth, shippingHeight, isFragile,
    saleMethod, category

  For the readyToShip items query:
    Same fields + soldPrice, soldAt

  For the shipped items query (already has label data):
    Verify shippingWeight is included

  These fields already exist on the Item model in the Prisma schema.
  Just add them to the select clause.

  ALSO: Include the AI analysis data for shipping suggestions:
    aiResult: { select: { rawJson: true } }
  The AI analysis rawJson contains shipping_profile data (dimensions,
  weight, packaging type) that the Shipping Center needs.

  The API response for each item should now include:
    id, title, status, photo, valuationLow, valuationHigh, listingPrice,
    shippingWeight, shippingLength, shippingWidth, shippingHeight, isFragile,
    saleMethod, category, aiShippingProfile (extracted from aiResult)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — DISPLAY ITEM SHIPPING PROFILES IN SHIPPING CENTER

File: app/shipping/ShippingCenterClient.tsx

Now that the API returns shipping dimensions, show them in the Shipping Center:

1. PRE-SALE TAB — Show item shipping profile below each item:
   If the item has shippingWeight/Length/Width/Height:
     "📦 18×14×10 in · 5 lbs · FRAGILE"
   If not available from AI yet:
     "📦 No dimensions yet — run AI analysis"

   This way users can see what they're working with BEFORE getting an estimate.

2. READY TO SHIP TAB — CRITICAL FIX:
   Replace the HARDCODED mock data in generateLabel (line 184):
   Currently: carrier: "USPS", service: "Priority Mail", weight: 5, rateAmount: 8.95
   Replace with: Use the item's actual shipping dimensions and weight.

   Add a pre-fill flow:
   - Show the item's shipping profile (dimensions + weight)
   - If the item previously had a shipping estimate (from PreSale tab),
     show the cheapest carrier as a recommended option
   - Let the user confirm or change before generating the label
   - The generateLabel call should use REAL data, not mock data

   Instead of immediately calling generateLabel with mock data:
   a) Show a mini shipping summary: dimensions, weight, estimated carrier/price
   b) "Confirm & Generate Label" button
   c) The label API call uses the real dimensions and carrier data

3. SHIPPED TAB — Show the shipping profile alongside tracking:
   "📦 18×14×10 in · 5 lbs" next to the carrier and tracking number.

4. UPDATE ItemRow component:
   Add an optional subtitle showing the shipping profile:
   If item has dimensions: "18×14×10 in · 5 lbs"
   If fragile: add "⚠️ FRAGILE" badge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Shipping API routes OTHER than /api/shipping/center
  — ShippingPanel.tsx (3,508 lines — locked)
  — LocalPickupPanel.tsx (locked)
  — Any other locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Full reads complete: yes / no

  SOLD PRICE WIDGET:
  3. Zero hardcoded #fff on theme surfaces: yes / no
  4. Zero rgba(207,216,220,...) remaining: yes / no
  5. Zero rgba(0,0,0,0.3) remaining: yes / no
  6. Inputs readable in light mode: yes / no
  7. Widget readable in dark mode: yes / no

  SHIPPING API:
  8. preSale items include shipping dimensions: yes / no
  9. readyToShip items include shipping dimensions: yes / no
  10. AI shipping profile extracted from aiResult: yes / no

  SHIPPING CENTER:
  11. Pre-Sale tab shows item shipping profiles: yes / no
  12. Ready to Ship tab uses real data (not mock): yes / no
  13. Label generation pre-fills from item data: yes / no
  14. Shipped tab shows shipping profile: yes / no

  N+1. All locked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. npx tsc --noEmit: 0 errors
  N+4. npm run build: pass
  N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — SoldPriceWidget: [fixed / issue]
    - Hardcoded colors fixed: [count]
    - Light mode readable: [yes / no]

  Part C — Shipping API enrichment: [fixed / issue]
    - Dimensions added: [yes / no]
    - AI profile extracted: [yes / no]

  Part D — Shipping Center data display: [fixed / issue]
    - Item profiles shown: [yes / no]
    - Mock data removed from generateLabel: [yes / no]
    - Real data used: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list — should be 3]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Sold Price Fix + Shipping Bridge (Command 1 of 2)
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
