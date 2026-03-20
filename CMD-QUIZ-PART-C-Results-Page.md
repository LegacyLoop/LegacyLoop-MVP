LEGACYLOOP — COMMAND TEMPLATE v9 — PART C of 3
Onboarding Quiz Upgrade — Results Page Full Upgrade (results/page.tsx ONLY)
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

PREREQUISITE: Parts A and B must be completed and passing before running Part C.
Part A converted quiz hardcoded colors + visual polish.
Part B upgraded quiz tone, added White Glove preview, "Anything else?" step, and routing guards.
Part C now upgrades the results page to match.

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
  echo '--- Verify Parts A+B completed ---'
  grep -c 'var(--' app/onboarding/quiz/page.tsx
  grep -c '#f0fdfa\|#1c1917\|#78716c\|#0f766e' app/onboarding/quiz/page.tsx
  grep -c 'userNotes\|wantsHelp\|showNotesStep\|showWhiteGlovePreview' app/onboarding/quiz/page.tsx
  echo '--- Results page current state ---'
  grep -c '#f0fdfa\|#1c1917\|#78716c\|#0f766e\|#e7e5e4' app/onboarding/results/page.tsx
  echo '=== CHECKPOINT COMPLETE ==='

Expected:
  quiz var(-- count: 40+
  quiz hardcoded color count: 0 (only #fff on button text)
  quiz new features count: 4+ (userNotes, wantsHelp, showNotesStep, showWhiteGlovePreview)
  results hardcoded count: 30+ (these are what we are replacing NOW)

If quiz features count < 4, Part B was not completed — STOP and report.

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

— Quiz Page (Parts A+B Complete) —
✓ app/onboarding/quiz/page.tsx — LOCKED (completed in Parts A+B)

SURGICAL UNLOCK — This file is explicitly unlocked for THIS PART ONLY:

  app/onboarding/results/page.tsx — UNLOCKED (theme support, Neighborhood Bundle, personalization, White Glove soft-surface, credit add-ons mention)

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

Pass 5 Locked (March 19, 2026 — Parts A+B):
  • Quiz theme support — 25 hardcoded colors → CSS variables
  • Quiz visual polish — 8px progress bar with glow, option glow, card styling
  • Quiz warmer tone — Q1, Q4, Q5 wording updated, subtitles on all 6 questions
  • White Glove preview after Q4 — shows for fullService/someHelp users
  • Optional "Anything else?" 7th step — textarea, skip/continue, userNotes in URL
  • Budget guard — free/affordable blocks White Glove path
  • wantsHelp flag — passed as URL param when fullService/someHelp
  • fullService + premium budget → routes directly to /white-glove

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  — Does this collect signal we learn from?
  — Does it make the next AI prediction better?
  — Does it create data nobody else has?
  — Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this part: The results page receives userNotes and wantsHelp from the quiz.
These are available via URL params for future storage/display. No new data
collection in this part — but flag if the results page should save/display these.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Always follow this sequence. Never skip steps. Close the loop every time.

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this part: UI upgrade only. Replace hardcoded colors with CSS variables,
add new result sections, and improve personalization messaging.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

DEMO_MODE=true — admin accounts bypass all gates and credit deductions.
Both test accounts are Tier 4 Estate Manager with full access.

FULL SERVICE CATALOG (results page should surface ALL of these appropriately):

  DIGITAL TIERS (self-service with AI):
    Free:           $0/mo,  12% commission, 3 items
    DIY Seller:     $10-20/mo, 8% commission, 25 items
    Power Seller:   $25-49/mo, 5% commission, 100 items
    Estate Manager: $75-99/mo, 4% commission, unlimited items

  WHITE GLOVE TIERS (on-site, full-service estate management):
    Essentials:     $1,495 (up to 100 items, 1-2 bedrooms)
    Professional:   $2,995 (200+ items, 3-4 bedrooms) — RECOMMENDED
    Legacy:         $4,995+ (unlimited items, dedicated PM, printed legacy book)

  NEIGHBORHOOD BUNDLE (group/community sales):
    Route: /services/neighborhood-bundle

  CREDIT ADD-ONS (premium AI tools):
    AI Listing Optimizer, Buyer Outreach Blast, AI Market Report,
    MegaBot Analysis, Expert Appraisal, Text/Audio/Video Story,
    Priority Processing, Inventory Report PDF, Print Story Book,
    Legacy Archive USB, White Glove Coordination, Estate Documentation,
    Social Media Pack, AI Price Drop Alert
    Packs: $25 → 30 credits, $50 → 65, $100 → 140, $200 → 300

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
  — Hardcode colors on always-dark panels
  (modals, overlays, slide-panels)

  You MAY NOT:
  — Touch any locked files
  — Touch quiz/page.tsx (completed in Parts A+B)
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

OBJECTIVE — Onboarding Quiz Part C: Results Page Full Upgrade

This is Part C of a 3-part upgrade to the onboarding quiz.
Part A: Theme + Visual (quiz/page.tsx) — LOCKED
Part B: Tone + Features + Routing Guards (quiz/page.tsx) — LOCKED
Part C: Results Page Full Upgrade (results/page.tsx) — THIS COMMAND

This part ONLY touches results/page.tsx. DO NOT touch quiz/page.tsx.

Problem: The results page uses ~49 hardcoded light-theme colors. It does not
work in dark mode. It has no Neighborhood Bundle surfacing, no personalized
situation context, no credit add-ons mention, and no White Glove soft-surface
for users who wanted help but got routed to a digital tier.

IMPORTANT ROUTING CONTEXT FROM PART B:
  The quiz now routes users as follows:
  - fullService + budget NOT blocked → /white-glove (direct, skips results)
  - ALL other users → /onboarding/results with these URL params:
    ?r={...recommendation JSON...}&wantsHelp=true&userNotes=...

  So the results page receives:
  - searchParams.get("r") — JSON recommendation (always present)
  - searchParams.get("wantsHelp") — "true" if helpLevel was fullService or someHelp
  - searchParams.get("userNotes") — optional free text from "Anything else?" step

  NOTE: "wantsHelp" is the exact URL param name. NOT "wh". NOT "wants_help".

SURGICAL UNLOCK:
  app/onboarding/results/page.tsx — UNLOCKED for full upgrade

Expected output: Results page looks stunning in both modes. Shows personalized
context, surfaces Neighborhood Bundle and White Glove appropriately, mentions
credit add-ons for digital tiers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/onboarding/results/page.tsx — FULL file (721 lines)
   Find: Lines 15-71 — helper functions (tier names, prices, descriptions)
   Find: Lines 73-165 — recommendation reasons builder
   Find: Lines 205-696 — ResultsContent JSX (all hardcoded colors here)

2. Read app/globals.css — READ ONLY (lines 1-160)
   Find: All CSS variable definitions for html.dark and html.light
   Use these EXACT variable names in all replacements

3. Read lib/pricing/constants.ts — READ ONLY
   Find: WHITE_GLOVE_TIERS export (for pricing data)
   Find: DIGITAL_TIERS export (for subscription data)

4. Read app/services/neighborhood-bundle/page.tsx — READ ONLY
   Understand Neighborhood Bundle page for link consistency

5. Read app/white-glove/page.tsx — READ ONLY
   Understand White Glove page for link consistency

6. Read app/onboarding/quiz/page.tsx — READ ONLY (lines 376-398)
   Find: finalizeQuiz function — see exactly what URL params are passed
   Confirm: wantsHelp param name, userNotes param name, r param structure

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — REPLACE ALL HARDCODED COLORS (~49 instances)

EXACT MAPPING — use this reference:

  BACKGROUNDS:
    "#f0fdfa"                             → var(--bg-primary)
    "#eff6ff"                             → var(--bg-primary)
    "#fff" or "#ffffff" (as background)   → var(--bg-card-solid)
    "#fafaf9"                             → var(--ghost-bg)
    "#ecfdf5"                             → var(--bg-primary)
    "linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%)"
                                          → linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)

  TEXT:
    "#1c1917"                             → var(--text-primary)
    "#78716c"                             → var(--text-muted)
    "#57534e"                             → var(--text-secondary)
    "#a8a29e"                             → var(--muted-color)
    "#d6d3d1"                             → var(--border-default)

  ACCENT:
    "#0f766e"                             → var(--accent-theme)
    "#0d9488"                             → var(--accent)

  BORDERS + SURFACES:
    "#e7e5e4"                             → var(--ghost-bg)
    "rgba(0,0,0,0.08)" (shadow)          → var(--card-shadow)
    "rgba(0,0,0,0.06)" (shadow)          → var(--card-shadow)

  SPECIAL CASES (KEEP HARDCODED — intentional always-colored):
    "#fef9c3", "#fde68a", "#92400e", "#78350f" — appraisal upsell (always gold)
    "#eff6ff", "#bfdbfe", "#1e40af", "#1e3a8a" — vehicle note (always blue)
    "#fbbf24" — gold accent for White Glove pricing (always gold)
    "linear-gradient(135deg, #1c1917, #292524)" — WG card (intentionally always dark)

  IMPORTANT:
    "#fff" as TEXT on dark/accent backgrounds → KEEP "#fff"
    "#fff" as BACKGROUND on cards → var(--bg-card-solid)
    Distinguish between these two uses carefully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — READ wantsHelp AND userNotes FROM URL PARAMS

In the ResultsContent component, add these reads from searchParams:

  const wantsHelp = searchParams.get("wantsHelp") === "true";
  const userNotes = searchParams.get("userNotes") || "";

These are used in Parts E and G below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — PERSONALIZED SITUATION CONTEXT

Replace the current generic subheading:
  "Based on your answers, here's what we recommend:"

With a personalized sentence built from the recommendation data:

  const categoryLabel: Record<string, string> = {
    estate: "estate transition",
    garage: "garage sale",
    neighborhood: "neighborhood sale",
  };

  "Based on your {categoryLabel[rec.primaryCategory] || 'sale'}, here's what we recommend:"

Also update the confidence display text to:
  "We're {rec.confidence}% confident this is the right plan for you."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — NEIGHBORHOOD BUNDLE SURFACING

When rec.primaryCategory is "neighborhood" AND (rec.scores?.neighborhood ?? 0) > 8,
add a section BETWEEN the primary recommendation card and the "Why we recommend this" card:

  Icon: 🏘️
  Title: "Neighborhood Bundle — Perfect for You"
  Body: "You mentioned organizing a group or community sale.
         Our Neighborhood Bundle lets you coordinate with neighbors,
         share the costs, and turn it into a real event.
         More buyers. Less hassle. Better prices for everyone."
  CTA: "Learn More About Neighborhood Bundles →"
  Link: /services/neighborhood-bundle

  Style: var(--accent-dim) background, var(--accent-border) border,
  borderRadius 1.25rem, comfortable padding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — WHITE GLOVE PRICING TRANSPARENCY

For White Glove recommendations (ESSENTIALS, PROFESSIONAL, LEGACY),
add a brief pricing explainer INSIDE the primary recommendation card,
below the tier description and above the pre-launch callout:

  ESSENTIALS: "Includes on-site visit, AI photography, up to 100 items, and full buyer management."
  PROFESSIONAL: "Full estate management for 3-4 bedrooms. Multiple visits, MegaBot analysis on every item, dedicated team coordination."
  LEGACY: "Unlimited items, dedicated project manager, printed legacy book, premium photography, and white-glove everything."

  Style: fontSize 0.85rem, color rgba(255,255,255,0.8) (inside the dark/accent card), lineHeight 1.5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — CREDIT ADD-ONS MENTION FOR DIGITAL TIERS

For ALL digital tier recommendations (FREE, STARTER, PLUS, PRO),
add a tip section AFTER the primary recommendation card:

  Icon: 💡
  Text: "Pro tip: Boost your results with AI-powered add-ons like Expert Appraisals,
        Buyer Outreach, and Market Reports. Credit packs start at just $25."

  Style: var(--ghost-bg) background, var(--border-default) border,
  borderRadius 1rem, comfortable padding.

  Do NOT show for White Glove tiers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART H — WHITE GLOVE SOFT-SURFACE FOR DIGITAL + WANTS HELP USERS

When the recommended tier is DIGITAL (FREE/STARTER/PLUS/PRO)
AND (wantsHelp is true OR (rec.scores?.whiteGlove ?? 0) >= 8),
add a section AFTER the credit add-ons mention:

  Icon: 🤝
  Title: "Want us to handle it all?"
  Body: "Our White Glove service starts at $1,495.
         We come to your home, photograph everything, price with AI,
         and manage all buyers and shipping. You just approve sales."
  CTA: "Explore White Glove Options →"
  Link: /white-glove

  Style: gradient bg (var(--bg-card-solid) to var(--ghost-bg)),
  var(--accent-border) border, borderRadius 1.25rem.

  Do NOT show when tier is already White Glove.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VISUAL POLISH (apply throughout):

  1. All cards: borderRadius "1.25rem" or "1.5rem", boxShadow "var(--card-shadow)",
     border "1px solid var(--border-default)"
  2. All links: color "var(--accent-theme)", no underline
  3. Footer CTA: borderRadius "9999px", background "var(--accent-theme)"
  4. Confidence bar: var(--accent-theme) fill, var(--ghost-bg) track
  5. Category icon circle: var(--bg-primary) for non-WG, keep dark for WG

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE IN THIS PART:
  — quiz/page.tsx (completed in Parts A+B)
  — getTierName, getTierPrice, getTierHref, getTierCtaLabel functions (keep as-is)
  — getTierDescription (keep as-is, WG pricing transparency is ADDITIONAL)
  — getRecommendationReasons (keep as-is)
  — getAlternativeOptions (keep as-is)
  — getCategoryEmoji (keep as-is)
  — Tier routing logic (lives in quiz/page.tsx, already done)
  — Any locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  THEME:
  3. Zero hardcoded #f0fdfa remaining (except intentional): yes / no
  4. Zero hardcoded #1c1917 remaining (except WG card): yes / no
  5. Zero hardcoded #78716c remaining: yes / no
  6. Zero hardcoded #0f766e remaining: yes / no
  7. Zero hardcoded #e7e5e4 remaining: yes / no
  8. Zero hardcoded #fff as BACKGROUND remaining: yes / no
  9. White text on dark/accent backgrounds preserved: yes / no
  10. Appraisal upsell (gold) still intentionally colored: yes / no
  11. Vehicle note (blue) still intentionally colored: yes / no

  PERSONALIZATION:
  12. Situation context sentence uses correct category label: yes / no
  13. Confidence text reads "We're X% confident...": yes / no

  NEIGHBORHOOD:
  14. Bundle section shows when neighborhood > 8: yes / no
  15. Bundle section does NOT show when neighborhood <= 8: yes / no
  16. Link to /services/neighborhood-bundle works: yes / no

  WHITE GLOVE PRICING:
  17. WG pricing transparency shows for ESSENTIALS: yes / no
  18. WG pricing transparency shows for PROFESSIONAL: yes / no
  19. WG pricing transparency shows for LEGACY: yes / no

  CREDIT ADD-ONS:
  20. Credit tip shows for all digital tiers: yes / no
  21. Credit tip does NOT show for WG tiers: yes / no

  WHITE GLOVE SOFT-SURFACE:
  22. Soft-surface shows when wantsHelp=true AND tier is digital: yes / no
  23. Soft-surface shows when whiteGlove score >= 8 AND tier is digital: yes / no
  24. Soft-surface does NOT show when tier is already WG: yes / no
  25. Link to /white-glove works: yes / no

  URL PARAMS:
  26. wantsHelp read from searchParams.get("wantsHelp"): yes / no
  27. userNotes read from searchParams.get("userNotes"): yes / no

  N+1. All locked files untouched: yes / no
  N+2. quiz/page.tsx UNTOUCHED: yes / no
  N+3. inline style={{}} throughout: yes / no
  N+4. Always-dark panels use hardcoded colors: yes / no
  N+5. Theme-aware surfaces use CSS variables: yes / no
  N+6. npx tsc --noEmit: 0 errors
  N+7. npm run build: pass
  N+8. CHECKPOINT post-change: pass
  N+9. Dev server: localhost:3000
  N+10. Light mode tested: no broken contrast
  N+11. Dark mode tested: all elements visible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part A printed: [yes / no]

  Part B — Theme replacements: [fixed / issue]
    - Hardcoded colors replaced: [count] of ~49
    - Dark mode clean: [yes / no]
    - Light mode clean: [yes / no]

  Part C — URL params: [fixed / issue]
    - wantsHelp read correctly: [yes / no]
    - userNotes read correctly: [yes / no]

  Part D — Personalization: [fixed / issue]
    - Situation context sentence: [yes / no]
    - Confidence text updated: [yes / no]

  Part E — Neighborhood Bundle: [fixed / issue]
    - Shows when neighborhood > 8: [yes / no]
    - Link works: [yes / no]

  Part F — WG Pricing: [fixed / issue]
    - Shows for all 3 WG tiers: [yes / no]

  Part G — Credit add-ons: [fixed / issue]
    - Shows for digital tiers: [yes / no]
    - Hidden for WG tiers: [yes / no]

  Part H — WG soft-surface: [fixed / issue]
    - Shows for digital + wantsHelp: [yes / no]
    - Hidden for WG tiers: [yes / no]
    - Link works: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]
  ALWAYS-DARK PANELS: [hardcoded colors used / issues]

  EXISTING LOGIC UNTOUCHED:
  — All helper functions unchanged: [Confirm]
  — quiz/page.tsx untouched: [Confirm]
  — All locked files verified as untouched

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, missed data collection, out-of-scope items]

  Files modified: [list all — should be exactly 1: app/onboarding/results/page.tsx]
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

FINAL REPORT — ALL 3 PARTS COMPLETE

After Part C passes, provide a combined summary:

  PART A — Theme + Visual (quiz/page.tsx): [pass / fail]
  PART B — Tone + Features + Guards (quiz/page.tsx): [pass / fail]
  PART C — Results Page (results/page.tsx): [pass / fail]

  Total files modified: 2
    - app/onboarding/quiz/page.tsx
    - app/onboarding/results/page.tsx

  Hardcoded colors eliminated: ~74
  New features added:
    1. White Glove preview after Q4
    2. "Anything else?" optional 7th step
    3. Budget guard for routing
    4. Personalized situation context on results
    5. Neighborhood Bundle surfacing on results
    6. White Glove pricing transparency on results
    7. Credit add-ons mention for digital users
    8. White Glove soft-surface for digital users who want help

  Scoring logic: UNCHANGED
  Tier routing fundamentals: UNCHANGED
  All 7 tiers: REACHABLE
  Light + Dark mode: BOTH CLEAN

  IF ANY PART FAILS: REVERT THAT PART ONLY. Do not revert passing parts.

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
Part C of 3 | Command Template v9 | LegacyLoop | Onboarding Quiz Upgrade
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
