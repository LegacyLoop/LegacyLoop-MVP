LEGACYLOOP — COMMAND TEMPLATE v9
Item Control Center — Add "New Item" Quick Link
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

Copy this entire command into Claude Code. Never skip sections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

  All styles inline style={{}} — NO Tailwind. NO external CSS.
  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
  ELON MUSK STANDARD: $1B product quality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Quick Links check ---'
  grep -n 'QUICK LINKS\|Quick Links' app/items/\[id\]/ItemDashboardPanels.tsx | head -5
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/items/[id]/ItemDashboardPanels.tsx — UNLOCKED (add "New Item" to Quick Links grid in ItemControlCenter ONLY)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTIONS 4-11 — Same as previous commands. All features locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Add "New Item" Button to Item Control Center Quick Links

The Item Control Center was just polished with a Quick Links grid at the
bottom (Edit Item, View Store, Messages, Dashboard, and conditionally Run Bots).

Add one more link to the Quick Links grid:

  📷 Add Item → /items/new

This gives users a quick way to add another item while they're looking at
the current one. Place it as the SECOND link in the grid (after Edit Item,
before View Store).

PART A — Read the ItemControlCenter function in ItemDashboardPanels.tsx.
Find the Quick Links grid section (near the bottom of the function).

PART B — Add this link to the Quick Links array/grid:

  Icon: 📷
  Label: "Add Item"
  href: "/items/new"

Match the exact same card style as the other quick links (ghost-bg, border,
rounded corners, hover state).

DO NOT change anything else in the file. This is a single link addition.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. "Add Item" link visible in Quick Links grid: yes / no
  2. Links to /items/new: yes / no
  3. Matches existing link card style: yes / no
  4. No other changes to the file: yes / no
  N+1. npx tsc --noEmit: 0 errors
  N+2. npm run build: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]
  "Add Item" link added: [yes / no]
  No other changes: [Confirm]
  Files modified: [1]
  Build: [pass / fail]
  TypeScript: [0 errors]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Control Center Add Item Button
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
