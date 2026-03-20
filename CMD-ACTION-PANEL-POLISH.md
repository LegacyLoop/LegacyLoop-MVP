LEGACYLOOP — COMMAND TEMPLATE v9
Item Action Panel — Elon-Level Slide-Out Panel Polish
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

  ELON MUSK STANDARD: This must feel like a $1B product.
  Every interaction must feel responsive and purposeful.
  Think Tesla center console — dense, smart, fast.

  CRITICAL: The ItemActionPanel is an ALWAYS-DARK slide-out overlay.
  It uses rgba(8,8,12,0.98) background with blur.
  ALL TEXT must use HARDCODED light colors — #fff, rgba(255,255,255,...).
  NEVER use CSS variables like var(--text-primary) in this panel —
  they invert to dark in light mode and become invisible.
  The panel is always dark regardless of theme mode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Action Panel check ---'
  wc -l app/components/ItemActionPanel.tsx
  grep -n 'function ItemActionPanel\|export default' app/components/ItemActionPanel.tsx
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/components/ItemActionPanel.tsx — UNLOCKED (add features + visual polish to always-dark slide-out panel)

All other files remain LOCKED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All Pass 1-5 + Phase 2 features LOCKED.
The ItemActionPanel structure is SOLID — slide animation, mobile bottom-sheet,
context-sensitive CTAs, sale assignment, 10-bot grid, item snapshot, manage
section with delete confirmation. We are ADDING features and POLISHING.
Do NOT remove or break any existing functionality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently.
Share/copy actions could be tracked as engagement signals.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI upgrade only. Single file. No API changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true. Both test accounts Tier 4 Estate Manager.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Add new features listed in the OBJECTIVE
  — Improve visual polish and spacing
  — Add hover states and interaction feedback
  — Improve the bot grid routing
  — Make the panel feel more like a command center

  You MAY NOT:
  — Touch any other files
  — Use CSS variables for text/colors (this is ALWAYS-DARK)
  — Remove any existing functionality
  — Change the slide animation or mobile behavior
  — Change the sale assignment logic
  — Deviate from inline style={{}}

  CRITICAL REMINDER: This panel is ALWAYS DARK.
  Use hardcoded colors: #fff, rgba(255,255,255,...), #00bcd4, etc.
  NEVER var(--text-primary) or any CSS variable for colors.

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

OBJECTIVE — Item Action Panel: Elon-Level Polish + New Features

The ItemActionPanel (app/components/ItemActionPanel.tsx, 1,141 lines) is the
slide-out panel that opens when a user taps an item on the dashboard. It's
already solid with status CTAs, sale assignment, bot grid, snapshot, and
manage section. This command adds 5 targeted features and visual polish.

SURGICAL UNLOCK:
  app/components/ItemActionPanel.tsx — 1 file

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

Read app/components/ItemActionPanel.tsx — FULL file (1,141 lines)

Find these sections:
  Lines 88-118: PanelItem + BotStatusMap types + Props interface
  Lines 120-291: Component state, effects, handlers (sale assignment, status change, delete, price)
  Lines 302-314: Bot grid data (10 bots)
  Lines 316-433: Helper functions (sectionLabel, sectionDivider, ctaPrimary, ctaSecondary, ghostBtn)
  Lines 435-561: renderStatusActions() — context-sensitive CTAs per status
  Lines 563-587: Item snapshot data
  Lines 588-640: Panel wrapper JSX (backdrop, panel, header)
  Lines 710-737: SECTION 1 — Status & Actions
  Lines 739-908: SECTION 1.5 — Sale Assignment
  Lines 910-977: SECTION 2 — AI Bot Suite
  Lines 979-1019: SECTION 3 — Item Snapshot
  Lines 1023-1117: SECTION 4 — Manage (View Dashboard, Edit, Delete)
  Lines 1120-1136: Footer (LegacyLoop branding)

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ADD "SHARE ITEM" TO MANAGE SECTION

In SECTION 4 — Manage (around line 1023), add a "Share Item" ghost button
AFTER "View Full Item Dashboard" and "Edit Item Details":

  Add a state variable:
    const [shareCopied, setShareCopied] = useState(false);

  Add a handler:
    const copyShareLink = () => {
      const url = `${window.location.origin}/items/${item.id}`;
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }).catch(() => {});
    };

  Render using the existing ghostBtn pattern BUT with custom feedback:

    <button
      onClick={copyShareLink}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '12px 14px', minHeight: '46px',
        background: shareCopied ? 'rgba(0,188,212,0.08)' : 'transparent',
        border: shareCopied ? '1px solid rgba(0,188,212,0.25)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', cursor: 'pointer', fontSize: '14px',
        fontWeight: 500,
        color: shareCopied ? '#00bcd4' : 'rgba(255,255,255,0.8)',
        textAlign: 'left', transition: 'all 0.2s ease', marginBottom: '6px',
      }}
    >
      <span style={{ fontSize: '16px', width: '22px', textAlign: 'center', flexShrink: 0 }}>
        {shareCopied ? '✓' : '📤'}
      </span>
      <span style={{ flex: 1 }}>{shareCopied ? 'Link Copied!' : 'Share Item'}</span>
      {!shareCopied && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', flexShrink: 0 }}>→</span>}
    </button>

  Place it AFTER "Edit Item Details" and BEFORE the delete danger zone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — ADD "ADD NEW ITEM" TO MANAGE SECTION

In SECTION 4 — Manage, add an "Add New Item" ghost button AFTER "Share Item"
and BEFORE the delete danger zone:

  Use the existing ghostBtn helper:
    {ghostBtn("📷", "Add New Item", () => { onClose(); router.push("/items/new"); })}

  This closes the panel and navigates to the new item page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — NET EARNINGS PREVIEW BELOW LISTING PRICE

In the listing price section (around lines 450-520 in renderStatusActions,
specifically the showPriceInput flow), add a net earnings preview below
the price input:

  When priceInput has a value > 0, show:
    const priceNum = parseFloat(priceInput) || 0;
    const estCommission = Math.round(priceNum * 0.05 * 100) / 100; // ~5% estimate
    const estSellerFee = Math.round(priceNum * 0.0175 * 100) / 100; // 1.75% seller fee
    const estNet = Math.round((priceNum - estCommission - estSellerFee) * 100) / 100;

  Display below the price input (inside the showPriceInput block):
    {priceInput && parseFloat(priceInput) > 0 && (
      <div style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.45)',
        marginTop: '6px',
        lineHeight: 1.4,
      }}>
        You'll keep ~<span style={{ color: '#4ade80', fontWeight: 600 }}>${estNet.toFixed(2)}</span>
        {' '}after ~5% commission + 1.75% fee
      </div>
    )}

  NOTE: This uses ~5% as an estimate since the panel doesn't receive userTier.
  The display clearly marks it as approximate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — SMARTER BOT GRID ROUTING

Currently ALL bot grid buttons route to `/items/${item.id}` (the item dashboard).
Upgrade so bots that HAVEN'T been run route to their specific bot page:

  Change the onClick for each bot button (around line 927):

  From:
    onClick={() => router.push(`/items/${item.id}`)}

  To:
    onClick={() => {
      onClose();
      router.push(bot.run ? `/items/${item.id}` : `/bots/${bot.route}?itemId=${item.id}`);
    }}

  This requires adding a `route` field to each bot in the bots array (line 303-314):

    { emoji: "🔍", name: "AnalyzeBot", run: ..., route: "analyzebot" },
    { emoji: "💰", name: "PriceBot", run: ..., route: "pricebot" },
    { emoji: "📋", name: "ListBot", run: ..., route: "listbot" },
    { emoji: "👥", name: "BuyerBot", run: ..., route: "buyerbot" },
    { emoji: "🔭", name: "ReconBot", run: ..., route: "reconbot" },
    { emoji: "📸", name: "PhotoBot", run: ..., route: "stylebot" },
    { emoji: "🏺", name: "AntiqueBot", run: ..., route: "antiquebot" },
    { emoji: "🃏", name: "Collectibles", run: ..., route: "collectiblesbot" },
    { emoji: "🚗", name: "CarBot", run: ..., route: "carbot" },
    { emoji: "⚡", name: "MegaBot", run: ..., route: "megabot" },

  If bot is already run → go to item dashboard (see results)
  If bot is NOT run → go to bot page with item pre-selected (run it)

  Also update the bot card text:
    {bot.run ? "✓ Complete" : "Tap to run →"}
  To:
    {bot.run ? "✓ View Results" : "Tap to run →"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — VISUAL POLISH

1. MANAGE SECTION ORDER:
   After this upgrade, SECTION 4 Manage should have this order:
     📁 View Full Item Dashboard
     ✏️ Edit Item Details
     📤 Share Item (with copy feedback)
     📷 Add New Item
     ─── danger zone border ───
     🗑️ Delete Item (with confirmation)

2. BOT GRID — Add a subtle "X of 10 bots complete" summary below the grid:
   const botsComplete = bots.filter(b => b.run).length;

   <div style={{
     fontSize: '11px',
     color: 'rgba(255,255,255,0.3)',
     textAlign: 'center',
     marginTop: '10px',
   }}>
     {botsComplete}/10 bots complete • All bots run from your item dashboard
   </div>

3. SNAPSHOT SECTION — If listing price exists AND item has a valuation,
   show a "vs estimate" comparison:
   e.g., "Listed $50 · Est. $26-$86 · 92% of mid"

4. OVERALL — Ensure all hover states work smoothly.
   Ensure the panel doesn't feel cramped with the new buttons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — The slide animation or mobile bottom-sheet behavior
  — The sale assignment logic (State A/B/D)
  — The backdrop, header, or close button
  — The footer branding
  — Any locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Full read complete: yes / no

  NEW FEATURES:
  3. Share Item button in Manage section: yes / no
  4. Share copies URL to clipboard: yes / no
  5. "Link Copied!" feedback shows for 2 seconds: yes / no
  6. Add New Item button in Manage section: yes / no
  7. Add New Item routes to /items/new: yes / no
  8. Net earnings preview below price input: yes / no
  9. Shows approximate commission + 1.75% fee: yes / no

  BOT GRID:
  10. Bots not yet run route to specific bot page: yes / no
  11. Bots already run route to item dashboard: yes / no
  12. Route field added to each bot in array: yes / no
  13. Bot summary "X/10 complete" shown below grid: yes / no

  MANAGE ORDER:
  14. Order is: Dashboard → Edit → Share → Add New → Delete: yes / no

  ALWAYS-DARK:
  15. ALL text uses hardcoded light colors (NOT CSS variables): yes / no
  16. No var(--text-primary) or similar in the panel: yes / no

  EXISTING:
  17. Slide animation unchanged: yes / no
  18. Sale assignment unchanged: yes / no
  19. Delete confirmation unchanged: yes / no
  20. Status CTAs unchanged: yes / no

  N+1. Only file modified: app/components/ItemActionPanel.tsx: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. npx tsc --noEmit: 0 errors
  N+4. npm run build: pass
  N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Share Item: [fixed / issue]
    - Button visible: [yes / no]
    - Copy + feedback: [yes / no]
  Part C — Add New Item: [fixed / issue]
  Part D — Net earnings: [fixed / issue]
    - Shows below price input: [yes / no]
  Part E — Bot routing: [fixed / issue]
    - Smart routing per bot: [yes / no]
    - Route field added: [yes / no]
  Part F — Visual polish: [fixed / issue]
    - Bot summary: [yes / no]
    - Manage order correct: [yes / no]

  ALWAYS-DARK VERIFIED: [hardcoded colors only / issues]

  EXISTING LOGIC UNTOUCHED:
  — Slide animation: [Confirm]
  — Sale assignment: [Confirm]
  — Delete confirmation: [Confirm]
  — Status CTAs: [Confirm]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [1 — app/components/ItemActionPanel.tsx]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Item Action Panel Polish
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
