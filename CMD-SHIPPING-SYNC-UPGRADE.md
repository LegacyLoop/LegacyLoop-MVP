LEGACYLOOP — COMMAND TEMPLATE v9
Shipping Center Sync + Upgrade — World-Class Shipping Experience
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
  echo '--- Shipping files ---'
  wc -l app/shipping/ShippingCenterClient.tsx app/items/\[id\]/ShippingPanel.tsx
  echo '--- Fee check ---'
  grep -n 'PROCESSING_FEE\|1\.75\|sellerRate\|buyerRate' app/items/\[id\]/ShippingPanel.tsx | head -5
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/shipping/ShippingCenterClient.tsx — UNLOCKED (visual upgrade, sync improvements, local pickup tab)
  app/shipping/page.tsx — UNLOCKED (pass additional data if needed)
  app/items/[id]/ShippingPanel.tsx — UNLOCKED (sync verification, fee display check, visual polish)

All other files LOCKED. API routes LOCKED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTIONS 4-11 — Same as all previous commands. All features locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Shipping Center Sync + World-Class Upgrade (Phase 3, Item 17)

The Shipping Center page (494 lines) and the Item Dashboard ShippingPanel
(3,508 lines) both manage shipping data independently. This command:

  1. SYNC: Ensure shipping status, labels, and tracking are consistent
     between the Shipping Center page and individual Item Dashboards.
  2. VISUAL POLISH: Upgrade the Shipping Center to Elon-level premium feel.
  3. FEE DISPLAY: Verify the ShippingPanel uses the corrected 1.75% fee split.
  4. COMPLETENESS: Add a Local Pickup/Meetup tab to the Shipping Center
     (currently only in the item dashboard, not the shipping center).
  5. NAVIGATION: Add "View Item" links from the Shipping Center back to items.

SURGICAL UNLOCK: 3 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/shipping/ShippingCenterClient.tsx — FULL (494 lines)
   Find: TABS array, StatsBar, StatusBadge, ItemRow helpers
   Find: PreSaleTab (line 93), ReadyToShipTab (line 167), ShippedTab (line 208), FreightTab (line 254)
   Find: Main component with data fetch from /api/shipping/center (line 415)

2. Read app/items/[id]/ShippingPanel.tsx — FIRST 100 lines + LAST 100 lines
   Find: How shipping data is loaded and displayed on the item dashboard
   Find: Fee display — verify it uses the corrected 1.75% split (PROCESSING_FEE.sellerDisplay / buyerDisplay)
   Find: Label generation, tracking display, LTL freight handling

3. Read app/shipping/page.tsx — FULL (30 lines)
   Find: What data is passed to ShippingCenterClient

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — SHIPPING CENTER VISUAL POLISH

File: app/shipping/ShippingCenterClient.tsx

1. HEADER — Add a header section above the tabs:
   Section title: "Shipping Center"
   Subtitle: "Manage labels, tracking, estimates, and freight for all your items"
   Breadcrumbs: Dashboard → Shipping Center

2. TABS — Upgrade the tab buttons:
   - Add item counts in badges (already partially done)
   - Active tab: stronger visual treatment (teal background, not just border)
   - Add a 5th tab: "Local Pickup" (icon: 🤝)
   - Ensure tabs look great in both light and dark mode

3. STATS BAR — Already has 4 stats (Pre-Sale, Ready to Ship, In Transit, Delivered)
   - Add a 5th stat: "Local Pickup" (count of items with pickup status)
   - Make the stats more visually prominent
   - Add total shipping cost across all shipped items

4. ITEM ROWS — Upgrade the ItemRow component:
   - Add "View Item →" link on each row (links to /items/{id})
   - Better status badges with color coding
   - Show listing price alongside shipping info

5. PRE-SALE TAB — The estimate flow works. Polish:
   - Better empty state
   - Show carrier logos/icons alongside carrier names
   - Highlight cheapest option

6. READY TO SHIP TAB — Works. Polish:
   - More prominent "Generate Label" CTA
   - Show item value alongside the ship button
   - Add urgency indicator if item was sold more than 3 days ago

7. SHIPPED TAB — Works. Polish:
   - Better tracking number display (full number, not truncated)
   - Delivery progress bar (similar to status progress in Item Control Center)
   - Estimated delivery date more prominent
   - "Track Package" external link if tracking URL exists

8. FREIGHT TAB — Already comprehensive. Minor polish:
   - Better form layout
   - Confirmation card styling upgrade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ADD LOCAL PICKUP TAB

File: app/shipping/ShippingCenterClient.tsx

Add a 5th tab "Local Pickup" that shows items with local pickup status:

1. Add to TABS array:
   { key: "pickup", label: "Local Pickup", icon: "🤝" }

2. Update the Tab type to include "pickup"

3. Fetch pickup data from the /api/shipping/center response
   (or from a separate query if needed — read the API to check)

4. The pickup tab shows items that are:
   - Status: SOLD with saleMethod LOCAL_PICKUP or BOTH
   - Have pickupStatus set (any stage)
   - Or have pickupScheduledAt set

5. Each item in the pickup tab shows:
   - Item photo + title
   - Pickup status (Invite Sent, Confirmed, En Route, Handed Off, Completed)
   - Scheduled date/time if set
   - Location if set
   - "View Item" link to manage the full pickup flow

6. Empty state: "No local pickups in progress. When a buyer chooses local
   pickup, it will appear here."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — FEE DISPLAY VERIFICATION IN ShippingPanel

File: app/items/[id]/ShippingPanel.tsx (3,508 lines)

The ShippingPanel was already updated in the fee split command (earlier today).
VERIFY that it correctly shows:
  - "Seller pays 1.75%" (not "Charged to buyer 3.5%")
  - "Buyer pays 1.75%" (not the full 3.5%)
  - "Split: 1.75% seller / 1.75% buyer"

If ANY references to the old fee model remain, fix them:
  - "Charged to buyer" → "Split: seller + buyer"
  - PROCESSING_FEE.display (3.5%) → show the split

Also do a light mode audit: scan for any hardcoded colors that
would break in light mode. Fix if found.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — SYNC IMPROVEMENTS

The key sync issue: when a user generates a label or updates shipping
on the Shipping Center page, the Item Dashboard should reflect it
(and vice versa). Both pages read from the same database, so the data
IS in sync — the issue is that pages don't refresh automatically.

For now, these improvements help:
  1. After any action in the Shipping Center (generate label, get estimate),
     use router.refresh() instead of window.location.reload() to refresh
     server data without full page reload.

  2. Add a "Refresh" button in the Shipping Center header that
     re-fetches shipping data.

  3. In the Shipping Center, when displaying items, show a "Last updated"
     timestamp so users know the data is current.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Shipping API routes (all locked)
  — lib/shipping/* (all locked)
  — Item dashboard panels (except ShippingPanel for fee verification)
  — Any other locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Full reads complete: yes / no

  VISUAL POLISH:
  3. Header + breadcrumbs added: yes / no
  4. Tabs upgraded with counts: yes / no
  5. Stats bar upgraded: yes / no
  6. Item rows have "View Item" links: yes / no
  7. Pre-Sale tab polished: yes / no
  8. Ready to Ship tab polished: yes / no
  9. Shipped tab polished (tracking, delivery progress): yes / no

  LOCAL PICKUP TAB:
  10. 5th tab added: yes / no
  11. Shows items with pickup status: yes / no
  12. Empty state: yes / no

  FEE DISPLAY:
  13. ShippingPanel uses corrected fee split language: yes / no
  14. No remaining "Charged to buyer 3.5%" text: yes / no

  SYNC:
  15. router.refresh() used instead of window.location.reload(): yes / no
  16. Refresh button in header: yes / no

  N+1. All locked files untouched: yes / no
  N+2. API routes untouched: yes / no
  N+3. inline style={{}} throughout: yes / no
  N+4. Both light and dark mode clean: yes / no
  N+5. npx tsc --noEmit: 0 errors
  N+6. npm run build: pass
  N+7. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Visual polish: [fixed / issue]
  Part C — Local Pickup tab: [fixed / issue]
  Part D — Fee display verification: [fixed / no changes needed / issue]
  Part E — Sync improvements: [fixed / issue]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  Files modified: [list — should be 1-3]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Shipping Center Sync + Upgrade (Item 17)
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
