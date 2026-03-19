LEGACYLOOP — COMMAND TEMPLATE v8
Message Center Command 1 — Functional Fixes + Light Mode + Weekly Report
Updated: March 18, 2026 | Use this for EVERY build command

Copy everything below this line into Claude Code.

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
NEVER hardcoded rgba(255,255,255,...) or hardcoded hex (#fff, #0a1929, etc.)
for backgrounds, text, or borders on surfaces that need to work in both themes.

EXCEPTION: Elements inside always-dark containers (modals, photo overlays)
keep hardcoded colors. White text on teal/accent buttons keeps white.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'OPENAI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL backend lib files — LOCKED.
ALL API routes — LOCKED (message API routes stay as-is).
ALL bot files — LOCKED.
ALL item dashboard files — LOCKED.
ALL other UI files not listed below — LOCKED.
globals.css, vercel.json, prisma/schema.prisma — LOCKED.

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/messages/layout.tsx — UNLOCKED (fix hardcoded #0a1929 background to CSS variable)
app/messages/MessagesClient.tsx — UNLOCKED (fix remaining hardcoded colors, improve layout)
app/messages/MessagesAgentWrapper.tsx — UNLOCKED (minor adjustments if needed)
app/components/messaging/InboxCommandCenter.tsx — UNLOCKED (fix hardcoded #0a1929 + hardcoded white colors, improve layout proportions)
app/components/messaging/WeeklyReportCard.tsx — UNLOCKED (fix light mode colors, wire real conversation counts)
app/components/messaging/AiMessageToolbar.tsx — UNLOCKED (verify functionality, fix any hardcoded colors)
app/components/messaging/AiSuggestionsPanel.tsx — UNLOCKED (verify functionality, fix any hardcoded colors)
app/components/messaging/BuyerIntelligenceCard.tsx — UNLOCKED (fix hardcoded colors)
app/components/messaging/NegotiationCoach.tsx — UNLOCKED (fix hardcoded colors)
app/components/messaging/AgentSettings.tsx — UNLOCKED (fix hardcoded colors)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All bot AI logic, output formats, MegaBot, antique/collectible detection,
shipping, offers, credits, billing, subscriptions, marketplace, bundles,
trade proposals, sold price tracking, data pipelines.

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment, Upload system, Light Mode Rounds 1-4,
  Item Control Center V1+V2, Edit Item Form upgrade, Camera upload fix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Flag all missed data collection opportunities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

For this command: Light mode color fixes across 10 files + Weekly Report
data wiring + layout proportion improvements. No API changes. No schema changes.
Message handling logic stays identical.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY: Improve beyond spec, make it stunning, fix UX issues found during audit,
improve readability, make the message center feel professional and premium.

You MAY NOT: Touch locked files, change message API logic, change how messages
are sent/received/stored, add npm packages, change schema.

CRITICAL: The message center must work PERFECTLY in both light AND dark mode.
Every piece of text must be readable. Every button must be visible. Every
border must be distinguishable. This is where buyers and sellers communicate —
trust depends on this page looking professional.

ELON MUSK STANDARD: Think Tesla Model S center console. Clean, purposeful,
information-dense without feeling cluttered. Every pixel earns its place.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env. Admin bypasses all gates. TO GO LIVE: set false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Message Center: Functional Fixes + Light Mode + Layout Improvements

The Message Center has three categories of issues:

A) LIGHT MODE: Hardcoded dark backgrounds (#0a1929) and white text (#fff) make
   the entire message center invisible in light mode. The layout.tsx, InboxCommandCenter,
   WeeklyReportCard, and MessagesClient all have hardcoded dark-theme colors.

B) WEEKLY REPORT: Shows all dashes "—" for every metric. It needs to display real
   conversation counts from the data already available via CustomEvent dispatches
   (conversation-counts-updated event from MessagesClient).

C) LAYOUT PROPORTIONS: The 4-panel layout (AI Agent sidebar 260px + conversation
   list 320px + thread area + intelligence panel 300px) leaves only ~300-400px for
   the actual conversation on a 1400px container. This is too cramped.

This command fixes all three in one pass.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

Read ALL 10 message center files completely before making any changes.

1. Read app/messages/layout.tsx — 35 lines
   Find: Line 19 — background: '#0a1929' (HARDCODED DARK — must be CSS variable)

2. Read app/messages/MessagesAgentWrapper.tsx — 50 lines
   Find: Line 41 — <WeeklyReportCard /> render

3. Read app/components/messaging/InboxCommandCenter.tsx — 103 lines
   Find: Line 36 — background: "#0a1929" (HARDCODED DARK)
   Find: Line 42 — color: "#fff" (HARDCODED WHITE)
   Find: Line 97 — color: "#fff", rgba(207,216,220,0.5) (HARDCODED)

4. Read app/components/messaging/WeeklyReportCard.tsx — 37 lines
   Find: Line 13 — color: "#fff" (HARDCODED)
   Find: Line 22 — all metrics show "—" (NO DATA)
   Find: Line 24 — color: "#fff" (HARDCODED)
   Find: Line 25 — color: "rgba(207,216,220,0.5)" (HARDCODED)
   Find: Line 32 — color: "rgba(207,216,220,0.4)" (HARDCODED)

5. Read app/messages/MessagesClient.tsx — 1135 lines
   Find: Line 980 — background: "#0a1929" (HARDCODED in date separator)
   Find: Line 1049 — background: "rgba(0,0,0,0.2)" (reply input area)
   Find: Line 1052 — color: "#fff" (textarea text)
   Find: Line 1061 — color: "#000" (send button text)

6. Read remaining 5 messaging component files:
   AiMessageToolbar.tsx, AiSuggestionsPanel.tsx, BuyerIntelligenceCard.tsx,
   NegotiationCoach.tsx, AgentSettings.tsx
   Find ALL hardcoded #fff, rgba(207,216,220,...), #0a1929 colors.

Print a summary of ALL findings before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Fix layout.tsx Light Mode Background

File: app/messages/layout.tsx

Line 19 — BEFORE: background: '#0a1929'
AFTER: background: 'var(--bg-primary)'

This one change makes the entire message center page adapt to the current theme.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Fix InboxCommandCenter Light Mode + Layout Proportions

File: app/components/messaging/InboxCommandCenter.tsx

C1. Line 36 — BEFORE: background: "#0a1929"
    AFTER: background: "var(--bg-primary)"

C2. Line 38 — AI Agent sidebar width: 260px → 220px (save 40px for thread area)
    ALSO change minWidth: 220, maxWidth: 220

C3. Line 42 — BEFORE: color: "#fff"
    AFTER: color: "var(--text-primary)"

C4. Line 81 — Intelligence Panel width: 300px → 260px (save 40px for thread area)
    ALSO change minWidth: 260, maxWidth: 260

C5. Line 97 — BEFORE: color: "#fff"
    AFTER: color: "var(--text-primary)"

C6. Line 97 — BEFORE: rgba(207,216,220,0.5)
    AFTER: var(--text-muted)

C7. Fix ALL other hardcoded rgba(207,216,220,...) and #fff instances in this file
    to use var(--text-primary), var(--text-secondary), or var(--text-muted).

NOTE: The sidebar backgrounds should use var(--bg-card) or var(--bg-secondary).
They need to be slightly different from the main content area for visual separation
but still theme-aware.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — Fix WeeklyReportCard + Wire Real Data

File: app/components/messaging/WeeklyReportCard.tsx

D1. Fix ALL hardcoded colors:
    - Line 13: color: "#fff" → color: "var(--text-primary)"
    - Line 24: color: "#fff" → color: "var(--text-primary)"
    - Line 25: color: "rgba(207,216,220,0.5)" → color: "var(--text-muted)"
    - Line 32: color: "rgba(207,216,220,0.4)" → color: "var(--text-muted)"

D2. Wire real conversation counts into the Weekly Report:

    The component currently shows hardcoded "—" for all 4 metrics.
    The InboxCommandCenter already receives conversation counts via the
    "conversation-counts-updated" CustomEvent from MessagesClient.

    APPROACH: Add a useEffect listener for the same "conversation-counts-updated"
    event in WeeklyReportCard to receive real counts:

    Add state:
      const [counts, setCounts] = useState({ hot: 0, needsReply: 0, total: 0 });

    Add useEffect:
      useEffect(() => {
        const handler = (e: Event) => {
          const d = (e as CustomEvent).detail;
          if (d) setCounts({ hot: d.hot || 0, needsReply: d.needsReply || 0, total: d.total || 0 });
        };
        window.addEventListener("conversation-counts-updated", handler);
        return () => window.removeEventListener("conversation-counts-updated", handler);
      }, []);

    Replace the metric values:
      { label: "Messages", value: String(counts.total || "—") }
      { label: "Hot Leads", value: String(counts.hot || "—") }
      { label: "Needs Reply", value: String(counts.needsReply || "—") }
      { label: "Avg Response", value: "—" }  (keep as dash — no data source yet)

    This gives real-time counts instead of all dashes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — Fix MessagesClient Hardcoded Colors

File: app/messages/MessagesClient.tsx

E1. Line 980 — date separator background:
    BEFORE: background: "#0a1929"
    AFTER: background: "var(--bg-primary)"

E2. Line 1049 — reply input area:
    BEFORE: background: "rgba(0,0,0,0.2)"
    AFTER: background: "var(--ghost-bg)"

E3. Line 1052 — textarea text color:
    BEFORE: color: "#fff"
    AFTER: color: "var(--text-primary)"

E4. Line 1061 — send button text color:
    BEFORE: color: "#000"
    AFTER: color: "#fff" (white on teal gradient button is always correct)

E5. Scan the ENTIRE file for any remaining hardcoded #fff, rgba(207,216,220,...),
    #0a1929, or rgba(0,0,0,...) that appear on theme-aware surfaces (not photo
    overlays or always-dark containers). Replace with CSS variables.

    Use the standard mapping:
      #fff / rgba(255,255,255,0.8+) on theme surfaces → var(--text-primary)
      rgba(207,216,220,0.5-0.6) → var(--text-muted)
      #0a1929 → var(--bg-primary)
      rgba(0,0,0,0.2) for surfaces → var(--ghost-bg)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — Fix Remaining Messaging Component Colors

Fix ALL hardcoded colors in these 5 files. Same mapping as Part E.

Files:
  app/components/messaging/AiMessageToolbar.tsx
  app/components/messaging/AiSuggestionsPanel.tsx
  app/components/messaging/BuyerIntelligenceCard.tsx
  app/components/messaging/NegotiationCoach.tsx
  app/components/messaging/AgentSettings.tsx

For each file:
1. Read the full file
2. Find every hardcoded #fff, rgba(207,216,220,...), rgba(255,255,255,...), #0a1929
3. Replace with CSS variables on theme-aware surfaces
4. Keep hardcoded colors inside always-dark containers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — Improve Conversation List Readability

File: app/messages/MessagesClient.tsx

The conversation list (left sidebar, 320px) is cramped. Improve readability:

G1. Reduce the conversation list width from 320px to 300px (line 640)
    This gives 20px more to the thread area.

G2. The overall layout gap is 1.5rem (line 636). Reduce to 0 — the panels
    should be edge-to-edge with borders separating them, not gaps.
    This recovers ~48px of horizontal space.

G3. Add a subtle borderRight to the conversation list panel:
    borderRight: "1px solid var(--border-default)"

G4. The "Log Buyer Message" button text is confusing. Change to:
    "+ New Conversation" or "+ Compose Message"

These are LAYOUT-ONLY changes. Zero logic changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. All 10 files read: yes / no
LIGHT MODE:
3. layout.tsx background uses var(--bg-primary): yes / no
4. InboxCommandCenter background uses var(--bg-primary): yes / no
5. WeeklyReportCard — all text uses CSS variables: yes / no
6. MessagesClient — date separator uses var(--bg-primary): yes / no
7. MessagesClient — reply input uses var(--ghost-bg): yes / no
8. MessagesClient — textarea uses var(--text-primary): yes / no
9. All 5 messaging components — hardcoded colors fixed: yes / no
10. Zero remaining hardcoded #0a1929 in any unlocked file: yes / no
11. Zero remaining hardcoded rgba(207,216,220,...) in any unlocked file: yes / no
WEEKLY REPORT:
12. WeeklyReportCard listens for conversation-counts-updated event: yes / no
13. Messages count shows real number: yes / no
14. Hot Leads count shows real number: yes / no
15. Needs Reply count shows real number: yes / no
LAYOUT:
16. AI Agent sidebar reduced to 220px: yes / no
17. Intelligence panel reduced to 260px: yes / no
18. Conversation list reduced to 300px: yes / no
19. Layout gap reduced to 0 (edge-to-edge with borders): yes / no
20. Button text changed from "Log Buyer Message" to better label: yes / no
FUNCTIONALITY:
21. Message sending still works: yes / no
22. Conversation selection still works: yes / no
23. AI toolbar buttons still work: yes / no
24. Search/filter still works: yes / no
25. All existing message logic UNCHANGED: yes / no
QUALITY:
26. Light mode: all text readable: yes / no
27. Light mode: all buttons visible: yes / no
28. Dark mode: no regressions: yes / no
29. Overall: message center looks professional in both modes: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]

Fix B — layout.tsx background: [fixed / issue]
Fix C — InboxCommandCenter light mode + proportions: [fixed / issue]
  - Background fixed: [yes / no]
  - Sidebar widths adjusted: [yes / no]
  - Hardcoded colors fixed: [count]
Fix D — WeeklyReportCard data + colors: [fixed / issue]
  - Real counts wired: [yes / no]
  - Colors fixed: [count]
Fix E — MessagesClient colors: [fixed / issue]
  - Hardcoded instances fixed: [count]
Fix F — 5 messaging components colors: [fixed / issue]
  - Per-file counts: [list]
Fix G — Layout improvements: [fixed / issue]
  - Widths adjusted: [yes / no]
  - Gap removed: [yes / no]
  - Button text improved: [yes / no]

TOTAL hardcoded colors fixed: [count across all files]

LIGHT MODE VISUAL CHECK:
  - Message center fully readable in light mode: [yes / no]
  - All panels visible with proper contrast: [yes / no]
  - Weekly report readable: [yes / no]

DARK MODE REGRESSION: [Confirm no regressions]
ALL MESSAGE LOGIC UNTOUCHED: [Confirm zero API/handler changes]

FLAGS: [Any remaining issues for Command 2]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Message Center Command 1
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
