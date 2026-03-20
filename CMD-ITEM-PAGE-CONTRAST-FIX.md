LEGACYLOOP — COMMAND TEMPLATE v9
New Item Page — Light Mode Contrast Fix + Add Item Button in Sale Header
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
  NEVER hardcoded rgba(255,255,255,...) or #fff on theme surfaces.

  ELON MUSK STANDARD: This must feel like a $1B product.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Contrast check ---'
  grep -n 'color: "#fff"' app/items/new/page.tsx
  grep -n 'color: "white"' app/items/new/page.tsx
  echo '--- Sale header check ---'
  grep -n 'Edit Sale\|Public Page\|Publish All' app/projects/\[id\]/ProjectDetailClient.tsx | head -5
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT the two listed below in SURGICAL UNLOCK.

SURGICAL UNLOCK — These files are explicitly unlocked for THIS COMMAND ONLY:

  app/items/new/page.tsx — UNLOCKED (fix hardcoded #fff colors for light mode contrast)
  app/projects/[id]/ProjectDetailClient.tsx — UNLOCKED (add "Add Item" button to sale header bar)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Pass 1-5 + Phase 2 Items 9-11 + Create New Item from Sale — all LOCKED.
Edit Sale, Sell All, Item Assignment, Auto-trigger quiz — all working.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.
No new data collection in this command.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this command: UI fixes only. No API changes. No logic changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true — admin accounts bypass all gates.
Both test accounts are Tier 4 Estate Manager with full access.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Fix any additional hardcoded colors found during the read
  — Improve contrast on any element that's hard to read in light mode
  — Scan the ENTIRE new item page for light mode issues

  You MAY NOT:
  — Touch any locked files
  — Change the UploadModal (locked)
  — Change item creation logic or API routes
  — Change the sale assignment logic (already working)
  — Deviate from inline style={{}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

  DEMO_MODE=true in .env — active now.
  TEST ACCOUNTS:
  annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
  ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — ENVIRONMENT VARIABLES STATUS

  All keys SET. DEMO_MODE=true. DATABASE_URL SET.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — PENDING SCHEMA MIGRATION

  No changes in this command.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — New Item Page Contrast Fix + Add Item Button in Sale Header

Two problems:

  1. The Add New Item page (app/items/new/page.tsx) has hardcoded "#fff" and
     "white" text colors that are INVISIBLE in light mode. The page title,
     all input text, and some labels are white-on-white. This is a critical
     usability bug — seniors literally cannot see what they're typing.

  2. The sale detail page header bar has Edit Sale, Public Page, and Publish All
     buttons — but no quick "Add Item" button. Users should be able to add an
     item from the most visible spot on the page.

SURGICAL UNLOCK:
  app/items/new/page.tsx — fix contrast
  app/projects/[id]/ProjectDetailClient.tsx — add header button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/items/new/page.tsx — FULL file (898+ lines)
   Find: Line 58 — color: "#fff" in inputStyle (global input text color)
   Find: Line 458 — color: "#fff" in page title "Add New Item"
   Find: Line 913 — color: "white" (find exact context)
   Find: ALL other instances of hardcoded "#fff", "white", "#1c1917", "#e7e5e4"
   Scan the ENTIRE file for any color that would break in light mode.
   The page ALREADY uses some var(--) colors — check which ones are correct
   and which are still hardcoded.

2. Read app/projects/[id]/ProjectDetailClient.tsx — FULL file (as modified)
   Find: The VIEW MODE header section with Edit Sale, Public Page, Publish All buttons
   Find: The exact line where these buttons are rendered (around line 371-411)
   This is where we add the new "Add Item" button.

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — FIX CONTRAST ON NEW ITEM PAGE

File: app/items/new/page.tsx

KNOWN FIXES:

  Line 58: inputStyle.color
    From: color: "#fff"
    To:   color: "var(--input-color, #f1f5f9)"

  Line 458: page title color
    From: color: "#fff"
    To:   color: "var(--text-primary)"

  Line 913: (find context — likely a button or label)
    From: color: "white"
    To:   appropriate CSS variable

SCAN THE ENTIRE FILE for additional hardcoded colors:
  - Any "#fff" used as TEXT on theme-aware backgrounds
  - Any "white" used as TEXT
  - Any hardcoded dark colors (#1c1917, #292524) used as TEXT that would
    be invisible on dark mode backgrounds

  NOTE: "#fff" used as TEXT on accent/teal BUTTONS is correct and should
  stay — those buttons have their own dark background. Only fix "#fff"
  used on theme-aware surfaces (cards, inputs, page background).

  Replace all broken instances with appropriate CSS variables:
    Text: var(--text-primary), var(--text-secondary), var(--text-muted)
    Input text: var(--input-color)
    Label text: var(--label-color) or var(--text-muted)
    Placeholder: var(--input-placeholder)

After this fix: The entire Add New Item page should be readable in BOTH
light and dark mode. Every input, every label, every heading.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ADD "ADD ITEM" BUTTON TO SALE HEADER BAR

File: app/projects/[id]/ProjectDetailClient.tsx

In the VIEW MODE header section (around line 371-411), there are currently
three buttons in a flex row:
  1. Edit Sale (pencil icon, ghost style)
  2. Public Page (link icon, ghost style)
  3. Publish All Items (megaphone icon, primary gradient style)

ADD a fourth button BEFORE "Edit Sale" — this is the primary action:

  <Link
    href={`/items/new?saleId=${project.id}&saleName=${encodeURIComponent(project.name)}`}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      padding: "0.45rem 0.85rem",
      borderRadius: "0.5rem",
      border: "none",
      background: "linear-gradient(135deg, #00bcd4, #009688)",
      color: "#fff",
      fontSize: "0.78rem",
      fontWeight: 700,
      textDecoration: "none",
      transition: "all 0.15s ease",
    }}
  >
    📷 Add Item
  </Link>

Button order should now be:
  [📷 Add Item] [✏️ Edit Sale] [🔗 Public Page] [📢 Publish All Items]

The "Add Item" button uses the same gradient teal as "Publish All" to make
it visually prominent. Both are primary actions.

If the header feels crowded with 4 buttons, consider making "Edit Sale" and
"Public Page" smaller (0.4rem padding) or putting them on a second row on
narrow screens. Use creative judgment to keep it clean.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — UploadModal (locked)
  — Item creation API routes (locked)
  — Sale assignment logic (already working)
  — Sell All feature (already working)
  — Edit Sale form (already working)
  — Quiz pages (locked)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  CONTRAST FIX:
  3. inputStyle.color uses CSS variable (not #fff): yes / no
  4. Page title "Add New Item" readable in light mode: yes / no
  5. Line 913 "white" fixed: yes / no
  6. ALL inputs readable in light mode (text visible): yes / no
  7. ALL labels readable in light mode: yes / no
  8. ALL section headers readable in light mode: yes / no
  9. Page still looks correct in dark mode: yes / no
  10. Zero remaining "#fff" or "white" on theme-aware surfaces: yes / no

  HEADER BUTTON:
  11. "Add Item" button visible in sale header bar: yes / no
  12. Button links to /items/new?saleId=...&saleName=...: yes / no
  13. Button uses gradient teal style: yes / no
  14. Header doesn't feel cluttered with 4 buttons: yes / no

  EXISTING FEATURES:
  15. Edit Sale still works: yes / no
  16. Sell All still works: yes / no
  17. Create New Item in items section still works: yes / no
  18. Sale assignment from URL params still works: yes / no

  N+1. All locked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. npx tsc --noEmit: 0 errors
  N+4. npm run build: pass
  N+5. CHECKPOINT post-change: pass
  N+6. Dev server: localhost:3000
  N+7. Light mode tested: ALL text visible and readable
  N+8. Dark mode tested: no regressions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part A printed: [yes / no]

  Part B — Contrast fix: [fixed / issue]
    - Hardcoded colors fixed: [count]
    - Light mode readable: [yes / no]
    - Dark mode clean: [yes / no]

  Part C — Header button: [fixed / issue]
    - Add Item button in header: [yes / no]
    - Links correctly: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Edit Sale preserved: [Confirm]
  — Sell All preserved: [Confirm]
  — Item assignment preserved: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, additional hardcoded colors found]

  Files modified: [list all — should be exactly 2]
  Build: [pass / fail]
  TypeScript: [0 errors / list errors]
  CHECKPOINT after: [pass / issue]
  Dev server: [localhost:3000]

  IF POST-CHECKPOINT FAILS:
  REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  Event Name                    Direction                  Purpose
  conversation-selected         Messages → InboxCmd        Conversation clicked
  conversation-counts-updated   Messages → InboxCmd        Update count badges
  agent-fill-message            InboxCmd → Messages        AI fills reply box
  agent-settings-toggle         InboxCmd → AgentSettings   Open settings panel
  inbox-filter-change           InboxCmd → Messages        Sidebar category clicked
  inbox-filter-reset            Messages → InboxCmd        Tab bar clicked — reset sidebar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Item Page Contrast Fix + Sale Header Button
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
