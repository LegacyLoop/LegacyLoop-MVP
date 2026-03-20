LEGACYLOOP — COMMAND TEMPLATE v9
Trade Flow Upgrade + Item Messages Filter + Offer Visibility (Items 13+14 Round 2)
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

  ALWAYS-DARK PANELS: Modals and overlays that are always dark
  MUST use hardcoded colors. NEVER CSS variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Trade files ---'
  wc -l app/items/\[id\]/TradeProposalsPanel.tsx app/items/\[id\]/TradeToggle.tsx
  echo '--- Messages filter ---'
  grep -n 'byItem\|selectedItemFilter' app/messages/MessagesClient.tsx | head -5
  echo '--- Item Control Center trade section ---'
  grep -n 'TradeToggle\|TRADE' app/items/\[id\]/ItemDashboardPanels.tsx | head -5
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT those in SURGICAL UNLOCK below.

SURGICAL UNLOCK:

  TRADE FLOW:
  app/items/[id]/TradeProposalsPanel.tsx — UNLOCKED (show always when trades enabled, not just when proposals exist)
  app/items/[id]/TradeToggle.tsx — UNLOCKED (add link to view trade proposals, show trade activity status)

  ITEM CONTROL CENTER:
  app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED (ItemControlCenter function ONLY — upgrade trade section, fix messages link)

  MESSAGES:
  app/messages/MessagesClient.tsx — UNLOCKED (read itemId from URL search params, pre-filter to that item)

  ACTION PANEL:
  app/components/ItemActionPanel.tsx — UNLOCKED (fix Messages link to include itemId)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All Pass 1-5 + Phase 2 features LOCKED.
Trade APIs (/api/trades/**) are LOCKED and working.
Offer APIs (/api/offers/**) are LOCKED and working.
TradeProposalModal is LOCKED (always-dark, working).
The trade and offer BACKEND works. We are fixing the FRONTEND flow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI upgrades across 5 files. No API changes. No schema changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true. Both test accounts Tier 4 Estate Manager.

THE PROBLEMS WE'RE FIXING:

  1. TRADE INVISIBILITY: The TradeProposalsPanel returns null when there
     are zero proposals. So if a user enables trades, they see NOTHING —
     no proof trades are active, no explanation of how it works, no way
     to know someone could propose. This confuses users.

  2. MESSAGES NOT FILTERED: The Messages quick link in the Item Control
     Center and the slide-out Action Panel go to /messages with no filter.
     Users see ALL messages, not just the ones for the item they were
     looking at. This is confusing and loses context.

  3. OFFER VISIBILITY: Active offers should be surfaced more prominently
     in the Item Control Center when they exist.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Make the trade system feel real and credible
  — Add visual feedback for trade status
  — Improve the empty state for trades

  You MAY NOT:
  — Touch any locked files
  — Change trade or offer API routes
  — Change the TradeProposalModal (already locked)
  — Modify any function other than ItemControlCenter in ItemDashboardPanels.tsx
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

OBJECTIVE — Trade Flow Visibility + Item Messages Filter + Offer Surfacing

Three fixes in one command:

  1. TRADE: Make the trade system visible and credible even with zero proposals
  2. MESSAGES: Fix the Messages link to filter to the specific item's conversations
  3. OFFERS: Surface active offers more prominently in the Item Control Center

SURGICAL UNLOCK: 5 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/items/[id]/TradeProposalsPanel.tsx — FULL (80 lines)
   Find: line 32 — if (loading || proposals.length === 0) return null;
   THIS IS THE CORE PROBLEM. It hides when there are no proposals.

2. Read app/items/[id]/TradeToggle.tsx — FULL (39 lines)
   Find: Toggle state and rendering

3. Read app/items/[id]/ItemDashboardPanels.tsx — ONLY the ItemControlCenter function
   Find: Line ~6537-6545 — TradeToggle + SaleAssignment section
   Find: Line ~6570-6584 — Quick Links section (where Messages link lives)

4. Read app/messages/MessagesClient.tsx — Lines 45-55 and 165-175
   Find: Line 47 — FilterMode type includes "byItem"
   Find: Line 169 — selectedItemFilter state
   Find: Lines 233-234 — byItem filter logic
   Confirm: The filter ALREADY works. We just need to read itemId from URL params.

5. Read app/components/ItemActionPanel.tsx — Lines 1023-1030
   Find: The Messages quick link (currently links to /messages)

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — FIX TradeProposalsPanel: ALWAYS SHOW WHEN TRADES ENABLED

File: app/items/[id]/TradeProposalsPanel.tsx (80 lines)

PROBLEM: Line 32 returns null when proposals.length === 0.
This means the panel is INVISIBLE when trades are enabled but no one
has proposed yet. Users see no proof that trades are working.

FIX: Change the component to ALWAYS render when not loading.
When there are zero proposals, show a helpful empty state instead of null.

Change line 32 from:
  if (loading || proposals.length === 0) return null;
To:
  if (loading) return null;

Then add an empty state rendering BELOW the header when proposals.length === 0:

  {proposals.length === 0 && (
    <div style={{
      textAlign: "center",
      padding: "1.25rem 1rem",
      background: "var(--bg-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "0.75rem",
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔄</div>
      <div style={{
        fontSize: "0.85rem",
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: "0.25rem",
      }}>
        Trades are enabled
      </div>
      <div style={{
        fontSize: "0.75rem",
        color: "var(--text-muted)",
        lineHeight: 1.5,
      }}>
        Buyers can propose items in exchange for yours.
        When someone makes an offer, it will appear here
        with options to accept, decline, or counter.
      </div>
    </div>
  )}

But ALSO — make the panel aware of whether trades are actually enabled.
Currently it always fetches proposals. Add a check:

  Add a new prop: tradeEnabled?: boolean
  If tradeEnabled is explicitly false, return null.
  If tradeEnabled is true or undefined, show the panel.

  UPDATE the component signature:
    export default function TradeProposalsPanel({ itemId, tradeEnabled }: { itemId: string; tradeEnabled?: boolean }) {

  Add at line 32:
    if (loading) return null;
    if (tradeEnabled === false && proposals.length === 0) return null;

This way:
  - Trades enabled + proposals exist → show proposals
  - Trades enabled + no proposals → show empty state
  - Trades disabled + no proposals → hide (return null)
  - Trades disabled + proposals exist → show proposals (historical)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — UPGRADE TradeToggle: ADD STATUS INFO AND LINK

File: app/items/[id]/TradeToggle.tsx (39 lines)

Add more context to the trade toggle:

1. When trades are ENABLED, show a small info section below the toggle:
   "🟢 Trade proposals are visible to buyers on your store page.
    When someone proposes a trade, you'll see it in the Trade Proposals
    panel below."

2. When trades are DISABLED, show:
   "Trades are off. Enable to let buyers propose item exchanges."

3. Add a subtle count if proposals exist:
   Fetch the count from /api/trades/{itemId} (already done in the useEffect,
   just need to expose the count).
   If proposals > 0: "📬 {count} trade proposal{s}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — FIX MESSAGES LINK IN ITEM CONTROL CENTER

File: app/items/[id]/ItemDashboardPanels.tsx (ItemControlCenter function ONLY)

Find the Quick Links section (around line 6570-6584).
The Messages link currently goes to /messages with no filter:

  <a href="/messages" ...>💬 Messages</a>

Change to include the itemId as a URL parameter:

  <a href={`/messages?itemId=${itemId}`} ...>💬 Item Messages</a>

This passes the item's ID to the Messages page so it can pre-filter.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — FIX MESSAGES LINK IN ACTION PANEL

File: app/components/ItemActionPanel.tsx

Find the Messages link in the Manage section or wherever Messages is referenced.
Same fix — add itemId as URL param:

  Any link to /messages → /messages?itemId=${item.id}

CRITICAL: This is an ALWAYS-DARK panel. Use hardcoded colors only.
Only change the href, not the styling.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — READ itemId PARAM IN MESSAGES CLIENT

File: app/messages/MessagesClient.tsx

The component already has:
  - filterMode state with "byItem" option (line 47)
  - selectedItemFilter state (line 169)
  - Filter logic that works when byItem + selectedItemFilter are set (lines 233-234)

We need to READ the itemId from URL search params on mount and pre-set the filter.

ADD to the component (it's already "use client"):

  1. Import useSearchParams:
     import { useSearchParams } from "next/navigation";

     NOTE: If useSearchParams requires a Suspense boundary, check if one
     already exists. The messages page may already have one. If not, wrap
     the component or handle it cleanly.

  2. At the top of the component function, read the param:
     const searchParams = useSearchParams();
     const initialItemId = searchParams.get("itemId") || "";

  3. Update the state initializers:
     From: const [filterMode, setFilterMode] = useState<FilterMode>("all");
     To:   const [filterMode, setFilterMode] = useState<FilterMode>(initialItemId ? "byItem" : "all");

     From: const [selectedItemFilter, setSelectedItemFilter] = useState<string>("");
     To:   const [selectedItemFilter, setSelectedItemFilter] = useState<string>(initialItemId);

  4. When itemId param is present, the Messages page will automatically:
     - Set filterMode to "byItem"
     - Set selectedItemFilter to the itemId
     - Filter conversations to only show that item's conversations
     - Users see ONLY the messages for the item they came from

  5. The existing "All" tab should still work to clear the filter:
     When user clicks "All", it resets filterMode to "all" and clears
     selectedItemFilter — this already happens in the existing code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — SURFACE ACTIVE OFFERS IN ITEM CONTROL CENTER

File: app/items/[id]/ItemDashboardPanels.tsx (ItemControlCenter function ONLY)

ActiveOffersWidget is already imported at line 19.
Check if it's rendered inside the ItemControlCenter function.
If NOT, add it as a section between the Trade section and the Quick Links:

  {/* Active Offers */}
  <div style={{ marginBottom: "0.5rem" }}>
    <ActiveOffersWidget itemId={itemId} />
  </div>

If it IS already rendered somewhere else on the page, that's fine —
but check if the ItemControlCenter should also have a quick indicator
showing "2 active offers" or similar.

The key is that when someone is looking at an item's control center,
they should see at a glance: status, actions, trades, offers, and messages.
Everything in one place.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Trade APIs (/api/trades/**)
  — Offer APIs (/api/offers/**)
  — TradeProposalModal (locked, always-dark)
  — Any function other than ItemControlCenter in ItemDashboardPanels.tsx
  — Schema

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  TRADE FLOW:
  3. TradeProposalsPanel shows empty state when trades enabled + 0 proposals: yes / no
  4. TradeProposalsPanel hides when trades disabled + 0 proposals: yes / no
  5. TradeProposalsPanel shows proposals when they exist (regardless of toggle): yes / no
  6. TradeToggle shows info text when enabled: yes / no
  7. TradeToggle shows info text when disabled: yes / no

  MESSAGES:
  8. Item Control Center Messages link includes ?itemId=: yes / no
  9. Action Panel Messages link includes ?itemId=: yes / no
  10. MessagesClient reads itemId from URL params: yes / no
  11. MessagesClient pre-filters to byItem when itemId present: yes / no
  12. "All" tab still clears the filter: yes / no

  OFFERS:
  13. Active offers visible in Item Control Center: yes / no

  LIGHT + DARK:
  14. TradeProposalsPanel empty state uses CSS variables: yes / no
  15. TradeToggle info text uses CSS variables: yes / no
  16. Action Panel changes use hardcoded colors (always-dark): yes / no

  N+1. All locked files untouched: yes / no
  N+2. API routes untouched: yes / no
  N+3. Only ItemControlCenter function modified in ItemDashboardPanels.tsx: yes / no
  N+4. inline style={{}} throughout: yes / no
  N+5. npx tsc --noEmit: 0 errors
  N+6. npm run build: pass
  N+7. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — TradeProposalsPanel: [fixed / issue]
    - Empty state shown: [yes / no]
    - Hides when disabled + no proposals: [yes / no]
  Part C — TradeToggle: [fixed / issue]
    - Info text shown: [yes / no]
  Part D — Item Control Center Messages link: [fixed / issue]
  Part E — Action Panel Messages link: [fixed / issue]
  Part F — MessagesClient pre-filter: [fixed / issue]
    - Reads itemId param: [yes / no]
    - Pre-filters correctly: [yes / no]
  Part G — Active Offers in Control Center: [fixed / issue]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Trade APIs: [Confirm]
  — Offer APIs: [Confirm]
  — TradeProposalModal: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list — should be up to 5]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Trade Flow + Messages Filter + Offer Visibility
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
