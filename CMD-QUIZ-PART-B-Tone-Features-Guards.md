→LEGACYLOOP — COMMAND TEMPLATE v9 — PART B of 3
→Onboarding Quiz Upgrade — Tone + Features + Guards (quiz/page.tsx ONLY)
→Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
→
→Copy this entire command into Claude Code. Never skip sections.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 1 — CRITICAL DESIGN DIRECTIVE
→
→READ BEFORE MAKING ANY CHANGES:
→
→  This app has an established design system: sleek, elegant, high-tech —
→  inspired by Tesla, SpaceX, and Grok.
→  Dark theme with teal (#00bcd4) accents, glass morphism cards, subtle animations,
→  generous whitespace, premium typography. Senior-friendly.
→
→  All styles inline style={{}} — NO Tailwind. NO external CSS.
→  NO className for styling. ONLY inline style={{}}.
→
→  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
→  NEVER hardcoded rgba(255,255,255,...) or #fff on theme surfaces.
→
→  ELON MUSK STANDARD: This must feel like a $1B product.
→  Every interaction must feel responsive and purposeful.
→  Think Tesla center console — dense, smart, fast.
→
→  ALWAYS-DARK PANELS: Modals and overlays that are always dark
→  MUST use hardcoded colors (#e2e8f0 text, rgba(255,255,255,0.05) bg)
→  NEVER CSS variables — they invert in light mode.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 2 — VERIFICATION CHECKPOINT
→
→Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.
→
→  echo '=== CHECKPOINT ==='
→  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
→  grep 'OPENAI_API_KEY' .env | sed 's/=.*/=SET/'
→  grep 'ANTHROPIC_API_KEY' .env | sed 's/=.*/=SET/'
→  grep 'GEMINI_API_KEY' .env | sed 's/=.*/=SET/'
→  grep 'XAI_API_KEY' .env | sed 's/=.*/=SET/'
→  grep 'SENDGRID_API_KEY' .env | sed 's/=.*/=SET/'
→  grep 'DEMO_MODE' .env | head -2
→  grep -n 'shouldBypassGates|isDemoMode' lib/constants/pricing.ts | head -3
→  grep -n 'checkCredits|deductCredits' lib/credits.ts | head -3
→  grep -c 'var(--' app/onboarding/quiz/page.tsx
→  grep -c '#f0fdfa\|#1c1917' app/onboarding/quiz/page.tsx
→  npx tsc --noEmit 2>&1 | tail -3
→  echo '=== CHECKPOINT COMPLETE ==='
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 3 — PERMANENTLY LOCKED FILES
→
→ALWAYS LOCKED — Never touch without explicit surgical unlock:
→
→— Core Adapters —
→✓ lib/adapters/ai.ts
→✓ lib/adapters/rainforest.ts
→✓ lib/adapters/auth.ts — EXTEND ONLY
→✓ lib/adapters/storage.ts
→✓ lib/adapters/multi-ai.ts
→
→— AI Detection + Scoring —
→✓ lib/antique-detect.ts
→✓ lib/collectible-detect.ts
→
→— MegaBot Engine —
→✓ lib/megabot/run-specialized.ts
→✓ lib/megabot/prompts.ts — ADD-ONLY
→
→— Shipping —
→✓ lib/shipping/package-suggestions.ts
→
→— Data Pipelines —
→✓ lib/data/backfill.ts
→✓ lib/data/populate-intelligence.ts
→✓ lib/data/project-rollup.ts
→✓ lib/data/user-events.ts
→
→— Enrichment —
→✓ lib/enrichment/item-context.ts
→✓ lib/addons/enrich-item-context.ts
→
→— Credits + Billing —
→✓ lib/credits.ts
→✓ lib/tier-enforcement.ts — READ ONLY
→✓ lib/billing/pro-rate.ts
→✓ lib/billing/commission.ts
→
→— Offers —
→✓ lib/offers/expiry.ts
→✓ lib/offers/notify.ts
→✓ lib/offers/cron.ts
→
→— Email System —
→✓ lib/email/send.ts
→✓ lib/email/templates.ts
→
→— Pricing Constants —
→✓ lib/constants/pricing.ts
→✓ lib/pricing/constants.ts
→✓ lib/adapters/pricing.ts
→✓ lib/pricing/calculate.ts
→
→— API Routes —
→✓ app/api/** — ALL LOCKED
→
→— Item + Dashboard + Bots —
→✓ app/items/** — ALL LOCKED
→✓ app/dashboard/** — ALL LOCKED
→✓ app/bots/** — ALL LOCKED
→
→— Core UI —
→✓ app/components/AppNav.tsx
→✓ app/components/UploadModal.tsx
→✓ app/page.tsx
→✓ globals.css
→
→— Commerce + Pages —
→✓ app/subscription/** — LOCKED
→✓ app/credits/** — LOCKED
→✓ app/marketplace/** — LOCKED
→✓ app/bundles/** — LOCKED
→✓ app/shipping/** — LOCKED
→✓ app/pricing/** — LOCKED
→✓ app/projects/** — LOCKED
→✓ app/offers/** — LOCKED
→
→— Always-Dark Overlays —
→✓ app/components/ItemActionPanel.tsx
→✓ app/components/billing/CancelFlowModal.tsx
→✓ app/components/billing/UpgradeFlowModal.tsx
→✓ app/components/TradeProposalModal.tsx
→
→— Messaging System — ALL LOCKED —
→✓ app/messages/layout.tsx
→✓ app/messages/page.tsx
→✓ app/messages/MessagesClient.tsx
→✓ app/messages/MessagesAgentWrapper.tsx
→✓ app/components/messaging/InboxCommandCenter.tsx
→✓ app/components/messaging/WeeklyReportCard.tsx
→✓ app/components/messaging/AiMessageToolbar.tsx
→✓ app/components/messaging/AiSuggestionsPanel.tsx
→✓ app/components/messaging/BuyerIntelligenceCard.tsx
→✓ app/components/messaging/NegotiationCoach.tsx
→✓ app/components/messaging/AgentSettings.tsx
→
→— Add-On Tools — ALL LOCKED —
→✓ app/addons/listing-optimizer/page.tsx
→✓ app/addons/buyer-outreach/page.tsx
→✓ app/addons/market-report/page.tsx
→
→— Infrastructure —
→✓ vercel.json
→✓ prisma/schema.prisma — READ ONLY
→
→— Results Page (Part C) —
→✓ app/onboarding/results/page.tsx — LOCKED FOR THIS PART
→
→SURGICAL UNLOCK — This file is explicitly unlocked for THIS PART ONLY:
→
→  app/onboarding/quiz/page.tsx — UNLOCKED (tone upgrade, White Glove preview, optional notes field, routing guards)
→
→All unlocked files return to LOCKED after approval.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 4 — ALL APPROVED + LOCKED FEATURES
→
→Never touch, modify, or rebuild any of these:
→
→Pass 1-3 Locked Features:
→  • All bot AI logic and prompt systems
→  • All bot output formats
→  • MegaBot 4-agent consensus system (OpenAI, Claude, Gemini, Grok)
→  • Antique detection + Antique Alert (78 signals)
→  • Collectible detection + scoring
→  • Amazon/Rainforest enrichment adapter
→  • Shipping calculator + package suggestions
→  • Offer negotiation system (3-round, magic link)
→  • Credit system (packs, custom, deductions, balance)
→  • Subscription tiers (Free/DIY/Power/Estate Manager)
→  • Pro-rate billing for upgrades/downgrades
→  • Commission calculator
→  • ListBot Publish Hub (13 platforms)
→  • Marketplace and bundle system
→  • Trade proposals
→  • Sold price tracking
→  • Data pipelines and enrichment
→
→Pass 3 Final Locked (March 16-17, 2026):
→  • Custom credit purchase with sliding scale ($25-$10K, 5 tiers)
→  • Subscription page (5 bug fixes + RECOMMENDED badge)
→  • Email system (env var from address, per-email overrides, shared templates)
→  • Gemini MegaBot reliability (safety settings, model fallback, retry logic)
→
→Pass 4 Locked (March 18, 2026):
→  • Amazon enrichment — first-pull-only, reruns use stored data
→  • Upload system — shared UploadModal with 6 methods, wired into both pages
→  • Edit Item Form — full field upgrade matching new item depth
→  • Item Control Center V1+V2 — consolidated Trade+Sale, info strip
→  • Light Mode Rounds 1-4 — ~1,554 replacements across 88 files
→  • Message Center Commands 1-2 — light mode + Weekly Report + UX improvements
→
→Message Center Command 3 Locked (March 18, 2026):
→  • InboxCommandCenter — sidebar categories clickable with filter dispatch
→  • MessagesClient — inbox-filter-change listener, extended FilterMode
→  • MessagesClient — star/flag conversation capability
→  • AgentSettings — contrast fix for always-dark slide-out panel
→  • CustomEvent bridge: inbox-filter-change + inbox-filter-reset
→  • Hot Leads filter (botScore >= 80), Needs Reply filter (last msg buyer)
→  • Console logging on filter clicks (data collection for usage patterns)
→
→Business Infrastructure Locked (March 15-19, 2026):
→  • GET /api/items route — returns user items for add-on tools
→  • Add-On Launch Bridge — Owned becomes Launch Tool with navigation
→  • Back to Store links — all point to /marketplace
→  • Add-On Store Marketplace Upgrade — fully API-wired
→  • Financial Fairness Engine — pro-rate, cancel flow, commission
→  • Bundle Sale Engine — 3 types, public pages, BundleSuggestions widget
→  • CRON Job Setup — Vercel native, vercel.json, /api/cron/offers
→  • AI Listing Optimizer add-on — /addons/listing-optimizer (4-AI)
→  • Buyer Outreach Blast add-on — /addons/buyer-outreach (4-AI)
→  • AI Market Intelligence Report — /addons/market-report (4-AI)
→  • Add-On Enrichment Layer — lib/addons/enrich-item-context.ts
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 5 — DATA COLLECTION STANDARD
→
→LegacyLoop collects and retains ALL data permanently. Nothing is purged.
→
→Every feature must answer:
→  — Does this collect signal we learn from?
→  — Does it make the next AI prediction better?
→  — Does it create data nobody else has?
→  — Does it compound in value over time?
→
→Flag all missed data collection opportunities. We decide together.
→
→For this part: userNotes (optional 7th step) creates new data on hesitation and open-ended feedback. Capture this signal.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 6 — BUILD PATTERN
→
→Always follow this sequence. Never skip steps. Close the loop every time.
→
→  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update
→
→For this part: UI upgrade with new question wording, White Glove preview conditional,
→optional notes field, and routing guards based on budget + support level.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 7 — PLATFORM CONTEXT
→
→PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
→PHASE 2: Direct publish as OAuth is approved per platform.
→
→DEMO_MODE=true — admin accounts bypass all gates and credit deductions.
→Both test accounts are Tier 4 Estate Manager with full access.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 8 — CLAUDE CODE CREATIVE LATITUDE
→
→  You MAY:
→  — Improve question wording beyond minimum spec (warmer, more conversational)
→  — Flag gaps noticed while working
→  — Choose cleanest technical path
→  — Add defensive error handling
→  — Make UI impressive for investor demo
→  — Refine White Glove preview appearance beyond spec
→  — Polish the "Anything else?" step UI
→  — Make this feel like a $1B product
→  — Hardcode colors on always-dark panels
→  (modals, overlays, slide-panels)
→
→  You MAY NOT:
→  — Touch any locked files
→  — Change Part A theme/visual work (that is locked now)
→  — Touch results/page.tsx (that is Part C)
→  — Change scoring logic
→  — Change any bot AI or prompt logic
→  — Change any bot output format
→  — Deviate from inline style{{}}
→  — Add unapproved npm packages
→  — Add routes beyond scope
→  — Change schema without explicit approval
→  — Change business or pricing logic
→  — Use Tailwind or external CSS
→  — Use className for styling
→
→  Flag everything outside scope.
→  Do not fix silently. Always report flags clearly.
→  Read FULL component code before writing any command.
→  Never assume. Never guess. Read first. Build second.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 9 — DEMO MODE + ADMIN BYPASS
→
→  DEMO_MODE=true in .env — active now.
→  Admin account bypasses ALL tier gates and credit deductions.
→  shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)
→  Admin: never locked out. No credits deducted. Full platform access.
→
→  TEST ACCOUNTS:
→  annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
→  ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager
→  SYSTEM_USER_ID=cmmqpoljs0000pkwpl1uygvkz
→
→  TO GO LIVE:
→  Set DEMO_MODE=false in .env
→  Switch Square sandbox keys to production keys
→  All gates enforce immediately for real users
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 10 — ENVIRONMENT VARIABLES STATUS
→
→  Variable                  Status      Notes
→  OPENAI_API_KEY            SET         GPT-4o — vision + analysis
→  ANTHROPIC_API_KEY         SET         Claude — narrative + accuracy
→  GEMINI_API_KEY            SET         Gemini — SEO + search
→  XAI_API_KEY               SET         Grok — social + viral
→  XAI_BASE_URL              SET         Grok endpoint
→  XAI_MODEL_TEXT            SET         Text model
→  XAI_MODEL_VISION          SET         Vision model
→  SQUARE_APPLICATION_ID     SET         Sandbox
→  SQUARE_ACCESS_TOKEN       SET         Sandbox
→  SQUARE_LOCATION_ID        SET         Sandbox
→  SQUARE_ENVIRONMENT        SET         sandbox
→  SENDGRID_API_KEY          SET (new)   New account ryan@legacy-loop.com
→  CRON_SECRET               SET         Vercel cron auth
→  SYSTEM_USER_ID            SET         cmmqpoljs0000pkwpl1uygvkz
→  DEMO_MODE                 true        Bypasses all gates
→  DATABASE_URL              SET         PostgreSQL
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 11 — PENDING SCHEMA MIGRATION
→
→DO ALL AT ONCE — Never piecemeal. Run after Monday walkthrough:
→
→  • User.role field — 'admin' | 'user' (activates shouldBypassGates automatically)
→  • soldPrice Int → Float (penny precision fix)
→  • soldVia String? on Item (platform item sold through)
→  • estimatedValue Float? on Item
→  • priceDelta Float? on Item (sold vs estimated difference)
→  • TradeProposal model (full trade workflow)
→  • AgentSettings model (AI agent preferences per user)
→  • Bundle model (replace EventLog workaround)
→  • BundleItem model (items in bundle)
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→OBJECTIVE — Onboarding Quiz Part B: Tone + Features + Guards
→
→This is Part B of a 3-part upgrade to the onboarding quiz.
→Part A: Theme + Visual (quiz/page.tsx) — COMPLETE
→Part B: Tone + Features + Guards (quiz/page.tsx) — THIS COMMAND
→Part C: Results Page Full Upgrade (results/page.tsx)
→
→This part ONLY touches quiz/page.tsx. DO NOT touch results/page.tsx.
→
→Problem: The quiz has overly formal question wording, no White Glove preview,
→no way to capture open-ended user notes, and routing logic doesn't guard against
→budget-blocked users accessing White Glove features. This part fixes all three.
→
→SURGICAL UNLOCK:
→  app/onboarding/quiz/page.tsx — UNLOCKED for tone upgrade, White Glove preview, optional notes field, routing guards
→
→Expected output: Quiz has warmer question language. After Q4, users see a White Glove
→preview (fullService/someHelp only). Optional 7th step ("Anything else?") collects notes.
→Budget guards prevent free/affordable users from being routed to White Glove.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→PART A — MANDATORY FULL READ
→
→DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.
→
→1. Read app/onboarding/quiz/page.tsx — FULL file (as modified by Part A)
→   Find: Lines 39-253 — QUIZ_QUESTIONS array (all 6 questions, wording for Part B)
→   Find: Lines 255-343 — scoring and recommendation logic (READ ONLY)
→   Find: Lines 347-431 — component state and handlers (state for Part B)
→   Find: Lines 433-710 — JSX rendering (questions shown here, Part A colors already applied)
→
→2. Read lib/pricing/constants.ts — READ ONLY
→   Find: Recommendation interface (fullService, someHelp, diy, learning)
→   Find: budgetBlocksWhiteGlove logic (free || affordable)
→   Use this to understand which users see White Glove preview
→
→3. Read app/white-glove/page.tsx — READ ONLY
→   Find: What White Glove preview should show (summary of premium service)
→   Find: Any styling patterns to match
→
→Print ALL findings with exact line numbers.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→PART B — WARMER QUESTION WORDING
→
→Replace these exact question texts in QUIZ_QUESTIONS array:
→
→  Q1 (currently): "What is your primary antique or collectible?"
→  Q1 (becomes):   "What's happening in your life right now?"
→
→  Q2 (currently): "How experienced are you with your item?"
→  Q2 (becomes):   "What's your experience level with collectibles?"
→             ADD SUBTITLE: "Takes 5 seconds to tell us"
→
→  Q3 (currently): "How would you describe your item's condition?"
→  Q3 (becomes):   (keep wording, ADD SUBTITLE) "Keep it simple, we'll dig in later"
→
→  Q4 (currently): "What would help you most?"
→  Q4 (becomes):   "How would you like us to help?"
→
→  Q5 (currently): "What's your estimated budget for this?"
→  Q5 (becomes):   "What level of investment feels right?"
→
→  Q6 (currently): stays same
→
→SUBTITLE PLACEMENT:
→  Q2 and Q3 already have subtitle support in the JSX.
→  Confirm subtitle field exists in QUIZ_QUESTIONS items and add text.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→PART C — WHITE GLOVE PREVIEW AFTER Q4
→
→Add a conditional preview card after Q4 submission (before Q5 appears):
→
→1. CONDITION: Show IF recommendedPath === 'fullService' || recommendedPath === 'someHelp'
→2. HIDE: If recommendedPath === 'diy' || recommendedPath === 'learning'
→
→3. TIMING: Render between Q4 submission and Q5 display
→   Use state: showWhiteGlovePreview (true after Q4 if condition met, false after user continues)
→
→4. STYLING:
→   Background: var(--accent-dim) (teal tint)
→   Border: 1px solid var(--accent-theme)
→   borderRadius: "1.5rem"
→   padding: "1.5rem"
→   marginBottom: "1.5rem"
→   Slide-down animation: same as question fade-in
→
→5. CONTENT (slide-down card):
→   Title: "White Glove Preview"
→   Subtitle: "Premium hands-on support for your collection"
→   Bullet: "Expert consultation on value and care"
→   Bullet: "Market research and insurance guidance"
→   Bullet: "Direct access to trusted buyers (if selling)"
→   Bullet: "Personalized recommendations for growth"
→   CTA: "Learn more" (link to /white-glove)
→
→6. BUTTON:
→   Text: "Continue to budget"
→   Styling: Secondary (ghost) button style
→   Action: Sets showWhiteGlovePreview = false, allows Q5 to display
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→PART D — OPTIONAL "ANYTHING ELSE?" 7TH STEP
→
→Add a 7th question (optional notes) after Q6 submission:
→
→1. CONDITION: Show after Q6 is answered (currentQuestion === 6)
→2. OPTIONAL: User can skip or continue with empty field
→
→3. QUESTION TEXT:
→   Title: "Anything else we should know?"
→   Subtitle: "Tell us anything that might help us serve you better (optional)"
→
→4. INPUT: Textarea
→   placeholder: "For example: items in several categories, planning to sell soon, interested in insurance..."
→   height: "120px"
→   maxLength: 500 characters
→   Styling: var(--bg-card-solid) background, var(--border-default) border
→
→5. BUTTONS:
→   Button 1: "Skip" (ghost style) → goes directly to results
→   Button 2: "Continue" (primary style) → captures userNotes, goes to results
→
→6. STATE: userNotes (string, max 500 chars, stored in component state)
→
→7. URL ENCODING: When navigating to results:
→   Add userNotes as URL param: ?userNotes=<encoded>
→   (Use encodeURIComponent)
→   Results page can read this param and store if needed
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→PART E — BUDGET GUARD ROUTING FIX
→
→Fix routing to White Glove to respect budget constraints:
→
→1. READ lib/pricing/constants.ts:
→   Find: budgetBlocksWhiteGlove definition
→   Confirm: budgetBlocksWhiteGlove = (tier === 'free' || tier === 'affordable')
→
→2. IN QUIZ ROUTING LOGIC:
→   BEFORE: whiteGlovePath check does not guard on budget
→   AFTER: whiteGlovePath check includes !budgetBlocksWhiteGlove
→
→3. ADD wantsHelp FLAG:
→   When user selects fullService or someHelp in Q4:
→   Add wantsHelp = true to URL params when routing to results
→   Example: /onboarding/results?wantsHelp=true&recommendation=fullService
→
→4. LOGIC:
→   IF recommendedPath === 'fullService' && !budgetBlocksWhiteGlove
→     → Route to /white-glove with wantsHelp=true
→   ELSE
→     → Route to /onboarding/results with recommendation params
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→DO NOT CHANGE IN THIS PART:
→  — Scoring logic (points unchanged)
→  — Question options and points (Q1-Q6 option text stays same, points same)
→  — results/page.tsx (Part C)
→  — Any locked files
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 12 — VERIFICATION CHECKLIST
→
→  1. CHECKPOINT baseline: pass
→  2. Part A full reads completed and printed: yes / no
→  3. Part A colors verified with grep -c 'var(--' app/onboarding/quiz/page.tsx: [count] ≥ 20
→  4. Part A colors verified with grep -c '#f0fdfa|#1c1917' app/onboarding/quiz/page.tsx: [count] = 0 or low
→
→  TONE:
→  5. Q1 wording changed to "What's happening in your life right now?": yes / no
→  6. Q2 wording + subtitle "Takes 5 seconds to tell us" added: yes / no
→  7. Q3 subtitle "Keep it simple, we'll dig in later" added: yes / no
→  8. Q4 wording changed to "How would you like us to help?": yes / no
→  9. Q5 wording changed to "What level of investment feels right?": yes / no
→  10. Q6 wording unchanged: yes / no
→
→  WHITE GLOVE PREVIEW:
→  11. Preview shown after Q4 for fullService/someHelp: yes / no
→  12. Preview hidden for diy/learning: yes / no
→  13. Preview has teal accent background (var(--accent-dim)): yes / no
→  14. Preview shows 4 bullet points + CTA link: yes / no
→  15. "Continue to budget" button works: yes / no
→  16. Preview animates with fade-in: yes / no
→
→  ANYTHING ELSE STEP:
→  17. Q7 "Anything else?" appears after Q6: yes / no
→  18. Textarea has 500 char limit: yes / no
→  19. "Skip" button routes to results: yes / no
→  20. "Continue" button captures userNotes and encodes in URL: yes / no
→  21. userNotes param appears in results URL: yes / no
→
→  ROUTING GUARDS:
→  22. White Glove path guarded by !budgetBlocksWhiteGlove: yes / no
→  23. wantsHelp flag passed as URL param: yes / no
→  24. Free/affordable users cannot reach White Glove: yes / no
→  25. fullService users with budget > affordable see White Glove: yes / no
→
→  SCORING:
→  26. Scoring logic UNCHANGED from Part A: yes / no
→  27. All option points remain same: yes / no
→  28. recommendedPath calculation unchanged: yes / no
→
→  UNCHANGED:
→  29. All theme/visual from Part A preserved: yes / no
→  30. results/page.tsx untouched: yes / no
→
→  N+1. All locked files untouched: yes / no
→  N+2. inline style{{}} throughout: yes / no
→  N+3. Always-dark panels use hardcoded colors: yes / no
→  N+4. Theme-aware surfaces use CSS variables: yes / no
→  N+5. npx tsc --noEmit: 0 errors
→  N+6. npm run build: pass
→  N+7. CHECKPOINT post-change: pass
→  N+8. Dev server: localhost:3000
→  N+9. Light mode tested: no broken contrast
→  N+10. Dark mode tested: all elements visible
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→SECTION 13 — REQUIRED REPORT FORMAT
→
→  CHECKPOINT before: [pass / issue]
→
→  Part A verify: [colors confirmed / issues]
→    - CSS variable count: [#]
→    - Hardcoded theme colors remaining: [count] (should be 0 or very low)
→
→  Part B — Tone: [fixed / issue]
→    - Q1-Q5 wording updated: [yes / no]
→    - Subtitles added (Q2, Q3): [yes / no]
→    - All 6 questions wording confirmed: [yes / no]
→
→  Part C — White Glove preview: [fixed / issue]
→    - Preview shown for fullService/someHelp: [yes / no]
→    - Preview hidden for diy/learning: [yes / no]
→    - Styling and animation applied: [yes / no]
→    - CTA link working: [yes / no]
→
→  Part D — Anything else step: [fixed / issue]
→    - Q7 textarea appears after Q6: [yes / no]
→    - Skip/Continue buttons functional: [yes / no]
→    - userNotes encoded in results URL: [yes / no]
→
→  Part E — Routing guards: [fixed / issue]
→    - White Glove path guarded by !budgetBlocksWhiteGlove: [yes / no]
→    - wantsHelp flag passed correctly: [yes / no]
→    - Budget blocks tested: [yes / no]
→
→  LIGHT MODE: [clean / issues]
→  DARK MODE: [clean / issues]
→  ALWAYS-DARK PANELS: [hardcoded colors used / issues]
→
→  EXISTING LOGIC UNTOUCHED:
→  — Scoring logic unchanged: [Confirm]
→  — Option points unchanged: [Confirm]
→  — results/page.tsx untouched: [Confirm]
→  — All locked files verified as untouched
→
→  FLAGS FROM CLAUDE CODE:
→  — [All gaps, risks, missed data collection, out-of-scope items]
→
→  Files modified: [list all — should be exactly 1: app/onboarding/quiz/page.tsx]
→  New files: [none]
→  Schema changes needed: [none]
→  Build: [pass / fail]
→  TypeScript: [0 errors / list errors]
→  CHECKPOINT after: [pass / issue]
→  Dev server: [localhost:3000]
→
→  IF POST-CHECKPOINT FAILS:
→  REVERT IMMEDIATELY.
→  Report exactly what broke and what was touched.
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→
→QUICK REFERENCE — CUSTOMEVENTS IN USE
→
→  Event Name                    Direction                  Purpose
→  conversation-selected         Messages → InboxCmd        Conversation clicked
→  conversation-counts-updated   Messages → InboxCmd        Update count badges
→  agent-fill-message            InboxCmd → Messages        AI fills reply box
→  agent-settings-toggle         InboxCmd → AgentSettings   Open settings panel
→  inbox-filter-change           InboxCmd → Messages        Sidebar category clicked
→  inbox-filter-reset            Messages → InboxCmd        Tab bar clicked — reset sidebar
→
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→Part B of 3 | Command Template v9 | LegacyLoop | Onboarding Quiz Upgrade
→Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
→━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
