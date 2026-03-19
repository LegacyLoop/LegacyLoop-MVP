LEGACYLOOP — COMMAND TEMPLATE v8
Amazon Enrichment — First Pull Only, Reruns Use Stored Data
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
lib/email/send.ts — LOCKED
lib/email/templates.ts — LOCKED

# ─── Pricing Constants (single source of truth) ───
lib/constants/pricing.ts — LOCKED (916+ lines, sections A-N)
lib/pricing/constants.ts — LOCKED
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
app/api/payments/checkout/route.ts — LOCKED
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
app/items/[id]/AnalyzeActions.tsx — LOCKED (just updated)
app/items/[id]/MegaBotPanel.tsx — LOCKED (just updated)
app/items/[id]/AmazonPriceBadge.tsx — LOCKED (just updated)

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

app/api/analyze/[itemId]/route.ts — UNLOCKED (change Amazon pre-fetch block: first run fetches fresh, re-runs read stored EventLog data)

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
  Amazon context injection into AI prompt (sellerContext append)
  amazonData passed to legacy pricing adapter
  Amazon metrics in ANALYZED EventLog

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

For this command: One surgical edit to the Amazon pre-fetch block.
First run → fresh API call → store. Re-run → read stored → skip API call.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

Amazon enrichment: Rainforest API is pay-per-call. After this fix, each item
gets exactly 1 API call on its first analysis. Re-runs and all downstream
bots read the stored data. Zero wasted API calls.

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

OBJECTIVE — Fix Amazon Enrichment: First Run Fetches Fresh, Re-Runs Use Stored Data

The analyze route currently calls searchAmazon() on EVERY run — first analysis
AND re-analysis. This burns an API call every time the user re-analyzes.

The correct behavior per Ryan's spec:
  - FIRST analysis (force is false, no existing aiResult) → fresh Amazon API call → store in EventLog
  - RE-analysis (force=1, aiResult already exists) → read stored RAINFOREST_RESULT from EventLog → skip API call
  - All downstream bots → read stored data through enrichment pipeline (already works)

One pull per item. Stored permanently. Read by everything.

What this command touches:
  app/api/analyze/[itemId]/route.ts — lines 104-123 (Amazon pre-fetch block only)

What this command does NOT touch:
  Lines 125-153 — Amazon context append to sellerContext (UNCHANGED)
  The AI analysis call (UNCHANGED)
  The legacy pricing adapter call with amazonData (UNCHANGED)
  The ANALYZED EventLog with amazon metrics (UNCHANGED)
  Everything else in the file (UNCHANGED)
  All other files (ALL LOCKED)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/api/analyze/[itemId]/route.ts — Lines 78-153 (force flag through Amazon block)
   Find: Line 78 — const force = new URL(req.url).searchParams.get("force") === "1"
   Find: Line 80 — if (!force && item.aiResult && item.valuation) — early return for cached
   Find: Lines 104-123 — current Amazon pre-fetch block (always calls searchAmazon)
   Find: Lines 125-153 — Amazon context append to sellerContext
   Confirm: force=true means re-run. force=false AND no aiResult means first run.
   Confirm: We can check for existing RAINFOREST_RESULT EventLog to decide fresh vs stored.

Print the exact current code at lines 104-123 before making changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — First Run Fresh, Re-Runs Read Stored

File: app/api/analyze/[itemId]/route.ts

Current code at lines 104-123:

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
      console.log(`[analyze] Amazon data fetched and stored: ${amazonData.resultCount} results, ${amazonData.priceRange.low}-${amazonData.priceRange.high}`);
      populateFromRainforest(item.id, amazonData as unknown as Record<string, unknown>).catch(() => null);
    } else {
      console.log("[analyze] No Amazon data found — proceeding without");
    }

Replace with:

  let amazonData: RainforestEnrichmentData | null = null;
  try {
    // Check if this item already has stored Amazon data from a previous analysis
    const existingAmazon = await prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "RAINFOREST_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (existingAmazon?.payload) {
      // Re-run or downstream: use stored data — no API call
      amazonData = JSON.parse(existingAmazon.payload) as RainforestEnrichmentData;
      console.log(`[analyze] Using stored Amazon data (${amazonData.resultCount} results, from ${new Date(existingAmazon.createdAt).toLocaleDateString()})`);
    } else {
      // First analysis: fresh Amazon pull
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
    }

What changed:
  - ADDED: prisma.eventLog.findFirst check for existing RAINFOREST_RESULT (no time limit — permanent)
  - ADDED: if stored data exists, parse and use it — zero API call
  - KEPT: if no stored data exists, fetch fresh from searchAmazon (first run)
  - KEPT: EventLog creation on fresh fetch
  - KEPT: populateFromRainforest fire-and-forget on fresh fetch
  - KEPT: all console logging

The logic:
  First analysis → no RAINFOREST_RESULT exists → fresh API call → store → feed AI
  Re-analysis → RAINFOREST_RESULT exists → read it → skip API → feed AI
  Other bots → read through enrichment pipeline (already works, no change)

What NOT to touch:
  Lines 125-153 — Amazon context append to sellerContext (UNCHANGED — still runs with either fresh or stored amazonData)
  Line 152 — amazonData passed to legacy pricing (UNCHANGED)
  Lines 349-351 — Amazon metrics in ANALYZED EventLog (UNCHANGED)
  Everything before line 104 and after line 153 — UNCHANGED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A read completed and printed: yes / no
3. prisma.eventLog.findFirst check for existing RAINFOREST_RESULT added: yes / no
4. If stored data exists: parsed and used WITHOUT calling searchAmazon: yes / no
5. If no stored data: searchAmazon called (first run): yes / no
6. EventLog creation on fresh fetch PRESERVED: yes / no
7. populateFromRainforest on fresh fetch PRESERVED: yes / no
8. Amazon context append to sellerContext (lines 125-153) UNCHANGED: yes / no
9. amazonData passed to legacy pricing UNCHANGED: yes / no
10. ANALYZED EventLog amazon metrics UNCHANGED: yes / no
11. Everything outside the Amazon pre-fetch block UNCHANGED: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — Amazon first-run-only fetch with stored reuse: [fixed / issue]
  - Stored data check added: [yes / no]
  - Re-run uses stored data (no API call): [yes / no]
  - First run fetches fresh: [yes / no]
  - EventLog stored on fresh fetch: [yes / no]
  - Context still appended to AI prompt: [yes / no]
  - amazonData still passed to legacy pricing: [yes / no]

EXISTING LOGIC UNTOUCHED:
  [List every locked file verified]

ANALYZE ROUTE — SURGICAL EDIT ONLY:
  [Verify only lines 104-123 changed — Amazon pre-fetch block]
  [Verify lines 125-153 unchanged — context append]
  [Verify all other code unchanged]

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
Command Template v8 | LegacyLoop | Amazon First-Pull-Only Fix
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
