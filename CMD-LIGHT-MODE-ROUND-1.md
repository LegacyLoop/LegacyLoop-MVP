LEGACYLOOP — COMMAND TEMPLATE v8
CRITICAL: Light Mode Fix Round 1 — Core Navigation + Item Views
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

Every new element must match this design system exactly. No exceptions.

LIGHT MODE CRITICAL RULE:
The app supports html.dark and html.light themes via CSS variables in globals.css.
NEVER use hardcoded rgba(255,255,255,...) for text, borders, or backgrounds on
theme-aware surfaces. ALWAYS use the CSS variables that already exist.

EXCEPTION: Always-dark overlays (modals, slide-out panels, photo badges, tooltips
that render on top of rgba(0,0,0,...) or rgba(8,8,12,...) backgrounds) KEEP their
hardcoded white colors — those backgrounds don't change with theme.

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
  grep 'TWILIO' .env | sed 's/=.*/=SET/'
  grep 'DEMO_MODE' .env | head -2
  grep -n 'shouldBypassGates|isDemoMode' lib/constants/pricing.ts | head -3
  grep -n 'checkCredits|deductCredits' lib/credits.ts | head -3
  npx tsc --noEmit 2>&1 | tail -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALWAYS LOCKED — Never touch without explicit surgical unlock:

# All backend files — ALL LOCKED (no backend changes in this command)
lib/** — ALL LOCKED
app/api/** — ALL LOCKED

# Modals and always-dark overlays — LOCKED (white text is correct on dark bg)
app/components/ItemActionPanel.tsx — LOCKED (always-dark overlay — verified)
app/components/billing/CancelFlowModal.tsx — LOCKED (always-dark modal)
app/components/billing/UpgradeFlowModal.tsx — LOCKED (always-dark modal)
app/components/TradeProposalModal.tsx — LOCKED (always-dark modal)
app/components/CommandPalette.tsx — LOCKED (always-dark overlay)
app/components/HelpWidget.tsx — LOCKED (always-dark widget)
app/components/BotLoadingState.tsx — LOCKED (always-dark)

# Config and infrastructure
globals.css — LOCKED (CSS variables are correct — don't touch)
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

Round 1 — Core navigation and item views (what users see first):

app/components/AppNav.tsx — UNLOCKED (77 instances — main navigation, visible on every page)
app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED (188 instances — the main item view)
app/items/[id]/TradeToggle.tsx — UNLOCKED (3 instances — "Accept Trades" unreadable in screenshot)
app/items/[id]/MegaBotPanel.tsx — UNLOCKED (57 instances — MegaBot panel on item page)
app/items/[id]/ShippingPanel.tsx — UNLOCKED (131 instances — shipping section)
app/items/[id]/LocalPickupPanel.tsx — UNLOCKED (87 instances — local pickup section)
app/items/[id]/ItemToolPanels.tsx — UNLOCKED (23 instances — tool panels)
app/items/[id]/ItemPhotoStrip.tsx — UNLOCKED (11 instances — photo strip)
app/items/[id]/SoldPriceWidget.tsx — UNLOCKED (9 instances — sold price display)
app/items/[id]/DocumentVault.tsx — UNLOCKED (9 instances — document vault)
app/items/[id]/TrackingTimeline.tsx — UNLOCKED (6 instances — tracking)
app/items/[id]/TradeProposalsPanel.tsx — UNLOCKED (6 instances — trade proposals)
app/items/[id]/VehicleSpecsCard.tsx — UNLOCKED (4 instances — vehicle specs)
app/items/[id]/SaleAssignment.tsx — UNLOCKED (4 instances — sale assignment)
app/items/[id]/ShareDropdown.tsx — UNLOCKED (1 instance — share dropdown)
app/items/[id]/page.tsx — UNLOCKED (1 instance — item page wrapper)
app/items/[id]/MegaBuyingBotPanel.tsx — UNLOCKED (1 instance)
app/items/new/page.tsx — UNLOCKED (23 instances — new item upload page)
app/items/[id]/edit/EditItemForm.tsx — UNLOCKED (5 instances — edit form)
app/dashboard/DashboardClient.tsx — UNLOCKED (if any hardcoded colors exist)
app/dashboard/page.tsx — UNLOCKED (2 instances)
app/components/UploadModal.tsx — UNLOCKED (24 instances — upload component)
app/components/DemoBanner.tsx — UNLOCKED (4 instances)
app/components/CollapsiblePanel.tsx — UNLOCKED (2 instances)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these.

PASS 1-3 LOCKED FEATURES:
  All bot AI logic and prompt systems
  All bot output formats
  MegaBot 4-agent consensus system
  Antique detection + Antique Alert
  Collectible detection + scoring
  Amazon/Rainforest enrichment adapter
  Shipping calculator + package suggestions
  Offer negotiation system (3-round, magic link)
  Credit system (packs, custom, deductions, balance)
  Subscription tiers (FREE/STARTER/PLUS/PRO)
  Pro-rate billing for upgrades/downgrades
  Commission calculator
  ListBot publish hub (13 platforms)
  Marketplace and bundle system
  Trade proposals
  Sold price tracking
  Message center
  Data pipelines and enrichment

PASS 3 FINAL LOCKED (March 16-17, 2026):
  Custom credit purchase with sliding scale ($25-$10K, 5 tiers)
  Subscription page (5 bug fixes + RECOMMENDED badge)
  Email system (env var from address, per-email overrides, shared templates)
  Gemini MegaBot reliability (safety settings, model fallback, retry logic)

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  AnalyzeActions.tsx — server-side enrichment, status indicator
  AmazonPriceBadge.tsx — auto-retry polling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command: UI-only color fix. Zero logic changes. Zero API changes.
Replace hardcoded colors with CSS variables. Nothing else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY:
  - Improve beyond minimum spec
  - Flag gaps noticed while working
  - Choose cleanest technical path
  - Add defensive error handling
  - Make UI impressive for investor demo
  - Wire logical connections within scope
  - Flag missed data collection opportunities
  - Add polish that serves the Elon standard
  - Make this feel like a $1B product

You MAY NOT:
  - Touch any locked files
  - Change any component logic, state, handlers, or functionality
  - Change any bot AI or prompt logic
  - Change any bot output format
  - Deviate from inline style={{}}
  - Add unapproved npm packages
  - Add routes beyond scope
  - Change schema without explicit approval
  - Change the design directive wording

Flag everything outside scope. Do not fix silently. Always report flags clearly.

Read the FULL component code before writing any command — not just grep results.
Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env — active now.
Admin account bypasses ALL tier gates and credit deductions.

shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)

Admin: never locked out. No credits deducted. Full platform access.

TO GO LIVE:
Set DEMO_MODE=false in .env.
Switch Square sandbox keys to production keys.
All gates enforce immediately for real users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Fix Light Mode Visibility: Round 1 — Core Navigation + All Item Views

The app has 1,632 hardcoded rgba(255,255,255,...) color instances across 102 files.
These are invisible in light mode. This is Round 1 of 4 — fixing the most critical
files that users see first: the navigation bar, item dashboard, item creation,
and all item-related panels.

This round covers 24 files with ~636 instances combined. These are the pages
users interact with most — the demo flow goes: login → dashboard → item → bots.
After this round, the core navigation and item experience will be perfect in both modes.

THE REPLACEMENT RULES:

For EVERY file, apply these replacements to elements on theme-aware surfaces:

  HARDCODED (BROKEN)                    →  CSS VARIABLE (WORKS IN BOTH MODES)
  ──────────────────────────────────────────────────────────────────────────
  TEXT COLORS:
  color: "rgba(255,255,255,0.9)"        →  color: "var(--text-primary)"
  color: "rgba(255,255,255,0.85)"       →  color: "var(--text-primary)"
  color: "rgba(255,255,255,0.8)"        →  color: "var(--text-primary)"
  color: "rgba(255,255,255,0.7)"        →  color: "var(--text-secondary)"
  color: "rgba(255,255,255,0.65)"       →  color: "var(--text-secondary)"
  color: "rgba(255,255,255,0.6)"        →  color: "var(--text-secondary)"
  color: "rgba(255,255,255,0.55)"       →  color: "var(--text-secondary)"
  color: "rgba(255,255,255,0.5)"        →  color: "var(--text-muted)"
  color: "rgba(255,255,255,0.45)"       →  color: "var(--text-muted)"
  color: "rgba(255,255,255,0.4)"        →  color: "var(--text-muted)"
  color: "rgba(255,255,255,0.35)"       →  color: "var(--text-muted)"
  color: "rgba(255,255,255,0.3)"        →  color: "var(--text-muted)"
  color: "rgba(255,255,255,0.25)"       →  color: "var(--text-muted)"
  color: "rgba(255,255,255,0.2)"        →  color: "var(--text-muted)"
  color: "#fff"  (on theme surfaces)    →  color: "var(--text-primary)"
  color: "white" (on theme surfaces)    →  color: "var(--text-primary)"
  color: "#e2e8f0"                      →  color: "var(--text-primary)"
  color: "#cbd5e1"                      →  color: "var(--text-secondary)"
  color: "#94a3b8"                      →  color: "var(--text-muted)"

  BORDER COLORS:
  border*: "*rgba(255,255,255,0.12)*"   →  var(--border-default)
  border*: "*rgba(255,255,255,0.1)*"    →  var(--border-default)
  border*: "*rgba(255,255,255,0.08)*"   →  var(--border-default)
  border*: "*rgba(255,255,255,0.06)*"   →  var(--border-default)
  border*: "*rgba(255,255,255,0.04)*"   →  var(--border-default)

  BACKGROUND COLORS:
  background: "rgba(255,255,255,0.02)"  →  background: "var(--bg-card)"
  background: "rgba(255,255,255,0.03)"  →  background: "var(--bg-card)"
  background: "rgba(255,255,255,0.04)"  →  background: "var(--ghost-bg)"
  background: "rgba(255,255,255,0.05)"  →  background: "var(--ghost-bg)"
  background: "rgba(255,255,255,0.06)"  →  background: "var(--ghost-bg)"
  background: "rgba(255,255,255,0.07)"  →  background: "var(--ghost-bg)"
  background: "rgba(255,255,255,0.08)"  →  background: "var(--ghost-bg)"
  background: "rgba(255,255,255,0.1)"   →  background: "var(--bg-card-hover)"
  background: "rgba(255,255,255,0.12)"  →  background: "var(--bg-card-hover)"
  background: "rgba(255,255,255,0.14)"  →  background: "var(--bg-card-hover)"

EXCEPTIONS — DO NOT REPLACE these (keep hardcoded):
  1. Elements inside always-dark containers (background: "rgba(0,0,0,...)" or
     "rgba(8,8,12,...)" or "rgba(13,13,25,...)" or "rgba(15,15,20,...)")
  2. Photo overlay badges (on top of <img> elements)
  3. Tooltip content that renders on dark tooltip backgrounds
  4. Progress bars and visual indicators inside dark containers
  5. Camera preview modal (always-dark fullscreen overlay)
  6. Elements where color: "#fff" is on a teal/accent background (buttons with
     background: linear-gradient(135deg, #00bcd4...) — white text on teal is fine)

HOW TO IDENTIFY EXCEPTIONS:
  Look at the PARENT element's background. If the parent has a hardcoded dark
  background (rgba(0,0,0,...) or similar), the children should KEEP white text.
  If the parent uses var(--bg-card) or var(--bg-primary) or no explicit background,
  the children should USE CSS variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE.

1. Read app/globals.css — Lines 89-158 (html.light variables)
   Confirm all CSS variables exist and have proper light mode values.

2. For EACH unlocked file, read the FULL file and:
   a. Count total rgba(255,255,255 instances
   b. Identify which are on theme-aware surfaces (REPLACE)
   c. Identify which are in always-dark containers (KEEP)
   d. Print the count: "File X: Y to replace, Z to keep"

Start with the biggest files first:
   - AppNav.tsx (77 instances)
   - ItemDashboardPanels.tsx (188 instances)
   - ShippingPanel.tsx (131 instances)
   - LocalPickupPanel.tsx (87 instances)
   - MegaBotPanel.tsx (57 instances)
   - Then remaining files in decreasing order

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Apply Replacements File by File

For EACH unlocked file:
1. Read the full file
2. Identify every rgba(255,255,255,...) instance
3. Determine: theme-aware surface (REPLACE) or dark container (KEEP)
4. Apply the replacement mapping from the OBJECTIVE section
5. Do NOT change any component logic, state, props, handlers, or functionality
6. Only change color/border/background values

Work through ALL 24 files. Do not skip any.

CRITICAL: After replacing, verify the file still compiles:
  npx tsc --noEmit 2>&1 | grep "error" | head -5

If any file causes TypeScript errors, revert that file and report.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A reads completed for all 24 files: yes / no
CORE NAVIGATION:
3. AppNav.tsx — all theme-aware colors use CSS variables: yes / no
4. AppNav.tsx — navigation visible and readable in light mode: yes / no
5. DemoBanner.tsx — colors use CSS variables: yes / no
HIGH-IMPACT ITEM VIEWS:
6. ItemDashboardPanels.tsx — all theme-aware colors fixed: yes / no
7. TradeToggle.tsx — "Accept Trades" text visible in light mode: yes / no
8. MegaBotPanel.tsx — panel content visible in light mode: yes / no
9. ShippingPanel.tsx — shipping info visible in light mode: yes / no
10. LocalPickupPanel.tsx — pickup info visible in light mode: yes / no
11. ItemToolPanels.tsx — tool panels visible: yes / no
12. ItemPhotoStrip.tsx — photo strip visible: yes / no
13. SoldPriceWidget.tsx — sold price visible: yes / no
14. DocumentVault.tsx — vault UI visible: yes / no
15. TrackingTimeline.tsx — timeline visible: yes / no
16. TradeProposalsPanel.tsx — proposals visible: yes / no
17. VehicleSpecsCard.tsx — specs visible: yes / no
18. SaleAssignment.tsx — assignment visible: yes / no
ITEM CREATION + EDIT:
19. items/new/page.tsx — upload page visible in light mode: yes / no
20. EditItemForm.tsx — edit form visible in light mode: yes / no
21. UploadModal.tsx — upload component visible in light mode: yes / no
DASHBOARD:
22. DashboardClient.tsx — dashboard visible: yes / no
23. CollapsiblePanel.tsx — panels visible: yes / no
DARK CONTAINER EXCEPTIONS:
24. Photo overlay badges KEPT hardcoded: yes / no
25. Camera preview modal KEPT hardcoded: yes / no
26. Tooltip backgrounds KEPT hardcoded: yes / no
27. White text on teal/accent buttons KEPT: yes / no
REGRESSION:
28. Dark mode still looks correct (no regressions): yes / no
29. All component logic/functionality unchanged: yes / no
30. Zero changes to handlers, state, props, or event listeners: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

PER-FILE REPORT (list EVERY file):
  AppNav.tsx: [X replaced, Y kept] — [pass / issue]
  ItemDashboardPanels.tsx: [X replaced, Y kept] — [pass / issue]
  ShippingPanel.tsx: [X replaced, Y kept] — [pass / issue]
  LocalPickupPanel.tsx: [X replaced, Y kept] — [pass / issue]
  MegaBotPanel.tsx: [X replaced, Y kept] — [pass / issue]
  ItemToolPanels.tsx: [X replaced, Y kept] — [pass / issue]
  items/new/page.tsx: [X replaced, Y kept] — [pass / issue]
  UploadModal.tsx: [X replaced, Y kept] — [pass / issue]
  ItemPhotoStrip.tsx: [X replaced, Y kept] — [pass / issue]
  SoldPriceWidget.tsx: [X replaced, Y kept] — [pass / issue]
  DocumentVault.tsx: [X replaced, Y kept] — [pass / issue]
  TrackingTimeline.tsx: [X replaced, Y kept] — [pass / issue]
  TradeProposalsPanel.tsx: [X replaced, Y kept] — [pass / issue]
  TradeToggle.tsx: [X replaced, Y kept] — [pass / issue]
  VehicleSpecsCard.tsx: [X replaced, Y kept] — [pass / issue]
  SaleAssignment.tsx: [X replaced, Y kept] — [pass / issue]
  ShareDropdown.tsx: [X replaced, Y kept] — [pass / issue]
  page.tsx (item): [X replaced, Y kept] — [pass / issue]
  MegaBuyingBotPanel.tsx: [X replaced, Y kept] — [pass / issue]
  EditItemForm.tsx: [X replaced, Y kept] — [pass / issue]
  DashboardClient.tsx: [X replaced, Y kept] — [pass / issue]
  dashboard/page.tsx: [X replaced, Y kept] — [pass / issue]
  DemoBanner.tsx: [X replaced, Y kept] — [pass / issue]
  CollapsiblePanel.tsx: [X replaced, Y kept] — [pass / issue]

TOTAL: [X instances replaced across Y files]
TOTAL KEPT (dark containers): [Z instances across W files]

LIGHT MODE VISUAL CHECK:
  - Navigation bar readable: [yes / no]
  - Item dashboard panels readable: [yes / no]
  - Accept Trades toggle readable: [yes / no]
  - Shipping panel readable: [yes / no]
  - Upload modal readable: [yes / no]
  - All buttons visible: [yes / no]
  - All borders visible: [yes / no]

DARK MODE REGRESSION:
  [Confirm dark mode still renders correctly]

EXISTING LOGIC UNTOUCHED:
  [Confirm zero logic/handler/state changes in every file]

FILES REMAINING FOR ROUNDS 2-4:
  [List all files NOT fixed in this round that still need attention]

FLAGS FROM CLAUDE CODE:
  [All gaps, risks, missed opportunities]

Files modified: [list all]
New files: none
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Light Mode Fix Round 1
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
