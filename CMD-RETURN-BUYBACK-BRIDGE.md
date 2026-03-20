LEGACYLOOP — COMMAND TEMPLATE v9
Return + Buyback Bridge — Relist, Refund Management, and Seller Recovery Flow
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
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Refund API check ---'
  ls app/api/refunds/route.ts app/api/refunds/\[itemId\]/route.ts 2>/dev/null
  echo '--- Item Control Center ---'
  grep -n 'function ItemControlCenter' app/items/\[id\]/ItemDashboardPanels.tsx
  echo '--- Action panel SOLD actions ---'
  grep -n 'SOLD\|SHIPPED\|COMPLETED' app/components/ItemActionPanel.tsx | head -10
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT those in SURGICAL UNLOCK below.

— Refund API Routes — READ ONLY (already built, DO NOT modify):
✓ app/api/refunds/route.ts — POST (buyer request), GET (seller list)
✓ app/api/refunds/[itemId]/route.ts — PATCH (seller approve/deny)

SURGICAL UNLOCK:

  app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED (ItemControlCenter function ONLY — add Returns & Relisting section)
  app/components/ItemActionPanel.tsx — UNLOCKED (add Relist + Return actions for SOLD/SHIPPED/COMPLETED statuses)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All Pass 1-5 + Phase 2 Items 9-14 + all added items — LOCKED.
Trade Center (with expandable proposals + example card) — LOCKED.
Refund/Return API routes — LOCKED (already built and working).

IMPORTANT — EXISTING REFUND API:
  POST /api/refunds — buyer requests refund (body: itemId, reason, description, buyerEmail)
  GET /api/refunds — seller gets refund requests (as EventLog entries)
  PATCH /api/refunds/[itemId] — seller approves or denies (body: action "approve"|"deny", reason?)
    - Approve: marks earnings "refunded", ledger "refunded", relists item to LISTED
    - Deny: logs denial event
    - Processing fee is NON-REFUNDABLE

  DO NOT modify these API routes. Build the UI that CALLS them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.
Relist actions, refund requests, and refund decisions are already
logged as EventLog entries by the API.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI only. The API is built. We are building the frontend that CALLS it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true. Both test accounts Tier 4 Estate Manager.

THE RETURN/BUYBACK CONCEPT:
  When a sale falls through — buyer changes mind, item damaged in transit,
  buyer never picks up — the seller needs to:
  1. Move the item back from SOLD/SHIPPED → LISTED (relist it)
  2. Handle any refund request from the buyer
  3. See the history of what happened

  This also covers "buyback" — when the seller decides to keep the item
  or take it back from the buyer (reverse the sale).

  Current status flow: DRAFT → ANALYZED → READY → LISTED → INTERESTED → SOLD → SHIPPED → COMPLETED
  The return flow is: SOLD/SHIPPED → back to LISTED (via relist)
  Refund handling: approve (auto-relists) or deny

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Make the return/relist flow feel professional and trustworthy
  — Add confirmation dialogs for significant actions
  — Show clear explanations of what happens when relisting
  — Make refund management feel like a real commerce feature

  You MAY NOT:
  — Touch any locked files
  — Modify the refund API routes
  — Modify any function other than ItemControlCenter in ItemDashboardPanels.tsx
  — Change the status flow (the API handles status changes)
  — Deviate from inline style={{}}

  IMPORTANT: ItemActionPanel is ALWAYS-DARK. Use hardcoded colors there.
  ItemDashboardPanels is theme-aware. Use CSS variables there.

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

No changes in this command. The schema TODO at line 10 of schema.prisma
notes: "Returns flow — add RETURN_REQUESTED, RETURNED, REFUNDED statuses."
This is for a future migration. For now, we use the existing status flow
and EventLog entries to track returns.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Return + Buyback Bridge: Relist, Refund, and Recovery Flow

Problem: When an item is SOLD, SHIPPED, or COMPLETED, there is NO way to:
  - Relist it (move back to LISTED if the sale falls through)
  - View or manage refund requests from buyers
  - Handle "buyback" scenarios (seller takes item back)
The refund API exists and works, but there's zero UI for it.

This command adds:
  1. "Returns & Relisting" section in the Item Control Center for SOLD/SHIPPED items
  2. "Relist Item" action with confirmation
  3. Refund request management (fetch, view, approve, deny)
  4. Matching actions in the slide-out Action Panel

SURGICAL UNLOCK: 2 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/api/refunds/route.ts — FULL (140 lines) — READ ONLY
   Find: POST handler (buyer requests refund — takes itemId, reason)
   Find: GET handler (returns refund EventLog entries for seller's items)

2. Read app/api/refunds/[itemId]/route.ts — FULL (107 lines) — READ ONLY
   Find: PATCH handler (approve → relists item to LISTED, deny → logs)

3. Read app/items/[id]/ItemDashboardPanels.tsx — ItemControlCenter function ONLY
   Find: Where to add the Returns & Relisting section
   Find: The existing "Sale Details" section for SOLD/SHIPPED/COMPLETED (around line 6547-6568)
   This is where we ADD the new section — AFTER sale details, BEFORE quick links.

4. Read app/components/ItemActionPanel.tsx — Lines 539-560
   Find: SOLD, SHIPPED, COMPLETED status CTA rendering
   Currently SOLD shows "Arrange Shipping" + "Mark Shipped"
   Currently SHIPPED shows "Track Shipment" + "Mark Delivered"
   Currently COMPLETED shows "View Full Item"
   We ADD "Relist Item" as an additional action for these statuses.

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ADD RETURNS & RELISTING SECTION TO ITEM CONTROL CENTER

File: app/items/[id]/ItemDashboardPanels.tsx (ItemControlCenter function ONLY)

Only show this section when status is SOLD, SHIPPED, or COMPLETED.
Add it AFTER the existing "Sale Details" section and BEFORE "Quick Links".

1. ADD STATE for refund data:
   const [refundRequests, setRefundRequests] = useState<any[]>([]);
   const [refundLoading, setRefundLoading] = useState(false);
   const [refundActionLoading, setRefundActionLoading] = useState<string | null>(null);
   const [relistLoading, setRelistLoading] = useState(false);

2. ADD FETCH for refund requests (only for SOLD/SHIPPED/COMPLETED):
   useEffect that fetches GET /api/refunds and filters for this itemId:

   useEffect(() => {
     if (!["SOLD", "SHIPPED", "COMPLETED"].includes(status)) return;
     setRefundLoading(true);
     fetch("/api/refunds")
       .then(r => r.json())
       .then(data => {
         const itemRefunds = (data.refunds || []).filter((r: any) => r.itemId === itemId);
         setRefundRequests(itemRefunds);
       })
       .catch(() => {})
       .finally(() => setRefundLoading(false));
   }, [itemId, status]);

3. ADD RELIST HANDLER:
   async function relistItem() {
     if (!confirm("Relist this item? It will move back to LISTED status and be visible to buyers again.")) return;
     setRelistLoading(true);
     try {
       await fetch(`/api/items/status/${itemId}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: "LISTED" }),
       });
       router.refresh();
     } catch {}
     setRelistLoading(false);
   }

4. ADD REFUND RESPONSE HANDLER:
   async function handleRefund(action: "approve" | "deny") {
     const msg = action === "approve"
       ? "Approve this refund? The item will be relisted and earnings marked as refunded. Processing fee is non-refundable."
       : "Deny this refund request?";
     if (!confirm(msg)) return;
     setRefundActionLoading(action);
     try {
       await fetch(`/api/refunds/${itemId}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ action }),
       });
       router.refresh();
     } catch {}
     setRefundActionLoading(null);
   }

5. RENDER THE SECTION:
   Only visible when status is SOLD, SHIPPED, or COMPLETED.

   Section label: "🔄 Returns & Relisting"

   CONTENT:

   A) RELIST BUTTON (always visible for SOLD/SHIPPED):
      A prominent card/button:
        "🔄 Relist This Item"
        Subtitle: "Sale fell through? Move this item back to LISTED so buyers can find it again."
        Style: Ghost button, full width, teal border, var(--accent-theme) text
        onClick: relistItem()
        disabled: relistLoading
        Note below: "This does not process a refund — it only changes the item status."

   B) REFUND REQUESTS (if any exist):
      Show a "Refund Requests" subsection:
      For each refund request:
        - Type badge (refund_requested / refund_approved / refund_denied)
        - Reason text
        - Date
        - For PENDING requests: Approve + Deny buttons

      Color coding:
        refund_requested → amber/yellow badge "Pending Review"
        refund_approved → green badge "Approved"
        refund_denied → red badge "Denied"

   C) REFUND EMPTY STATE (if no refund requests):
      "No refund requests for this item."
      Small muted text.

   D) HOW RETURNS WORK (always visible, collapsed by default):
      An expandable "How Returns Work" section (similar to Trade Center):

      "How Returns Work:
       1. Buyer requests a return through our platform
       2. You review the request and approve or deny
       3. If approved, the item is automatically relisted
       4. Processing fees are non-refundable per our terms
       5. Refund is issued to the buyer (minus processing fee)"

   E) FOR COMPLETED ITEMS:
      Show a softer version: "This sale is complete. You can still relist
      the item if needed, but no refund processing will occur."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ADD RELIST ACTION TO SLIDE-OUT ACTION PANEL

File: app/components/ItemActionPanel.tsx

CRITICAL: This is an ALWAYS-DARK panel. Use HARDCODED colors only.

In the renderStatusActions function, add a "Relist Item" action for
SOLD, SHIPPED, and COMPLETED statuses:

FOR SOLD STATUS (around line 539-545):
  Currently shows: "Arrange Shipping" + "Mark as Shipped"
  ADD: ctaSecondary("🔄 Relist Item", async () => {
    if (confirm("Relist this item? It will move back to LISTED.")) {
      await onStatusChange("LISTED");
    }
  })

FOR SHIPPED STATUS (around line 547-553):
  Currently shows: "Track Shipment" + "Mark Delivered"
  ADD: ctaSecondary("🔄 Relist Item", async () => {
    if (confirm("Relist this item? It will move back to LISTED.")) {
      await onStatusChange("LISTED");
    }
  })

FOR COMPLETED STATUS (line 555-556):
  Currently shows: "View Full Item"
  ADD: ctaSecondary("🔄 Relist Item", async () => {
    if (confirm("Relist this item? It will move back to LISTED.")) {
      await onStatusChange("LISTED");
    }
  })

This gives users a way to relist from the quick action panel too.
The actual status change is handled by the existing onStatusChange prop
which calls PATCH /api/items/status/[itemId].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Refund API routes (locked, working)
  — Status flow logic (API handles it)
  — Any other function in ItemDashboardPanels.tsx
  — Trade Center, Sell All, Edit Sale, or any other locked feature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. All reads complete: yes / no

  ITEM CONTROL CENTER:
  3. Returns & Relisting section visible for SOLD items: yes / no
  4. Returns & Relisting section visible for SHIPPED items: yes / no
  5. Returns & Relisting section visible for COMPLETED items: yes / no
  6. Returns section HIDDEN for DRAFT/ANALYZED/READY/LISTED: yes / no
  7. Relist button works (confirmation + status change): yes / no
  8. Refund requests fetched from GET /api/refunds: yes / no
  9. Refund approve calls PATCH /api/refunds/[itemId] with "approve": yes / no
  10. Refund deny calls PATCH /api/refunds/[itemId] with "deny": yes / no
  11. Empty state shows when no refund requests: yes / no
  12. "How Returns Work" explanation visible: yes / no

  ACTION PANEL:
  13. "Relist Item" action visible for SOLD status: yes / no
  14. "Relist Item" action visible for SHIPPED status: yes / no
  15. "Relist Item" action visible for COMPLETED status: yes / no
  16. Relist confirmation dialog works: yes / no
  17. Action panel uses hardcoded colors (always-dark): yes / no

  VISUAL:
  18. Item Control Center uses CSS variables: yes / no
  19. Both light and dark mode clean: yes / no

  N+1. All locked files untouched: yes / no
  N+2. Refund API routes untouched: yes / no
  N+3. Only ItemControlCenter function modified in ItemDashboardPanels.tsx: yes / no
  N+4. inline style={{}} throughout: yes / no
  N+5. npx tsc --noEmit: 0 errors
  N+6. npm run build: pass
  N+7. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Item Control Center Returns section: [fixed / issue]
    - Relist button: [yes / no]
    - Refund management: [yes / no]
    - Empty state: [yes / no]
    - How Returns Work: [yes / no]

  Part C — Action Panel Relist action: [fixed / issue]
    - SOLD relist: [yes / no]
    - SHIPPED relist: [yes / no]
    - COMPLETED relist: [yes / no]
    - Always-dark colors: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Refund API routes: [Confirm]
  — Trade Center: [Confirm]
  — All other Item Control Center sections: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list — should be 2]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Return + Buyback Bridge (Item 15)
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
