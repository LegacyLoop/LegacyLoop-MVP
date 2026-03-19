LEGACYLOOP — COMMAND TEMPLATE v8
Item Control Center Upgrade — Consolidate Trade + Sale Assignment
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

LIGHT MODE RULE: All text, borders, and backgrounds on theme-aware surfaces
MUST use CSS variables from globals.css (var(--text-primary), var(--border-default),
etc.) — NEVER hardcoded rgba(255,255,255,...).

Every new element must match this design system exactly. No exceptions.

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

ALWAYS LOCKED — Never touch without explicit surgical unlock:

# All backend files — ALL LOCKED
lib/** — ALL LOCKED
app/api/** — ALL LOCKED (trade-settings route stays as-is, SaleAssignment calls projects API as-is)

# All files fixed in light mode rounds — LOCKED (colors done)
# Modals, overlays, always-dark panels — LOCKED
# All bot files, shipping, messaging, marketplace, etc — ALL LOCKED

globals.css — LOCKED
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED (add TradeToggle + SaleAssignment inside ItemControlCenter panel, remove standalone SaleAssignment render)
app/items/[id]/page.tsx — UNLOCKED (remove standalone TradeToggle render)
app/items/[id]/TradeToggle.tsx — UNLOCKED (fix light mode colors — hardcoded #fff and rgba(207,216,220,0.6))
app/items/[id]/SaleAssignment.tsx — UNLOCKED (no logic changes — may need minor style tweaks for compact rendering inside panel)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these.

All bot AI logic, output formats, MegaBot, antique/collectible detection,
shipping, offers, credits, billing, subscriptions, marketplace, bundles,
trade proposals, sold price tracking, message center, data pipelines.

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  Upload system — shared UploadModal with 6 methods
  Light Mode Rounds 1-4 — ~1,554 replacements across 88 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Flag all missed data collection opportunities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

For this command: UI consolidation. Move two standalone components INTO the
Item Control Center panel. Remove their standalone renders. Fix light mode
on TradeToggle. No API changes. No logic changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY: Improve beyond spec, flag gaps, make it investor-ready, add polish.
You MAY NOT: Touch locked files, change API logic, change bot output, add packages.

CRITICAL: The current Item Control Center look is LOVED by the founder.
The status pipeline, quick actions, listing price section — all must stay
visually identical. We are ADDING Trade + Sale Assignment into the panel
in a way that feels natural and doesn't disrupt the existing layout.
Think: elegant additions, not a redesign.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env. Admin bypasses all gates. TO GO LIVE: set false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Consolidate Trade Toggle + Sale Assignment INTO Item Control Center

The Item Control Center is the command hub for each item. Currently, the
Accept Trades toggle and Sale Assignment sit as separate panels outside it.
This command consolidates them INTO the Item Control Center so users have
ONE unified panel to control everything about their item.

Current layout (3 separate panels):
  1. TradeToggle — standalone on page.tsx (line 362-365)
  2. Item Control Center — in ItemDashboardPanels.tsx (lines 6341-6548)
  3. SaleAssignment — standalone in ItemDashboardPanels.tsx (lines 7138-7141)

New layout (1 unified panel):
  Item Control Center contains:
    1. Status Pipeline (KEEP exactly as-is)
    2. Quick Actions (KEEP exactly as-is)
    3. Listing Price (KEEP exactly as-is)
    4. Accept Trades toggle (MOVED IN — light mode fixed)
    5. Sale Assignment (MOVED IN — compact within panel)
    6. Sale Details when sold (KEEP exactly as-is)
    7. Quick Links (KEEP exactly as-is)

Also fixes the TradeToggle light mode issue:
  - color: "#fff" → color: "var(--text-primary)"
  - color: "rgba(207,216,220,0.6)" → color: "var(--text-muted)"

What this command touches:
  app/items/[id]/ItemDashboardPanels.tsx — add Trade + Sale inside ItemControlCenter, remove standalone SaleAssignment render
  app/items/[id]/page.tsx — remove standalone TradeToggle render + import
  app/items/[id]/TradeToggle.tsx — fix light mode colors, adjust styling for in-panel render
  app/items/[id]/SaleAssignment.tsx — adjust marginTop for in-panel render (remove extra spacing)

What this command does NOT touch:
  API routes (trade-settings, projects) — UNCHANGED
  TradeToggle logic (fetch, toggle, state) — UNCHANGED
  SaleAssignment logic (fetch sales, assign, remove) — UNCHANGED
  TradeProposalsPanel — stays in its current position on page.tsx
  Item Control Center status pipeline, quick actions, listing price — ALL UNCHANGED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE.

1. Read app/items/[id]/ItemDashboardPanels.tsx — Lines 6340-6548 (ItemControlCenter function)
   Find: Line 6343 — PanelHeader with "Item Control Center"
   Find: Lines 6346-6391 — Status Pipeline (KEEP exactly as-is)
   Find: Lines 6393-6416 — Quick Actions (KEEP exactly as-is)
   Find: Lines 6418-6504 — Listing Price section (KEEP exactly as-is)
   Find: Lines 6506-6527 — Sale Details when sold (KEEP exactly as-is)
   Find: Lines 6529-6543 — Quick Links (KEEP exactly as-is)
   Find: Lines 6544-6548 — closing tags
   Confirm: We ADD TradeToggle + SaleAssignment between Listing Price (6504) and Sale Details (6506)

2. Read app/items/[id]/ItemDashboardPanels.tsx — Lines 7133-7141
   Find: Line 7135 — ItemControlCenter render
   Find: Lines 7138-7141 — standalone SaleAssignment render (THIS GETS REMOVED)

3. Read app/items/[id]/page.tsx — Lines 360-368
   Find: Lines 362-365 — standalone TradeToggle render (THIS GETS REMOVED)
   Find: Line 14 — import TradeToggle (THIS GETS REMOVED)
   Find: Lines 366-368 — TradeProposalsPanel (THIS STAYS in page.tsx)

4. Read app/items/[id]/TradeToggle.tsx — FULL file (39 lines)
   Find: Line 31 — color: "#fff" (BROKEN in light mode)
   Find: Line 32 — color: "rgba(207,216,220,0.6)" (BROKEN in light mode)
   Confirm: All toggle logic (fetch, PATCH, state) works independently

5. Read app/items/[id]/SaleAssignment.tsx — FULL file (290 lines)
   Find: Line 116 — marginTop: "0.75rem" (needs to be 0 when inside panel)
   Confirm: Component is self-contained with its own fetch/state

Print ALL findings before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Fix TradeToggle Light Mode Colors

File: app/items/[id]/TradeToggle.tsx

Line 31 — BEFORE:
  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>🔄 Accept Trades</div>

AFTER:
  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>🔄 Accept Trades</div>

Line 32 — BEFORE:
  <div style={{ fontSize: 11, color: "rgba(207,216,220,0.6)", marginTop: 2 }}>Allow buyers to propose items in exchange</div>

AFTER:
  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Allow buyers to propose items in exchange</div>

Also on line 29, the container style has borderLeft: "3px solid #00bcd4" which is fine
(accent color works in both modes). But update the background and border to use CSS vars:

Line 29 — BEFORE:
  <div style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderLeft: "3px solid #00bcd4", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

This is actually already using CSS vars for bg and border (from Round 1 fix). Just fix the text colors on lines 31-32. Keep everything else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Add TradeToggle + SaleAssignment Inside Item Control Center

File: app/items/[id]/ItemDashboardPanels.tsx

STEP 1 — Add import for TradeToggle (if not already imported).

Check the imports at the top of the file. SaleAssignment is already imported (line 17).
Add TradeToggle import if missing:

  import TradeToggle from "./TradeToggle";

STEP 2 — Add TradeToggle and SaleAssignment inside the ItemControlCenter component.

Find the Listing Price section ending at line 6504 (the closing </div> of the
listing price block). Between that and the Sale Details section (line 6506),
INSERT:

        {/* ── Accept Trades ── */}
        <div style={{ marginBottom: "0.75rem" }}>
          <TradeToggle itemId={itemId} />
        </div>

        {/* ── Sale Assignment ── */}
        <div style={{ marginBottom: "0.75rem" }}>
          <SaleAssignment itemId={itemId} initialProjectId={null} />
        </div>

This renders both components INSIDE the Item Control Center panel, between
the Listing Price and Sale Details sections. The components handle their own
state and API calls — no new logic needed in ItemControlCenter.

STEP 3 — Remove the standalone SaleAssignment render.

Find lines 7138-7141:

      {/* ── SALE ASSIGNMENT (below Item Control Center) ── */}
      <div style={{ marginBottom: "1rem" }}>
        <SaleAssignment itemId={itemId} initialProjectId={null} />
      </div>

DELETE these 4 lines entirely. SaleAssignment now renders inside ItemControlCenter.

STEP 4 — Adjust SaleAssignment marginTop for in-panel rendering.

File: app/items/[id]/SaleAssignment.tsx

The component has marginTop: "0.75rem" on its root container (lines 100 and 116).
When rendered inside the Item Control Center, the parent already handles spacing.
Change both instances of marginTop: "0.75rem" to marginTop: "0" (or remove the
marginTop entirely). The parent div in ItemControlCenter handles the spacing with
marginBottom: "0.75rem".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — Remove Standalone TradeToggle from page.tsx

File: app/items/[id]/page.tsx

STEP 1 — Remove the import (line 14):

  DELETE: import TradeToggle from "./TradeToggle";

STEP 2 — Remove the standalone render (lines 362-365):

  DELETE:
      {/* ═══ Trade System ═══ */}
      <div style={{ marginTop: "1rem" }}>
        <TradeToggle itemId={item.id} />
      </div>

KEEP the TradeProposalsPanel that follows (lines 366-368) — that stays in page.tsx.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A reads completed: yes / no
TRADE TOGGLE:
3. TradeToggle color "#fff" fixed to var(--text-primary): yes / no
4. TradeToggle color "rgba(207,216,220,0.6)" fixed to var(--text-muted): yes / no
5. TradeToggle visible in light mode: yes / no
6. TradeToggle toggle logic UNCHANGED: yes / no
ITEM CONTROL CENTER:
7. TradeToggle rendered inside ItemControlCenter (after Listing Price): yes / no
8. SaleAssignment rendered inside ItemControlCenter (after TradeToggle): yes / no
9. Status Pipeline UNCHANGED: yes / no
10. Quick Actions UNCHANGED: yes / no
11. Listing Price section UNCHANGED: yes / no
12. Sale Details section UNCHANGED: yes / no
13. Quick Links UNCHANGED: yes / no
CLEANUP:
14. Standalone TradeToggle removed from page.tsx: yes / no
15. TradeToggle import removed from page.tsx: yes / no
16. Standalone SaleAssignment render removed from ItemDashboardPanels.tsx: yes / no
17. TradeProposalsPanel STILL in page.tsx: yes / no
SPACING:
18. SaleAssignment marginTop adjusted for in-panel render: yes / no
19. Panel doesn't feel cramped — spacing between sections is clean: yes / no
FUNCTIONALITY:
20. TradeToggle fetch + toggle still works: yes / no
21. SaleAssignment fetch + assign + remove still works: yes / no
22. All API calls (trade-settings, projects) UNCHANGED: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — TradeToggle light mode colors: [fixed / issue]
Fix C — Trade + Sale moved inside Item Control Center: [fixed / issue]
  - TradeToggle rendering inside panel: [yes / no]
  - SaleAssignment rendering inside panel: [yes / no]
  - All existing sections preserved: [yes / no]
Fix D — Standalone renders removed: [fixed / issue]
  - TradeToggle removed from page.tsx: [yes / no]
  - SaleAssignment standalone removed: [yes / no]
  - TradeProposalsPanel still in page.tsx: [yes / no]

LIGHT MODE CHECK:
  - Accept Trades text visible in light mode: [yes / no]
  - Sale Assignment visible in light mode: [yes / no]
  - Entire Item Control Center looks clean in light mode: [yes / no]

DARK MODE REGRESSION: [Confirm no regressions]
ALL LOGIC UNTOUCHED: [Confirm zero API/handler/state changes]

FLAGS: [Any gaps or issues]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Item Control Center Upgrade
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
