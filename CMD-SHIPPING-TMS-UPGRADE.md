LEGACYLOOP — COMMAND TEMPLATE v9
Shipping Center TMS Upgrade — Real Transportation Management System
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

CONTEXT: Ryan has years of logistics experience. This Shipping Center must
function like a real TMS (Transportation Management System). Every shipment
stage must be visible, trackable, and manageable from one place. The AI
dimensions, packaging type, fragile status, and carrier data must flow
seamlessly from item analysis through quoting to label generation to tracking.

Copy this entire command into Claude Code. Never skip sections.

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
  ELON MUSK STANDARD: This must feel like a $1B product.
  Think FedEx Ship Manager meets Tesla UI — clean, powerful, trustworthy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Shipping files ---'
  wc -l app/shipping/ShippingCenterClient.tsx app/shipping/page.tsx
  echo '--- Shipping API ---'
  wc -l app/api/shipping/center/route.ts
  echo '--- Item shipping fields ---'
  grep -n 'shippingWeight\|shippingLength\|shippingWidth\|shippingHeight\|isFragile\|aiShipping' app/api/shipping/center/route.ts | head -10
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/shipping/ShippingCenterClient.tsx — UNLOCKED (full TMS rebuild)
  app/shipping/page.tsx — UNLOCKED (pass additional data if needed)

All other files LOCKED. ALL API routes LOCKED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All Pass 1-5 + Phase 2 + Phase 3 Items 16-17 Command 1 — ALL LOCKED.
The shipping API was enriched in Command 1 to return:
  - shippingLength, shippingWidth, shippingHeight, shippingWeight, isFragile
  - saleMethod, soldPrice, soldAt
  - aiShipping profile (extracted from AI analysis)
  - category

This data is NOW AVAILABLE. Use it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.
Shipping events (quotes, labels, tracking updates) are already logged.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI upgrade only. No API changes. The API already returns enriched data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true. Both test accounts Tier 4 Estate Manager.

THE TMS VISION:
  A seller should be able to come to the Shipping Center and:
  1. See ALL items that need shipping attention, organized by stage
  2. See each item's shipping profile (dimensions, weight, packaging, fragile)
  3. Get instant rate comparisons from multiple carriers
  4. Convert any quote into a label with one click
  5. Track every shipment from label creation to delivery
  6. Handle freight/LTL for large items
  7. Manage local pickups and meetups
  8. See the full shipping cost history and totals

  This is a COMMAND CENTER, not a simple list.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Go beyond minimum spec to make this world-class
  — Design this like a professional TMS
  — Add shipment stage indicators and progress visualization
  — Add cost summaries and shipping analytics
  — Make carrier comparison prominent and easy
  — Add urgency indicators for items waiting to ship
  — Make the quote-to-label flow seamless
  — Add keyboard shortcuts or quick actions

  You MAY NOT:
  — Touch any locked files
  — Modify API routes
  — Deviate from inline style={{}}
  — Add unapproved npm packages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

  DEMO_MODE=true. TEST ACCOUNTS:
  annalyse07@gmail.com / LegacyLoop123!
  ryanroger11@gmail.com / Freedom26$

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — ENVIRONMENT VARIABLES STATUS

All keys SET. DEMO_MODE=true.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — PENDING SCHEMA MIGRATION

No changes in this command.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Full TMS-Level Shipping Center Upgrade

Ryan's feedback: "The Shipping Center is not cutting it. It's not bringing
in any of the image size and box size info from the AI suggestion. It needs
to be a top grade shipping center a shipping company would want to use.
We need to flow smoothly from quoting into actually shipping. All the AI
information and saved information needs to transfer smoothly. We have major
holes. This needs to be a real TMS."

This command rebuilds the Shipping Center UI to be a REAL Transportation
Management System while keeping all existing functionality.

SURGICAL UNLOCK:
  app/shipping/ShippingCenterClient.tsx — full TMS upgrade
  app/shipping/page.tsx — if additional data needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/shipping/ShippingCenterClient.tsx — FULL file (~555 lines)
   Find: TABS array (5 tabs including pickup)
   Find: StatsBar component (line 22)
   Find: ItemRow component (line 65) — already shows dims + fragile from Command 1
   Find: PreSaleTab — get estimate flow
   Find: ReadyToShipTab — confirmation step + label generation (updated in Command 1)
   Find: ShippedTab — tracking with delivery progress bar (updated in Command 1)
   Find: FreightTab — LTL freight quote form
   Find: LocalPickupTab — info page
   Find: Main component with fetchData, lastRefresh, refresh button

2. Read app/shipping/page.tsx — FULL
   Find: What server data is available

3. Read app/api/shipping/center/route.ts — FULL — READ ONLY
   Find: What fields are now returned (dims, weight, fragile, AI shipping, soldPrice, soldAt)

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — UPGRADE STATS BAR TO TMS DASHBOARD

Replace the current 5-stat bar with a comprehensive TMS dashboard header:

STATS ROW 1 — Shipment Pipeline (counts):
  | Needs Quote | Ready to Ship | In Transit | Delivered | Local Pickup |
  Show counts for each stage. Color-coded:
    Needs Quote: amber (#ff9800)
    Ready to Ship: teal (#00bcd4)
    In Transit: blue (#3b82f6)
    Delivered: green (#4caf50)
    Local Pickup: purple (#a855f7)

STATS ROW 2 — Financial Summary:
  | Total Ship Cost | Avg. Cost/Item | Items Awaiting Shipment | Days Since Oldest Unsent |
  Show aggregated shipping financial data.
  "Days Since Oldest Unsent" creates urgency — if an item was sold 5 days ago
  and hasn't shipped, that's a problem.

Style: Glass cards with var(--bg-card), teal accent borders on active stats.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — UPGRADE PRE-SALE TAB (SHIPPING PROFILES + ESTIMATES)

Current: Shows items with "Get Estimate" button and carrier results.
Upgrade to feel like a shipping quote system:

1. ITEM SHIPPING PROFILE CARD:
   For each item, show a full shipping profile card:
     📦 Chipper Jones Upper Deck Card
     Dimensions: 18×14×10 in · 5 lbs · ⚠️ FRAGILE
     Packaging: Box (AI suggested)
     Category: Collectibles
     Value: $26-$86 est.

   If AI dimensions are missing:
     "⚠️ No dimensions — AI analysis hasn't been run yet. [Analyze Now →]"
     Link to /items/{id} to run analysis.

2. CARRIER COMPARISON (after estimate):
   Show carriers in a comparison table, not just pills:
     | Carrier | Service | Price | Days | Best Value |
     | USPS | Priority Mail | $8.95 | 2-3 | ★ BEST |
     | UPS | Ground | $12.40 | 4-5 | |
     | FedEx | Home Delivery | $11.80 | 3-4 | |

   Highlight the cheapest with green "BEST" badge.
   Show the fastest with a "FASTEST" badge.

3. QUOTE PERSISTENCE:
   When an estimate is fetched, store it in component state keyed by itemId.
   When the item moves to "Ready to Ship", the quote data should carry forward
   (it's already in state from the pre-sale phase).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — UPGRADE READY TO SHIP TAB (QUOTE-TO-LABEL FLOW)

This is THE critical flow. A sold item needs to become a shipped item smoothly.

1. EACH ITEM SHOWS:
   - Item photo, title, sold price, sold date
   - Shipping profile (dims, weight, fragile, packaging)
   - URGENCY: "Sold 3 days ago — ship soon!" (amber if > 2 days, red if > 5)
   - Previously quoted carrier (if estimate was done in PreSale tab)

2. SHIP FLOW (when user clicks "Ship"):
   Step 1: Confirm package details (dims, weight, fragile)
     - Pre-filled from item data / AI
     - Editable if user needs to change
     - "Looks Good" button to proceed

   Step 2: Enter buyer shipping address
     - Ship FROM: pre-filled from user profile or saleZip
     - Ship TO: buyer ZIP (required) + city/state (optional)
     - If buyer address already known (from conversation/offer), pre-fill it

   Step 3: Choose carrier
     - Show carrier comparison (same format as PreSale estimate)
     - If pre-sale estimate exists, show it immediately (no re-fetch needed)
     - If not, auto-fetch on entering buyer ZIP
     - User selects carrier

   Step 4: Generate label
     - Show final summary: item, dims, weight, from/to, carrier, price
     - "Generate Label" button
     - After generation: show label URL, tracking number, confirmation

   This should feel like a WIZARD — steps 1-2-3-4, clear progression.
   Use a step indicator similar to the item status progress bar.

   CRITICAL: The generateLabel call must use REAL item data (dims, weight,
   carrier from selection). Command 1 already improved this — but verify
   it's using the actual item shipping dimensions, not defaults.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — UPGRADE SHIPPED TAB (TRACKING COMMAND CENTER)

Current: Shows items with tracking number, status badge, and delivery progress bar.
Upgrade to a real tracking dashboard:

1. EACH SHIPMENT CARD:
   - Item photo, title, sold price
   - Carrier + service + tracking number (full, copyable)
   - Ship date → estimated delivery date (visual timeline)
   - Delivery progress bar (5 steps: Label → Picked Up → Transit → Out → Delivered)
   - Current status with color coding
   - Shipping cost
   - "Track Package" external link (if tracking URL exists)
   - "View Item" link

2. SORT OPTIONS:
   Sort by: Most recent | Needs attention | Delivered
   Default: Most recent shipped first

3. DELIVERED ITEMS:
   Delivered items should be visually distinct (subtle green border, "✅ Delivered" badge)
   but still accessible for reference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — UPGRADE FREIGHT TAB

The Freight tab is already the most complete section. Polish:

1. When an item has AI dimensions and is over 40 lbs, pre-fill the freight form
   with the item's dimensions instead of defaults (48×40×36).

2. Add a note: "Items over 40 lbs or too large for standard carriers
   are automatically flagged for freight shipping."

3. The quote results and schedule pickup flow are already good — keep them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — UPGRADE LOCAL PICKUP TAB

Current: Shows a static info page explaining how pickups work.
Upgrade to show ACTUAL items in local pickup flow:

1. Fetch items with saleMethod "LOCAL_PICKUP" or "BOTH" that have
   status SOLD or pickupStatus set.
   Use the data already returned by /api/shipping/center.

2. For each item in pickup flow:
   - Item photo, title, sold price
   - Pickup status: INVITE_SENT → CONFIRMED → EN_ROUTE → HANDED_OFF → COMPLETED
   - Pickup status progress bar (5 steps like the delivery bar)
   - Scheduled date/time if set
   - Location if set
   - "Manage Pickup" link to /items/{id}

3. Empty state: Keep the existing explanation cards but add:
   "No items currently in local pickup. When a buyer chooses local pickup,
   you'll manage the handoff here."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART H — OVERALL TMS POLISH

1. HEADER:
   Keep the refresh button + last updated timestamp.
   Add a total item count: "Managing shipping for X items across Y shipments"

2. TAB BADGES:
   Each tab should show a count badge:
   Pre-Sale (3) | Ready to Ship (2) | Shipped (5) | Freight (0) | Pickup (1)
   The "Ready to Ship" badge should be amber/red if items have been waiting > 3 days.

3. NAVIGATION:
   Every item row should have a "View Full Item →" link back to the item dashboard.
   This creates a two-way sync experience — go to Shipping Center to manage shipping,
   click through to item dashboard for full details, come back.

4. EMPTY STATES:
   Each tab should have a meaningful empty state that explains what will appear
   and how to get there. Not just "No items" — explain the flow.

5. RESPONSIVE:
   Ensure all grids collapse cleanly on mobile (minmax patterns).
   Stats bar should stack on narrow screens.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Shipping API routes (all locked)
  — lib/shipping/* (all locked)
  — ShippingPanel.tsx (item dashboard — locked)
  — LocalPickupPanel.tsx (item dashboard — locked)
  — Any other locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Full reads complete: yes / no

  STATS DASHBOARD:
  3. Shipment pipeline counts visible: yes / no
  4. Financial summary visible: yes / no
  5. Urgency indicator (days since oldest unsent): yes / no

  PRE-SALE:
  6. Full shipping profile shown per item (dims, weight, fragile): yes / no
  7. Missing dimensions shows warning: yes / no
  8. Carrier comparison in table format: yes / no
  9. BEST and FASTEST badges: yes / no

  READY TO SHIP:
  10. Sold price + date shown: yes / no
  11. Urgency indicator for old sales: yes / no
  12. Ship wizard with steps (confirm → address → carrier → label): yes / no
  13. Pre-filled from item data / AI: yes / no
  14. Carrier selection from real data: yes / no
  15. Label generation uses item's actual dims/weight: yes / no

  SHIPPED:
  16. Full tracking numbers (not truncated): yes / no
  17. Delivery progress bar: yes / no
  18. Ship date → delivery timeline: yes / no
  19. Carrier + cost shown: yes / no

  FREIGHT:
  20. Pre-fills from AI dims when available: yes / no

  LOCAL PICKUP:
  21. Shows actual items in pickup flow: yes / no
  22. Pickup status progress bar: yes / no

  OVERALL:
  23. Tab badges with counts: yes / no
  24. "View Item" links on all rows: yes / no
  25. Both light and dark mode clean: yes / no
  26. All text uses CSS variables: yes / no

  N+1. All locked files untouched: yes / no
  N+2. API routes untouched: yes / no
  N+3. inline style={{}} throughout: yes / no
  N+4. npx tsc --noEmit: 0 errors
  N+5. npm run build: pass
  N+6. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Stats dashboard: [fixed / issue]
  Part C — Pre-Sale upgrade: [fixed / issue]
    - Shipping profiles: [yes / no]
    - Carrier comparison table: [yes / no]
  Part D — Ready to Ship wizard: [fixed / issue]
    - Ship wizard steps: [yes / no]
    - Real data used: [yes / no]
  Part E — Shipped tracking: [fixed / issue]
    - Progress bars: [yes / no]
    - Full tracking: [yes / no]
  Part F — Freight pre-fill: [fixed / issue]
  Part G — Local Pickup with real items: [fixed / issue]
  Part H — Overall polish: [fixed / issue]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — API routes: [Confirm]
  — All locked files: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list — should be 1-2]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Shipping Center TMS Upgrade (Command 2 of 2)
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
