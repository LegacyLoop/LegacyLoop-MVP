LEGACYLOOP — COMMAND TEMPLATE v9
Trade Panel Integration — Merge Trade Proposals Into Item Control Center
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

Copy this entire command into Claude Code. Never skip sections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

  All styles inline style={{}} — NO Tailwind. NO external CSS.
  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
  ELON MUSK STANDARD: This must feel like a $1B product.
  Think Tesla center console — dense, smart, fast.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Trade panel location ---'
  grep -n 'TradeProposalsPanel' app/items/\[id\]/page.tsx
  grep -n 'TradeToggle' app/items/\[id\]/ItemDashboardPanels.tsx | head -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/items/[id]/page.tsx — UNLOCKED (remove standalone TradeProposalsPanel)
  app/items/[id]/TradeToggle.tsx — UNLOCKED (expand to include trade proposals inline)
  app/items/[id]/TradeProposalsPanel.tsx — UNLOCKED (restructure for inline embedding)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4-11 — Same as all previous commands. All features locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Merge Trade Proposals Into the Trade Toggle Section

PROBLEM: The Trade Proposals panel currently renders as a STANDALONE
ugly box on the item page (line 363 of page.tsx), completely disconnected
from the Item Control Center. It looks unprofessional and confusing.
The "Accept Trades" toggle in the Item Control Center has no way to
view or manage proposals — they're in a separate panel above.

SOLUTION: Integrate trade proposals INSIDE the TradeToggle component.
The TradeToggle becomes a self-contained trade management section:
  - Toggle on/off (already works)
  - Status text (already added)
  - When trades enabled + proposals exist: show proposals INLINE
  - When trades enabled + no proposals: show the "waiting for proposals" state
  - Expandable/collapsible so it doesn't take up too much space

Remove the standalone TradeProposalsPanel from page.tsx entirely.

SURGICAL UNLOCK: 3 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/items/[id]/page.tsx — Lines 360-365
   Find: Line 363 — standalone <TradeProposalsPanel itemId={item.id} />
   This is what we're REMOVING.

2. Read app/items/[id]/TradeToggle.tsx — FULL (53 lines, recently upgraded)
   Find: The toggle switch, enabled/disabled state, proposal count fetch
   This is where we're ADDING the proposals inline.

3. Read app/items/[id]/TradeProposalsPanel.tsx — FULL (110 lines, recently upgraded)
   Find: The proposals fetch, accept/decline handlers, proposal cards
   Find: The empty state ("Trades are enabled" card)
   We're MERGING this logic into TradeToggle.

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — REMOVE STANDALONE PANEL FROM PAGE

File: app/items/[id]/page.tsx

Remove the standalone TradeProposalsPanel section (lines ~361-364):

  DELETE:
    {/* ═══ Trade Proposals ═══ */}
    <div style={{ marginTop: "1rem" }}>
      <TradeProposalsPanel itemId={item.id} />
    </div>

  Also remove the import at line 14:
    import TradeProposalsPanel from "./TradeProposalsPanel";

  The trade functionality will now live INSIDE the TradeToggle component
  which is already rendered in the Item Control Center.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — EXPAND TRADETOGGLE TO INCLUDE PROPOSALS

File: app/items/[id]/TradeToggle.tsx

Merge the TradeProposalsPanel logic into TradeToggle. The component
becomes a complete trade management section:

1. ADD STATE for proposals:
   const [proposals, setProposals] = useState<any[]>([]);
   const [proposalsLoading, setProposalsLoading] = useState(true);
   const [responding, setResponding] = useState<string | null>(null);
   const [expanded, setExpanded] = useState(false);

2. FETCH proposals in the existing useEffect (alongside the trade settings fetch):
   Already fetches /api/trades/{itemId} for count — now also save the full proposals:

   fetch(`/api/trades/${itemId}`).then(r => r.json()).then(d => {
     const allProposals = d.proposals || [];
     setProposals(allProposals);
     setProposalCount(allProposals.filter((p: any) => p.status === "PENDING").length);
     setProposalsLoading(false);
   }).catch(() => { setProposalsLoading(false); });

3. ADD respond handler (from TradeProposalsPanel):
   async function respond(tradeId: string, action: string) {
     if (action === "DECLINE" && !confirm("Decline this trade proposal?")) return;
     setResponding(tradeId);
     try {
       const res = await fetch("/api/trades/respond", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ tradeId, action }),
       });
       if (res.ok) {
         setProposals(prev => prev.map(p =>
           p.id === tradeId
             ? { ...p, status: action === "ACCEPT" ? "ACCEPTED" : action === "DECLINE" ? "DECLINED" : "COUNTERED" }
             : p
         ));
         setProposalCount(prev => Math.max(0, prev - 1));
       }
     } catch {}
     setResponding(null);
   }

4. RENDER — The component now has three visual states:

   STATE 1: Trades DISABLED
     - Toggle switch (off position)
     - "Trades are off. Enable to let buyers propose item exchanges."
     - No proposals shown

   STATE 2: Trades ENABLED, no proposals (or proposals loading)
     - Toggle switch (on position)
     - 🟢 "Trade proposals are visible to buyers"
     - Subtle hint text: "When someone proposes a trade, it will appear here"

   STATE 3: Trades ENABLED, proposals exist
     - Toggle switch (on position)
     - 🟢 "Trade proposals are visible to buyers · 📬 X pending"
     - EXPANDABLE SECTION: Click "View X proposals" to expand
     - When expanded, show proposal cards inline (same styling as TradeProposalsPanel had)
     - Each proposal card: buyer name, items offered, cash added, total value,
       Accept/Decline buttons for PENDING proposals
     - Collapse button to hide proposals again

5. EXPAND/COLLAPSE UX:
   When there are proposals, show a clickable bar:
     "📬 {pending.length} pending · {proposals.length} total — View →"

   Clicking expands the section with a smooth height transition.
   The proposals render inside the same card, below the toggle.
   This keeps everything in ONE clean, integrated unit.

   When no proposals exist but trades are enabled:
     Show the "waiting for proposals" text inline (no separate card)

6. STYLING:
   Keep the existing card style with teal left border.
   The expanded proposals section should feel like an accordion:
     - Same background, same card
     - Proposals listed with subtle separators
     - Accept (teal) and Decline (red outline) buttons
     - Compact proposal cards — buyer name, items, value, actions
     - All using CSS variables for theme-aware surfaces

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — CLEAN UP TradeProposalsPanel.tsx

File: app/items/[id]/TradeProposalsPanel.tsx

Since the proposals are now rendered inside TradeToggle, this file
is no longer imported anywhere. Two options:

  OPTION A (preferred): Keep the file but make it a no-op.
    Change the export to: export default function TradeProposalsPanel() { return null; }
    This way if anything else imports it, it won't break.

  OPTION B: Delete the file entirely if nothing else imports it.
    Check: grep -r "TradeProposalsPanel" app/ to verify only page.tsx imported it.
    If only page.tsx imported it (and we removed that import in Part B),
    the file can safely be an empty export.

  Use OPTION A for safety.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Trade API routes (locked)
  — ItemDashboardPanels.tsx (locked — it renders TradeToggle, which is what we're upgrading)
  — ItemActionPanel.tsx (locked)
  — Any other files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. All reads complete: yes / no

  STANDALONE REMOVED:
  3. TradeProposalsPanel import removed from page.tsx: yes / no
  4. TradeProposalsPanel JSX removed from page.tsx: yes / no
  5. No ugly standalone trade box on the page: yes / no

  INTEGRATED TRADE TOGGLE:
  6. Trades disabled: shows toggle + "enable" text: yes / no
  7. Trades enabled, no proposals: shows toggle + "visible to buyers" + hint: yes / no
  8. Trades enabled, proposals exist: shows toggle + expand bar: yes / no
  9. Expand shows proposal cards inline: yes / no
  10. Accept button works on PENDING proposals: yes / no
  11. Decline button works with confirmation: yes / no
  12. Collapse hides proposals: yes / no
  13. Everything in one clean card with teal left border: yes / no

  CLEANUP:
  14. TradeProposalsPanel.tsx returns null or is cleaned: yes / no

  N+1. All locked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. CSS variables on theme-aware surfaces: yes / no
  N+4. npx tsc --noEmit: 0 errors
  N+5. npm run build: pass
  N+6. CHECKPOINT post-change: pass
  N+7. Light mode tested: yes / no
  N+8. Dark mode tested: yes / no

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Standalone removed: [fixed / issue]
    - Import removed: [yes / no]
    - JSX removed: [yes / no]

  Part C — Integrated TradeToggle: [fixed / issue]
    - Proposals fetch: [yes / no]
    - Accept/Decline: [yes / no]
    - Expand/collapse: [yes / no]
    - Clean integrated look: [yes / no]

  Part D — Cleanup: [fixed / issue]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  Files modified: [list — should be 3]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Trade Panel Integration
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
