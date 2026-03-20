LEGACYLOOP — COMMAND TEMPLATE v9 — PART A of 3
Onboarding Quiz Upgrade — Theme Support + Visual Polish (quiz/page.tsx ONLY)
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
✓ app/api/** — ALL LOCKED

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
✓ app/projects/** — LOCKED
✓ app/offers/** — LOCKED

— Always-Dark Overlays —
✓ app/components/ItemActionPanel.tsx
✓ app/components/billing/CancelFlowModal.tsx
✓ app/components/billing/UpgradeFlowModal.tsx
✓ app/components/TradeProposalModal.tsx

— Messaging System — ALL LOCKED —
✓ app/messages/layout.tsx
✓ app/messages/page.tsx
✓ app/messages/MessagesClient.tsx
✓ app/messages/MessagesAgentWrapper.tsx
✓ app/components/messaging/InboxCommandCenter.tsx
✓ app/components/messaging/WeeklyReportCard.tsx
✓ app/components/messaging/AiMessageToolbar.tsx
✓ app/components/messaging/AiSuggestionsPanel.tsx
✓ app/components/messaging/BuyerIntelligenceCard.tsx
✓ app/components/messaging/NegotiationCoach.tsx
✓ app/components/messaging/AgentSettings.tsx

— Add-On Tools — ALL LOCKED —
✓ app/addons/listing-optimizer/page.tsx
✓ app/addons/buyer-outreach/page.tsx
✓ app/addons/market-report/page.tsx

— Infrastructure —
✓ vercel.json
✓ prisma/schema.prisma — READ ONLY

— Results Page (Part C) —
✓ app/onboarding/results/page.tsx — LOCKED FOR THIS PART

SURGICAL UNLOCK — This file is explicitly unlocked for THIS PART ONLY:

  app/onboarding/quiz/page.tsx — UNLOCKED (theme support + visual polish ONLY)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-3 Locked Features:
  • All bot AI logic and prompt systems
  • All bot output formats
  • MegaBot 4-agent consensus system (OpenAI, Claude, Gemini, Grok)
  • Antique detection + Antique Alert (78 signals)
  • Collectible detection + scoring
  • Amazon/Rainforest enrichment adapter
  • Shipping calculator + package suggestions
  • Offer negotiation system (3-round, magic link)
  • Credit system (packs, custom, deductions, balance)
  • Subscription tiers (Free/DIY/Power/Estate Manager)
  • Pro-rate billing for upgrades/downgrades
  • Commission calculator
  • ListBot Publish Hub (13 platforms)
  • Marketplace and bundle system
  • Trade proposals
  • Sold price tracking
  • Data pipelines and enrichment

Pass 3 Final Locked (March 16-17, 2026):
  • Custom credit purchase with sliding scale ($25-$10K, 5 tiers)
  • Subscription page (5 bug fixes + RECOMMENDED badge)
  • Email system (env var from address, per-email overrides, shared templates)
  • Gemini MegaBot reliability (safety settings, model fallback, retry logic)

Pass 4 Locked (March 18, 2026):
  • Amazon enrichment — first-pull-only, reruns use stored data
  • Upload system — shared UploadModal with 6 methods, wired into both pages
  • Edit Item Form — full field upgrade matching new item depth
  • Item Control Center V1+V2 — consolidated Trade+Sale, info strip
  • Light Mode Rounds 1-4 — ~1,554 replacements across 88 files
  • Message Center Commands 1-2 — light mode + Weekly Report + UX improvements

Message Center Command 3 Locked (March 18, 2026):
  • InboxCommandCenter — sidebar categories clickable with filter dispatch
  • MessagesClient — inbox-filter-change listener, extended FilterMode
  • MessagesClient — star/flag conversation capability
  • AgentSettings — contrast fix for always-dark slide-out panel
  • CustomEvent bridge: inbox-filter-change + inbox-filter-reset
  • Hot Leads filter (botScore >= 80), Needs Reply filter (last msg buyer)
  • Console logging on filter clicks (data collection for usage patterns)

Business Infrastructure Locked (March 15-19, 2026):
  • GET /api/items route — returns user items for add-on tools
  • Add-On Launch Bridge — Owned becomes Launch Tool with navigation
  • Back to Store links — all point to /marketplace
  • Add-On Store Marketplace Upgrade — fully API-wired
  • Financial Fairness Engine — pro-rate, cancel flow, commission
  • Bundle Sale Engine — 3 types, public pages, BundleSuggestions widget
  • CRON Job Setup — Vercel native, vercel.json, /api/cron/offers
  • AI Listing Optimizer add-on — /addons/listing-optimizer (4-AI)
  • Buyer Outreach Blast add-on — /addons/buyer-outreach (4-AI)
  • AI Market Intelligence Report — /addons/market-report (4-AI)
  • Add-On Enrichment Layer — lib/addons/enrich-item-context.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  — Does this collect signal we learn from?
  — Does it make the next AI prediction better?
  — Does it create data nobody else has?
  — Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this part: No new data collection. Theme and visual changes only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Always follow this sequence. Never skip steps. Close the loop every time.

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this part: UI upgrade only. Replace hardcoded colors with CSS variables
and apply visual polish. No logic changes. No new features.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

DEMO_MODE=true — admin accounts bypass all gates and credit deductions.
Both test accounts are Tier 4 Estate Manager with full access.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve visual polish beyond minimum spec
  — Flag gaps noticed while working
  — Choose cleanest technical path
  — Add defensive error handling
  — Make UI impressive for investor demo
  — Add hover states, focus states, interaction feedback
  — Add polish that serves the Elon standard
  — Make this feel like a $1B product
  — Hardcode colors on always-dark panels
  (modals, overlays, slide-panels)

  You MAY NOT:
  — Touch any locked files
  — Change question wording (that is Part B)
  — Change scoring logic (that is Part B)
  — Change routing logic (that is Part B)
  — Add new questions or features (that is Part B)
  — Touch results/page.tsx (that is Part C)
  — Change any bot AI or prompt logic
  — Change any bot output format
  — Deviate from inline style={{}}
  — Add unapproved npm packages
  — Add routes beyond scope
  — Change schema without explicit approval
  — Change business or pricing logic
  — Use Tailwind or external CSS
  — Use className for styling

  Flag everything outside scope.
  Do not fix silently. Always report flags clearly.
  Read FULL component code before writing any command.
  Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

  DEMO_MODE=true in .env — active now.
  Admin account bypasses ALL tier gates and credit deductions.
  shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)
  Admin: never locked out. No credits deducted. Full platform access.

  TEST ACCOUNTS:
  annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
  ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager
  SYSTEM_USER_ID=cmmqpoljs0000pkwpl1uygvkz

  TO GO LIVE:
  Set DEMO_MODE=false in .env
  Switch Square sandbox keys to production keys
  All gates enforce immediately for real users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — ENVIRONMENT VARIABLES STATUS

  Variable                  Status      Notes
  OPENAI_API_KEY            SET         GPT-4o — vision + analysis
  ANTHROPIC_API_KEY         SET         Claude — narrative + accuracy
  GEMINI_API_KEY            SET         Gemini — SEO + search
  XAI_API_KEY               SET         Grok — social + viral
  XAI_BASE_URL              SET         Grok endpoint
  XAI_MODEL_TEXT            SET         Text model
  XAI_MODEL_VISION          SET         Vision model
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

DO ALL AT ONCE — Never piecemeal. Run after Monday walkthrough:

  • User.role field — 'admin' | 'user' (activates shouldBypassGates automatically)
  • soldPrice Int → Float (penny precision fix)
  • soldVia String? on Item (platform item sold through)
  • estimatedValue Float? on Item
  • priceDelta Float? on Item (sold vs estimated difference)
  • TradeProposal model (full trade workflow)
  • AgentSettings model (AI agent preferences per user)
  • Bundle model (replace EventLog workaround)
  • BundleItem model (items in bundle)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Onboarding Quiz Part A: Theme Support + Visual Polish

This is Part A of a 3-part upgrade to the onboarding quiz.
Part A: Theme + Visual (quiz/page.tsx) — THIS COMMAND
Part B: Tone + Features + Routing Guards (quiz/page.tsx)
Part C: Results Page Full Upgrade (results/page.tsx)

This part ONLY touches quiz/page.tsx. DO NOT touch results/page.tsx.

Problem: The quiz uses 25 hardcoded light-theme colors (#f0fdfa, #fff, #1c1917,
#78716c, #0f766e, #e7e5e4, #d6d3d1, #a8a29e, #0d9488). It does NOT work in
dark mode. It needs CSS variable replacements and premium visual polish.

SURGICAL UNLOCK:
  app/onboarding/quiz/page.tsx — UNLOCKED for theme + visual ONLY

Expected output: Quiz looks stunning in BOTH light and dark mode.
Premium progress bar, teal glow on selections, smooth transitions.
Zero hardcoded theme colors remaining in JSX.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/onboarding/quiz/page.tsx — FULL file (710 lines)
   Find: Lines 39-253 — QUIZ_QUESTIONS array (all 6 questions)
   Find: Lines 255-343 — scoring and recommendation logic
   Find: Lines 347-431 — component state and handlers
   Find: Lines 433-710 — JSX rendering (all hardcoded colors are here)

2. Read app/globals.css — READ ONLY (lines 1-160)
   Find: html.dark variables (lines 17-87)
   Find: html.light variables (lines 89-159)
   Use these EXACT variable names in all replacements

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — REPLACE ALL 25 HARDCODED COLORS

EXACT MAPPING — use this reference:

  BACKGROUNDS:
    "#f0fdfa"                             → var(--bg-primary)
    "#eff6ff"                             → var(--bg-primary)
    "#fff" or "#ffffff" (as background)   → var(--bg-card-solid)
    "linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%)"
                                          → linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)

  TEXT:
    "#1c1917"                             → var(--text-primary)
    "#78716c"                             → var(--text-muted)
    "#a8a29e"                             → var(--muted-color)
    "#d6d3d1"                             → var(--border-default)

  ACCENT:
    "#0f766e"                             → var(--accent-theme)
    "#0d9488"                             → var(--accent)
    "linear-gradient(90deg, #0f766e, #0d9488)"
                                          → linear-gradient(90deg, var(--accent-theme), var(--accent))

  BORDERS + SURFACES:
    "#e7e5e4"                             → var(--ghost-bg)
    "rgba(0,0,0,0.08)" (box shadow)      → var(--card-shadow)

  IMPORTANT EXCEPTION:
    "#fff" used as TEXT COLOR on teal/dark buttons — keep as "#fff"
    or use var(--btn-primary-text). Do NOT replace white-on-accent text
    with var(--bg-card-solid) — that would turn invisible in light mode.

EVERY INSTANCE IN THE FILE (exact line numbers):

  Line 437: page background gradient → var(--bg-primary) + var(--bg-secondary)
  Line 460: logo box background "#0f766e" → var(--accent-theme)
  Line 461: logo box text "#fff" → KEEP "#fff" (white on accent)
  Line 471: brand text "#1c1917" → var(--text-primary)
  Line 484: progress label "#78716c" → var(--text-muted)
  Line 491: progress percent "#0f766e" → var(--accent-theme)
  Line 499: progress track "#e7e5e4" → var(--ghost-bg)
  Line 508: progress fill gradient → var(--accent-theme) to var(--accent)
  Line 519: card background "#fff" → var(--bg-card-solid)
  Line 522: card shadow rgba(0,0,0,0.08) → var(--card-shadow)
  Line 532: question text "#1c1917" → var(--text-primary)
  Line 541: subtitle text "#78716c" → var(--text-muted)
  Line 572: option border selected "#0f766e" / unselected "#e7e5e4" → var(--accent-theme) / var(--ghost-bg)
  Line 573: option bg selected "#f0fdfa" / unselected "#fff" → var(--accent-dim) / var(--bg-card-solid)
  Line 587: option text selected "#0f766e" / unselected "#1c1917" → var(--accent-theme) / var(--text-primary)
  Line 599: checkbox border selected "#0f766e" / unselected "#d6d3d1" → var(--accent-theme) / var(--border-default)
  Line 600: checkbox bg selected "#0f766e" / unselected "#fff" → var(--accent-theme) / var(--bg-card-solid)
  Line 611: checkmark "#fff" → KEEP "#fff"
  Line 627: radio bg "#0f766e" → var(--accent-theme)
  Line 634: radio check "#fff" → KEEP "#fff"
  Line 660: back button disabled "#d6d3d1" / enabled "#78716c" → var(--border-default) / var(--text-muted)
  Line 674: next button bg "#0f766e" → var(--accent-theme)
  Line 675: next button text "#fff" → KEEP "#fff"
  Line 690: helper text "#a8a29e" → var(--muted-color)
  Line 701: footer text "#a8a29e" → var(--muted-color)

After: ZERO hardcoded theme colors remaining. Only "#fff" on button text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — VISUAL POLISH

Apply these upgrades to quiz/page.tsx:

1. PROGRESS BAR:
   Gradient: linear-gradient(90deg, var(--accent-theme), var(--accent))
   Height: 8px (up from 6px)
   Rounded full (borderRadius: "999px")
   Smooth transition: "width 0.4s ease"
   Add glow on filled portion: boxShadow: "0 0 8px var(--accent-glow)"

2. SELECTED OPTION GLOW:
   When selected:
     border: "2px solid var(--accent-theme)"
     boxShadow: "0 0 0 3px var(--accent-glow)"
     background: "var(--accent-dim)"
   Unselected:
     border: "2px solid var(--ghost-bg)"
     background: "var(--bg-card-solid)"
   Hover (unselected):
     border: "2px solid var(--border-hover)"
     background: "var(--bg-card-hover)"

3. QUESTION CARD:
   borderRadius: "1.5rem"
   boxShadow: "var(--card-shadow)"
   border: "1px solid var(--border-default)"
   background: "var(--bg-card-solid)"

4. TRANSITIONS:
   Keep existing fade + translateX (220ms ease)
   Ensure smooth between all questions

5. LOGO:
   Logo box background: var(--accent-theme)
   Logo text "LL": keep "#fff"
   Brand text "LegacyLoop": var(--text-primary)

6. BUTTONS:
   Primary (Next, See Results):
     background: "var(--accent-theme)"
     color: "#fff"
     borderRadius: "0.875rem"
     fontWeight: 700
   Ghost (Back):
     background: "transparent"
     border: "none"
     color: "var(--text-muted)"

7. FOOTER:
   "No account needed · Takes about 2 minutes"
   color: "var(--muted-color)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE IN THIS PART:
  — Question wording (Part B)
  — Scoring logic (Part B)
  — Routing logic (Part B)
  — No new questions or features (Part B)
  — results/page.tsx (Part C)
  — Any locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  THEME:
  3. Zero hardcoded #f0fdfa remaining: yes / no
  4. Zero hardcoded #1c1917 remaining: yes / no
  5. Zero hardcoded #78716c remaining: yes / no
  6. Zero hardcoded #0f766e remaining: yes / no
  7. Zero hardcoded #e7e5e4 remaining: yes / no
  8. Zero hardcoded #fff as BACKGROUND remaining: yes / no
  9. White text on accent buttons preserved as "#fff": yes / no
  10. All replacements use exact CSS variable names from globals.css: yes / no

  VISUAL:
  11. Progress bar height 8px with gradient and glow: yes / no
  12. Selected options have teal glow (boxShadow): yes / no
  13. Question card has border + card-shadow: yes / no
  14. Transitions smooth between all questions: yes / no

  UNCHANGED:
  15. All question wording UNCHANGED: yes / no
  16. All scoring logic UNCHANGED: yes / no
  17. All routing logic UNCHANGED: yes / no
  18. All option points UNCHANGED: yes / no

  N+1. All locked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. Always-dark panels use hardcoded colors: yes / no
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

  Part B — Theme replacements: [fixed / issue]
    - Hardcoded colors replaced: [count] of 25
    - Dark mode clean: [yes / no]
    - Light mode clean: [yes / no]

  Part C — Visual polish: [fixed / issue]
    - Progress bar upgraded: [yes / no]
    - Option glow working: [yes / no]
    - Card styling applied: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]
  ALWAYS-DARK PANELS: [hardcoded colors used / issues]

  EXISTING LOGIC UNTOUCHED:
  — Question wording unchanged: [Confirm]
  — Scoring logic unchanged: [Confirm]
  — Routing logic unchanged: [Confirm]
  — results/page.tsx untouched: [Confirm]
  — All locked files verified as untouched

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, missed data collection, out-of-scope items]

  Files modified: [list all — should be exactly 1: app/onboarding/quiz/page.tsx]
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
Part A of 3 | Command Template v9 | LegacyLoop | Onboarding Quiz Upgrade
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
