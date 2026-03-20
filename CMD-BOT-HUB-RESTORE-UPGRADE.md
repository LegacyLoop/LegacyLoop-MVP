LEGACYLOOP — COMMAND TEMPLATE v9
Bot Hub — CollectiblesBot Restore + ReconBot Add + Coming Soon Bots + Visual Polish
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
  echo '--- Bot pages check ---'
  ls app/bots/*/page.tsx | wc -l
  ls app/bots/collectiblesbot/page.tsx 2>/dev/null && echo 'CollectiblesBot page EXISTS' || echo 'CollectiblesBot page MISSING'
  ls app/bots/reconbot/page.tsx 2>/dev/null && echo 'ReconBot page EXISTS' || echo 'ReconBot page MISSING'
  echo '--- Current BOTS array ---'
  grep -c "id:" app/bots/page.tsx
  echo '=== CHECKPOINT COMPLETE ==='

Expected:
  Bot pages: 11 (analyzebot, antiquebot, buyerbot, carbot, collectiblesbot, listbot, megabot, photobot, reconbot, shipbot, stylebot)
  CollectiblesBot page: EXISTS
  ReconBot page: EXISTS
  Current BOTS array entries: 9 (missing collectiblesbot and reconbot)

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

— Item + Dashboard —
✓ app/items/** — ALL LOCKED
✓ app/dashboard/** — ALL LOCKED

— Bot Sub-Pages — ALL LOCKED (individual bot dashboards) —
✓ app/bots/analyzebot/** — LOCKED
✓ app/bots/antiquebot/** — LOCKED
✓ app/bots/buyerbot/** — LOCKED
✓ app/bots/carbot/** — LOCKED
✓ app/bots/collectiblesbot/** — LOCKED
✓ app/bots/listbot/** — LOCKED
✓ app/bots/megabot/** — LOCKED
✓ app/bots/photobot/** — LOCKED
✓ app/bots/reconbot/** — LOCKED
✓ app/bots/shipbot/** — LOCKED
✓ app/bots/stylebot/** — LOCKED

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
✓ app/messages/** — ALL LOCKED
✓ app/components/messaging/** — ALL LOCKED

— Add-On Tools — ALL LOCKED —
✓ app/addons/** — ALL LOCKED

— Onboarding (just locked today) —
✓ app/onboarding/quiz/page.tsx — LOCKED
✓ app/onboarding/results/page.tsx — LOCKED

— Infrastructure —
✓ vercel.json
✓ prisma/schema.prisma — READ ONLY

SURGICAL UNLOCK — This file is explicitly unlocked for THIS COMMAND ONLY:

  app/bots/page.tsx — UNLOCKED (restore missing bots, add Coming Soon bots, visual polish)

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
  • Custom credit purchase with sliding scale
  • Subscription page
  • Email system
  • Gemini MegaBot reliability

Pass 4 Locked (March 18, 2026):
  • Amazon enrichment, Upload system, Edit Item Form
  • Item Control Center V1+V2, Light Mode, Message Center

Pass 5 Locked (March 19, 2026):
  • Quiz theme support — 60 hardcoded colors eliminated
  • Quiz warmer tone, White Glove preview, "Anything else?" step
  • Budget guard + wantsHelp flag
  • Results personalization, Neighborhood Bundle, WG pricing, credit add-ons
  • Quiz auto-trigger for new users, localStorage persistence, retake in settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  — Does this collect signal we learn from?
  — Does it make the next AI prediction better?
  — Does it create data nobody else has?
  — Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this command: No new data collection. UI fix + visual polish only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Always follow this sequence. Never skip steps. Close the loop every time.

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this command: UI fix only. Restore missing bots to the grid,
add Coming Soon placeholders, and visual polish.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

DEMO_MODE=true — admin accounts bypass all gates and credit deductions.
Both test accounts are Tier 4 Estate Manager with full access.

COMPLETE BOT ROSTER (what LegacyLoop has built):

  LIVE BOTS (have full pages at /bots/{id}):
    1. MegaBot — 4-engine consensus power-up (OpenAI + Claude + Gemini + Grok)
    2. AnalyzeBot — comprehensive item identification + analysis
    3. PriceBot — deep pricing intelligence + market analysis
    4. ListBot — listing optimization for 13 platforms
    5. BuyerBot — aggressive buyer search across networks
    6. ShipBot — shipping intelligence + carrier comparison + LTL
    7. PhotoBot — visual presentation + photo quality scoring
    8. CarBot — vehicle-specific analysis + VIN + pricing
    9. AntiqueBot — antique authentication + provenance + auction
   10. CollectiblesBot — collectible detection + scoring + market (MISSING FROM GRID)
   11. ReconBot — real-time market intelligence + competitor tracking (MISSING FROM GRID)

  COMING SOON BOTS (planned, no pages yet):
   12. StoryBot — legacy storytelling (text, audio, video generation)
   13. InsuranceBot — valuation for insurance documentation
   14. DonationBot — donation routing + tax receipt generation

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
  — Improve the bot card layout, spacing, and visual hierarchy
  — Add section dividers between bot categories (Power-Up, Specialists, Intelligence, Coming Soon)
  — Improve the stats bar design

  You MAY NOT:
  — Touch any locked files (especially individual bot pages)
  — Change any bot AI or prompt logic
  — Change any bot output format
  — Deviate from inline style={{}}
  — Add unapproved npm packages
  — Add routes beyond scope
  — Change schema without explicit approval
  — Change business or pricing logic
  — Use Tailwind or external CSS
  — Use className for styling (except existing className usages like "section-title", "h1", "muted", "bot-hub-card")

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

  • User.role field — 'admin' | 'user'
  • soldPrice Int → Float
  • soldVia String? on Item
  • estimatedValue Float? on Item
  • priceDelta Float? on Item
  • TradeProposal model
  • AgentSettings model
  • Bundle model
  • BundleItem model
  • quizCompletedAt DateTime? on User

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Bot Hub: Restore CollectiblesBot + ReconBot + Coming Soon + Visual Polish

Problem: The Bot Hub page (app/bots/page.tsx) is missing 2 live bots from its
BOTS array. CollectiblesBot and ReconBot both have full working pages at
/bots/collectiblesbot and /bots/reconbot, but they are not listed on the
Bot Hub grid. This creates a visible gap in the layout. The header also says
"8 specialist bots" which is inaccurate. Additionally, planned future bots
should appear as "Coming Soon" to show product depth for the investor demo.

SURGICAL UNLOCK:
  app/bots/page.tsx — UNLOCKED

Expected output:
  - All 11 live bots visible in the grid with working links
  - 3 "Coming Soon" bots shown (greyed out, no link)
  - Header copy updated to accurate bot count
  - Stats bar updated
  - Visual polish pass — section dividers, premium feel
  - Light + dark mode clean

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/bots/page.tsx — FULL file (250 lines)
   Find: Lines 9-95 — BOTS array (currently 9 entries — missing collectiblesbot, reconbot)
   Find: Lines 97-107 — data queries (analyzedCount, totalItems)
   Find: Lines 109-250 — JSX rendering (header, stats bar, grid)

2. Read app/bots/collectiblesbot/page.tsx — first 30 lines — READ ONLY
   Confirm: Page exists and route is /bots/collectiblesbot

3. Read app/bots/reconbot/page.tsx — first 30 lines — READ ONLY
   Confirm: Page exists and route is /bots/reconbot

4. Read app/globals.css — READ ONLY (lines 1-160)
   Verify: CSS variable names for any color fixes needed

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ADD MISSING BOTS TO BOTS ARRAY

Add CollectiblesBot and ReconBot to the BOTS array. Insert them in
logical positions within the existing bot order.

ADD CollectiblesBot (insert AFTER AntiqueBot — they are related specialists):

  {
    id: "collectiblesbot",
    name: "CollectiblesBot",
    icon: "🏆",
    desc: "Collectible specialist — detection, scoring, market value, and collector community connections",
    detail: "Identifies collectibles across 20+ categories, scores rarity and condition, estimates collector market value, and connects to buyer communities.",
    color: "#8b5cf6",
    route: "/bots/collectiblesbot",
    badge: "Auto-Detects Collectibles",
  },

ADD ReconBot (insert AFTER CollectiblesBot — it's market intelligence):

  {
    id: "reconbot",
    name: "ReconBot",
    icon: "🔍",
    desc: "Market intelligence — real-time competitor tracking, price alerts, and market shift detection",
    detail: "Scans competing listings across platforms, tracks price movements, detects market shifts, and sends alerts when action is needed.",
    color: "#06b6d4",
    route: "/bots/reconbot",
    badge: "Real-Time Intel",
  },

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ADD COMING SOON BOTS

Add a new array COMING_SOON_BOTS after the BOTS array:

  const COMING_SOON_BOTS = [
    {
      id: "storybot",
      name: "StoryBot",
      icon: "📖",
      desc: "Legacy storytelling — generate text, audio, and video stories about your items and family history",
      detail: "AI-generated item stories, family narratives, audio recordings, and video montages. Preserve memories alongside sales.",
      color: "#a855f7",
    },
    {
      id: "insurancebot",
      name: "InsuranceBot",
      icon: "🛡️",
      desc: "Insurance valuations — certified appraisal reports for insurance documentation and claims",
      detail: "Generate insurance-grade valuation reports with replacement cost estimates, condition documentation, and photo evidence packages.",
      color: "#14b8a6",
    },
    {
      id: "donationbot",
      name: "DonationBot",
      icon: "💝",
      desc: "Donation routing — find charities, schedule pickups, and generate tax receipts automatically",
      detail: "Match unsold items with local charities, coordinate pickup schedules, estimate fair market value for tax deductions, and generate IRS-ready donation receipts.",
      color: "#f43f5e",
    },
  ];

These bots render in the grid with a "Coming Soon" badge and NO link.
They are NOT clickable. They use a <div> instead of <Link>.
They have reduced opacity (0.7) and a muted "Coming Soon" badge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — UPDATE HEADER AND STATS

1. Update the header description from:
     "8 specialist bots + MegaBot power-up work together..."
   To:
     "10 specialist bots + MegaBot power-up + 3 coming soon — your complete AI selling team."
     (Adjust copy to sound premium and accurate.)

2. Update the stats bar "Active Modules" count from hardcoded 8:
     Current: { label: "Active Modules", value: analyzedCount > 0 ? 8 : 0 }
     Change to: { label: "Active Bots", value: analyzedCount > 0 ? BOTS.length : 0 }
   This way the count automatically updates as bots are added.

3. Consider adding a 4th stat: "Coming Soon" showing COMING_SOON_BOTS.length
   This shows product depth for investors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — VISUAL POLISH

Raise the bar on the entire Bot Hub page:

1. SECTION DIVIDERS:
   Consider grouping bots into visual categories with subtle section headers:
     "🤖 Power-Up" — MegaBot (standalone at top, hero card treatment)
     "🧠 Specialist Bots" — AnalyzeBot, PriceBot, ListBot, BuyerBot, ShipBot, PhotoBot
     "🔬 Detection + Intelligence" — CarBot, AntiqueBot, CollectiblesBot, ReconBot
     "🚀 Coming Soon" — StoryBot, InsuranceBot, DonationBot

   Section headers: small, uppercase, var(--text-muted), letter-spacing 0.08em.
   This is OPTIONAL — only do it if it improves the visual hierarchy without
   making the page feel cluttered. Use creative judgment.

2. MEGABOT HERO CARD:
   MegaBot is the "Power-Up" — it should feel special.
   Consider giving it a wider card (span full width or 2 columns),
   a subtle gradient border, or a slightly different background treatment.
   It already has badge: "Power-Up" — make that badge feel premium.

3. COMING SOON CARDS:
   Visual treatment for Coming Soon bots:
     - Reduced opacity (0.6-0.7)
     - No hover effect (not clickable)
     - "Coming Soon" badge in muted style
     - No "View Dashboard" link at bottom
     - Render as <div> not <Link>
     - cursor: "default" not "pointer"

4. CARD HOVER:
   Existing hover CSS uses .bot-hub-card:hover with !important.
   This is fine — keep it. But ensure Coming Soon cards do NOT
   get the hover effect. Use a different className or no className.

5. COLOR REVIEW:
   The current file already uses var(--bg-card), var(--border-card),
   var(--text-primary), var(--text-secondary), var(--text-muted).
   Good — these should stay. Verify no hardcoded colors crept in.
   Check: bot.color is used for accent per-bot (icon bg, badge, link) —
   this is correct and should stay as unique per-bot brand colors.

6. RESPONSIVE:
   Current grid: repeat(auto-fill, minmax(420px, 1fr))
   This works but might be tight on smaller screens.
   Consider: repeat(auto-fill, minmax(360px, 1fr)) for better mobile.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE IN THIS COMMAND:
  — Any individual bot page (app/bots/*/page.tsx or *Client.tsx)
  — Any bot AI logic or prompts
  — Any API routes
  — Any locked files
  — The Prisma queries in the page (analyzedCount, totalItems)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  BOTS RESTORED:
  3. CollectiblesBot in BOTS array: yes / no
  4. CollectiblesBot links to /bots/collectiblesbot: yes / no
  5. CollectiblesBot badge says "Auto-Detects Collectibles": yes / no
  6. ReconBot in BOTS array: yes / no
  7. ReconBot links to /bots/reconbot: yes / no
  8. ReconBot badge says "Real-Time Intel": yes / no
  9. Total BOTS array count: 11 (was 9): yes / no

  COMING SOON:
  10. StoryBot renders with "Coming Soon" badge: yes / no
  11. InsuranceBot renders with "Coming Soon" badge: yes / no
  12. DonationBot renders with "Coming Soon" badge: yes / no
  13. Coming Soon cards are NOT clickable (no Link): yes / no
  14. Coming Soon cards have reduced opacity: yes / no
  15. Coming Soon cards have no "View Dashboard" link: yes / no

  HEADER + STATS:
  16. Header copy updated to accurate bot count: yes / no
  17. Stats bar "Active Bots" uses BOTS.length (not hardcoded 8): yes / no

  VISUAL:
  18. MegaBot has premium treatment: yes / no
  19. Grid gap visible between all bots (no layout holes): yes / no
  20. All 14 bot cards render cleanly: yes / no
  21. No hardcoded theme colors on theme-aware surfaces: yes / no

  N+1. All locked files untouched: yes / no
  N+2. Individual bot pages untouched: yes / no
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

  Part B — Missing bots restored: [fixed / issue]
    - CollectiblesBot added: [yes / no]
    - ReconBot added: [yes / no]
    - Both link to correct routes: [yes / no]
    - BOTS array count: [11]

  Part C — Coming Soon bots: [fixed / issue]
    - 3 Coming Soon bots render: [yes / no]
    - Not clickable: [yes / no]
    - Reduced opacity: [yes / no]

  Part D — Header + stats: [fixed / issue]
    - Header copy accurate: [yes / no]
    - Stats dynamic: [yes / no]

  Part E — Visual polish: [fixed / issue]
    - MegaBot hero treatment: [yes / no]
    - Section grouping (if applied): [yes / no / skipped]
    - Grid responsive: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — All individual bot pages untouched: [Confirm]
  — Prisma queries unchanged: [Confirm]
  — All locked files verified as untouched

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, missed data collection, out-of-scope items]

  Files modified: [list all — should be exactly 1: app/bots/page.tsx]
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
Command Template v9 | LegacyLoop | Bot Hub Restore + Upgrade
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
