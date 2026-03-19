LEGACYLOOP — COMMAND TEMPLATE v8
Amazon Enrichment Cache Fix — Fresh Pull Every Analysis
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
lib/megabot/run-specialized.ts — LOCKED (Gemini fix just landed)
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
lib/offers/notify.ts — LOCKED (just updated — now uses shared email templates)
lib/offers/cron.ts — LOCKED

# ─── Email System ───
lib/email/send.ts — LOCKED (just updated — env vars, per-email from override, structured logging)
lib/email/templates.ts — LOCKED (just created — shared emailWrapper, ctaButton, APP_URL)

# ─── Pricing Constants (single source of truth) ───
lib/constants/pricing.ts — LOCKED (916+ lines, sections A-N, includes custom credit scale)
lib/pricing/constants.ts — LOCKED (bridge file with legacy aliases)
lib/adapters/pricing.ts — LOCKED
lib/pricing/calculate.ts — LOCKED

# ─── API Routes — Analysis + Bots ───
app/api/megabot/[itemId]/route.ts — LOCKED
app/api/bots/* — ALL LOCKED

# ─── API Routes — Commerce ───
app/api/shipping/* — LOCKED
app/api/items/status/[itemId]/route.ts — LOCKED
app/api/offers/* — ALL LOCKED
app/api/cron/offers/route.ts — LOCKED
app/api/addons/* — READ ONLY
app/api/billing/* — ALL LOCKED
app/api/payments/checkout/route.ts — LOCKED (custom credits handler just added)
app/api/items/sold/route.ts — LOCKED

# ─── Core UI Components ───
app/components/AppNav.tsx — LOCKED
app/page.tsx — LOCKED
globals.css — LOCKED

# ─── Item Dashboard ───
app/items/[id]/ItemDashboardPanels.tsx — LOCKED
app/items/[id]/SoldPriceWidget.tsx — LOCKED
app/items/[id]/TradeToggle.tsx — LOCKED
app/items/[id]/TradeProposalsPanel.tsx — LOCKED
app/items/[id]/AnalyzeActions.tsx — LOCKED (just updated — Amazon POST removed, status added)
app/items/[id]/MegaBotPanel.tsx — LOCKED (just updated — redundant POST removed)
app/items/[id]/AmazonPriceBadge.tsx — LOCKED (just updated — retry polling added)

# ─── Subscription + Credits Pages ───
app/subscription/SubscriptionClient.tsx — LOCKED (5 bugs fixed + badge fix)
app/components/billing/CancelFlowModal.tsx — LOCKED
app/components/billing/UpgradeFlowModal.tsx — LOCKED (null safety + fresh subscribe)
app/credits/CreditsClient.tsx — LOCKED (custom credit purchase UI added)

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

app/api/analyze/[itemId]/route.ts — UNLOCKED (remove 24-hour cache check, always fetch fresh Amazon data on every analysis run)

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
  AnalyzeActions.tsx — client-side Amazon POST removed, status indicator added
  MegaBotPanel.tsx — redundant Amazon POST removed
  AmazonPriceBadge.tsx — auto-retry polling added

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this command: Each analysis run creates a new RAINFOREST_RESULT EventLog
entry with fresh data. Over time this builds a price history for each item
showing how Amazon pricing changes. This is valuable market intelligence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command: One surgical edit inside the Amazon pre-fetch block of
the analyze route. Remove cache check. Always fetch fresh. Store result.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

Amazon enrichment: Rainforest API is pay-per-call. Each AnalysisBot run
triggers exactly 1 Amazon search. The data is stored in EventLog so all
downstream bots can read it through the enrichment pipeline — but the
analyze route itself always fetches fresh. No stale cache. No shortcuts.

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

OBJECTIVE — Remove 24-Hour Cache Check from Amazon Pre-Fetch in Analyze Route

The analyze route currently checks for a cached RAINFOREST_RESULT EventLog
within 24 hours before fetching Amazon data. If a cache exists, it reuses
stale data instead of pulling fresh. This is wrong.

The correct behavior: Every time the AnalysisBot runs (first analysis OR
re-analysis), it fetches FRESH Amazon data. The data gets stored in EventLog
so all downstream bots can read it — but the analyze route never skips the
fetch. One pull per analysis run. Fresh every time.

What this command touches:
  app/api/analyze/[itemId]/route.ts — remove cache check (lines 107-117), always fetch fresh

What this command does NOT touch:
  Everything else in the analyze route — AI call, pricing, antique detection, etc.
  The enrichment/amazon API route still has its own 24h cache for direct calls — irrelevant now
  All other locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/api/analyze/[itemId]/route.ts — Lines 99-166 (the Amazon pre-fetch block)
   Find: Line 102 — let sellerContext = buildSellerContext(item)
   Find: Lines 107-112 — 24-hour cutoff and cache check query (THIS MUST GO)
   Find: Lines 114-116 — cache hit branch that reuses stale data (THIS MUST GO)
   Find: Lines 117-133 — else branch that does fresh fetch (THIS STAYS, but becomes the only path)
   Find: Lines 136-163 — Amazon context appended to sellerContext (UNCHANGED)
   Find: Line 164-166 — catch block (UNCHANGED)

Print the exact current code at lines 104-134 before making changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Remove Cache Check, Always Fetch Fresh

File: app/api/analyze/[itemId]/route.ts

Current code at lines 104-134:

  let amazonData: RainforestEnrichmentData | null = null;
  try {
    // Check for cached Amazon data first (24-hour window)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cachedAmazon = await prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "RAINFOREST_RESULT", createdAt: { gte: cutoff } },
      orderBy: { createdAt: "desc" },
    });

    if (cachedAmazon?.payload) {
      amazonData = JSON.parse(cachedAmazon.payload) as RainforestEnrichmentData;
      console.log(`[analyze] Amazon data from cache (${Math.round((Date.now() - cachedAmazon.createdAt.getTime()) / 3600000)}h old)`);
    } else {
      const searchTerm = buildSearchTerm(item.title || "item");
      amazonData = await searchAmazon(searchTerm).catch(() => null);

      if (amazonData) {
        await prisma.eventLog.create({
          data: {
            itemId: item.id,
            eventType: "RAINFOREST_RESULT",
            payload: JSON.stringify(amazonData),
          },
        });
        console.log(`[analyze] Amazon data fetched and stored: ${amazonData.resultCount} results, ${amazonData.priceRange.low}-${amazonData.priceRange.high}`);
        populateFromRainforest(item.id, amazonData as unknown as Record<string, unknown>).catch(() => null);
      } else {
        console.log("[analyze] No Amazon data found — proceeding without");
      }
    }

Replace with:

  let amazonData: RainforestEnrichmentData | null = null;
  try {
    // Fresh Amazon fetch on every analysis run — no cache, no shortcuts
    const searchTerm = buildSearchTerm(item.title || "item");
    amazonData = await searchAmazon(searchTerm).catch(() => null);

    if (amazonData) {
      await prisma.eventLog.create({
        data: {
          itemId: item.id,
          eventType: "RAINFOREST_RESULT",
          payload: JSON.stringify(amazonData),
        },
      });
      console.log(`[analyze] Amazon data fetched and stored: ${amazonData.resultCount} results, $${amazonData.priceRange.low}-$${amazonData.priceRange.high}`);
      populateFromRainforest(item.id, amazonData as unknown as Record<string, unknown>).catch(() => null);
    } else {
      console.log("[analyze] No Amazon data found — proceeding without");
    }

What changed:
  - REMOVED: 24-hour cutoff calculation (line 108)
  - REMOVED: prisma.eventLog.findFirst cache check query (lines 109-112)
  - REMOVED: if (cachedAmazon?.payload) branch (lines 114-116)
  - REMOVED: else wrapper around the fresh fetch (line 117)
  - KEPT: buildSearchTerm + searchAmazon call (always runs now)
  - KEPT: EventLog creation on successful fetch
  - KEPT: populateFromRainforest fire-and-forget
  - KEPT: console logging

What NOT to touch:
  - Lines 136-163 — Amazon context appended to sellerContext (UNCHANGED)
  - Lines 164-166 — catch block (UNCHANGED)
  - Everything before line 104 — UNCHANGED
  - Everything after line 166 — UNCHANGED
  - AI call, pricing, antique detection, vehicle blur — ALL UNCHANGED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A read completed and printed: yes / no
3. 24-hour cutoff variable REMOVED: yes / no
4. prisma.eventLog.findFirst cache query REMOVED: yes / no
5. if (cachedAmazon?.payload) branch REMOVED: yes / no
6. searchAmazon always called (no conditional): yes / no
7. EventLog creation on success PRESERVED: yes / no
8. populateFromRainforest PRESERVED: yes / no
9. Amazon context block (lines 136-163) UNCHANGED: yes / no
10. AI analysis call UNCHANGED: yes / no
11. Legacy pricing call with amazonData UNCHANGED: yes / no
12. ANALYZED EventLog with amazon metrics UNCHANGED: yes / no
13. Everything outside the Amazon pre-fetch block UNCHANGED: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — 24-hour cache check removed, fresh fetch every run: [fixed / issue]
  - Cache check code removed: [yes / no]
  - searchAmazon always called: [yes / no]
  - EventLog still created on success: [yes / no]
  - Context still appended to AI prompt: [yes / no]

EXISTING LOGIC UNTOUCHED:
  [List every locked file verified]

ANALYZE ROUTE — REMOVAL ONLY:
  [Verify only the cache check block was removed — no other code changed]

FLAGS FROM CLAUDE CODE:
  [All gaps, risks, missed opportunities]

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
Command Template v8 | LegacyLoop | Amazon Cache Fix — Fresh Pull Every Analysis
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
