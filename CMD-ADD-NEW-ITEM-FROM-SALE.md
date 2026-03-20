LEGACYLOOP — COMMAND TEMPLATE v9
Add New Item From Sale Dashboard — Direct Item Creation with Auto-Assignment
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Verify sale detail has edit mode ---'
  grep -c 'editMode\|sellAll\|showAddItems' app/projects/\[id\]/ProjectDetailClient.tsx
  echo '--- Verify new item page has sale selector ---'
  grep -c 'selectedSaleId\|Assign to a sale' app/items/new/page.tsx
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT the two listed below in SURGICAL UNLOCK.
This includes ALL locked files from previous commands.

SURGICAL UNLOCK — These files are explicitly unlocked for THIS COMMAND ONLY:

  app/projects/[id]/ProjectDetailClient.tsx — UNLOCKED (add "Create New Item" button/section)
  app/items/new/page.tsx — UNLOCKED (read saleId from URL params, pre-select sale, add back-to-sale link)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these.

Pass 1-5 + Phase 2 Items 9-11 Locked.
Edit Sale, Sell All, Item Assignment all working and locked.
The UploadModal, photo flow, and all 14 item fields are locked.
We are NOT rebuilding any of that. We are CONNECTING it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.
For this command: When a user creates an item from a sale context,
that signal tells us they're actively working on a sale — valuable for
engagement tracking.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this command: UI only. No API changes. The new item page already
creates items and assigns them to sales via the existing API.
We are improving the FLOW between the sale dashboard and item creation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. DEMO_MODE=true.

THE USER STORY:
  A senior is managing Grandma Dorothy's Estate Sale.
  They're on the sale dashboard looking at their 6 items.
  They spot a china cabinet they forgot to add.
  They should be able to tap "Add New Item", snap a photo,
  fill in the details, and the item automatically joins this sale.
  No hunting. No confusion. No leaving the context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Make the flow feel seamless and intuitive
  — Add a "return to sale" link after item creation
  — Make the button placement obvious and accessible

  You MAY NOT:
  — Touch any locked files
  — Rebuild the item creation form (it already works)
  — Change the UploadModal (already locked)
  — Change the API routes
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

OBJECTIVE — Add New Item From Sale Dashboard

Problem: Users can only add EXISTING items to a sale from the sale dashboard.
If they want to add a NEW item (snap a photo, fill in details), they have to
navigate away to /items/new, create the item, then come back and assign it.
For seniors managing estate sales, this is confusing and frustrating.

Solution: Two small changes that connect the sale dashboard to item creation:

  1. Sale detail page: Add a prominent "Create New Item for This Sale" button
     that links to /items/new?saleId={project.id}&saleName={project.name}

  2. New item page: Read saleId and saleName from URL search params.
     If present, pre-select that sale and show a contextual banner:
     "Creating item for: {saleName}" with a back link to the sale.

This uses the EXISTING item creation flow (photos, UploadModal, 14 fields,
AI analysis) — no duplicate code, no new forms.

SURGICAL UNLOCK:
  app/projects/[id]/ProjectDetailClient.tsx — add Create New Item button
  app/items/new/page.tsx — read URL params, pre-select sale, add context banner

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/projects/[id]/ProjectDetailClient.tsx — FULL file (as modified)
   Find: The "Items in this Sale" section header (around line 210-230)
   Find: The "+ Add Items" button (for existing items)
   Find: The empty state with "+ Add New Item" link (around line 308-315)
   NOTE: We need to add a "Create New Item" button ALONGSIDE the existing
   "+ Add Items" toggle. Users should see BOTH options clearly.

2. Read app/items/new/page.tsx — FULL file (898 lines)
   Find: Line 103 — NewItemPage component start
   Find: Line 117 — selectedSaleId state (currently starts empty)
   Find: Lines 110-130 — sales data loading (useEffect that fetches /api/projects)
   Find: Lines 638-695 — Sale assignment UI section
   Find: useRouter import and usage

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ADD "CREATE NEW ITEM" BUTTON TO SALE DETAIL PAGE

File: app/projects/[id]/ProjectDetailClient.tsx

In the "Items in this Sale" header area (around line 210-230),
there is currently a "+ Add Items" toggle button for EXISTING items.

ADD a second button next to it: "Create New Item"
This button links to the new item page with the sale pre-selected:

  <Link
    href={`/items/new?saleId=${project.id}&saleName=${encodeURIComponent(project.name)}`}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      padding: "0.4rem 0.85rem",
      borderRadius: "0.5rem",
      border: "none",
      background: "linear-gradient(135deg, #00bcd4, #009688)",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 700,
      textDecoration: "none",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }}
  >
    📷 Create New Item
  </Link>

Place this button BEFORE the "+ Add Items" toggle so it's the primary action.
The layout should be: [📷 Create New Item] [+ Add Items]

Also update the EMPTY STATE (when items.length === 0):
The existing empty state has two buttons: "+ Add New Item" and "+ Add Existing Items".
Change the "+ Add New Item" href from "/items/new" to:
  `/items/new?saleId=${project.id}&saleName=${encodeURIComponent(project.name)}`

This ensures new items created from the empty state also auto-assign to the sale.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — READ URL PARAMS IN NEW ITEM PAGE

File: app/items/new/page.tsx

1. ADD useSearchParams import:
   The page is already "use client" with useRouter. Add:
     import { useSearchParams } from "next/navigation";

   If the page needs a Suspense wrapper for useSearchParams, handle it cleanly.
   Check if there's already a wrapper or if one is needed.

2. READ saleId and saleName from URL params:
   At the top of the NewItemPage component (line 103):

     const searchParams = useSearchParams();
     const preSelectedSaleId = searchParams.get("saleId") || "";
     const preSelectedSaleName = searchParams.get("saleName") || "";

3. PRE-SELECT the sale in state:
   Change the selectedSaleId initial state from:
     const [selectedSaleId, setSelectedSaleId] = useState("");
   To:
     const [selectedSaleId, setSelectedSaleId] = useState(preSelectedSaleId);

4. ADD CONTEXTUAL BANNER when coming from a sale:
   If preSelectedSaleId is present, show a banner at the top of the page
   (above the photo upload section):

     {preSelectedSaleName && (
       <div style={{
         background: "var(--accent-dim, rgba(0,188,212,0.06))",
         border: "1px solid var(--accent-border, rgba(0,188,212,0.25))",
         borderRadius: "0.75rem",
         padding: "0.75rem 1rem",
         marginBottom: "1rem",
         display: "flex",
         alignItems: "center",
         justifyContent: "space-between",
         gap: "0.75rem",
       }}>
         <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
           <span style={{ fontSize: "1rem" }}>🏷️</span>
           <span style={{ fontSize: "0.85rem", color: "var(--text-primary, #f1f5f9)" }}>
             Creating item for: <strong>{preSelectedSaleName}</strong>
           </span>
         </div>
         <Link
           href={`/projects/${preSelectedSaleId}`}
           style={{
             fontSize: "0.78rem",
             color: "var(--accent, #00bcd4)",
             textDecoration: "none",
             fontWeight: 600,
             whiteSpace: "nowrap",
           }}
         >
           ← Back to Sale
         </Link>
       </div>
     )}

   Import Link from "next/link" if not already imported.

5. AFTER SUCCESSFUL ITEM CREATION — RETURN TO SALE:
   Find where the router.push happens after successful item creation
   (after the item is created and the API responds).
   If preSelectedSaleId is set, redirect back to the sale instead of
   the default destination:

     if (preSelectedSaleId) {
       router.push(`/projects/${preSelectedSaleId}`);
     } else {
       // existing redirect logic (likely /items/{id} or /dashboard)
     }

   This closes the loop — user goes from sale → create item → back to sale.

6. SALE ASSIGNMENT SECTION:
   The existing sale assignment section (around line 638) shows a list of sales
   to choose from. When preSelectedSaleId is set, the correct sale should
   already be highlighted (since we pre-set selectedSaleId state).
   No changes needed to the selector UI — just verify it works.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — UploadModal (locked)
  — Item creation API routes (locked)
  — Photo upload logic (locked)
  — Item fields (14 fields already working, locked)
  — Sale assignment API (PATCH /api/projects/[id] with addItemId — locked)
  — Sell All feature (locked)
  — Edit Sale feature (locked)
  — Any other locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  SALE DETAIL PAGE:
  3. "Create New Item" button visible in items section header: yes / no
  4. Button links to /items/new?saleId=...&saleName=...: yes / no
  5. Empty state "Add New Item" also links with saleId param: yes / no
  6. Existing "+ Add Items" toggle still works: yes / no

  NEW ITEM PAGE:
  7. Reads saleId from URL search params: yes / no
  8. Pre-selects correct sale in assignment dropdown: yes / no
  9. Shows "Creating item for: {saleName}" banner: yes / no
  10. "Back to Sale" link works: yes / no
  11. After creation, redirects back to sale (if saleId present): yes / no
  12. Without saleId param, page works exactly as before: yes / no

  FLOW TEST:
  13. Sale dashboard → Create New Item → photo upload → fill details → save → returns to sale: yes / no
  14. Item appears in the sale's item list after creation: yes / no

  N+1. All locked files untouched: yes / no
  N+2. UploadModal untouched: yes / no
  N+3. API routes untouched: yes / no
  N+4. inline style={{}} throughout: yes / no
  N+5. npx tsc --noEmit: 0 errors
  N+6. npm run build: pass
  N+7. CHECKPOINT post-change: pass
  N+8. Dev server: localhost:3000
  N+9. Light mode tested: no broken contrast
  N+10. Dark mode tested: all elements visible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part A printed: [yes / no]

  Part B — Sale detail "Create New Item" button: [fixed / issue]
    - Button visible in header: [yes / no]
    - Links with saleId + saleName params: [yes / no]
    - Empty state updated: [yes / no]

  Part C — New item page URL param support: [fixed / issue]
    - Reads saleId: [yes / no]
    - Pre-selects sale: [yes / no]
    - Context banner shown: [yes / no]
    - Back to sale link: [yes / no]
    - Redirects to sale after creation: [yes / no]
    - Works normally without params: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Edit Sale preserved: [Confirm]
  — Sell All preserved: [Confirm]
  — Item assignment preserved: [Confirm]
  — UploadModal untouched: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list all — should be exactly 2]
    - app/projects/[id]/ProjectDetailClient.tsx
    - app/items/new/page.tsx
  New files: [none]
  Schema changes needed: [none]
  Build: [pass / fail]
  TypeScript: [0 errors / list errors]
  CHECKPOINT after: [pass / issue]
  Dev server: [localhost:3000]

  IF POST-CHECKPOINT FAILS:
  REVERT IMMEDIATELY.
  Report exactly what broke and what was touched.

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
Command Template v9 | LegacyLoop | Add New Item From Sale Dashboard
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
