LEGACYLOOP — COMMAND TEMPLATE v9
PriceBot Page Upgrade + Sync — Fee Display, Freshness, Visual Polish
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
  ELON MUSK STANDARD: This must feel like a $1B product.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- PriceBot page check ---'
  wc -l app/bots/pricebot/PriceBotClient.tsx app/bots/pricebot/page.tsx
  echo '--- Fee constant check ---'
  grep -n 'sellerRate\|buyerRate' lib/constants/pricing.ts | head -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/bots/pricebot/PriceBotClient.tsx — UNLOCKED (fee display, freshness indicator, visual polish)
  app/bots/pricebot/page.tsx — UNLOCKED (pass additional data if needed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All Pass 1-5 + Phase 2 complete. Trade Center, Return/Buyback Bridge, all locked.
PriceBot AI logic and API routes are LOCKED. We are upgrading the UI only.

IMPORTANT — FEE MODEL:
  Total processing fee: 3.5%
  Buyer pays: 1.75% (PROCESSING_FEE.buyerRate)
  Seller pays: 1.75% (PROCESSING_FEE.sellerRate)
  This was fixed earlier today. PriceBot display should reflect this.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI upgrade only. No API changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true. Both test accounts Tier 4 Estate Manager.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Add net earnings display showing seller's take-home after commission + fee
  — Add freshness indicator showing when PriceBot was last run
  — Improve the "Not Run Yet" teaser to be more compelling
  — Add visual polish to the results display
  — Fix any hardcoded fallback colors

  You MAY NOT:
  — Touch any locked files
  — Change PriceBot AI logic or API routes
  — Change the data extraction functions (extractPH, _getComparables, etc.)
  — Deviate from inline style={{}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

  DEMO_MODE=true. TEST ACCOUNTS:
  annalyse07@gmail.com / LegacyLoop123!
  ryanroger11@gmail.com / Freedom26$

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — ENVIRONMENT VARIABLES STATUS

All keys SET. DEMO_MODE=true.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — PENDING SCHEMA MIGRATION

No changes in this command.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — PriceBot Page Upgrade + Sync (Phase 3, Item 16)

Problem: The PriceBot page (PriceBotClient.tsx, 973 lines) is functional
but needs three upgrades:

  1. FEE DISPLAY: PriceBot shows price ranges but doesn't show the seller's
     actual take-home after commission and the 1.75% seller fee. The item
     dashboard shows "You'll keep ~$X" but PriceBot doesn't match this.

  2. FRESHNESS INDICATOR: No way to know when PriceBot was last run.
     Users can't tell if pricing data is current or stale.

  3. VISUAL POLISH: Some hardcoded fallback colors (#888), the "Not Run Yet"
     teaser could be more compelling, and the overall results display could
     be tighter and more premium.

SURGICAL UNLOCK:
  app/bots/pricebot/PriceBotClient.tsx — main upgrade
  app/bots/pricebot/page.tsx — pass additional data if needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/bots/pricebot/PriceBotClient.tsx — FULL file (973 lines)
   Find: Lines 1-45 — types, Card helper, SectionLabel
   Find: Lines 47-69 — DemandBadge, RelevanceBadge
   Find: Lines 71-157 — extractPH data extraction (DO NOT MODIFY)
   Find: Lines 159-417 — MegaBotPricingSection
   Find: Lines 419-510 — State + runPriceBot handler
   Find: Lines 512-973 — Main component JSX rendering

2. Read app/bots/pricebot/page.tsx — FULL (87 lines)
   Find: What data is passed to PriceBotClient
   Find: priceBotRunAt field — is it passed?

3. Read lib/constants/pricing.ts — lines 351-359 — READ ONLY
   Find: PROCESSING_FEE.sellerRate (0.0175)

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ADD SELLER NET EARNINGS DISPLAY

Wherever PriceBot shows a price range (low/mid/high), add a "Seller Net"
calculation showing what the seller actually keeps:

  For each price point:
    sellerNet = price - (price * commissionRate) - (price * 0.0175)

  The commission rate depends on the user's tier. The page data includes
  the item but NOT the user tier directly. Use a reasonable estimate:
    - If the page.tsx passes userTier, use it
    - If not, use 5% as a middle-ground estimate and label as "~5%"

  Display format:
    "$43 mid → You keep ~$40.28"
    or as a separate line below the price range:
    "After ~5% commission + 1.75% fee → ~$40.28"

  Show this for:
    - The main price range at the top
    - The negotiation guide (list price, sweet spot, min accept)
    - The platform breakdown (seller net per platform)

  Style: Green (#4ade80) for the net amount, muted for the explanation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ADD FRESHNESS INDICATOR

The ItemData type has priceBotRunAt (string | null).
When PriceBot has been run, show when:

  If priceBotRunAt exists:
    "Last run: {relative time}" — e.g., "2 hours ago", "3 days ago", "just now"

  Function to calculate relative time:
    function timeAgo(dateStr: string): string {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }

  Display location: Near the item name/header when an item is selected and
  has PriceBot data. Small muted text.

  If data is older than 7 days, show a subtle "Stale" warning:
    "⚠️ Pricing data is 8 days old — consider re-running for current values"
    Style: amber/yellow muted text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — VISUAL POLISH

1. FIX HARDCODED FALLBACK COLORS:
   Lines 228, 362: `color: "#888"` — replace fallback with "var(--text-muted)"
   Scan for any other hardcoded colors that should use CSS variables.

2. "NOT RUN YET" TEASER (around line 535-539):
   Currently shows a basic "No pricing data yet" message.
   Upgrade to be more compelling:
     - Show what PriceBot will provide (market comps, platform breakdown, negotiation guide)
     - Show the cost (1 credit)
     - More premium empty state design
     - Clear CTA button

3. PRICE RANGE DISPLAY:
   The main price range at the top should feel like a premium pricing dashboard.
   Consider:
     - Larger, bolder mid-price
     - Low-High range as a subtle bar/indicator
     - Confidence indicator alongside the range
     - Demand badge more prominent

4. COMPARABLES TABLE (around line 284-340):
   The comparable sales table shows platform, item, price, date, condition, relevance.
   Polish:
     - Better column alignment
     - Platform icons/colors
     - Alternating row backgrounds using var(--ghost-bg)

5. ALL CARDS:
   Ensure consistent styling using the Card helper.
   All text uses CSS variables.
   Both light and dark mode clean.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — UPDATE page.tsx IF NEEDED

File: app/bots/pricebot/page.tsx (87 lines)

Check if priceBotRunAt is already passed to PriceBotClient.
If not, add it to the serialized data.

Also check if userTier is passed. If not, consider adding it
so the net earnings calculation can be accurate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — extractPH, _getComparables, _normalizeKeys, _normalizeComparable functions
  — PriceBot API routes
  — MegaBot API calls
  — The runPriceBot handler logic (only UI rendering)
  — BotItemSelector component

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Full reads complete: yes / no

  FEE DISPLAY:
  3. Seller net shown for main price range: yes / no
  4. Seller net shown for negotiation guide prices: yes / no
  5. Net calculation includes ~5% commission + 1.75% seller fee: yes / no
  6. Net amount in green, explanation in muted: yes / no

  FRESHNESS:
  7. "Last run" time shown when priceBotRunAt exists: yes / no
  8. Stale warning for data > 7 days: yes / no

  VISUAL:
  9. Hardcoded #888 replaced: yes / no
  10. "Not Run Yet" teaser upgraded: yes / no
  11. Price range display more prominent: yes / no
  12. All text uses CSS variables: yes / no
  13. Both light and dark mode clean: yes / no

  N+1. All locked files untouched: yes / no
  N+2. Data extraction functions untouched: yes / no
  N+3. inline style={{}} throughout: yes / no
  N+4. npx tsc --noEmit: 0 errors
  N+5. npm run build: pass
  N+6. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Seller net earnings: [fixed / issue]
    - Net display added: [yes / no]
    - Calculation correct: [yes / no]
  Part C — Freshness indicator: [fixed / issue]
    - Time ago display: [yes / no]
    - Stale warning: [yes / no]
  Part D — Visual polish: [fixed / issue]
    - Hardcoded colors fixed: [count]
    - Teaser upgraded: [yes / no]
    - Price range polished: [yes / no]
  Part E — page.tsx: [fixed / no changes needed]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Data extraction functions: [Confirm]
  — API calls: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list — should be 1-2]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | PriceBot Page Upgrade + Sync (Item 16)
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
