LEGACYLOOP — COMMAND TEMPLATE v9
Edit Sale Function + Sales Dashboard Item Assignment Upgrade
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
  Every interaction must feel responsive and purposeful.
  Think Tesla center console — dense, smart, fast.

  ALWAYS-DARK PANELS: Modals and overlays that are always dark
  MUST use hardcoded colors (#e2e8f0 text, rgba(255,255,255,0.05) bg)
  NEVER CSS variables — they invert in light mode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'OPENAI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'ANTHROPIC_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'GEMINI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'XAI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'SENDGRID_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'DEMO_MODE' .env | head -2
  grep -n 'shouldBypassGates|isDemoMode' lib/constants/pricing.ts | head -3
  grep -n 'checkCredits|deductCredits' lib/credits.ts | head -3
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Sales pages check ---'
  wc -l app/projects/ProjectsClient.tsx app/projects/\[id\]/ProjectDetailClient.tsx app/projects/\[id\]/page.tsx
  echo '--- API route check ---'
  grep -c 'PATCH\|addItemId\|removeItemId\|publishAll' app/api/projects/\[id\]/route.ts
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALWAYS LOCKED — Never touch without explicit surgical unlock:

— Core Adapters —
✓ lib/adapters/ai.ts
✓ lib/adapters/rainforest.ts
✓ lib/adapters/auth.ts — EXTEND ONLY
✓ lib/adapters/storage.ts
✓ lib/adapters/multi-ai.ts

— AI Detection + Scoring —
✓ lib/antique-detect.ts
✓ lib/collectible-detect.ts

— MegaBot Engine —
✓ lib/megabot/run-specialized.ts
✓ lib/megabot/prompts.ts — ADD-ONLY

— Shipping —
✓ lib/shipping/package-suggestions.ts

— Data Pipelines —
✓ lib/data/backfill.ts
✓ lib/data/populate-intelligence.ts
✓ lib/data/project-rollup.ts
✓ lib/data/user-events.ts

— Enrichment —
✓ lib/enrichment/item-context.ts
✓ lib/addons/enrich-item-context.ts

— Credits + Billing —
✓ lib/credits.ts
✓ lib/tier-enforcement.ts — READ ONLY
✓ lib/billing/pro-rate.ts
✓ lib/billing/commission.ts

— Offers —
✓ lib/offers/expiry.ts
✓ lib/offers/notify.ts
✓ lib/offers/cron.ts

— Email System —
✓ lib/email/send.ts
✓ lib/email/templates.ts

— Pricing Constants —
✓ lib/constants/pricing.ts
✓ lib/pricing/constants.ts
✓ lib/adapters/pricing.ts
✓ lib/pricing/calculate.ts

— API Routes —
✓ app/api/** — ALL LOCKED (the PATCH route already supports all edit fields)

— Item + Dashboard + Bots —
✓ app/items/** — ALL LOCKED
✓ app/dashboard/** — ALL LOCKED
✓ app/bots/** — ALL LOCKED

— Core UI —
✓ app/components/AppNav.tsx
✓ app/components/UploadModal.tsx
✓ app/page.tsx
✓ globals.css

— Commerce + Pages —
✓ app/subscription/** — LOCKED
✓ app/credits/** — LOCKED
✓ app/marketplace/** — LOCKED
✓ app/bundles/** — LOCKED
✓ app/shipping/** — LOCKED
✓ app/pricing/** — LOCKED
✓ app/offers/** — LOCKED

— Always-Dark Overlays —
✓ app/components/ItemActionPanel.tsx
✓ app/components/billing/CancelFlowModal.tsx
✓ app/components/billing/UpgradeFlowModal.tsx
✓ app/components/TradeProposalModal.tsx

— Messaging System — ALL LOCKED —
✓ app/messages/** — ALL LOCKED
✓ app/components/messaging/** — ALL LOCKED

— Add-On Tools — ALL LOCKED —
✓ app/addons/** — ALL LOCKED

— Onboarding + Quiz — ALL LOCKED —
✓ app/onboarding/** — LOCKED

— Infrastructure —
✓ vercel.json — LOCKED
✓ prisma/schema.prisma — READ ONLY

— Public sale page —
✓ app/sale/[projectId]/page.tsx — LOCKED (buyer-facing, separate upgrade)

SURGICAL UNLOCK — These files are explicitly unlocked for THIS COMMAND ONLY:

  app/projects/[id]/ProjectDetailClient.tsx — UNLOCKED (add edit mode, upgrade item assignment UX, visual polish)
  app/projects/[id]/page.tsx — UNLOCKED (pass additional data if needed for edit mode)
  app/projects/ProjectsClient.tsx — UNLOCKED (visual polish, upgrade create flow if needed)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-5 Locked (through March 19, 2026):
  • All bot AI logic, prompt systems, output formats
  • MegaBot, antique/collectible detection, Amazon enrichment
  • Upload system, Edit Item Form, Item Control Center
  • Light Mode, Message Center, Bot Hub (11 live + 3 coming soon)
  • Quiz upgrade (4 parts: theme, tone, results, auto-trigger)
  • Fee split correction (1.75% buyer / 1.75% seller across 13 files)
  • Credit system, subscription tiers, offer system
  • Marketplace, bundles, trade proposals
  • Email system, shipping, billing

IMPORTANT — API ALREADY SUPPORTS EDITING:
  The PATCH route at /api/projects/[id]/route.ts already accepts:
    name, description, startDate, endDate, location, city, state, status, type
    addItemId, removeItemId, publishAll
  DO NOT modify the API route. Build the edit UI that calls this existing API.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  — Does this collect signal we learn from?
  — Does it make the next AI prediction better?
  — Does it create data nobody else has?
  — Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this command: Sale edit history could be tracked for user behavior analysis.
Flag if adding edit timestamps or change logging would be valuable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Always follow this sequence. Never skip steps. Close the loop every time.

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this command: UI upgrade only. The API already supports all edit operations.
We are building the frontend edit experience and upgrading the item assignment UX.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

DEMO_MODE=true — admin accounts bypass all gates and credit deductions.
Both test accounts are Tier 4 Estate Manager with full access.

SALE TYPES SUPPORTED:
  ESTATE_SALE — Downsizing, inheritance, liquidation
  GARAGE_SALE — Decluttering, seasonal cleanout
  MOVING_SALE — Relocating, everything must go
  YARD_SALE — Casual outdoor sale, community event
  DOWNSIZING — Simplifying, curated items
  ONLINE_SALE — Ship everything, no in-person

SALE STATUSES: DRAFT → ACTIVE → COMPLETED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Flag gaps noticed while working
  — Choose cleanest technical path
  — Add defensive error handling
  — Make UI impressive for investor demo
  — Wire logical connections within scope
  — Flag missed data collection opportunities
  — Add polish that serves the Elon standard
  — Make this feel like a $1B product
  — Add inline edit with smooth transitions
  — Add confirmation dialogs for destructive actions
  — Add keyboard shortcuts or quick actions
  — Improve the empty state experience

  You MAY NOT:
  — Touch any locked files
  — Modify the API route (/api/projects/[id])
  — Change any bot AI or prompt logic
  — Deviate from inline style={{}}
  — Add unapproved npm packages
  — Add routes beyond scope
  — Change schema without explicit approval
  — Change business or pricing logic
  — Use Tailwind or external CSS
  — Use className for styling (except existing utility classes)

  Flag everything outside scope.
  Do not fix silently. Always report flags clearly.
  Read FULL component code before writing any command.
  Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

  DEMO_MODE=true in .env — active now.
  Admin account bypasses ALL tier gates and credit deductions.
  shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)

  TEST ACCOUNTS:
  annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
  ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager
  SYSTEM_USER_ID=cmmqpoljs0000pkwpl1uygvkz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — ENVIRONMENT VARIABLES STATUS

  Variable                  Status      Notes
  OPENAI_API_KEY            SET         GPT-4o — vision + analysis
  ANTHROPIC_API_KEY         SET         Claude — narrative + accuracy
  GEMINI_API_KEY            SET         Gemini — SEO + search
  XAI_API_KEY               SET         Grok — social + viral
  SQUARE_APPLICATION_ID     SET         Sandbox
  SQUARE_ACCESS_TOKEN       SET         Sandbox
  SQUARE_LOCATION_ID        SET         Sandbox
  SQUARE_ENVIRONMENT        SET         sandbox
  SENDGRID_API_KEY          SET (new)   New account ryan@legacy-loop.com
  CRON_SECRET               SET         Vercel cron auth
  SYSTEM_USER_ID            SET         cmmqpoljs0000pkwpl1uygvkz
  DEMO_MODE                 true        Bypasses all gates
  DATABASE_URL              SET         PostgreSQL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — PENDING SCHEMA MIGRATION

DO ALL AT ONCE — Never piecemeal:
  • User.role, soldPrice Int→Float, soldVia, estimatedValue, priceDelta
  • TradeProposal, AgentSettings, Bundle, BundleItem models
  • quizCompletedAt DateTime? on User

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Edit Sale Function + Sales Dashboard Item Assignment Upgrade

This command covers Phase 2, Items 9 and 11:

  Item 9: Edit Sale Function — Allow users to edit existing sale details
  Item 11: Sales Dashboard Item Assignment — Add/remove items directly from sales dashboard

Problem: The sale detail page (ProjectDetailClient.tsx) has NO edit capability.
Users cannot change the sale name, type, dates, location, or description after
creation. The item assignment panel exists but is buried behind a toggle and
feels clunky. The entire sales dashboard needs a polish pass to feel premium.

The API already supports all edit operations via PATCH /api/projects/[id].
We need to build the frontend experience.

SURGICAL UNLOCK:
  app/projects/[id]/ProjectDetailClient.tsx — edit mode + item assignment upgrade
  app/projects/[id]/page.tsx — pass additional data if needed
  app/projects/ProjectsClient.tsx — visual polish on sales list

Expected output:
  - Users can edit all sale fields inline on the detail page
  - Item assignment is prominent and easy (not hidden behind a toggle)
  - The sales dashboard feels like a real command center
  - Everything works in both light and dark mode
  - Elon Musk approved quality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/projects/[id]/ProjectDetailClient.tsx — FULL file (408 lines)
   Find: Lines 47-95 — component state + add/remove/publish handlers
   Find: Lines 97-182 — header card (sale name, type badge, dates, status, share, publish)
   Find: Lines 184-202 — stats row (5 columns)
   Find: Lines 204-405 — items section (add panel toggle, item list, empty state)
   NOTE: There is NO edit functionality currently. No edit button. No edit form.

2. Read app/projects/[id]/page.tsx — FULL file (93 lines)
   Find: What data is passed to ProjectDetailClient
   Find: What data could be added (project fields for edit form defaults)

3. Read app/projects/ProjectsClient.tsx — FULL file (424 lines)
   Find: Lines 66-100 — create project form and handler
   Find: Lines 101-424 — sales list rendering (cards with photo grids)

4. Read app/api/projects/[id]/route.ts — FULL file (109 lines) — READ ONLY
   Find: Lines 35-91 — PATCH handler (all supported edit operations)
   Confirm: name, description, startDate, endDate, location, city, state, status, type
   Confirm: addItemId, removeItemId, publishAll
   DO NOT MODIFY THIS FILE.

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ADD EDIT MODE TO SALE DETAIL PAGE

File: app/projects/[id]/ProjectDetailClient.tsx

Add a complete inline edit experience. When the user clicks "Edit Sale",
the header card transforms into an edit form with all sale fields editable.

1. ADD EDIT STATE:
   const [editMode, setEditMode] = useState(false);
   const [saving, setSaving] = useState(false);
   const [editForm, setEditForm] = useState({
     name: project.name,
     description: project.description || "",
     type: project.type,
     startDate: project.startDate ? project.startDate.split("T")[0] : "",
     endDate: project.endDate ? project.endDate.split("T")[0] : "",
     city: project.city || "",
     state: project.state || "",
     status: project.status,
   });

2. ADD SAVE HANDLER:
   async function saveEdit() {
     setSaving(true);
     await fetch(`/api/projects/${project.id}`, {
       method: "PATCH",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(editForm),
     });
     setSaving(false);
     setEditMode(false);
     router.refresh();
   }

3. ADD EDIT BUTTON to the header card (next to Public Page and Publish All):
   An "Edit Sale" button that toggles editMode.
   Style: ghost button, var(--text-muted), pencil icon.

4. EDIT MODE RENDERING:
   When editMode is true, the header card shows editable fields instead of static text:

   - Sale name: text input (large, bold — feels like editing a title)
   - Sale type: dropdown/select with all 6 SALE_TYPES
   - Start date + End date: date inputs side by side
   - City + State: text inputs side by side
   - Description: textarea
   - Status: dropdown (DRAFT / ACTIVE / COMPLETED)

   All inputs styled with:
     background: "var(--input-bg)"
     border: "1px solid var(--input-border)"
     color: "var(--input-color)"
     borderRadius: "0.5rem"
     padding: "0.5rem 0.75rem"
     fontSize: appropriate for field

   Save and Cancel buttons at bottom of edit form:
     Save: accent primary style (var(--accent-theme))
     Cancel: ghost style, resets editForm to original values

   The transition between view mode and edit mode should feel smooth.
   Consider a subtle fade or the card expanding to fit the form.

5. SALE TYPE SELECTOR IN EDIT MODE:
   Show the 6 sale types as selectable cards or a styled dropdown.
   Each type has: emoji, label, subtitle, color.
   Selected type should be visually highlighted with its color.

6. STATUS CHANGE:
   When status changes from DRAFT → ACTIVE, this is a significant action.
   Consider adding a confirmation: "Activate this sale? Items will become visible."
   When changing to COMPLETED: "Mark this sale as complete? This cannot be undone."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — UPGRADE ITEM ASSIGNMENT UX

File: app/projects/[id]/ProjectDetailClient.tsx

The current "Add Items" panel is hidden behind a toggle button. Make it
more prominent and easy to use. This is the CORE of the sales dashboard.

1. ALWAYS-VISIBLE ADD ITEMS SECTION:
   Instead of hiding the add panel behind a toggle, show it as a permanent
   section below the item list (or as a collapsible section that defaults OPEN
   when there are available items and the sale has fewer than 3 items).

2. ITEM COUNT INDICATORS:
   Show clear counts:
   "6 items in this sale · 3 available to add"
   This helps users understand what they're working with at a glance.

3. QUICK-ADD FROM DASHBOARD:
   The current add flow requires clicking "Add Items" → seeing the list → clicking "Add".
   Keep this but make it feel more immediate:
   - Show item thumbnails in the add panel
   - "Add" button should be a teal "+" icon, not a full button
   - After adding, show a brief success flash (item slides into the main list)

4. REMOVE ITEM UX:
   Current "Remove" button is red and works. Keep it.
   Add a brief confirmation tooltip: "Remove from sale? (Item won't be deleted)"
   This reassures users that removing from a sale doesn't delete the item.

5. DRAG-FEEL REORDERING (optional polish):
   If time allows, add the ability to reorder items within the sale.
   This is a nice-to-have, not required. Flag if not implemented.

6. EMPTY STATE:
   The current empty state is good. Polish it:
   - Larger, more inviting CTA
   - "Your sale is ready — add your first item to get started"
   - Show count of available items: "You have X items ready to add"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — VISUAL POLISH PASS

Apply to ALL three unlocked files:

1. ProjectDetailClient.tsx:
   - Stats row: ensure responsive (collapse to 2-3 columns on narrow screens)
   - Item rows: add subtle hover effect
   - Share buttons section: ensure it works in both themes
   - All text uses CSS variables (no hardcoded colors)

2. ProjectsClient.tsx:
   - Sales list cards: ensure hover effects work in both themes
   - Create sale form: polish inputs and type selector
   - Empty state (no sales yet): make it inviting
   - Photo grid on each sale card: ensure consistent sizing

3. BOTH FILES:
   - Check ALL colors use CSS variables
   - Verify light + dark mode both look clean
   - All interactive elements have hover states
   - All buttons have proper cursor and disabled states
   - Smooth transitions on all state changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — UPDATE page.tsx IF NEEDED

File: app/projects/[id]/page.tsx

If the edit mode needs additional data from the server component
(e.g., full project fields for form defaults), update the data
passed to ProjectDetailClient.

Currently passes: project (ProjectInfo), items (ItemRow[]), availableItems (AvailItem[])

May need to add: project.description (already included), project.type (already included),
project.location (check if missing).

Read the file and verify all needed fields are passed. Fix if any are missing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — /api/projects/[id]/route.ts (API already complete)
  — Prisma schema
  — Any locked files
  — Sale type definitions (keep all 6 types)
  — Status flow (DRAFT → ACTIVE → COMPLETED)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  EDIT SALE (Item 9):
  3. "Edit Sale" button visible on detail page: yes / no
  4. Edit mode shows all fields (name, type, dates, city, state, description, status): yes / no
  5. All fields use styled inputs with CSS variables: yes / no
  6. Save calls PATCH /api/projects/[id] correctly: yes / no
  7. Cancel resets form and exits edit mode: yes / no
  8. Page refreshes after save: yes / no
  9. Sale type selector works (all 6 types): yes / no
  10. Status change has confirmation for significant actions: yes / no

  ITEM ASSIGNMENT (Item 11):
  11. Add Items section is more prominent (not fully hidden): yes / no
  12. Item counts shown (in sale + available): yes / no
  13. Add item works and refreshes: yes / no
  14. Remove item works with confirmation hint: yes / no
  15. Empty state is polished and inviting: yes / no

  VISUAL POLISH:
  16. Stats row responsive: yes / no
  17. All colors use CSS variables: yes / no
  18. Hover states on interactive elements: yes / no
  19. Sales list cards polished: yes / no

  N+1. All locked files untouched: yes / no
  N+2. API route untouched: yes / no
  N+3. inline style={{}} throughout: yes / no
  N+4. Theme-aware surfaces use CSS variables: yes / no
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

  Part B — Edit Sale: [fixed / issue]
    - Edit button visible: [yes / no]
    - All 8 fields editable: [yes / no]
    - Save/cancel work: [yes / no]
    - Sale type selector: [yes / no]
    - Status change confirmation: [yes / no]

  Part C — Item Assignment: [fixed / issue]
    - Add items prominent: [yes / no]
    - Item counts shown: [yes / no]
    - Add/remove work: [yes / no]
    - Empty state polished: [yes / no]

  Part D — Visual Polish: [fixed / issue]
    - CSS variables throughout: [yes / no]
    - Hover states: [yes / no]
    - Both themes clean: [yes / no]

  Part E — page.tsx: [fixed / no changes needed]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — API route unchanged: [Confirm]
  — All locked files verified as untouched

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, missed data collection, out-of-scope items]

  Files modified: [list all — should be 2-3]
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
Command Template v9 | LegacyLoop | Edit Sale + Dashboard Item Assignment
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
