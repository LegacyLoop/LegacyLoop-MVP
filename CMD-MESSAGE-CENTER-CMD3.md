LEGACYLOOP — COMMAND TEMPLATE v8
Message Center Command 3 — Functional AI Agent Inbox + Agent Settings Polish
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
NEVER hardcoded rgba(255,255,255,...) or #fff on theme surfaces.

ELON MUSK STANDARD: This must feel like a real operational inbox. Not a mockup.
Users must be able to click categories and see filtered results instantly.
Every interaction must feel responsive and purposeful. Think Gmail meets
Tesla center console — dense, smart, fast.

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
  grep 'TWILIO' .env | sed 's/=.*/=SET/'
  grep 'DEMO_MODE' .env | head -2
  grep -n 'shouldBypassGates|isDemoMode' lib/constants/pricing.ts | head -3
  grep -n 'checkCredits|deductCredits' lib/credits.ts | head -3
  npx tsc --noEmit 2>&1 | tail -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALWAYS LOCKED — Never touch without explicit surgical unlock:

# ─── Core Adapters ───
lib/adapters/ai.ts — LOCKED
lib/adapters/rainforest.ts — LOCKED
lib/adapters/auth.ts — EXTEND ONLY
lib/adapters/storage.ts — LOCKED
lib/adapters/multi-ai.ts — LOCKED

# ─── AI Detection + Scoring ───
lib/antique-detect.ts — LOCKED
lib/collectible-detect.ts — LOCKED

# ─── MegaBot Engine ───
lib/megabot/run-specialized.ts — LOCKED
lib/megabot/prompts.ts — ADD-ONLY

# ─── Shipping ───
lib/shipping/package-suggestions.ts — LOCKED

# ─── Data Pipelines ───
lib/data/backfill.ts — LOCKED
lib/data/populate-intelligence.ts — LOCKED
lib/data/project-rollup.ts — LOCKED
lib/data/user-events.ts — LOCKED

# ─── Enrichment ───
lib/enrichment/item-context.ts — LOCKED
lib/addons/enrich-item-context.ts — LOCKED

# ─── Credits + Billing ───
lib/credits.ts — LOCKED
lib/tier-enforcement.ts — READ ONLY
lib/billing/pro-rate.ts — LOCKED
lib/billing/commission.ts — LOCKED

# ─── Offers ───
lib/offers/expiry.ts — LOCKED
lib/offers/notify.ts — LOCKED
lib/offers/cron.ts — LOCKED

# ─── Email System ───
lib/email/send.ts — LOCKED
lib/email/templates.ts — LOCKED

# ─── Pricing Constants ───
lib/constants/pricing.ts — LOCKED
lib/pricing/constants.ts — LOCKED
lib/adapters/pricing.ts — LOCKED
lib/pricing/calculate.ts — LOCKED

# ─── API Routes ───
app/api/** — ALL LOCKED (message API routes stay as-is)

# ─── All Item Files ───
app/items/** — ALL LOCKED
app/dashboard/** — ALL LOCKED
app/bots/** — ALL LOCKED

# ─── Core UI ───
app/components/AppNav.tsx — LOCKED
app/components/UploadModal.tsx — LOCKED
app/page.tsx — LOCKED
globals.css — LOCKED

# ─── Commerce + Other ───
app/subscription/** — LOCKED
app/credits/** — LOCKED
app/marketplace/** — LOCKED
app/bundles/** — LOCKED
app/shipping/** — LOCKED
app/pricing/** — LOCKED
app/projects/** — LOCKED
app/offers/** — LOCKED

# ─── Always-Dark Overlays ───
app/components/ItemActionPanel.tsx — LOCKED
app/components/billing/CancelFlowModal.tsx — LOCKED
app/components/billing/UpgradeFlowModal.tsx — LOCKED
app/components/TradeProposalModal.tsx — LOCKED

# ─── Messaging Files Fixed in Commands 1-2 ───
app/messages/layout.tsx — LOCKED (bg fixed to var(--bg-primary))
app/messages/page.tsx — LOCKED (hardcoded colors fixed)
app/messages/MessagesAgentWrapper.tsx — LOCKED
app/components/messaging/WeeklyReportCard.tsx — LOCKED (real counts wired)
app/components/messaging/AiMessageToolbar.tsx — LOCKED
app/components/messaging/AiSuggestionsPanel.tsx — LOCKED
app/components/messaging/BuyerIntelligenceCard.tsx — LOCKED
app/components/messaging/NegotiationCoach.tsx — LOCKED

# ─── Infrastructure ───
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/components/messaging/InboxCommandCenter.tsx — UNLOCKED (make sidebar categories clickable + functional with filter dispatch)
app/messages/MessagesClient.tsx — UNLOCKED (listen for sidebar filter events, add star/flag, extend FilterMode)
app/components/messaging/AgentSettings.tsx — UNLOCKED (fix contrast for always-dark slide-out panel)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these.

PASS 1-3 LOCKED FEATURES:
  All bot AI logic and prompt systems
  All bot output formats
  MegaBot 4-agent consensus system
  Antique detection + Antique Alert
  Collectible detection + scoring
  Amazon/Rainforest enrichment adapter
  Shipping calculator + package suggestions
  Offer negotiation system (3-round, magic link)
  Credit system (packs, custom, deductions, balance)
  Subscription tiers (FREE/STARTER/PLUS/PRO)
  Pro-rate billing for upgrades/downgrades
  Commission calculator
  ListBot publish hub (13 platforms)
  Marketplace and bundle system
  Trade proposals
  Sold price tracking
  Message center
  Data pipelines and enrichment

PASS 3 FINAL LOCKED (March 16-17, 2026):
  Custom credit purchase with sliding scale ($25-$10K, 5 tiers)
  Subscription page (5 bug fixes + RECOMMENDED badge)
  Email system (env var from address, per-email overrides, shared templates)
  Gemini MegaBot reliability (safety settings, model fallback, retry logic)

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  Upload system — shared UploadModal with 6 methods, wired into both pages
  Edit Item Form — full field upgrade matching new item depth
  Item Control Center V1+V2 — consolidated Trade+Sale, info strip, tighter
  Light Mode Rounds 1-4 — ~1,554 replacements across 88 files
  Message Center Commands 1-2 — light mode + Weekly Report + UX improvements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this command: Log every sidebar filter click to console with the filter type.
This tells us which inbox views users use most — Hot Leads vs Needs Reply vs All.
Nobody else maps message triage behavior to resale patterns.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command: UI functionality wiring. The sidebar categories dispatch
CustomEvents to MessagesClient which applies filters. Agent Settings gets
contrast fixes. No API changes. No schema changes. CustomEvent bridge
pattern (already proven in this app for conversation-selected,
conversation-counts-updated, agent-fill-message, and inbox-filter-change).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

Message Center context: The inbox must be functional enough for a live demo.
Users need to click sidebar categories, see filtered conversations, star
important buyers, and manage their inbox. This is the communication hub —
it must feel real and operational, not a mockup.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY:
  - Improve beyond minimum spec
  - Flag gaps noticed while working
  - Choose cleanest technical path
  - Add defensive error handling
  - Make UI impressive for investor demo
  - Wire logical connections within scope
  - Flag missed data collection opportunities
  - Add polish that serves the Elon standard
  - Make this feel like a $1B product

You MAY NOT:
  - Touch any locked files
  - Change any message API logic
  - Change any bot AI or prompt logic
  - Change any bot output format
  - Deviate from inline style={{}}
  - Add unapproved npm packages
  - Add routes beyond scope
  - Change schema without explicit approval
  - Change the design directive wording

Flag everything outside scope. Do not fix silently. Always report flags clearly.

Read the FULL component code before writing any command — not just grep results.
Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env — active now.
Admin account bypasses ALL tier gates and credit deductions.

shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)

Admin: never locked out. No credits deducted. Full platform access.

TO GO LIVE:
Set DEMO_MODE=false in .env.
Switch Square sandbox keys to production keys.
All gates enforce immediately for real users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Make AI Agent Inbox Functional + Star Buyers + Polish Agent Settings

The AI Agent sidebar in InboxCommandCenter has 5 inbox categories (Hot Leads,
Needs Reply, Agent Handled, All Active, Closed) but they are STATIC LABELS —
clicking them does nothing. MessagesClient has its OWN filter system
(All Messages, Unread, Bot Flagged, By Item) that works independently.

This command bridges them: clicking a sidebar category dispatches a CustomEvent
that MessagesClient listens for and applies as a filter. The two systems sync.

Also fixes Agent Settings panel contrast issues and adds conversation
starring capability for buyer prioritization.

What this command touches:
  app/components/messaging/InboxCommandCenter.tsx — clickable categories + active state
  app/messages/MessagesClient.tsx — filter listener + star/flag + extended FilterMode
  app/components/messaging/AgentSettings.tsx — contrast fix for always-dark panel

What this command does NOT touch:
  All message API routes — UNCHANGED
  Message send/receive logic — UNCHANGED
  AI toolbar functionality — UNCHANGED
  Weekly Report — UNCHANGED (fixed in Command 1)
  Layout proportions — UNCHANGED (fixed in Commands 1-2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/components/messaging/InboxCommandCenter.tsx — FULL file (103 lines)
   Find: Lines 50-62 — the 5 sidebar category items (static, no onClick filter)
   Find: Line 57 — each item renders with: icon, label, key, count
   Find: No active/selected state on any category
   Confirm: Categories are purely visual — no filter dispatch

2. Read app/messages/MessagesClient.tsx — FULL file (1135 lines)
   Find: Line 47 — FilterMode type: "all" | "unread" | "bot" | "byItem"
   Find: Line 168 — const [filterMode, setFilterMode] = useState<FilterMode>("all")
   Find: The filteredConvs useMemo/calculation
   Find: Lines 394+ — the filter tab bar UI (All Messages, Unread, Bot Flagged, By Item)
   Confirm: MessagesClient already has working filter logic we can extend

3. Read app/components/messaging/AgentSettings.tsx — FULL file (58 lines)
   Find: Line 28 — panel background: "rgba(13,31,45,0.99)" (always-dark — correct)
   Find: Line 36 — permission card unselected bg: "var(--border-default)" (wrong for dark panel)
   Find: Lines 34, 37, 38, 42, 49 — text using var(--text-primary) and var(--text-muted) (wrong for always-dark panel)

Print ALL findings with exact line numbers before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Make Sidebar Categories Functional (InboxCommandCenter)

File: app/components/messaging/InboxCommandCenter.tsx

STEP 1: Add state for active category.

After line 7 (const [agentMode, setAgentMode]):

  const [activeView, setActiveView] = useState("all");

STEP 2: Replace the category rendering (lines 50-62) with clickable items.

Each category needs:
  - onClick: set activeView, dispatch "inbox-filter-change" CustomEvent, log to console
  - Active state: teal left border + teal tint background + bold text
  - Hover state: subtle background change

Replace with:

  {[
    { icon: "🔥", label: "Hot Leads", key: "hot", count: counts.hot },
    { icon: "💬", label: "Needs Reply", key: "needs_reply", count: counts.needsReply },
    { icon: "🤖", label: "Agent Handled", key: "agent", count: 0 },
    { icon: "👀", label: "All Active", key: "all", count: counts.total },
    { icon: "✅", label: "Closed", key: "closed", count: 0 },
  ].map(tab => (
    <div
      key={tab.key}
      onClick={() => {
        setActiveView(tab.key);
        console.log(`[Inbox] Filter: ${tab.key}`);
        window.dispatchEvent(new CustomEvent("inbox-filter-change", {
          detail: { filter: tab.key }
        }));
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
        marginBottom: 2,
        background: activeView === tab.key ? "rgba(0,188,212,0.08)" : "transparent",
        borderLeft: activeView === tab.key ? "3px solid #00bcd4" : "3px solid transparent",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ fontSize: 14 }}>{tab.icon}</span>
      <span style={{
        flex: 1,
        fontSize: 11,
        fontWeight: activeView === tab.key ? 700 : 400,
        color: activeView === tab.key ? "#00bcd4" : "var(--text-secondary)",
      }}>
        {tab.label}
      </span>
      {tab.count > 0 && (
        <span style={{
          fontSize: 9,
          minWidth: 18,
          height: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9,
          background: activeView === tab.key ? "#00bcd4"
            : (tab.key === "hot" || tab.key === "needs_reply") ? "rgba(0,188,212,0.2)" : "var(--ghost-bg)",
          color: activeView === tab.key ? "#fff"
            : (tab.key === "hot" || tab.key === "needs_reply") ? "#00bcd4" : "var(--text-muted)",
          fontWeight: 700,
        }}>
          {tab.count}
        </span>
      )}
    </div>
  ))}

STEP 3: Listen for filter resets from MessagesClient (when user clicks tab bar).

Add a useEffect to listen for reset events:

  useEffect(() => {
    const handler = (e: Event) => {
      const filter = (e as CustomEvent).detail?.filter;
      if (filter) setActiveView(filter);
    };
    window.addEventListener("inbox-filter-reset", handler);
    return () => window.removeEventListener("inbox-filter-reset", handler);
  }, []);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Listen for Sidebar Filters + Add Star/Flag (MessagesClient)

File: app/messages/MessagesClient.tsx

STEP 1: Extend FilterMode.

Line 47 — BEFORE:
  type FilterMode = "all" | "unread" | "bot" | "byItem";

AFTER:
  type FilterMode = "all" | "unread" | "bot" | "byItem" | "hot" | "needs_reply" | "agent" | "closed";

STEP 2: Add event listener for inbox-filter-change.

After the existing CustomEvent useEffects (around line 163):

  // Listen for AI Agent sidebar filter changes
  useEffect(() => {
    const handler = (e: Event) => {
      const filter = (e as CustomEvent).detail?.filter;
      if (filter) {
        setFilterMode(filter as FilterMode);
      }
    };
    window.addEventListener("inbox-filter-change", handler);
    return () => window.removeEventListener("inbox-filter-change", handler);
  }, []);

STEP 3: Add filtering logic for new filter modes.

Find where filteredConvs is calculated. Add cases for the new filters:

  "hot": filter to conversations where botScore >= 80
  "needs_reply": filter to conversations where the last message sender is "buyer"
  "agent": return empty array (no agent-handled conversations yet)
  "closed": return empty array (no closed status yet)

The existing filters ("all", "unread", "bot", "byItem") stay unchanged.

STEP 4: When user clicks the tab bar filters, dispatch back to sidebar to reset.

In the tab bar onClick handlers (where filterMode is set to "all", "unread", etc.),
ALSO dispatch:

  window.dispatchEvent(new CustomEvent("inbox-filter-reset", {
    detail: { filter: "all" }
  }));

This keeps the sidebar highlight in sync — clicking a tab bar filter resets
the sidebar back to "All Active".

STEP 5: Add star/flag state and UI.

Add state:
  const [starred, setStarred] = useState<Set<string>>(new Set());

In the conversation card rendering (around line 685-770), add a star button
at the end of each conversation card row. Position it so it doesn't interfere
with the card click handler:

  <button
    onClick={(e) => {
      e.stopPropagation();
      setStarred(prev => {
        const next = new Set(prev);
        if (next.has(conv.id)) next.delete(conv.id);
        else next.add(conv.id);
        return next;
      });
    }}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "2px",
      fontSize: 14,
      color: starred.has(conv.id) ? "#fbbf24" : "var(--text-muted)",
      opacity: starred.has(conv.id) ? 1 : 0.3,
      transition: "all 0.15s",
      flexShrink: 0,
    }}
    title={starred.has(conv.id) ? "Remove star" : "Star this buyer"}
  >
    ★
  </button>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — Polish Agent Settings Panel Contrast

File: app/components/messaging/AgentSettings.tsx

The panel has an always-dark background (rgba(13,31,45,0.99)) — correct.
But it uses CSS variables for text and backgrounds which change in light mode,
making them invisible on the dark panel.

D1. Permission level cards (line 36):
  Unselected background:
    BEFORE: "var(--border-default)"
    AFTER: "rgba(255,255,255,0.05)"
  Unselected border:
    BEFORE: "1px solid var(--border-default)"
    AFTER: "1px solid rgba(255,255,255,0.1)"

D2. ALL label text in the panel (lines 30, 34, 37, 42, 49):
  Replace var(--text-primary) → "#e2e8f0"
  Replace var(--text-muted) → "rgba(148,163,184,0.7)"

  These are hardcoded because the panel is ALWAYS dark — CSS variables would
  resolve to dark text in light mode which is invisible on the dark panel bg.

D3. Permission card name text (line 37):
  BEFORE: color: "var(--text-primary)"
  AFTER: color: "#e2e8f0"

D4. Permission card description text (line 38):
  BEFORE: color: "var(--text-muted)"
  AFTER: color: "rgba(148,163,184,0.7)"

D5. Check-in threshold input (line 50):
  Border: BEFORE "1px solid var(--border-default)"
  AFTER: "1px solid rgba(0,188,212,0.3)"

D6. Agent Settings gear button at bottom of sidebar (line 71):
  Border and color use var() — change to hardcoded for the dark sidebar:
  BEFORE: border: "1px solid var(--border-default)", color: "var(--text-muted)"
  AFTER: border: "1px solid rgba(255,255,255,0.1)", color: "rgba(148,163,184,0.7)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. All reads completed and printed: yes / no
SIDEBAR FUNCTIONALITY:
3. Hot Leads category clickable — filters to botScore >= 80: yes / no
4. Needs Reply category clickable — filters to last msg from buyer: yes / no
5. All Active shows all conversations: yes / no
6. Active category has teal left border + teal bg tint: yes / no
7. Category counts display correctly: yes / no
8. Clicking a category instantly filters conversation list: yes / no
9. Console log fires on each category click: yes / no
FILTER SYNC:
10. Sidebar filter syncs with MessagesClient filter state: yes / no
11. Tab bar click resets sidebar highlight back to "All Active": yes / no
12. Both filter systems coexist without conflict: yes / no
STAR/FLAG:
13. Star button visible on each conversation card: yes / no
14. Clicking star toggles gold (★) vs muted state: yes / no
15. Star click doesn't trigger conversation selection: yes / no
AGENT SETTINGS:
16. Permission level cards readable on dark panel: yes / no
17. Label text bright (#e2e8f0) on dark background: yes / no
18. Description text visible (rgba(148,163,184,0.7)): yes / no
19. Check-in input has teal border accent: yes / no
20. Tone buttons readable: yes / no
FUNCTIONALITY:
21. Message sending still works: yes / no
22. AI toolbar buttons still work: yes / no
23. Conversation selection still works: yes / no
24. Search/filter still works: yes / no
25. All existing filter modes (unread, bot, byItem) still work: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — Sidebar categories functional: [fixed / issue]
  - Categories clickable: [yes / no]
  - Active state styling (teal border + tint): [yes / no]
  - Filter event dispatched on click: [yes / no]
  - Console logging on click: [yes / no]
  - Reset listener added: [yes / no]
Fix C — MessagesClient filter integration + star: [fixed / issue]
  - FilterMode extended with new types: [yes / no]
  - inbox-filter-change listener working: [yes / no]
  - Hot Leads filter: [working / issue]
  - Needs Reply filter: [working / issue]
  - Tab bar resets sidebar: [yes / no]
  - Star/flag button added: [yes / no]
  - Star toggle works: [yes / no]
Fix D — Agent Settings contrast: [fixed / issue]
  - Cards readable on dark panel: [yes / no]
  - Labels use hardcoded bright colors: [yes / no]
  - Check-in input teal border: [yes / no]

ALL MESSAGE LOGIC UNTOUCHED: [Confirm zero API/handler changes]
LIGHT + DARK MODE: [Both clean]

FLAGS FROM CLAUDE CODE:
  [All gaps, risks, missed opportunities]

Files modified: [list all — be specific]
New files: none
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Message Center Command 3 — Functional Inbox
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
