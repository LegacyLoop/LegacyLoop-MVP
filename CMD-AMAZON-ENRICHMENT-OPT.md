LEGACYLOOP — COMMAND TEMPLATE v8
Amazon Enrichment Workflow Optimization + Analysis Integration
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

app/api/analyze/[itemId]/route.ts — UNLOCKED (add Amazon pre-fetch before AI analysis, pass amazonData to legacy pricing adapter)
app/items/[id]/AnalyzeActions.tsx — UNLOCKED (remove client-side Amazon POST, add completion status indicator)
app/items/[id]/MegaBotPanel.tsx — UNLOCKED (remove redundant Amazon POST on line 100-101)
app/items/[id]/AmazonPriceBadge.tsx — UNLOCKED (add auto-retry polling for badge appearance)

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this command specifically:
Log Amazon enrichment metrics to the ANALYZED EventLog entry:
  amazonEnriched (boolean), amazonResultCount (number), amazonPriceRange (object).
This gives us data on how often Amazon market data is available per item
category — nobody else has this mapped to AI resale analysis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command the sequence is:
Amazon Cache Check -> Amazon API (if needed) -> EventLog Store -> AI Analysis (with Amazon context) -> Legacy Pricing (with amazonData) -> UI Status Update -> Badge Refresh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

Amazon enrichment context: Rainforest API (pay-per-call). Data is cached
24 hours in EventLog to minimize API usage. The analyze route now does
the fetch so it happens once — at analysis time — and all downstream
bots inherit the data through the enrichment pipeline automatically.

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

OBJECTIVE — Optimize Amazon Enrichment + Feed AI Analysis with Amazon Data

The AnalysisBot is the first bot in the chain after a customer uploads
their first item photo. It feeds ALL downstream systems: shipping center
(dimensions/weight), pricing pipeline (value estimates), antique detection,
listing suggestions, and every specialist bot. It must be as data-rich as
possible on the very first run.

Currently Amazon enrichment fires AFTER analysis completes. This means the
first AI scan runs WITHOUT Amazon market context. We are wiring Amazon data
INTO the analyze route so the AI has real product data (titles, prices,
ratings, reviews) when it runs. This also passes Amazon data to the legacy
pricing adapter via the amazonData field that already exists but was never
populated.

What this command touches:
  app/api/analyze/[itemId]/route.ts — add Amazon pre-fetch + pass to pricing
  app/items/[id]/AnalyzeActions.tsx — remove client-side POST, add status
  app/items/[id]/MegaBotPanel.tsx — remove redundant Amazon POST
  app/items/[id]/AmazonPriceBadge.tsx — add auto-retry polling

What this command does NOT touch:
  lib/adapters/ai.ts — LOCKED (analyze() signature and prompt unchanged)
  lib/adapters/rainforest.ts — LOCKED (we call it, never modify it)
  lib/adapters/pricing.ts — LOCKED (applyAmazonAnchor already exists, just never had data)
  lib/pricing/calculate.ts — LOCKED (new pricing pipeline unchanged)
  lib/enrichment/item-context.ts — LOCKED (already reads RAINFOREST_RESULT for all bots)
  No bot logic. No schema changes. No pricing formula changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/api/analyze/[itemId]/route.ts — FULL file (363 lines)
   Find: Line 4 — import { pricingAdapter }
   Find: Line 100 — sellerContext = buildSellerContext(item)
   Find: Line 105 — analysis = await aiAdapter.analyze(photoPaths, sellerContext || undefined)
   Find: Lines 143-152 — pricingAdapter.getEstimate call — NO amazonData passed
   Find: Lines 125-134 — calculatePricing call
   Find: Lines 334-354 — ANALYZED EventLog creation
   Confirm: sellerContext is a string injected into the AI prompt at ai.ts line 208

2. Read lib/adapters/ai.ts — READ ONLY (LOCKED — do NOT modify)
   Find: Line 136 — analyze(photoPaths: string[], context?: string)
   Find: Lines 207-209 — context string injected as SELLER-PROVIDED DATA
   Confirm: We add Amazon data to the context string WITHOUT touching ai.ts

3. Read lib/adapters/rainforest.ts — READ ONLY (LOCKED — do NOT modify)
   Find: Lines 25-37 — RainforestEnrichmentData type
   Find: Lines 11-23 — RainforestSearchResult type (title, price, rating, ratingsTotal)
   Find: Lines 43-55 — buildSearchTerm() function
   Find: Lines 68-168 — searchAmazon() function

4. Read lib/adapters/pricing.ts — READ ONLY (LOCKED — do NOT modify)
   Find: Line 19 — amazonData?: RainforestEnrichmentData | null (already in PricingInput)
   Find: Line 186 — applyAmazonAnchor() function (already built, never called with data)
   Confirm: We just need to pass amazonData to getEstimate — the function already handles it

5. Read app/api/enrichment/amazon/[itemId]/route.ts — READ ONLY
   Find: Line 8 — CACHE_HOURS = 24
   Find: Lines 60-75 — 24-hour cache check in POST handler
   Find: Lines 99-105 — EventLog RAINFOREST_RESULT creation
   Find: Line 110 — populateFromRainforest fire-and-forget

6. Read app/items/[id]/AnalyzeActions.tsx — FULL file (145 lines)
   Find: Line 36 — fire-and-forget Amazon POST after analyze

7. Read app/items/[id]/MegaBotPanel.tsx — Lines 90-110
   Find: Lines 100-101 — redundant Amazon POST after MegaBot

8. Read app/items/[id]/AmazonPriceBadge.tsx — FULL file (81 lines)
   Find: Lines 15-22 — single GET on mount, no retry

9. Read lib/enrichment/item-context.ts — READ ONLY (LOCKED — do NOT modify)
   Verify: Line 105 — RAINFOREST_RESULT in EventLog query
   Verify: Line 161 — amazonFindings populated from RAINFOREST_RESULT
   Verify: Lines 506-507 — Amazon Market Data in context block
   Confirm: All bots already see Amazon data through enrichment once the
   EventLog entry exists. No changes needed here.

Print ALL findings with exact line numbers before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Wire Amazon Pre-Fetch INTO the Analyze Route

File: app/api/analyze/[itemId]/route.ts
Why: The AnalysisBot is the first bot in the chain. Giving it Amazon market
  data on the first run makes pricing smarter, identification more accurate,
  and feeds all downstream bots through the enrichment pipeline.

STEP 1 — Add imports.

After line 8 (import { populateFromAnalysis }), add these 3 lines:

  import { searchAmazon, buildSearchTerm } from "@/lib/adapters/rainforest";
  import type { RainforestEnrichmentData } from "@/lib/adapters/rainforest";
  import { populateFromRainforest } from "@/lib/data/populate-intelligence";

STEP 2 — Add Amazon pre-fetch between sellerContext build and AI analyze call.

Current code at lines 100-105:

  const sellerContext = buildSellerContext(item);
  let analysis;
  try {
    analysis = await aiAdapter.analyze(photoPaths, sellerContext || undefined);

Replace with:

  let sellerContext = buildSellerContext(item);

  // ── Pre-fetch Amazon market data (feeds AI analysis + all downstream bots) ──
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
        console.log(`[analyze] Amazon data fetched and stored: ${amazonData.resultCount} results, $${amazonData.priceRange.low}-$${amazonData.priceRange.high}`);
        populateFromRainforest(item.id, amazonData as unknown as Record<string, unknown>).catch(() => null);
      } else {
        console.log("[analyze] No Amazon data found — proceeding without");
      }
    }

    // Append Amazon context to seller data block for the AI prompt
    if (amazonData && amazonData.resultCount > 0) {
      const amazonLines: string[] = [
        "",
        "AMAZON MARKET CONTEXT (real-time product data — use for pricing accuracy):",
        `- Amazon search term: "${amazonData.searchTerm}"`,
        `- ${amazonData.resultCount} matching Amazon listings found`,
        `- Amazon price range: $${amazonData.priceRange.low} – $${amazonData.priceRange.high} (avg: $${amazonData.priceRange.avg}, median: $${amazonData.priceRange.median})`,
      ];
      const topProducts = amazonData.results.slice(0, 3);
      if (topProducts.length > 0) {
        amazonLines.push("- Top Amazon matches:");
        topProducts.forEach((p, i) => {
          const parts = [`  ${i + 1}. "${p.title}"`];
          if (p.price) parts.push(`$${p.price}`);
          if (p.rating) parts.push(`${p.rating}★`);
          if (p.ratingsTotal) parts.push(`(${p.ratingsTotal} reviews)`);
          if (p.condition !== "New") parts.push(`[${p.condition}]`);
          amazonLines.push(parts.join(" — "));
        });
      }
      amazonLines.push(
        "- NOTE: These are NEW retail prices on Amazon. The item being analyzed is USED/SECONDHAND.",
        "  Adjust pricing accordingly — used items typically sell for 30-70% of Amazon retail",
        "  depending on condition, age, and demand. Use Amazon prices as a CEILING, not as the estimate."
      );
      sellerContext = (sellerContext || "") + "\n" + amazonLines.join("\n");
    }
  } catch (amazonErr: any) {
    console.error("[analyze] Amazon pre-fetch failed (non-fatal):", amazonErr?.message);
  }

  // 1) Vision analysis
  let analysis;
  try {
    analysis = await aiAdapter.analyze(photoPaths, sellerContext || undefined);

STEP 3 — Pass amazonData to the legacy pricing adapter.

Current code at lines 142-152:

  let estimate: any = { low: 0, high: 0, comps: [], source: "none", sources: {} };
  try {
    estimate = await pricingAdapter.getEstimate({
      ai: analysis,
      condition: item.condition,
      notes: item.description,
      purchasePrice: item.purchasePrice,
      purchaseDate: item.purchaseDate,
      saleMethod: item.saleMethod,
      saleZip: item.saleZip,
      saleRadiusMi: item.saleRadiusMi,
    });

Add ONE line inside the object — after saleRadiusMi:

      amazonData: amazonData ?? undefined,

STEP 4 — Add Amazon metrics to the ANALYZED EventLog.

In the EventLog payload object (around lines 339-349), add after the
adjustments line:

          amazonEnriched: !!amazonData,
          amazonResultCount: amazonData?.resultCount ?? 0,
          amazonPriceRange: amazonData?.priceRange ?? null,

WHAT NOT TO TOUCH:
  buildSellerContext() — UNCHANGED
  extractTag() — UNCHANGED
  Credit/tier gate (lines 82-95) — UNCHANGED
  aiAdapter.analyze() call — UNCHANGED (same function, richer context string)
  calculatePricing() call (lines 125-134) — UNCHANGED
  Valuation upsert — UNCHANGED
  AntiqueCheck detection and save — UNCHANGED
  Item status update — UNCHANGED
  Vehicle detection and plate blur — UNCHANGED
  PriceSnapshot creation — UNCHANGED
  Market comp save — UNCHANGED
  logUserEvent call — UNCHANGED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Simplify AnalyzeActions (Server-Side Enrichment)

File: app/items/[id]/AnalyzeActions.tsx
Why: The analyze route now handles Amazon enrichment directly. The
  client-side fire-and-forget POST on line 36 is no longer needed.

Current line 35-36:

      // Auto-trigger Amazon enrichment — fire and forget, silent
      fetch(`/api/enrichment/amazon/${itemId}`, { method: "POST", headers: { "Content-Type": "application/json" } }).catch(() => null);

Replace those 2 lines with:

      // Amazon enrichment is now handled inside the analyze route —
      // no client-side fire-and-forget POST needed

Also add a state variable after line 16 (const [error, setError]):

  const [analysisDone, setAnalysisDone] = useState(false);

In handleAnalyze(), add before refreshKeepScroll() (line 34):

      setAnalysisDone(true);

Reset it at the start of handleAnalyze() after setError(null):

    setAnalysisDone(false);

Add a status indicator after the buttons div closing tag (after the </div> on line 109), before the disabled hint:

      {analysisDone && !analyzing && (
        <p style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: "rgba(0,188,212,0.8)",
          marginTop: "0.5rem",
          margin: "0.5rem 0 0 0",
        }}>
          ✓ Analysis complete — Amazon market data included
        </p>
      )}

All button styles, disabled states, error handling PRESERVED exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — Remove Redundant Amazon POST from MegaBotPanel

File: app/items/[id]/MegaBotPanel.tsx
Why: The analyze route already fetched and stored Amazon data. MegaBot
  runs AFTER analysis, so this POST is a wasted DB round-trip.

Current lines 100-101:

      // Auto-trigger Amazon enrichment — fire and forget, silent
      fetch(`/api/enrichment/amazon/${itemId}`, { method: "POST", headers: { "Content-Type": "application/json" } }).catch(() => null);

Replace with:

      // Amazon enrichment is handled by the analyze route — data already cached

Do NOT touch: MegaBot fetch (line 93), result state, provider status,
scanning animation, error handling, delta calculation, or any other logic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — Add Auto-Retry Polling to AmazonPriceBadge

File: app/items/[id]/AmazonPriceBadge.tsx
Why: The badge does a single GET on mount. If data was just stored by the
  analyze route, the badge may not show until page reload. Add retry polling.

Add import at line 3 (after useState, useEffect):

  import { useState, useEffect, useRef } from "react";

Add constants after the AmazonData type (after line 10):

  const MAX_RETRIES = 3;
  const RETRY_INTERVAL_MS = 5000;

Replace the useEffect block (lines 15-22) with:

  const retriesRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(`/api/enrichment/amazon/${itemId}`);
        const d = await res.json();
        if (!cancelled && d.success && d.data) {
          setData(d.data);
          if (timerRef.current) clearTimeout(timerRef.current);
          return;
        }
      } catch {
        // Non-critical — fail silently
      }
      if (!cancelled && retriesRef.current < MAX_RETRIES) {
        retriesRef.current += 1;
        timerRef.current = setTimeout(fetchData, RETRY_INTERVAL_MS);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [itemId]);

All badge styling below the useEffect PRESERVED exactly — zero visual changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A full reads completed and printed: yes / no
3. analyze route imports searchAmazon, buildSearchTerm, populateFromRainforest: yes / no
4. analyze route checks 24-hour Amazon cache before API call: yes / no
5. analyze route calls searchAmazon if no cache: yes / no
6. analyze route stores RAINFOREST_RESULT EventLog: yes / no
7. analyze route calls populateFromRainforest fire-and-forget: yes / no
8. analyze route appends Amazon context to sellerContext string: yes / no
9. Amazon context includes price range, top products, used-vs-new warning: yes / no
10. Amazon fetch failure does NOT block analysis (try/catch, non-fatal): yes / no
11. Legacy pricing adapter receives amazonData param: yes / no
12. ANALYZED EventLog includes amazonEnriched and amazonResultCount: yes / no
13. AnalyzeActions — client-side Amazon POST removed: yes / no
14. AnalyzeActions — analysisDone status indicator added: yes / no
15. AnalyzeActions — all button styles preserved exactly: yes / no
16. MegaBotPanel — redundant Amazon POST removed (lines 100-101): yes / no
17. MegaBotPanel — all MegaBot logic untouched: yes / no
18. AmazonPriceBadge — retry polling added (3 retries, 5s interval): yes / no
19. AmazonPriceBadge — stops polling once data found: yes / no
20. AmazonPriceBadge — cleanup on unmount: yes / no
21. AmazonPriceBadge — all badge styling preserved exactly: yes / no
22. lib/adapters/ai.ts — NOT modified (LOCKED): yes / no
23. lib/adapters/rainforest.ts — NOT modified (LOCKED): yes / no
24. lib/adapters/pricing.ts — NOT modified (LOCKED): yes / no
25. lib/enrichment/item-context.ts — NOT modified (LOCKED): yes / no
26. lib/pricing/calculate.ts — NOT modified (LOCKED): yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — Amazon pre-fetch wired into analyze route: [fixed / issue]
  - Cache check working: [yes / no]
  - Fresh fetch working: [yes / no]
  - EventLog stored: [yes / no]
  - Context appended to AI prompt: [yes / no]
  - amazonData passed to legacy pricing: [yes / no]
  - ANALYZED EventLog includes amazon metrics: [yes / no]
Fix C — AnalyzeActions simplified: [fixed / issue]
Fix D — MegaBotPanel redundant POST removed: [fixed / issue]
Fix E — AmazonPriceBadge auto-retry polling: [fixed / issue]

EXISTING LOGIC UNTOUCHED:
  [List every locked file verified]

AI ADAPTER UNTOUCHED:
  [Verify lib/adapters/ai.ts not modified — analyze() signature same]

RAINFOREST ADAPTER UNTOUCHED:
  [Verify lib/adapters/rainforest.ts not modified]

PRICING LOGIC UNTOUCHED:
  [Verify lib/adapters/pricing.ts and lib/pricing/calculate.ts not modified]

ENRICHMENT PIPELINE UNTOUCHED:
  [Verify lib/enrichment/item-context.ts not modified]

ANALYZE ROUTE — ADDITIONS ONLY:
  [Verify no existing code deleted — only new code inserted between
   sellerContext build and aiAdapter.analyze call, plus amazonData param
   added to pricingAdapter.getEstimate, plus 3 fields added to EventLog]

FLAGS FROM CLAUDE CODE:
  [All gaps, risks, missed opportunities]

Files modified: [list all — be specific]
New files: [list all]
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Amazon Enrichment + Analysis Integration
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
