LEGACYLOOP — COMMAND TEMPLATE v8
EMERGENCY: Light Mode Visibility Fix — Dashboard Item Cards
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

LIGHT MODE CONTEXT — CRITICAL FOR THIS COMMAND:
The app supports both html.dark and html.light themes via CSS variables
in globals.css (lines 17-87 for dark, lines 89-158 for light). CSS variables
like var(--text-primary), var(--border-default), var(--bg-card) automatically
adapt between themes. HOWEVER, many components use hardcoded rgba(255,255,255,...)
colors in inline styles which are INVISIBLE against light mode's white backgrounds.

THE RULE: Never use hardcoded rgba(255,255,255,...) or rgba(0,0,0,...) for text,
borders, or backgrounds that need to be visible in both themes. ALWAYS use the
CSS variables that already exist in globals.css. The variable system is correct
and complete — the problem is components not using it.

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

# ─── Core Adapters ───
lib/adapters/ai.ts — LOCKED
lib/adapters/rainforest.ts — LOCKED
lib/adapters/auth.ts — EXTEND ONLY
lib/adapters/storage.ts — LOCKED
lib/adapters/multi-ai.ts — LOCKED

# ─── AI Detection + Scoring ───
lib/antique-detect.ts — LOCKED
lib/collectible-detect.ts — LOCKED

# ─── MegaBot Engine ───
lib/megabot/run-specialized.ts — LOCKED
lib/megabot/prompts.ts — ADD-ONLY

# ─── Shipping ───
lib/shipping/package-suggestions.ts — LOCKED

# ─── Data Pipelines ───
lib/data/backfill.ts — LOCKED
lib/data/populate-intelligence.ts — LOCKED
lib/data/project-rollup.ts — LOCKED
lib/data/user-events.ts — LOCKED

# ─── Enrichment ───
lib/enrichment/item-context.ts — LOCKED
lib/addons/enrich-item-context.ts — LOCKED

# ─── Credits + Billing ───
lib/credits.ts — LOCKED
lib/tier-enforcement.ts — READ ONLY
lib/billing/pro-rate.ts — LOCKED
lib/billing/commission.ts — LOCKED

# ─── Offers ───
lib/offers/expiry.ts — LOCKED
lib/offers/notify.ts — LOCKED
lib/offers/cron.ts — LOCKED

# ─── Email System ───
lib/email/send.ts — LOCKED
lib/email/templates.ts — LOCKED

# ─── Pricing Constants (single source of truth) ───
lib/constants/pricing.ts — LOCKED
lib/pricing/constants.ts — LOCKED
lib/adapters/pricing.ts — LOCKED
lib/pricing/calculate.ts — LOCKED

# ─── API Routes — Analysis + Bots ───
app/api/analyze/[itemId]/route.ts — LOCKED
app/api/megabot/[itemId]/route.ts — LOCKED
app/api/bots/* — ALL LOCKED

# ─── API Routes — Commerce ───
app/api/shipping/* — LOCKED
app/api/items/status/[itemId]/route.ts — LOCKED
app/api/offers/* — ALL LOCKED
app/api/cron/offers/route.ts — LOCKED
app/api/addons/* — READ ONLY
app/api/billing/* — ALL LOCKED
app/api/payments/checkout/route.ts — LOCKED
app/api/items/sold/route.ts — LOCKED

# ─── Core UI Components ───
app/components/AppNav.tsx — LOCKED
app/components/UploadModal.tsx — LOCKED (just rewritten — light mode fix deferred to Item 35)
app/page.tsx — LOCKED
globals.css — LOCKED

# ─── Item Dashboard ───
app/items/[id]/ItemDashboardPanels.tsx — LOCKED
app/items/[id]/SoldPriceWidget.tsx — LOCKED
app/items/[id]/TradeToggle.tsx — LOCKED
app/items/[id]/TradeProposalsPanel.tsx — LOCKED
app/items/[id]/AnalyzeActions.tsx — LOCKED
app/items/[id]/MegaBotPanel.tsx — LOCKED
app/items/[id]/AmazonPriceBadge.tsx — LOCKED

# ─── Subscription + Credits Pages ───
app/subscription/SubscriptionClient.tsx — LOCKED
app/components/billing/CancelFlowModal.tsx — LOCKED
app/components/billing/UpgradeFlowModal.tsx — LOCKED
app/credits/CreditsClient.tsx — LOCKED

# ─── Messaging ───
lib/messaging/* — ALL LOCKED
app/api/messages/* — ALL LOCKED
app/components/messaging/* — ALL LOCKED
app/messages/MessagesClient.tsx — LOCKED
app/messages/layout.tsx — LOCKED

# ─── Marketplace + Bundles ───
app/marketplace/MarketplaceClient.tsx — LOCKED
app/bundles/create/page.tsx — LOCKED
app/bundles/page.tsx — LOCKED
app/bundle/[slug]/page.tsx — LOCKED
app/components/BundleSuggestions.tsx — LOCKED

# ─── ListBot Publish Hub ───
app/bots/listbot/PublishHubClient.tsx — LOCKED

# ─── Listing Optimizer + Addons ───
app/addons/listing-optimizer/page.tsx — LOCKED
app/addons/buyer-outreach/page.tsx — LOCKED
app/addons/market-report/page.tsx — LOCKED

# ─── Dashboard ───
app/dashboard/DashboardClient.tsx — LOCKED
app/components/TradeProposalModal.tsx — LOCKED

# ─── Infrastructure ───
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY (changes need explicit approval)

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/dashboard/ItemCard.tsx — UNLOCKED (replace all hardcoded rgba(255,255,255,...) colors with CSS variables for light mode compatibility)
app/components/ItemActionPanel.tsx — UNLOCKED (same fix — action panel buttons use hardcoded white colors)

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
  MegaBotPanel.tsx — redundant Amazon POST removed
  AmazonPriceBadge.tsx — auto-retry polling
  UploadModal.tsx — full rewrite with 6 upload methods

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

For this command: UI-only fix. Replace hardcoded colors with CSS variables.
No logic changes. No API changes. No database changes.

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

OBJECTIVE — EMERGENCY: Fix Light Mode Visibility on Dashboard Item Cards

The dashboard item cards (ItemCard.tsx) use hardcoded rgba(255,255,255,...)
colors for text, borders, and backgrounds. In light mode, these are INVISIBLE
against white/light backgrounds. This is a demo-killer and trust-breaker.

The CSS variable system in globals.css already defines proper light mode tokens.
The fix is surgical: replace every hardcoded white-alpha color in the inline
styles with the corresponding CSS variable.

Also fix ItemActionPanel.tsx (the slide-out actions panel triggered from cards)
which has the same hardcoded color problem.

What this command touches:
  app/dashboard/ItemCard.tsx — replace hardcoded colors with CSS variables
  app/components/ItemActionPanel.tsx — same fix

What this command does NOT touch:
  globals.css — LOCKED (already has correct light mode variables)
  DashboardClient.tsx — LOCKED (parent component)
  No API routes. No logic changes. No database changes.
  All card functionality (status change, price set, delete, action panel) UNCHANGED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/globals.css — Lines 89-158 (html.light theme variables)
   Find and print the FULL light mode variable list. These are the targets.
   Key variables for this fix:
     --text-primary: #0f172a (dark text on light bg)
     --text-secondary: #475569
     --text-muted: #94a3b8
     --border-default: rgba(0, 0, 0, 0.08)
     --border-hover: rgba(0, 0, 0, 0.15)
     --bg-card: rgba(255, 255, 255, 0.9)
     --bg-card-hover: rgba(255, 255, 255, 1)
     --ghost-bg: rgba(0, 0, 0, 0.04)
     --ghost-border: rgba(0, 0, 0, 0.1)
     --ghost-color: #475569

2. Read app/dashboard/ItemCard.tsx — FULL file (705 lines)
   Find EVERY instance of hardcoded white-alpha colors. These are the bugs:
     Line 512 — background: "rgba(255,255,255,0.1)" (message badge)
     Line 513 — color: "#cbd5e1" (message badge text)
     Line 603 — borderTop: '1px solid rgba(255,255,255,0.06)' (INVISIBLE in light mode)
     Line 612 — border: '1px solid rgba(255,255,255,0.12)' (View Item button — INVISIBLE)
     Line 614 — color: 'rgba(255,255,255,0.85)' (View Item text — INVISIBLE on white)
     Line 627-628 — mouseEnter: borderColor rgba(0,188,212,0.5), color #00bcd4 (fine)
     Line 631-632 — mouseLeave: back to rgba(255,255,255,...) (INVISIBLE again)
     Line 644 — background: 'linear-gradient(135deg, rgba(0,188,212,0.15)...)' (barely visible)
     Line 650 — fontSize/fontWeight etc (fine — these are numbers not colors)

   Print the EXACT current code for lines 598-673 (the actions row section).

3. Read app/components/ItemActionPanel.tsx — FULL file
   Find EVERY instance of hardcoded rgba(255,255,255,...) colors.
   Print all line numbers with hardcoded white-alpha values.

Print ALL findings with exact line numbers before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Fix ItemCard.tsx Light Mode Colors

File: app/dashboard/ItemCard.tsx

CRITICAL RULE: Replace hardcoded rgba(255,255,255,...) with CSS variables.
Do NOT change any component logic, state, handlers, or functionality.
This is a COLOR-ONLY fix.

Here is the CSS variable mapping. Use these for every replacement:

  HARDCODED (BROKEN IN LIGHT MODE)     →  CSS VARIABLE (WORKS IN BOTH)
  ────────────────────────────────────────────────────────────────────
  rgba(255,255,255,0.85)  (text)       →  var(--text-primary)
  rgba(255,255,255,0.7)   (text)       →  var(--text-secondary)
  rgba(255,255,255,0.55)  (text)       →  var(--text-secondary)
  rgba(255,255,255,0.5)   (text)       →  var(--text-muted)
  rgba(255,255,255,0.4)   (text)       →  var(--text-muted)
  rgba(255,255,255,0.35)  (text)       →  var(--text-muted)
  rgba(255,255,255,0.3)   (text)       →  var(--text-muted)
  rgba(255,255,255,0.12)  (border)     →  var(--border-default)
  rgba(255,255,255,0.1)   (border/bg)  →  var(--border-default) or var(--ghost-bg)
  rgba(255,255,255,0.08)  (border)     →  var(--border-default)
  rgba(255,255,255,0.06)  (border)     →  var(--border-default)
  rgba(255,255,255,0.05)  (bg)         →  var(--ghost-bg)
  rgba(255,255,255,0.04)  (bg)         →  var(--ghost-bg)
  rgba(255,255,255,0.03)  (bg)         →  var(--bg-card)
  rgba(255,255,255,0.02)  (bg)         →  var(--bg-card)
  #cbd5e1                 (text)       →  var(--text-secondary)
  #e2e8f0                 (text)       →  var(--text-primary)
  #fff (for text on backgrounds)       →  var(--text-primary)

EXCEPTIONS — Keep hardcoded colors for these (they are overlays on photos/images):
  - Badges on top of photos (antique badge, collectible badge, MegaBot badge, bot status pills)
    These sit on top of photos so they need guaranteed contrast — keep hardcoded
  - Tooltip backgrounds (rgba(15,15,20,0.97)) — dark overlay, always dark
  - Progress bars inside tooltips — visual elements, always dark

THE SPECIFIC FIXES NEEDED IN ItemCard.tsx:

1. Actions row border (line 603):
   BEFORE: borderTop: '1px solid rgba(255,255,255,0.06)'
   AFTER:  borderTop: '1px solid var(--border-default)'

2. View Item button border (line 612):
   BEFORE: border: '1px solid rgba(255,255,255,0.12)'
   AFTER:  border: '1px solid var(--border-default)'

3. View Item button text color (line 614):
   BEFORE: color: 'rgba(255,255,255,0.85)'
   AFTER:  color: 'var(--text-primary)'

4. View Item mouseLeave handler (line 631):
   BEFORE: style.borderColor = 'rgba(255,255,255,0.12)'
   AFTER:  style.borderColor = 'var(--border-default)'

5. View Item mouseLeave handler (line 632):
   BEFORE: style.color = 'rgba(255,255,255,0.85)'
   AFTER:  style.color = 'var(--text-primary)'

6. Message badge background when not unread (line 512):
   BEFORE: background: "rgba(255,255,255,0.1)"
   AFTER:  background: "var(--ghost-bg)"

7. Message badge text (line 513):
   BEFORE: color: "#cbd5e1"
   AFTER:  color: "var(--text-secondary)"

8. SCAN THE ENTIRE FILE for any other rgba(255,255,255,...) in the body section
   (lines 524-596) and action row (lines 598-673) and replace with CSS variables.
   Photo overlay badges (lines 152-486) can stay hardcoded — they're on photos.

WHAT NOT TO TOUCH:
  - All state logic (lines 53-131)
  - STATUS_CONFIG object (lines 40-49) — these use status-specific colors, fine
  - Photo badge overlays (lines 152-486) — on top of images, need hardcoded contrast
  - Antique/Collectible tooltips — always dark backgrounds
  - ItemActionPanel import and usage (lines 676-702)
  - All event handlers (handleStatusChange, handleDeleteItem, saveListingPrice)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Fix ItemActionPanel.tsx Light Mode Colors

File: app/components/ItemActionPanel.tsx

Apply the SAME mapping from Part B. Find every hardcoded rgba(255,255,255,...)
color in the panel body (not overlays/badges) and replace with CSS variables.

Common patterns to fix:
  - Panel background → var(--bg-card-solid) or var(--bg-secondary)
  - Panel border → var(--border-default)
  - Text colors → var(--text-primary), var(--text-secondary), var(--text-muted)
  - Button borders → var(--border-default), var(--ghost-border)
  - Button text → var(--ghost-color), var(--text-primary)
  - Hover states → var(--ghost-hover-bg), var(--ghost-hover-border)
  - Section dividers → var(--border-default)

Read the FULL file first. Map every hardcoded color. Fix them all.

WHAT NOT TO TOUCH:
  - All action logic (status changes, delete, price set)
  - Bot status display logic
  - Modal/overlay backdrop (needs guaranteed dark)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A full reads completed and printed: yes / no
ITEM CARD:
3. Actions row border uses var(--border-default): yes / no
4. View Item button border uses var(--border-default): yes / no
5. View Item button text uses var(--text-primary): yes / no
6. View Item mouseLeave border uses var(--border-default): yes / no
7. View Item mouseLeave color uses var(--text-primary): yes / no
8. Message badge bg uses var(--ghost-bg): yes / no
9. Message badge text uses var(--text-secondary): yes / no
10. All body-section text uses CSS variables (no hardcoded white): yes / no
11. Photo overlay badges KEPT as hardcoded (still on photos): yes / no
12. All card functionality unchanged: yes / no
ACTION PANEL:
13. All panel text uses CSS variables: yes / no
14. All panel borders use CSS variables: yes / no
15. All button colors use CSS variables: yes / no
16. All action logic unchanged: yes / no
BOTH FILES — LIGHT MODE TEST:
17. In light mode: View Item button text is VISIBLE: yes / no
18. In light mode: View Item button border is VISIBLE: yes / no
19. In light mode: Actions button is VISIBLE: yes / no
20. In light mode: Card body text (title, condition, price, date) is VISIBLE: yes / no
21. In light mode: Action panel text and buttons are VISIBLE: yes / no
22. In dark mode: Everything still looks correct (no regressions): yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — ItemCard.tsx light mode colors: [fixed / issue]
  - View Item button visible in light mode: [yes / no]
  - Actions button visible in light mode: [yes / no]
  - Card body text visible in light mode: [yes / no]
  - Actions row border visible in light mode: [yes / no]
  - Photo badges still hardcoded (on images): [yes / no]
  - Total rgba(255,255,255,...) replaced: [count]
  - Total remaining in photo overlay section (intentional): [count]

Fix C — ItemActionPanel.tsx light mode colors: [fixed / issue]
  - Panel text visible in light mode: [yes / no]
  - Panel buttons visible in light mode: [yes / no]
  - Total rgba(255,255,255,...) replaced: [count]

DARK MODE REGRESSION CHECK:
  [Verify dark mode still renders correctly — no broken colors]

EXISTING LOGIC UNTOUCHED:
  [List every locked file verified]

FLAGS FROM CLAUDE CODE:
  [List ALL other files that have the same hardcoded color problem.
   This becomes the audit list for Item 35 — Global Standards Refresh.
   We need to know the full scope.]

Files modified: [list all — be specific]
New files: none
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | EMERGENCY Light Mode Visibility Fix
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
