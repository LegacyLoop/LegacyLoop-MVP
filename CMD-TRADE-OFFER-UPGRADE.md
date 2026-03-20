LEGACYLOOP — COMMAND TEMPLATE v9
Trade System Visibility + Offer/Haggling Flow Upgrade (Items 13 + 14)
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
  echo '--- Trade + Offer files check ---'
  wc -l app/items/\[id\]/TradeProposalsPanel.tsx app/items/\[id\]/TradeToggle.tsx app/components/OfferManagerPanel.tsx app/components/ActiveOffersWidget.tsx app/components/OfferHistoryTimeline.tsx app/store/\[userId\]/item/\[itemId\]/MakeOfferForm.tsx app/offers/\[token\]/page.tsx app/components/TradeProposalModal.tsx app/store/\[userId\]/item/\[itemId\]/TradeButton.tsx
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

— Credits + Billing —
✓ lib/credits.ts — LOCKED
✓ lib/tier-enforcement.ts — READ ONLY
✓ lib/billing/** — ALL LOCKED

— Offers API —
✓ lib/offers/** — ALL LOCKED (backend logic is correct)

— Email System —
✓ lib/email/** — ALL LOCKED

— Pricing Constants —
✓ lib/constants/pricing.ts — LOCKED
✓ lib/pricing/** — ALL LOCKED

— API Routes —
✓ app/api/** — ALL LOCKED (offer + trade APIs already work)

— Core UI —
✓ app/components/AppNav.tsx — LOCKED
✓ app/components/UploadModal.tsx — LOCKED
✓ app/page.tsx — LOCKED
✓ globals.css — LOCKED

— Dashboard + Items (except specific unlocks) —
✓ app/dashboard/** — LOCKED
✓ app/items/[id]/ItemDashboardPanels.tsx — LOCKED (just polished)
✓ app/items/[id]/page.tsx — LOCKED

— All other UI —
✓ app/bots/** — LOCKED
✓ app/messages/** — LOCKED
✓ app/onboarding/** — LOCKED
✓ app/subscription/** — LOCKED
✓ app/projects/** — LOCKED

— Infrastructure —
✓ vercel.json — LOCKED
✓ prisma/schema.prisma — READ ONLY

SURGICAL UNLOCK — These files are explicitly unlocked for THIS COMMAND ONLY:

  TRADE (Item 13):
  app/items/[id]/TradeProposalsPanel.tsx — UNLOCKED (light mode fix, visual upgrade)
  app/items/[id]/TradeToggle.tsx — UNLOCKED (visual upgrade, demo state)
  app/store/[userId]/item/[itemId]/TradeButton.tsx — UNLOCKED (visual upgrade)
  app/components/TradeProposalModal.tsx — UNLOCKED (always-dark audit, visual upgrade)

  OFFERS (Item 14):
  app/store/[userId]/item/[itemId]/MakeOfferForm.tsx — UNLOCKED (fix fee calc, visual upgrade)
  app/components/OfferManagerPanel.tsx — UNLOCKED (visual upgrade, expiry display)
  app/components/ActiveOffersWidget.tsx — UNLOCKED (visual upgrade, prominence)
  app/components/OfferHistoryTimeline.tsx — UNLOCKED (visual upgrade)
  app/offers/[token]/page.tsx — UNLOCKED (light mode fix, visual upgrade)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-5 + Phase 2 Items 9-12 + all added items — ALL LOCKED.
The trade and offer BACKEND (API routes, Prisma models, lib/offers/*) is
LOCKED and CORRECT. The 3-round offer system, magic links, expiry cron,
and trade proposal API all work. We are upgrading the FRONTEND only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

For this command: Trade proposals and offers are already tracked in the
database (Offer, OfferEvent, EventLog models). No new data collection needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this command: UI upgrade only. All backend logic is locked and working.
We are fixing light mode issues and making the trade/offer UI feel premium.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. DEMO_MODE=true.
Both test accounts are Tier 4 Estate Manager with full access.

TRADE SYSTEM:
  - TradeToggle on item dashboard enables/disables trades per item
  - TradeButton on buyer store page lets buyers propose trades
  - TradeProposalModal is always-dark overlay for creating proposals
  - TradeProposalsPanel shows incoming proposals with accept/decline

OFFER SYSTEM:
  - MakeOfferForm on buyer store page (name, email, amount, message)
  - Offers saved to database with magic link for buyer
  - 3-round negotiation: offer → counter → counter → final
  - Expiry countdown on each offer
  - OfferManagerPanel for seller to manage offers (accept/counter/decline)
  - ActiveOffersWidget shows active offers count on dashboard
  - OfferHistoryTimeline shows event history per offer
  - /offers/[token] page for buyers to respond via magic link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Make trade and offer features feel real and premium
  — Add visual feedback and animations
  — Fix any hardcoded colors found during reads
  — Make expiry countdown more prominent and dynamic
  — Add visual cues that trades/offers are active (badges, dots, counts)
  — Make the offer flow feel smooth and easy to follow

  You MAY NOT:
  — Touch any locked files
  — Change the offer/trade API routes or backend logic
  — Change the Prisma schema
  — Change the 3-round negotiation limit
  — Deviate from inline style={{}}
  — Add unapproved npm packages

  Flag everything outside scope.
  Read FULL component code before making changes.
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
  • TradeProposal model, AgentSettings model, Bundle model, BundleItem model
  • quizCompletedAt DateTime? on User

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Trade Visibility (Item 13) + Offer/Haggling Flow Upgrade (Item 14)

Two related systems being upgraded together:

ITEM 13 — TRADE SYSTEM VISIBILITY:
  Problem: Trade features exist but don't feel real. The TradeProposalsPanel
  has hardcoded #fff colors (invisible in light mode). The TradeToggle works
  but lacks visual feedback about trade activity. The TradeProposalModal is
  an always-dark overlay that needs audit.

ITEM 14 — OFFER/HAGGLING FLOW:
  Problem: The offer system is comprehensive but the MakeOfferForm still uses
  PROCESSING_FEE.rate (full 3.5%) instead of PROCESSING_FEE.buyerRate (1.75%).
  The OfferManagerPanel and buyer offer page need visual polish. The expiry
  countdown should be more prominent. The flow between make/accept/counter/decline
  needs to feel smooth and obvious.

SURGICAL UNLOCK: 9 files (4 trade + 5 offer)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

TRADE FILES:
1. Read app/items/[id]/TradeProposalsPanel.tsx — FULL (80 lines)
   Find: line 37 — color: "#fff" (broken in light mode)
   Find: line 44 — color: "#fff" (broken in light mode)
   Find: lines 51-53 — rgba colors that may break in light mode

2. Read app/items/[id]/TradeToggle.tsx — FULL (39 lines)
   Find: line 31 — "Accept Trades" text color
   Find: overall styling

3. Read app/store/[userId]/item/[itemId]/TradeButton.tsx — FULL (25 lines)
   Find: Button styling and functionality

4. Read app/components/TradeProposalModal.tsx — FULL (122 lines)
   Find: This is an ALWAYS-DARK overlay — verify it uses hardcoded colors
   correctly (NOT CSS variables)

OFFER FILES:
5. Read app/store/[userId]/item/[itemId]/MakeOfferForm.tsx — FULL (171 lines)
   Find: line 22 — PROCESSING_FEE.rate (should be PROCESSING_FEE.buyerRate)
   Find: Overall form styling and UX

6. Read app/components/OfferManagerPanel.tsx — FULL (406 lines)
   Find: Offer status badges, counter form, accept/decline buttons
   Find: Expiry countdown display (timeRemaining function)
   Find: Any hardcoded colors that break in light mode

7. Read app/components/ActiveOffersWidget.tsx — FULL (262 lines)
   Find: How active offers are displayed
   Find: Any hardcoded colors

8. Read app/components/OfferHistoryTimeline.tsx — FULL (193 lines)
   Find: Timeline event rendering
   Find: Any hardcoded colors

9. Read app/offers/[token]/page.tsx — FULL (377 lines)
   Find: Buyer-facing offer response page
   Find: Accept/Counter/Decline UI
   Find: Expiry display
   Find: Any hardcoded colors that break in light mode

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — TRADE: FIX LIGHT MODE IN TradeProposalsPanel.tsx

File: app/items/[id]/TradeProposalsPanel.tsx (80 lines)

KNOWN ISSUES:
  Line 37: color: "#fff" → color: "var(--text-primary)"
  Line 44: color: "#fff" → color: "var(--text-primary)"
  Lines 51-53: rgba(207,216,220,...) colors — these are light gray
  and may be hard to read in light mode. Replace with CSS variables:
    rgba(207,216,220,0.8) → var(--text-secondary)
    rgba(207,216,220,0.4) → var(--text-muted)
    rgba(207,216,220,0.6) → var(--text-muted)
    rgba(207,216,220,0.5) → var(--text-muted)

Scan the ENTIRE file for any other hardcoded colors.
Replace all theme-breaking colors with appropriate CSS variables.
Keep the left border accent (#00bcd4) — that works in both modes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — TRADE: UPGRADE TradeToggle.tsx

File: app/items/[id]/TradeToggle.tsx (39 lines)

The toggle already works. Visual upgrades:
  1. Add a subtle "trade activity" indicator when trades are enabled:
     Show a small teal dot or "Active" badge next to "Accept Trades"
  2. Verify all colors use CSS variables
  3. Consider adding a brief subtitle that explains what happens:
     Enabled: "Buyers can propose items in exchange"
     (Already has this — verify it works in both modes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — TRADE: UPGRADE TradeButton.tsx

File: app/store/[userId]/item/[itemId]/TradeButton.tsx (25 lines)

Visual upgrade:
  - Make the button feel more substantial and premium
  - Use var(--accent-theme) or teal gradient
  - Add a trade icon (🔄)
  - Ensure it looks good in both modes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — TRADE: AUDIT TradeProposalModal.tsx

File: app/components/TradeProposalModal.tsx (122 lines)

This is an ALWAYS-DARK overlay (like CancelFlowModal, UpgradeFlowModal).
VERIFY it uses HARDCODED colors, NOT CSS variables:
  - Text should be #e2e8f0, #f1f5f9, or similar light colors
  - Backgrounds should be rgba(255,255,255,0.05) or #16161e
  - NEVER var(--text-primary) (inverts to dark in light mode)

If it currently uses CSS variables, FIX to hardcoded always-dark colors.
If it already uses hardcoded colors correctly, note "no changes needed".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — OFFERS: FIX FEE CALCULATION IN MakeOfferForm.tsx

File: app/store/[userId]/item/[itemId]/MakeOfferForm.tsx (171 lines)

CRITICAL FIX:
  Line 22: const fee = offerNum > 0 ? Math.round(offerNum * PROCESSING_FEE.rate * 100) / 100 : 0;
  Change to: const fee = offerNum > 0 ? Math.round(offerNum * PROCESSING_FEE.buyerRate * 100) / 100 : 0;

  This matches the fee split fix from earlier today (1.75% buyer, not 3.5%).

Also:
  - Update any display text that says "3.5% fee" to show "1.75% fee (your share)"
  - Scan for hardcoded colors and fix for light mode
  - Make the form feel premium (input styling, button styling)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — OFFERS: UPGRADE OfferManagerPanel.tsx

File: app/components/OfferManagerPanel.tsx (406 lines)

Visual upgrades:
  1. EXPIRY COUNTDOWN — Make it more prominent and dynamic:
     - Show countdown in hours/minutes (already does this via timeRemaining)
     - Add a color indicator: green (>24h), yellow (4-24h), red (<4h)
     - Add a subtle pulsing animation when < 1 hour remaining

  2. STATUS BADGES — Already has statusBadge function. Verify colors
     work in both modes. The function uses rgba backgrounds which should
     work, but verify.

  3. COUNTER OFFER FORM — When seller clicks "Counter":
     - Make the counter price input prominent
     - Show the offer history alongside the counter form
     - Add a "Suggested counter" hint based on listing price

  4. LIGHT MODE AUDIT — Scan for any hardcoded colors.
     Replace any that break in light mode with CSS variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART H — OFFERS: UPGRADE ActiveOffersWidget.tsx

File: app/components/ActiveOffersWidget.tsx (262 lines)

Visual upgrades:
  1. Make active offers count more prominent (badge on item dashboard)
  2. Show most recent offer details (buyer name, amount, time remaining)
  3. Light mode audit — fix any hardcoded colors
  4. Add link to full offer manager

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART I — OFFERS: UPGRADE OfferHistoryTimeline.tsx

File: app/components/OfferHistoryTimeline.tsx (193 lines)

Visual upgrades:
  1. Make the timeline feel like a real conversation/negotiation flow
  2. Color-code events: buyer actions blue, seller actions teal
  3. Show price changes with arrows (↑ counter, ↓ counter)
  4. Light mode audit — fix any hardcoded colors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART J — OFFERS: UPGRADE BUYER OFFER PAGE (offers/[token]/page.tsx)

File: app/offers/[token]/page.tsx (377 lines)

This is the page buyers see when they click the magic link to respond
to an offer. Visual upgrades:

  1. LIGHT MODE — This page is buyer-facing and MUST look perfect in both modes.
     Scan ALL colors. Fix any hardcoded values.

  2. EXPIRY COUNTDOWN — Make it prominent with color coding:
     Green (>24h), Yellow (4-24h), Red (<4h), "Expired" in gray

  3. ACCEPT/COUNTER/DECLINE BUTTONS — Make the flow obvious:
     - Accept: green gradient, prominent
     - Counter: teal/neutral, opens counter form
     - Decline: red outline, less prominent

  4. COUNTER FORM — When buyer clicks counter:
     - Show current price
     - Input for new price
     - Optional message field
     - "Send Counter" button

  5. OVERALL — This is the BUYER'S first impression of LegacyLoop.
     It must feel trustworthy, clear, and premium.
     The item photo should be prominent.
     The price and expiry should be immediately visible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — API routes for trades or offers (locked and working)
  — Prisma schema
  — The 3-round negotiation logic
  — lib/offers/* (cron, expiry, notify — all locked)
  — ItemDashboardPanels.tsx (just polished)
  — Any locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  TRADE (Item 13):
  3. TradeProposalsPanel: zero #fff remaining: yes / no
  4. TradeProposalsPanel: rgba colors replaced with CSS vars: yes / no
  5. TradeProposalsPanel: readable in light mode: yes / no
  6. TradeToggle: visual upgrade applied: yes / no
  7. TradeButton: premium styling: yes / no
  8. TradeProposalModal: always-dark audit (hardcoded colors): yes / no

  OFFERS (Item 14):
  9. MakeOfferForm: fee uses buyerRate (0.0175): yes / no
  10. MakeOfferForm: light mode clean: yes / no
  11. OfferManagerPanel: expiry countdown color-coded: yes / no
  12. OfferManagerPanel: light mode clean: yes / no
  13. ActiveOffersWidget: visual upgrade: yes / no
  14. ActiveOffersWidget: light mode clean: yes / no
  15. OfferHistoryTimeline: visual upgrade: yes / no
  16. OfferHistoryTimeline: light mode clean: yes / no
  17. Buyer offer page: light mode clean: yes / no
  18. Buyer offer page: expiry countdown prominent: yes / no
  19. Buyer offer page: accept/counter/decline flow clear: yes / no

  N+1. All locked files untouched: yes / no
  N+2. API routes untouched: yes / no
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

  TRADE:
  Part B — TradeProposalsPanel: [fixed / issue]
    - Hardcoded colors fixed: [count]
    - Light mode readable: [yes / no]
  Part C — TradeToggle: [fixed / no changes / issue]
  Part D — TradeButton: [fixed / issue]
  Part E — TradeProposalModal: [fixed / no changes needed / issue]

  OFFERS:
  Part F — MakeOfferForm fee fix: [fixed / issue]
    - Uses buyerRate: [yes / no]
  Part G — OfferManagerPanel: [fixed / issue]
    - Expiry color-coded: [yes / no]
  Part H — ActiveOffersWidget: [fixed / issue]
  Part I — OfferHistoryTimeline: [fixed / issue]
  Part J — Buyer offer page: [fixed / issue]
    - Light mode clean: [yes / no]
    - Expiry prominent: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]
  ALWAYS-DARK PANELS: [hardcoded colors verified / issues]

  EXISTING LOGIC UNTOUCHED:
  — API routes unchanged: [Confirm]
  — 3-round negotiation unchanged: [Confirm]
  — All locked files verified as untouched

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, missed data collection, out-of-scope items]

  Files modified: [list all — should be up to 9]
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
Command Template v9 | LegacyLoop | Trade + Offer System Upgrade (Items 13+14)
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
