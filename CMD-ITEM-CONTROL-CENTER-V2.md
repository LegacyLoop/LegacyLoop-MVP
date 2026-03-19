LEGACYLOOP — COMMAND TEMPLATE v8
Item Control Center V2 — Tighter, Smarter, More Professional
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
NEVER hardcoded rgba(255,255,255,...).

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

ALL backend, API, bot, and library files — LOCKED.
ALL files fixed in light mode rounds — LOCKED.
ALL modals, overlays, always-dark panels — LOCKED.
globals.css, vercel.json, prisma/schema.prisma — LOCKED.

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED (upgrade ItemControlCenter function layout only — lines 6266-6548)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All bot AI logic, output formats, MegaBot, antique/collectible detection,
shipping, offers, credits, billing, subscriptions, marketplace, bundles,
trade proposals, sold price tracking, message center, data pipelines.

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment, Upload system, Light Mode Rounds 1-4,
  Item Control Center V1 consolidation (Trade + Sale moved in)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Flag all missed data collection opportunities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI layout upgrade only. Zero logic changes. Zero API changes.
All handlers (updateStatus, price save, TradeToggle, SaleAssignment) stay identical.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY: Improve beyond spec, make it stunning, add polish, add visual density.
You MAY NOT: Touch locked files, change handlers/state/API logic, add packages.

CRITICAL DESIGN CONSTRAINT: The founder LOVES the current status pipeline.
It MUST stay visually identical. The upgrade is about TIGHTENING the layout,
ADDING missing information, and making the overall panel more compact and
professional. Think: Tesla dashboard — dense, informative, beautiful.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env. Admin bypasses all gates. TO GO LIVE: set false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Upgrade Item Control Center Layout V2

The Item Control Center is the command hub for each item. V1 consolidated
TradeToggle + SaleAssignment into the panel. V2 tightens the layout, reduces
vertical space, adds missing information, and makes the panel feel like a
premium control dashboard.

The data is already available via props: itemId, status, valuation, aiData,
listingPrice. The parent component also has: photos, category, saleZip.

WHAT TO ADD (pass photos and category to ItemControlCenter from the parent):

Update the ItemControlCenter function signature (line 6281) to accept
two new optional props:
  photos?: any[];
  category?: string | null;

Update the render call (line 7146) to pass them:
  photos={photos} category={category}

THE NEW LAYOUT (inside ItemControlCenter, replacing lines 6345-6544):

1. STATUS PIPELINE — KEEP EXACTLY AS-IS (lines 6347-6391). Do not change
   a single pixel. This is sacred.

2. NEW: ITEM INFO STRIP — A compact single-line summary bar below the pipeline.
   Shows key metadata at a glance. Uses small font, horizontal layout.

   Layout: [📷 3 photos] · [🏷️ Furniture] · [🎯 AI: 72%] · [$50-$120 est]

   - Photo count: photos?.length ?? 0 — show "📷 X photos"
   - Category: category or aiData?.category — show "🏷️ Category"
   - AI confidence: valuation?.confidence or aiData?.confidence — show "🎯 AI: X%"
     (scale 0-1 to 0-100%, or if already 0-100 display as-is)
   - AI estimate: valuation low-high — show "$X – $Y est"

   Style: single row, flexbox, gap 1rem, wrapping allowed. Each item is a
   small pill/badge: fontSize 0.68rem, fontWeight 600, color var(--text-muted),
   border: 1px solid var(--border-default), borderRadius 9999px,
   padding 0.15rem 0.5rem, background var(--ghost-bg).
   If data is missing for any item, don't show that pill.
   Margin: 0.6rem 0 0.75rem 0.

3. QUICK ACTIONS — KEEP same logic (lines 6394-6416). Tighten slightly:
   - Reduce marginBottom from 0.75rem to 0.5rem
   - Reduce padding on buttons from "0.4rem 0.85rem" to "0.35rem 0.75rem"

4. PRICE + TRADES ROW — Put Listing Price and Accept Trades SIDE BY SIDE
   in a 2-column grid layout instead of stacked vertically.

   Use: display: "grid", gridTemplateColumns: "1fr auto", gap: "0.6rem",
   alignItems: "center", marginBottom: "0.5rem"

   LEFT column: Listing Price (same input + button + AI estimate hint, but
   tighter — reduce padding from "1rem 1.25rem" to "0.6rem 0.75rem")

   RIGHT column: Accept Trades toggle — keep the TradeToggle component but
   displayed compact. Just the toggle + small label, no description text.
   Since TradeToggle is a separate component rendered via <TradeToggle />,
   we can't easily change its internal layout from here. Instead, wrap it
   in a container that matches the price card height.

   ALTERNATIVE APPROACH (simpler): Keep Listing Price and TradeToggle stacked
   but REDUCE vertical padding on both. The price card goes from
   padding "1rem 1.25rem" to "0.65rem 1rem". The TradeToggle wrapper
   gets marginBottom: "0.5rem" instead of "0.75rem".

   Use whichever approach looks cleaner. The goal is LESS vertical space.

5. SALE ASSIGNMENT — Make it collapsible. Currently it shows the full list
   of sales even when an assignment exists. Wrap in a collapsible section:

   - When assigned: show a compact single line:
     "🏷️ Spring Cleanout Sale · Garage Sale  [Change]"
     The [Change] button expands to show the full selector.

   - When not assigned: show a compact "Assign to Sale" button that expands
     the selector list.

   - This saves the MOST vertical space because the sale list is the tallest section.

   Since SaleAssignment is a separate component, the simplest approach is:
   In the wrapper div around <SaleAssignment>, add a small collapsible header.
   OR: Just reduce the marginBottom to "0.5rem" and let it be.

   PRACTICAL APPROACH: SaleAssignment already handles its own collapsed/expanded
   state (showSelector). When assigned, it shows a compact badge + buttons.
   This is already good. Just tighten the wrapper spacing.

6. SALE DETAILS — KEEP as-is (lines 6506-6527). Only shows when sold.

7. QUICK LINKS — Tighten the link bar. Current uses text links with emojis.
   Make them slightly more compact:
   - Reduce fontSize from "0.72rem" to "0.7rem"
   - Reduce gap from "0.75rem" to "0.6rem"
   - Add a thin separator line above: borderTop: "1px solid var(--border-default)",
     paddingTop: "0.5rem", marginTop: "0.5rem"

OVERALL PADDING: Reduce the outer padding from "1rem 1.25rem" to "0.75rem 1rem".
This alone saves significant vertical space.

WHAT NOT TO TOUCH:
  - STATUS_FLOW array (lines 6270-6279) — UNCHANGED
  - updateStatus function (lines 6296-6310) — UNCHANGED
  - Actions logic (lines 6312-6337) — UNCHANGED
  - Price save handler (lines 6466-6486) — UNCHANGED
  - PanelHeader component usage — UNCHANGED
  - GlassCard wrapper — UNCHANGED
  - TradeToggle component internals — UNCHANGED
  - SaleAssignment component internals — UNCHANGED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/items/[id]/ItemDashboardPanels.tsx — Lines 6266-6548
   (the complete ItemControlCenter function)
   Print the current padding values, margin values, and layout structure.

2. Read line 7146 — ItemControlCenter render call
   Confirm current props passed.

3. Read lines 6778-6780 — Props type for main component
   Confirm photos and category are available.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Add New Props + Item Info Strip + Tighten Layout

File: app/items/[id]/ItemDashboardPanels.tsx

STEP 1: Update ItemControlCenter function signature (line 6281).
Add: photos?: any[]; category?: string | null;

STEP 2: Update render call (line 7146).
Add: photos={photos} category={category}

STEP 3: Add the Item Info Strip after the pipeline (after line 6391).
See OBJECTIVE section 2 for exact spec.

STEP 4: Tighten all spacing:
  - Outer padding: "1rem 1.25rem" → "0.75rem 1rem"
  - Quick Actions marginBottom: 0.75rem → 0.5rem
  - Quick Actions button padding: "0.4rem 0.85rem" → "0.35rem 0.75rem"
  - Listing Price card padding: "1rem 1.25rem" → "0.65rem 1rem"
  - TradeToggle wrapper marginBottom: "0.75rem" → "0.5rem"
  - SaleAssignment wrapper marginBottom: "0.75rem" → "0.5rem"
  - Pipeline marginBottom: "1rem" → "0.6rem"

STEP 5: Add separator line above Quick Links section.

ALL CHANGES ARE LAYOUT/SPACING/VISUAL ONLY.
Zero handler changes. Zero state changes. Zero API changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A reads completed: yes / no
STATUS PIPELINE:
3. Pipeline visually identical (zero changes to circles, lines, labels): yes / no
NEW INFO STRIP:
4. Photo count pill visible: yes / no
5. Category pill visible (when data exists): yes / no
6. AI confidence pill visible (when data exists): yes / no
7. AI estimate pill visible (when valuation exists): yes / no
8. Info strip is compact single row: yes / no
TIGHTER LAYOUT:
9. Outer padding reduced: yes / no
10. Pipeline margin reduced: yes / no
11. Quick Actions spacing reduced: yes / no
12. Listing Price card padding reduced: yes / no
13. Trade + Sale wrapper spacing reduced: yes / no
14. Quick Links separator line added: yes / no
15. Overall panel feels significantly more compact: yes / no
FUNCTIONALITY:
16. Status updates still work: yes / no
17. Price save still works: yes / no
18. Trade toggle still works: yes / no
19. Sale assignment still works: yes / no
20. Quick links still navigate correctly: yes / no
DESIGN:
21. All CSS variables used (no hardcoded white): yes / no
22. Light mode looks correct: yes / no
23. Dark mode looks correct: yes / no
24. Pipeline is UNTOUCHED: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — Item Control Center V2 upgrade: [fixed / issue]
  - Info strip added: [yes / no, which pills visible]
  - Spacing tightened: [yes / list changes]
  - Pipeline preserved: [yes / no]
  - New props wired (photos, category): [yes / no]
  - Quick Links separator: [yes / no]

FUNCTIONALITY PRESERVED:
  [Confirm all handlers still work]

LIGHT + DARK MODE:
  [Confirm both modes look correct]

FLAGS: [Any gaps or issues]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Item Control Center V2
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
