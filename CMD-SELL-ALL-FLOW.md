LEGACYLOOP — COMMAND TEMPLATE v9
Sell All Flow — Bulk Discount Sale Feature for Sales Dashboard
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
  echo '--- Verify Edit Sale completed ---'
  grep -c 'editMode\|editForm\|saveEdit\|cancelEdit' app/projects/\[id\]/ProjectDetailClient.tsx
  echo '=== CHECKPOINT COMPLETE ==='

Expected: editMode count 5+ (confirms previous command completed)

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

— Offers —
✓ lib/offers/** — ALL LOCKED

— Email System —
✓ lib/email/** — ALL LOCKED

— Pricing Constants —
✓ lib/constants/pricing.ts — LOCKED
✓ lib/pricing/** — ALL LOCKED

— Core UI —
✓ app/components/AppNav.tsx — LOCKED
✓ app/components/UploadModal.tsx — LOCKED
✓ app/page.tsx — LOCKED
✓ globals.css — LOCKED

— ALL other UI not listed below — LOCKED
✓ app/items/** — LOCKED
✓ app/dashboard/** — LOCKED
✓ app/bots/** — LOCKED
✓ app/messages/** — LOCKED
✓ app/onboarding/** — LOCKED
✓ app/subscription/** — LOCKED

— Infrastructure —
✓ vercel.json — LOCKED
✓ prisma/schema.prisma — READ ONLY

— Sales List Page —
✓ app/projects/ProjectsClient.tsx — LOCKED
✓ app/projects/page.tsx — LOCKED

SURGICAL UNLOCK — These files are explicitly unlocked for THIS COMMAND ONLY:

  app/projects/[id]/ProjectDetailClient.tsx — UNLOCKED (add Sell All feature UI)
  app/api/projects/[id]/route.ts — UNLOCKED (add sellAll PATCH handler)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-5 Locked (through March 19, 2026):
  • All bot AI logic, MegaBot, antique/collectible detection
  • Amazon enrichment, Upload system, Edit Item Form
  • Item Control Center V1+V2, Light Mode, Message Center
  • Bot Hub (11 live + 3 coming soon)
  • Quiz upgrade (4 parts: theme, tone, results, auto-trigger)
  • Fee split correction (1.75% buyer / 1.75% seller)
  • Edit Sale + Dashboard Item Assignment (Items 9+11)
  • Credit system, subscriptions, offers, marketplace, bundles
  • Email system, shipping, billing

IMPORTANT — EXISTING API HANDLERS TO PRESERVE:
  The PATCH route at /api/projects/[id] already handles:
    name, description, startDate, endDate, location, city, state, status, type
    addItemId, removeItemId, publishAll
  ADD the sellAll handler WITHOUT breaking any of these.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

For this command: Track when a "Sell All" offer is created — the discount
percentage, total value, items included. This data helps us understand
bulk selling patterns and optimize pricing recommendations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Always follow this sequence. Never skip steps. Close the loop every time.

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this command: API handler (add sellAll to PATCH) → UI (add Sell All panel).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. DEMO_MODE=true.
Both test accounts are Tier 4 Estate Manager with full access.

THE "SELL ALL" CONCEPT:
  When a seller has an entire sale (estate sale, garage sale, etc.) and wants
  to move EVERYTHING quickly, they can create a "Sell All" offer:
    - Set a single discounted price for ALL remaining unsold items
    - Or set a discount percentage off the total estimated value
    - This creates an attractive offer for bulk buyers
    - Think: "Everything in this estate sale for $5,000 (40% off estimated value)"

  This is common in estate sales and moving sales. A buyer comes in and
  says "I'll take everything for one price." LegacyLoop should make this
  easy, premium, and clear.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Make the Sell All feature feel premium and intentional
  — Add a discount slider with real-time price preview
  — Add confirmation dialogs
  — Make this feel like a $1B product

  You MAY NOT:
  — Touch any locked files
  — Break existing PATCH handlers (addItemId, removeItemId, publishAll, edit fields)
  — Change any bot AI or prompt logic
  — Deviate from inline style={{}}
  — Add unapproved npm packages
  — Change schema without explicit approval

  Flag everything outside scope.
  Read FULL component code before writing any command.
  Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

  DEMO_MODE=true in .env — active now.
  Admin account bypasses ALL tier gates and credit deductions.

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
  SENDGRID_API_KEY          SET (new)   New account ryan@legacy-loop.com
  DEMO_MODE                 true        Bypasses all gates
  DATABASE_URL              SET         PostgreSQL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — PENDING SCHEMA MIGRATION

DO ALL AT ONCE — Never piecemeal:
  • User.role, soldPrice Int→Float, soldVia, estimatedValue, priceDelta
  • TradeProposal, AgentSettings, Bundle, BundleItem models
  • quizCompletedAt DateTime? on User

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Sell All Flow: Bulk Discount Sale Feature

Problem: There is no way for a seller to offer their entire sale at a
bulk discount. Estate sale buyers often want to purchase everything at
once for a single reduced price. This feature needs to be obvious,
elegant, and easy to understand.

This command adds:
  1. API: A "sellAll" handler in the PATCH route
  2. UI: A "Sell All" section on the sale detail page with discount controls

SURGICAL UNLOCK:
  app/projects/[id]/ProjectDetailClient.tsx — add Sell All UI
  app/api/projects/[id]/route.ts — add sellAll handler

Expected output:
  - Prominent "Sell All" section on the sales dashboard
  - Discount slider (10%-60%) or fixed price input
  - Real-time preview: "All X items for $Y (Z% off estimated value)"
  - Confirmation before activating
  - Clear visual treatment — feels premium, not desperate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/projects/[id]/ProjectDetailClient.tsx — FULL file (as modified by previous command)
   Find: Component props and types (ProjectInfo, ItemRow, AvailItem)
   Find: project.portfolio and project.itemCount (for calculating bulk price)
   Find: Where to add the Sell All section (after stats row, before items section)

2. Read app/api/projects/[id]/route.ts — FULL file (109 lines)
   Find: PATCH handler (line 35)
   Find: Where to add sellAll handler (after publishAll block, before update fields block)

3. Read app/projects/[id]/page.tsx — READ ONLY
   Find: What data is passed to client (confirm portfolio value available)

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ADD sellAll HANDLER TO API

File: app/api/projects/[id]/route.ts

Add a new handler block in the PATCH function, AFTER the publishAll block
(around line 72) and BEFORE the update project fields block (line 75).

  // Sell All — mark all unsold items as SOLD with bulk pricing
  if (body.sellAll) {
    const { discountPct, bulkPrice } = body.sellAll;

    // Get all unsold items in this project
    const unsoldItems = await prisma.item.findMany({
      where: {
        projectId: id,
        userId: user.id,
        status: { notIn: ["SOLD", "SHIPPED", "COMPLETED"] },
      },
      select: { id: true, listingPrice: true },
    });

    if (unsoldItems.length === 0) {
      return Response.json({ ok: false, error: "No unsold items" });
    }

    // Calculate per-item price if bulk price given
    const perItemPrice = bulkPrice
      ? Math.round((bulkPrice / unsoldItems.length) * 100) / 100
      : null;

    // Mark all as SOLD with the bulk/discounted price
    for (const item of unsoldItems) {
      const soldPrice = perItemPrice ?? Math.round((item.listingPrice ?? 0) * (1 - (discountPct ?? 0) / 100));
      await prisma.item.update({
        where: { id: item.id },
        data: {
          status: "SOLD",
          soldPrice: soldPrice,
          soldAt: new Date(),
        },
      });
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        itemId: unsoldItems[0].id,
        userId: user.id,
        eventType: "SELL_ALL_BULK",
        payload: JSON.stringify({
          projectId: id,
          itemCount: unsoldItems.length,
          discountPct: discountPct ?? null,
          bulkPrice: bulkPrice ?? null,
          perItemPrice,
        }),
      },
    }).catch(() => null);

    // Update project rollup
    updateProjectRollup(id).catch(() => null);

    return Response.json({
      ok: true,
      action: "sellAll",
      itemCount: unsoldItems.length,
      bulkPrice: bulkPrice ?? null,
    });
  }

IMPORTANT: Do NOT move or modify any existing handlers.
Insert this block cleanly between publishAll and the update fields block.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ADD SELL ALL UI SECTION

File: app/projects/[id]/ProjectDetailClient.tsx

Add a "Sell All" section BETWEEN the stats row and the items section.
Only show it when there are unsold items (project.itemCount > project.soldCount).

1. ADD STATE:
   const [showSellAll, setShowSellAll] = useState(false);
   const [sellAllMode, setSellAllMode] = useState<"discount" | "fixed">("discount");
   const [discountPct, setDiscountPct] = useState(25);
   const [fixedPrice, setFixedPrice] = useState("");
   const [sellAllProcessing, setSellAllProcessing] = useState(false);

2. CALCULATE VALUES:
   const unsoldCount = project.itemCount - project.soldCount;
   const unsoldValue = project.portfolio; // estimated value of unsold items
   const discountedPrice = Math.round(unsoldValue * (1 - discountPct / 100));
   const displayPrice = sellAllMode === "discount" ? discountedPrice : (parseFloat(fixedPrice) || 0);
   const savingsAmount = unsoldValue - displayPrice;
   const savingsPct = unsoldValue > 0 ? Math.round((savingsAmount / unsoldValue) * 100) : 0;

3. SELL ALL HANDLER:
   async function executeSellAll() {
     const priceToUse = sellAllMode === "discount" ? discountedPrice : parseFloat(fixedPrice);
     if (!priceToUse || priceToUse <= 0) return;
     if (!confirm(`Sell all ${unsoldCount} items for $${priceToUse.toLocaleString()}? This will mark all unsold items as SOLD.`)) return;
     setSellAllProcessing(true);
     await fetch(`/api/projects/${project.id}`, {
       method: "PATCH",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         sellAll: sellAllMode === "discount"
           ? { discountPct }
           : { bulkPrice: parseFloat(fixedPrice) },
       }),
     });
     setSellAllProcessing(false);
     setShowSellAll(false);
     router.refresh();
   }

4. RENDER THE SECTION:
   Only show when unsoldCount > 0 and sale status is ACTIVE or DRAFT.

   The section should have:

   a) A TOGGLE BUTTON (collapsed by default):
      "💰 Sell Everything" — teal accent, premium feel
      Shows unsold count: "Offer all {unsoldCount} remaining items at a bulk discount"

   b) EXPANDED PANEL (when showSellAll is true):

      HEADER:
        "Sell Everything at Once"
        Subtitle: "Create a bulk offer for all {unsoldCount} unsold items"

      ESTIMATED VALUE DISPLAY:
        "Total estimated value: ${unsoldValue.toLocaleString()}"
        (This uses project.portfolio from the stats)

      MODE TOGGLE (two options — styled as pill buttons):
        "Set Discount %" — user picks a percentage off
        "Set Fixed Price" — user enters a specific dollar amount

      IF DISCOUNT MODE:
        A slider (input type="range") from 10% to 60% in 5% increments
        Default: 25%
        Real-time display:
          "{discountPct}% off"
          "All {unsoldCount} items for ${discountedPrice.toLocaleString()}"
          "Buyer saves ${savingsAmount.toLocaleString()}"

        Slider styling:
          Track: var(--ghost-bg)
          Filled: var(--accent-theme)
          Thumb: accent color, 20px, rounded

        PRESET BUTTONS below slider (quick-select):
          10% | 20% | 25% | 30% | 40% | 50%
          Styled as small pill buttons, selected one highlighted in accent

      IF FIXED PRICE MODE:
        A text input for the dollar amount
        Placeholder: "Enter bulk price..."
        Real-time display:
          "All {unsoldCount} items for ${fixedPrice}"
          "{savingsPct}% off estimated value"
          "Buyer saves ${savingsAmount.toLocaleString()}"

      SUMMARY CARD (always visible in expanded panel):
        Clean card showing:
          - Items included: {unsoldCount}
          - Estimated value: ${unsoldValue.toLocaleString()}
          - Your bulk price: ${displayPrice.toLocaleString()}
          - Discount: {savingsPct}%

      ACTION BUTTONS:
        "Confirm Sell All →" — accent primary, prominent
        "Cancel" — ghost style

      IMPORTANT NOTE (small text below buttons):
        "This will mark all unsold items as SOLD with the bulk price
         distributed evenly across items. This action cannot be undone."

5. VISUAL TREATMENT:
   The Sell All section should feel PREMIUM, not desperate:
   - Use a card with subtle gradient border or accent-dim background
   - The slider should feel smooth and responsive
   - Real-time price updates should feel instant
   - The summary card should feel like a professional quote
   - Think: "Make an offer on this entire collection"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Existing PATCH handlers (name, type, dates, addItemId, removeItemId, publishAll)
  — Edit mode (already working from previous command)
  — Item assignment UX (already working)
  — Any locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  API:
  3. sellAll handler added to PATCH route: yes / no
  4. Existing handlers (addItemId, removeItemId, publishAll, edit fields) preserved: yes / no
  5. sellAll accepts discountPct or bulkPrice: yes / no
  6. Items marked as SOLD with distributed price: yes / no
  7. EventLog created with SELL_ALL_BULK type: yes / no
  8. Project rollup updated after sell all: yes / no

  UI:
  9. "Sell Everything" toggle button visible when unsold items exist: yes / no
  10. Toggle button hidden when all items are sold: yes / no
  11. Expanded panel shows estimated value: yes / no
  12. Discount mode with slider works: yes / no
  13. Fixed price mode with input works: yes / no
  14. Real-time price preview updates: yes / no
  15. Preset discount buttons work: yes / no
  16. Summary card shows accurate numbers: yes / no
  17. Confirmation dialog before executing: yes / no
  18. Page refreshes after sell all: yes / no

  VISUAL:
  19. Section feels premium (not desperate): yes / no
  20. Slider is smooth and responsive: yes / no
  21. Both themes clean: yes / no
  22. All colors use CSS variables: yes / no

  EDIT MODE PRESERVED:
  23. Edit Sale still works after this change: yes / no
  24. Item assignment still works: yes / no

  N+1. All locked files untouched: yes / no
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

  Part B — API sellAll handler: [fixed / issue]
    - Handler added: [yes / no]
    - Existing handlers preserved: [yes / no]
    - EventLog created: [yes / no]

  Part C — Sell All UI: [fixed / issue]
    - Toggle button visible: [yes / no]
    - Discount mode works: [yes / no]
    - Fixed price mode works: [yes / no]
    - Real-time preview: [yes / no]
    - Summary card: [yes / no]
    - Confirmation dialog: [yes / no]
    - Premium feel: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Edit mode preserved: [Confirm]
  — Item assignment preserved: [Confirm]
  — All other PATCH handlers preserved: [Confirm]
  — All locked files verified as untouched

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, missed data collection, out-of-scope items]

  Files modified: [list all — should be exactly 2]
    - app/projects/[id]/ProjectDetailClient.tsx
    - app/api/projects/[id]/route.ts
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
Command Template v9 | LegacyLoop | Sell All Flow
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
