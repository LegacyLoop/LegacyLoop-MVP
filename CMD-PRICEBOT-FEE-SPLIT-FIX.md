LEGACYLOOP — COMMAND TEMPLATE v9
PriceBot Fee Split Correction — 3.5% Split to 1.75% Buyer / 1.75% Seller
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
  echo '--- Current fee model ---'
  grep -n 'PROCESSING_FEE' lib/constants/pricing.ts | head -5
  grep -n '0.035' lib/billing/commission.ts
  grep -n 'sellerProcessingFee' app/items/\[id\]/ItemDashboardPanels.tsx
  grep -n 'buyer pays' app/items/\[id\]/ItemDashboardPanels.tsx
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
✓ lib/data/** — ALL LOCKED

— Enrichment —
✓ lib/enrichment/** — ALL LOCKED

— Credits —
✓ lib/credits.ts — LOCKED
✓ lib/tier-enforcement.ts — READ ONLY

— Offers —
✓ lib/offers/** — ALL LOCKED

— All other UI not listed below —
✓ app/onboarding/** — LOCKED
✓ app/bots/page.tsx — LOCKED
✓ app/dashboard/** — LOCKED
✓ app/messages/** — LOCKED
✓ app/components/messaging/** — LOCKED

— Infrastructure —
✓ vercel.json — LOCKED
✓ prisma/schema.prisma — READ ONLY
✓ globals.css — LOCKED

SURGICAL UNLOCK — These files are explicitly unlocked for THIS COMMAND ONLY:

  BACKEND (financial logic):
  lib/constants/pricing.ts — UNLOCKED (PROCESSING_FEE constant — change to split model)
  lib/billing/commission.ts — UNLOCKED (add seller fee deduction to calculateCommission)
  lib/billing/pro-rate.ts — UNLOCKED (update hardcoded 0.035 to use constant)
  lib/commission.ts — UNLOCKED (update earningsBreakdown for split fee)
  lib/pricing/calculate.ts — UNLOCKED (update buyer total to use buyer half only)
  lib/services/payment-ledger.ts — UNLOCKED (update fee calculation)
  lib/email/templates.ts — UNLOCKED (update fee display in emails)

  UI (display corrections):
  app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED (fix "Your Best Net Payout" breakdown)
  app/items/[id]/ItemToolPanels.tsx — UNLOCKED (fix "(charged to buyer)" text)
  app/items/[id]/LocalPickupPanel.tsx — UNLOCKED (fix "Buyer pays" text)
  app/items/[id]/ShippingPanel.tsx — UNLOCKED (fix "Charged to buyer" text)
  app/components/ProcessingFeeTooltip.tsx — UNLOCKED (fix tooltip copy)
  app/store/[userId]/item/[itemId]/BuyNowModal.tsx — UNLOCKED (fix checkout display)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-5 Locked (through March 19, 2026):
  • All bot AI logic, prompt systems, output formats
  • MegaBot, antique/collectible detection, Amazon enrichment
  • Upload system, Edit Item Form, Item Control Center
  • Light Mode, Message Center, Quiz upgrade (all 4 parts)
  • Bot Hub restore + Coming Soon bots
  • Credit system, subscription tiers, offer system
  • Marketplace, bundles, trade proposals
  • Email system (templates — update fee display ONLY)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

For this command: Financial calculations change. Ensure all earnings breakdowns,
payment ledger entries, and email receipts reflect the new split model.
Flag if any stored data (PaymentLedger, SellerEarnings) needs format changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Always follow this sequence. Never skip steps. Close the loop every time.

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this command: Constants → Backend logic → UI display.
Change the source of truth first, then update all consumers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

DEMO_MODE=true — admin accounts bypass all gates and credit deductions.
Both test accounts are Tier 4 Estate Manager with full access.

THE FEE MODEL CHANGE:

  CURRENT (WRONG):
    Total processing fee: 3.5%
    Buyer pays: 3.5% (added to purchase price)
    Seller pays: 0% (no deduction from earnings)
    Display: "Processing fee: $0.00 (buyer pays 3.5%)"

  CORRECT (WHAT WE'RE BUILDING):
    Total processing fee: 3.5%
    Buyer pays: 1.75% (added to purchase price)
    Seller pays: 1.75% (deducted from earnings)
    Display: "Processing fee: -$X.XX (1.75% — buyer also pays 1.75%)"

  MATH EXAMPLE ($100 sale, 5% commission tier):
    CURRENT:
      Seller: $100 - $5.00 commission = $95.00 (keeps $95)
      Buyer:  $100 + $3.50 fee = $103.50 (pays $103.50)

    CORRECT:
      Seller: $100 - $5.00 commission - $1.75 fee = $93.25 (keeps $93.25)
      Buyer:  $100 + $1.75 fee = $101.75 (pays $101.75)

    Total fee collected: $1.75 + $1.75 = $3.50 (unchanged)
    Platform revenue: $5.00 commission + $3.50 total fee = $8.50 (unchanged)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve display of the fee breakdown
  — Add clarity to how the split is communicated
  — Make the breakdown feel transparent and trustworthy
  — Ensure consistency across ALL surfaces that show fees

  You MAY NOT:
  — Change the total fee rate (must remain 3.5% total)
  — Change the split ratio (must be exactly 50/50 = 1.75% each)
  — Change commission rates or tier logic
  — Touch any files not listed in surgical unlock
  — Change schema

  Flag everything outside scope.
  Read FULL files before making changes.
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

OBJECTIVE — PriceBot Fee Split Correction: 3.5% → 1.75% Buyer / 1.75% Seller

Problem: The processing fee is currently 3.5% charged entirely to the buyer.
The seller sees "$0.00 (buyer pays 3.5%)" in their net payout breakdown.
This is incorrect. LegacyLoop's intended model splits the fee 50/50.

The fix:
  1. Update the PROCESSING_FEE constant to a split model
  2. Update all backend calculation functions
  3. Update all UI displays to show the split accurately

Total fee: 3.5% (unchanged)
Buyer half: 1.75% (added to purchase price)
Seller half: 1.75% (deducted from seller earnings)

SURGICAL UNLOCK: 13 files (7 backend + 6 UI)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read lib/constants/pricing.ts — lines 347-360
   Find: PROCESSING_FEE constant (line 351)
   Find: calculateProcessingFee function (line 516)
   Find: calculateTotalWithFee function (line 522)

2. Read lib/billing/commission.ts — FULL file (17 lines)
   Find: line 12 — hardcoded 0.035

3. Read lib/commission.ts — FULL file (53 lines)
   Find: earningsBreakdown function
   Find: line 39-40 — processingFee calculation

4. Read lib/billing/pro-rate.ts — find line with 0.035
   Find: squareFeeAmount calculation

5. Read lib/pricing/calculate.ts — lines 350-380
   Find: processingFeeRate usage
   Find: buyerTotal calculations

6. Read lib/services/payment-ledger.ts — FULL file
   Find: calculateProcessingFee usage

7. Read lib/email/templates.ts — lines 110-140
   Find: processingFee display

8. Read app/items/[id]/ItemDashboardPanels.tsx — lines 2930-2995
   Find: line 2931 — sellerProcessingFee = 0
   Find: line 2987 — "$0.00 (buyer pays 3.5%)"

9. Read app/items/[id]/ItemToolPanels.tsx — line 379
   Find: "(charged to buyer)" text

10. Read app/items/[id]/LocalPickupPanel.tsx — lines 420-435
    Find: "Buyer pays" and PROCESSING_FEE.display

11. Read app/items/[id]/ShippingPanel.tsx — lines 1330-1335
    Find: "Charged to buyer"

12. Read app/components/ProcessingFeeTooltip.tsx — FULL file (118 lines)
    Find: "Sellers pay no processing fees" (line 84)

13. Read app/store/[userId]/item/[itemId]/BuyNowModal.tsx — lines 130-190
    Find: "charged to buyer" text

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — UPDATE PROCESSING_FEE CONSTANT

File: lib/constants/pricing.ts (line 351)

Change PROCESSING_FEE from:

  export const PROCESSING_FEE = {
    rate: 0.035,
    display: "3.5%",
    label: "Processing Fee",
    description: "Included in price",
    paidBy: "included" as const,
    model: "absorbed" as const,
  };

To:

  export const PROCESSING_FEE = {
    rate: 0.035,
    buyerRate: 0.0175,
    sellerRate: 0.0175,
    display: "3.5%",
    buyerDisplay: "1.75%",
    sellerDisplay: "1.75%",
    label: "Processing Fee",
    description: "Split evenly between buyer and seller",
    model: "split" as const,
  };

Also update calculateProcessingFee (line 516) to accept an optional "half" param:

  export function calculateProcessingFee(subtotal: number, half?: "buyer" | "seller"): number {
    const rate = half ? PROCESSING_FEE[`${half}Rate`] : PROCESSING_FEE.rate;
    return Math.round(subtotal * rate * 100) / 100;
  }

And update calculateTotalWithFee (line 522) to use buyer half:

  export function calculateTotalWithFee(subtotal: number): { subtotal: number; processingFee: number; total: number } {
    const fee = calculateProcessingFee(subtotal, "buyer");
    return { subtotal, processingFee: fee, total: Math.round((subtotal + fee) * 100) / 100 };
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — UPDATE lib/billing/commission.ts

Change line 12 from:
  const processingFee = Math.round(soldPrice * 0.035 * 100) / 100;

To:
  const sellerFee = Math.round(soldPrice * 0.0175 * 100) / 100;
  const buyerFee = Math.round(soldPrice * 0.0175 * 100) / 100;
  const processingFee = Math.round((sellerFee + buyerFee) * 100) / 100;

Update sellerEarnings (line 13) to deduct seller fee:
  const sellerEarnings = Math.round((soldPrice - commissionAmount - sellerFee) * 100) / 100;

Update return to include new fields:
  return {
    soldPrice, commissionRate: tierCommissionRate, commissionAmount,
    processingFee, sellerFee, buyerFee,
    sellerEarnings, platformRevenue
  };

Update the CommissionBreakdown interface to add:
  sellerFee: number;
  buyerFee: number;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — UPDATE lib/commission.ts

In earningsBreakdown function, change the processingFee and buyerTotal:

  const sellerFee = Math.round(salePrice * PROCESSING_FEE.sellerRate * 100) / 100;
  const buyerFee = Math.round(salePrice * PROCESSING_FEE.buyerRate * 100) / 100;
  const processingFee = Math.round((sellerFee + buyerFee) * 100) / 100;
  const netEarnings = Math.round((salePrice - commission - sellerFee) * 100) / 100;
  const buyerTotal = Math.round((salePrice + buyerFee) * 100) / 100;

Add sellerFee and buyerFee to the return object.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — UPDATE lib/billing/pro-rate.ts

Change line 21 hardcoded 0.035 to use PROCESSING_FEE:

  import { PROCESSING_FEE } from "@/lib/constants/pricing";

  const squareFeeAmount = Math.round(creditForUnused * PROCESSING_FEE.buyerRate * 100) / 100;

(Pro-rate refunds should use buyer rate since buyer paid that portion.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — UPDATE lib/pricing/calculate.ts

Line 353 uses PROCESSING_FEE.rate for buyer total calculations.
Change to PROCESSING_FEE.buyerRate for buyer-facing totals (lines 377-379):

  local: Math.round(localMid * (1 + PROCESSING_FEE.buyerRate) * 100) / 100,
  national: Math.round((nationalMid + shippingCost) * (1 + PROCESSING_FEE.buyerRate) * 100) / 100,
  bestMarket: Math.round((bestMid + shippingCost) * (1 + PROCESSING_FEE.buyerRate) * 100) / 100,

Also add sellerNet calculations that deduct seller fee:

  const sellerFeeRate = PROCESSING_FEE.sellerRate;

And deduct it in the sellerNet calculations (if they exist).
Read the full context to find all instances.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — UPDATE lib/services/payment-ledger.ts

This file uses calculateProcessingFee. Since we updated that function in
Part B to default to the FULL fee but accept a "half" param, check:
  - If it's calculating buyer-side charges → use calculateProcessingFee(subtotal, "buyer")
  - If it's calculating total collected → use calculateProcessingFee(subtotal) (full rate)

Read the file carefully and update accordingly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART H — UPDATE lib/email/templates.ts

Line 116 takes processingFee as a param.
Line 134 displays it.

Update the display to clarify the split:
  Where it currently says "Processing Fee" → "Processing Fee (buyer's share)"
  And ensure the amount shown is the BUYER'S half (1.75%), not the full 3.5%.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART I — FIX ItemDashboardPanels.tsx (THE SCREENSHOT)

File: app/items/[id]/ItemDashboardPanels.tsx

Line 2931: Change from:
  const sellerProcessingFee = 0; // Processing fee is charged to buyer, not seller

To:
  const sellerProcessingFee = Math.round(salePrice * 0.0175 * 100) / 100;

Line 2932: Update net calculation to deduct seller fee:
  const net = Math.round((salePrice - shipCost - comm - sellerProcessingFee) * 100) / 100;

Lines 2985-2987: Change the display from:
  <span>Processing fee</span>
  <span style={{ color: "#4ade80" }}>$0.00 (buyer pays {PROCESSING_FEE.display})</span>

To:
  <span>Processing fee ({PROCESSING_FEE.sellerDisplay})</span>
  <span style={{ color: "#ef4444" }}>-${sellerProcessingFee.toFixed(2)}</span>

And ADD a new line below it showing the buyer's share (informational):
  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "0.65rem", opacity: 0.7 }}>
    <span>Buyer also pays {PROCESSING_FEE.buyerDisplay}</span>
    <span>+${(Math.round(salePrice * 0.0175 * 100) / 100).toFixed(2)}</span>
  </div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART J — FIX ItemToolPanels.tsx

Line 379: Change from:
  "{PROCESSING_FEE.display} processing fee (charged to buyer)"

To:
  "{PROCESSING_FEE.display} processing fee (split: {PROCESSING_FEE.sellerDisplay} seller + {PROCESSING_FEE.buyerDisplay} buyer)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART K — FIX LocalPickupPanel.tsx

Lines 421-432: Update the fee display section.

Change "Buyer pays" language to show the split:
  "Seller pays {PROCESSING_FEE.sellerDisplay}"
  "Buyer pays {PROCESSING_FEE.buyerDisplay}"
  "Total processing fee {PROCESSING_FEE.display}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART L — FIX ShippingPanel.tsx

Line 1333: Change "Charged to buyer" to show split:
  "Split: {PROCESSING_FEE.sellerDisplay} seller / {PROCESSING_FEE.buyerDisplay} buyer"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART M — FIX ProcessingFeeTooltip.tsx

Line 17: feeAmount should show BUYER half (for buyer-facing contexts):
  const feeAmount = amount != null
    ? Math.round(amount * PROCESSING_FEE.buyerRate * 100) / 100
    : null;

Line 82-84: Change the tooltip copy from:
  "Square applies a {pctLabel} payment processing fee on all transactions,
   charged to the buyer. Sellers pay no processing fees."

To:
  "LegacyLoop applies a {PROCESSING_FEE.display} payment processing fee on all transactions,
   split evenly — {PROCESSING_FEE.buyerDisplay} added to buyer's total,
   {PROCESSING_FEE.sellerDisplay} deducted from seller's earnings."

Line 99: Update the breakdown display to show buyer's half, not full fee.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART N — FIX BuyNowModal.tsx

Line 136: Change "charged to buyer" to reflect split:
  "Processing fee ({PROCESSING_FEE.buyerDisplay} — your share)"

Line 187: ProcessingFeeTooltip already updated in Part M — verify it renders correctly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Total fee rate (must remain 3.5%)
  — Split ratio (must be exactly 50/50)
  — Commission rates or tier logic
  — Scoring, routing, or quiz logic
  — Any files not listed in surgical unlock

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  CONSTANT:
  3. PROCESSING_FEE.buyerRate = 0.0175: yes / no
  4. PROCESSING_FEE.sellerRate = 0.0175: yes / no
  5. PROCESSING_FEE.rate still = 0.035 (total unchanged): yes / no

  BACKEND MATH:
  6. lib/billing/commission.ts deducts seller 1.75% from earnings: yes / no
  7. lib/commission.ts earningsBreakdown deducts seller 1.75%: yes / no
  8. lib/billing/pro-rate.ts uses constant (not hardcoded 0.035): yes / no
  9. lib/pricing/calculate.ts buyer totals use 1.75%: yes / no
  10. lib/services/payment-ledger.ts uses buyer half for charges: yes / no

  MATH VERIFICATION ($100 sale, 5% commission):
  11. Seller earnings = $100 - $5.00 - $1.75 = $93.25: yes / no
  12. Buyer total = $100 + $1.75 = $101.75: yes / no
  13. Total fee collected = $3.50 (unchanged): yes / no

  UI DISPLAY:
  14. ItemDashboardPanels shows seller fee deduction (not $0.00): yes / no
  15. ItemDashboardPanels "You keep" reflects seller fee deduction: yes / no
  16. ItemToolPanels shows "split" language: yes / no
  17. LocalPickupPanel shows split: yes / no
  18. ShippingPanel shows split: yes / no
  19. ProcessingFeeTooltip shows split explanation: yes / no
  20. BuyNowModal shows buyer's share: yes / no

  CONSISTENCY:
  21. No remaining "buyer pays 3.5%" text anywhere: yes / no
  22. No remaining "Sellers pay no processing fees" text: yes / no
  23. No remaining "charged to buyer" (full fee) text: yes / no

  N+1. All non-unlocked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. npx tsc --noEmit: 0 errors
  N+4. npm run build: pass
  N+5. CHECKPOINT post-change: pass
  N+6. Dev server: localhost:3000
  N+7. Light mode tested: no broken contrast
  N+8. Dark mode tested: all elements visible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part A printed: [yes / no]

  Part B — PROCESSING_FEE constant: [fixed / issue]
  Part C — lib/billing/commission.ts: [fixed / issue]
  Part D — lib/commission.ts: [fixed / issue]
  Part E — lib/billing/pro-rate.ts: [fixed / issue]
  Part F — lib/pricing/calculate.ts: [fixed / issue]
  Part G — lib/services/payment-ledger.ts: [fixed / issue]
  Part H — lib/email/templates.ts: [fixed / issue]
  Part I — ItemDashboardPanels.tsx: [fixed / issue]
  Part J — ItemToolPanels.tsx: [fixed / issue]
  Part K — LocalPickupPanel.tsx: [fixed / issue]
  Part L — ShippingPanel.tsx: [fixed / issue]
  Part M — ProcessingFeeTooltip.tsx: [fixed / issue]
  Part N — BuyNowModal.tsx: [fixed / issue]

  MATH VERIFIED:
  - $100 sale, 5% tier: seller gets $93.25, buyer pays $101.75: [Confirm]
  - Total fee $3.50 unchanged: [Confirm]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Commission rates unchanged: [Confirm]
  — Tier logic unchanged: [Confirm]
  — All non-unlocked files untouched: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list all — should be exactly 13]
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
Command Template v9 | LegacyLoop | PriceBot Fee Split Correction
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
