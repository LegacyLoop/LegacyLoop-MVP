LEGACYLOOP — COMMAND TEMPLATE v9
Item Control Center — Elon-Level Polish + Feature Upgrades
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

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
  Think Tesla center console — dense, smart, fast.

  ALWAYS-DARK PANELS: Modals and overlays that are always dark
  MUST use hardcoded colors. NEVER CSS variables — they invert in light mode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP.

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Item Control Center check ---'
  grep -n 'ITEM CONTROL CENTER' app/items/\[id\]/ItemDashboardPanels.tsx
  grep -n 'function ItemControlCenter' app/items/\[id\]/ItemDashboardPanels.tsx
  wc -l app/items/\[id\]/ItemDashboardPanels.tsx
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED
  (ONLY the ItemControlCenter function, approximately lines 6270-6590.
   DO NOT modify any other function or panel in this 7,748-line file.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All Pass 1-5 + Phase 2 features LOCKED.
The Item Control Center V1+V2 structure is SOLID — we are POLISHING, not rebuilding.
Keep ALL existing functionality. Add to it. Make it better.
Do NOT remove any existing feature or change the status flow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.
For this command: Share/copy actions could be tracked as user engagement signals.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI polish only. No API changes. No new routes. Single function upgrade
within a large file.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true. Both test accounts Tier 4 Estate Manager.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve the visual hierarchy and layout
  — Add new quick actions and quick links
  — Improve the status progress bar readability
  — Add a net earnings preview below listing price
  — Make the info strip more visually distinct
  — Add hover states and interaction feedback
  — Improve the quick links section to feel more purposeful

  You MAY NOT:
  — Touch any other function/panel in ItemDashboardPanels.tsx
  — Change the status flow (DRAFT→ANALYZED→READY→LISTED→INTERESTED→SOLD→SHIPPED→COMPLETED)
  — Change the TradeToggle or SaleAssignment components (they're separate files)
  — Touch any locked files
  — Change API routes or add new ones
  — Deviate from inline style={{}}

  IMPORTANT: This file is 7,748 lines. Only modify the ItemControlCenter
  function (lines ~6270-6590). Everything above and below is LOCKED.

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

OBJECTIVE — Item Control Center: Elon-Level Polish + Feature Upgrades

The Item Control Center (ItemControlCenter function in ItemDashboardPanels.tsx,
lines ~6270-6590) was built in V1+V2 on March 18 and works correctly.
This command upgrades it to Elon-level quality:

  1. Better status progress bar (larger labels, better visual weight)
  2. Enhanced quick actions (add MegaBot, Share, Delete)
  3. Net earnings preview next to listing price
  4. Upgraded info strip (visual hierarchy, color-coded pills)
  5. Elevated quick links section (icons, hover states, grid layout)
  6. Overall visual polish (spacing, borders, premium feel)

SURGICAL UNLOCK:
  app/items/[id]/ItemDashboardPanels.tsx — ItemControlCenter function ONLY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/items/[id]/ItemDashboardPanels.tsx — lines 6270-6590 ONLY
   Find: STATUS_FLOW array (line 6274)
   Find: ItemControlCenter function signature (line 6285)
   Find: updateStatus handler (line 6302)
   Find: Quick actions builder (lines 6318-6343)
   Find: Status progress bar JSX (lines 6354-6397)
   Find: Info strip (lines 6400-6421)
   Find: Quick actions render (lines 6424-6446)
   Find: Listing price section (lines 6449-6535)
   Find: TradeToggle + SaleAssignment (lines 6537-6545)
   Find: Sale details (lines 6547-6568)
   Find: Quick links (lines 6570-6584)

2. Read lib/constants/pricing.ts — lines 351-359 (PROCESSING_FEE) — READ ONLY
   Confirm: PROCESSING_FEE.sellerRate = 0.0175 (for net earnings preview)

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — UPGRADE STATUS PROGRESS BAR

Current: 8-step flow with tiny 0.58rem labels and small circles.
Upgrade to be more readable and visually impactful:

1. Increase label font size from 0.58rem to 0.65rem
2. Current step label: fontWeight 800 (up from 700), color var(--accent)
3. Past step circles: show filled with subtle checkmark
4. Current step circle: slightly larger (1.6rem from 1.5rem), stronger glow
5. Add a subtle "Step X of 8" text above the progress bar
6. Consider adding a percentage indicator: "62% complete"

Keep the existing STATUS_FLOW array unchanged.
Keep the existing color logic (past=accent, current=accent+glow, future=ghost).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ENHANCE QUICK ACTIONS

Current actions are context-sensitive based on status. Keep that logic.
ADD these additional actions:

1. FOR ALL STATUSES (except COMPLETED):
   Add "Share Item" action:
     label: "📤 Share"
     onClick: Copy the item's store URL to clipboard
       navigator.clipboard.writeText(`${window.location.origin}/store/items/${itemId}`)
       Show brief "Copied!" feedback

2. FOR ANALYZED/READY/LISTED statuses:
   Add "⚡ Run MegaBot" action:
     onClick: router.push(`/bots/megabot?itemId=${itemId}`)
     This gives direct access to MegaBot from the control center

3. FOR DRAFT/ANALYZED statuses:
   Add "📝 Edit Item" action:
     onClick: router.push(`/items/${itemId}/edit`)

4. FOR ALL STATUSES (except SOLD/SHIPPED/COMPLETED):
   Add "🗑️ Delete" action (LAST, danger style):
     onClick: Confirm dialog, then DELETE /api/items/delete/${itemId}
     Style: Red text, no fill, rightmost position
     Confirmation: "Delete this item? This cannot be undone."
     After delete: router.push("/dashboard")

The quick actions should feel like a toolbar — organized, purposeful,
each button clearly communicating its function.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — NET EARNINGS PREVIEW

Below the listing price input + save button, add a real-time net earnings
preview that shows the seller what they'll actually keep:

  If priceInput has a value, calculate and show:
    const listPrice = parseFloat(priceInput) || 0;
    const commissionRate = get commission rate from userTier prop
    (userTier 1=0.12, 2=0.08, 3=0.05, 4=0.04 — use a simple lookup)
    const commission = Math.round(listPrice * commissionRate * 100) / 100;
    const sellerFee = Math.round(listPrice * 0.0175 * 100) / 100;
    const netEarnings = Math.round((listPrice - commission - sellerFee) * 100) / 100;

  Display:
    "You'll keep: ${netEarnings} after ${commissionRate*100}% commission + 1.75% fee"

  Style: Small text (0.72rem), green color for net earnings amount,
  muted color for the explanation. Only show when priceInput > 0.

  This gives instant transparency — sellers see their real take-home
  BEFORE they set the price. Trust-building.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — UPGRADE INFO STRIP

Current: All pills are the same muted color with ghost-bg background.
Upgrade with color-coded pills for visual hierarchy:

  📷 Photos: teal accent if photos > 0, muted if 0
  🏷️ Category: accent color matching the category type
  🎯 AI Confidence: green if > 80%, yellow if 60-80%, red if < 60%
  💰 Price range: green always (it's money)

  Keep the pill shape and size. Just add meaningful color coding.
  The info strip should give an INSTANT health check of the item.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — UPGRADE QUICK LINKS SECTION

Current: Four text links in a row at the bottom (Edit, Store, Messages, Dashboard).
They feel like an afterthought.

Upgrade to a grid of small action cards:

  Layout: 2x2 grid (or 4-column on wider screens)
  Each card:
    Icon (emoji) + Label
    Subtle background (ghost-bg)
    Border (border-default)
    Rounded corners (0.5rem)
    Hover: border-hover + slight lift

  Links:
    ✏️ Edit Item → /items/${itemId}/edit
    🏪 View in Store → /store (opens in new tab)
    💬 Messages → /messages
    📊 Dashboard → /dashboard
    🤖 Run All Bots → /bots (if status is ANALYZED or READY)
    📋 View Listing → /items/${itemId} (scroll to listing section)

  These should feel like quick-access shortcuts, not afterthought links.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — OVERALL VISUAL POLISH

1. SECTION DIVIDERS:
   Add subtle separator lines between sections:
   Status bar → Info strip → Quick actions → Listing price → Trade/Sale → Quick links
   Use: borderTop: "1px solid var(--border-default)", paddingTop, marginTop

2. SECTION LABELS:
   Each section should have a tiny uppercase label:
   "STATUS" (already has badge)
   "QUICK ACTIONS"
   "LISTING PRICE" (already labeled)
   "TRADE & ASSIGNMENT"
   "QUICK LINKS"

3. SPACING:
   Ensure consistent spacing between all sections.
   Use marginBottom: "0.75rem" between sections.

4. HOVER STATES:
   Quick action buttons: subtle background change on hover
   Quick link cards: border-hover + translateY(-1px)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Any function other than ItemControlCenter in this file
  — STATUS_FLOW array values
  — TradeToggle or SaleAssignment components
  — The GlassCard wrapper or PanelHeader
  — Any other panels in the 7,748-line file
  — API routes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A read complete: yes / no

  STATUS BAR:
  3. Labels more readable (larger font): yes / no
  4. Current step has stronger visual weight: yes / no

  QUICK ACTIONS:
  5. Share button copies URL + shows feedback: yes / no
  6. MegaBot action available for analyzed items: yes / no
  7. Edit Item action available for draft/analyzed: yes / no
  8. Delete action available with confirmation: yes / no

  NET EARNINGS:
  9. Real-time earnings preview shows below price input: yes / no
  10. Correctly calculates commission + 1.75% seller fee: yes / no

  INFO STRIP:
  11. Color-coded pills (confidence green/yellow/red): yes / no

  QUICK LINKS:
  12. Grid layout with icon cards: yes / no
  13. Hover states working: yes / no

  POLISH:
  14. Section dividers between all areas: yes / no
  15. Consistent spacing: yes / no
  16. Both themes clean: yes / no

  SAFETY:
  17. NO changes to any other function in the file: yes / no
  18. STATUS_FLOW unchanged: yes / no
  19. TradeToggle/SaleAssignment calls unchanged: yes / no

  N+1. All locked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. npx tsc --noEmit: 0 errors
  N+4. npm run build: pass
  N+5. CHECKPOINT post-change: pass
  N+6. Light mode tested: yes / no
  N+7. Dark mode tested: yes / no

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Status bar upgrade: [fixed / issue]
  Part C — Quick actions enhanced: [fixed / issue]
  Part D — Net earnings preview: [fixed / issue]
  Part E — Info strip color-coded: [fixed / issue]
  Part F — Quick links grid: [fixed / issue]
  Part G — Visual polish: [fixed / issue]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  OTHER FUNCTIONS UNTOUCHED: [Confirm — grep for function names above and below]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [1 — app/items/[id]/ItemDashboardPanels.tsx]
  Lines modified: [approximately 6270-6590 only]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Item Control Center Polish
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
