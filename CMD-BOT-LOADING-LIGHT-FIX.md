LEGACYLOOP — COMMAND TEMPLATE v9
Bot Loading State — Light Mode Contrast Fix
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

Copy this entire command into Claude Code. Never skip sections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

  All styles inline style={{}} — NO Tailwind. NO external CSS.
  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
  ELON MUSK STANDARD: $1B product quality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP.

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Bot loading check ---'
  grep -n 'color: "#fff"\|rgba(255,255,255' app/components/BotLoadingState.tsx
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/components/BotLoadingState.tsx — UNLOCKED (fix hardcoded colors for light mode)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All Pass 1-5 + Phase 2 features LOCKED. Do not touch.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

No new data collection. Visual fix only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI fix only. Single file. No API, no logic changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

DEMO_MODE=true. Both test accounts Tier 4 Estate Manager.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Fix all hardcoded colors in this file
  — Improve the loading animation to look premium in both modes
  — Enhance the pulse glow to use CSS variables

  You MAY NOT:
  — Touch any other files
  — Change the animation logic or timing
  — Change the bot subtexts content
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

OBJECTIVE — Fix Bot Loading State for Light Mode

Problem: The BotLoadingState component (app/components/BotLoadingState.tsx)
shows the "One minute while we cook..." loading animation when any bot
is running analysis. In light mode, the text is INVISIBLE because:

  Line 134: color: "#fff" — white headline on light background
  Line 148: color: "rgba(255,255,255,0.5)" — white subtext on light background

The cooking emoji, pulse glow, and dots are barely visible too.
This component is shared across ALL bot pages — fixing it once fixes
every bot's loading screen.

SURGICAL UNLOCK:
  app/components/BotLoadingState.tsx — 1 file, 197 lines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

Read app/components/BotLoadingState.tsx — FULL file (197 lines)

Find these hardcoded colors:
  Line 106-107: radial-gradient with rgba(0,188,212,0.15) — pulse glow (OK, teal works in both modes)
  Line 134: color: "#fff" — HEADLINE TEXT (BROKEN in light mode)
  Line 148: color: "rgba(255,255,255,0.5)" — SUBTEXT (BROKEN in light mode)
  Line 173: background: "#00bcd4" — dots (OK, teal works in both modes)

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — FIX HARDCODED COLORS

  Line 134: Headline "One minute while we cook..."
    From: color: "#fff"
    To:   color: "var(--text-primary)"

  Line 148: Rotating subtext
    From: color: "rgba(255,255,255,0.5)"
    To:   color: "var(--text-muted)"

  Line 173: Animated dots background
    From: background: "#00bcd4"
    To:   background: "var(--accent, #00bcd4)"

  Lines 106-107: Pulse glow gradient
    The rgba(0,188,212,0.15) is fine — teal glow works in both modes.
    But consider using: var(--accent-glow, rgba(0,188,212,0.15)) for consistency.

  ALSO SCAN for any other hardcoded colors in the file.
  The keyframe animations in the <style> tag (lines 180-193) use inline
  CSS which doesn't support var() in all contexts — leave those as-is
  since they're purely animation timing, not colors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Bot subtext content (the rotating messages)
  — Animation timing or keyframes
  — The cooking emoji
  — Any other files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. File read complete: yes / no
  3. Headline uses CSS variable (not #fff): yes / no
  4. Subtext uses CSS variable (not rgba white): yes / no
  5. Dots use var(--accent) with fallback: yes / no
  6. Readable in light mode: yes / no
  7. Still looks great in dark mode: yes / no
  8. Zero remaining "#fff" in the file: yes / no

  N+1. Only file modified: app/components/BotLoadingState.tsx: yes / no
  N+2. All other files untouched: yes / no
  N+3. inline style={{}} throughout: yes / no
  N+4. npx tsc --noEmit: 0 errors
  N+5. npm run build: pass
  N+6. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Contrast fix: [fixed / issue]
    - Headline color fixed: [yes / no]
    - Subtext color fixed: [yes / no]
    - Dots color fixed: [yes / no]
    - Light mode readable: [yes / no]
    - Dark mode clean: [yes / no]

  Files modified: [1 — app/components/BotLoadingState.tsx]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  conversation-selected, conversation-counts-updated, agent-fill-message,
  agent-settings-toggle, inbox-filter-change, inbox-filter-reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Bot Loading Light Mode Fix
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
