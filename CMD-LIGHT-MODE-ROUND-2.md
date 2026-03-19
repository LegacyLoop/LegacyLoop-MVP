LEGACYLOOP — COMMAND TEMPLATE v8
CRITICAL: Light Mode Fix Round 2 — All Bot Pages
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

Every new element must match this design system exactly. No exceptions.

LIGHT MODE CRITICAL RULE:
NEVER use hardcoded rgba(255,255,255,...) for text, borders, or backgrounds on
theme-aware surfaces. ALWAYS use CSS variables from globals.css.

EXCEPTION: Always-dark overlays, photo badges, tooltips on dark backgrounds —
keep hardcoded white. White text on teal/accent button backgrounds — keep white.

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

# All backend files — ALL LOCKED
lib/** — ALL LOCKED
app/api/** — ALL LOCKED

# All files fixed in Round 1 — LOCKED
app/components/AppNav.tsx — LOCKED
app/components/UploadModal.tsx — LOCKED
app/components/DemoBanner.tsx — LOCKED
app/components/CollapsiblePanel.tsx — LOCKED
app/items/** — ALL LOCKED (Round 1 complete)
app/dashboard/** — ALL LOCKED (Round 1 complete)

# Modals and always-dark overlays — LOCKED
app/components/ItemActionPanel.tsx — LOCKED
app/components/billing/CancelFlowModal.tsx — LOCKED
app/components/billing/UpgradeFlowModal.tsx — LOCKED
app/components/TradeProposalModal.tsx — LOCKED
app/components/CommandPalette.tsx — LOCKED
app/components/HelpWidget.tsx — LOCKED
app/components/BotLoadingState.tsx — LOCKED

# Config and infrastructure
globals.css — LOCKED
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

Round 2 — All bot pages (18 files, ~495 instances):

app/bots/collectiblesbot/CollectiblesBotClient.tsx — UNLOCKED (126 instances)
app/bots/megabot/MegaBotClient.tsx — UNLOCKED (78 instances)
app/bots/carbot/CarBotClient.tsx — UNLOCKED (38 instances)
app/bots/listbot/ListBotClient.tsx — UNLOCKED (35 instances)
app/bots/reconbot/ReconBotClient.tsx — UNLOCKED (30 instances)
app/bots/buyerbot/BuyerBotClient.tsx — UNLOCKED (30 instances)
app/bots/analyzebot/AnalyzeBotClient.tsx — UNLOCKED (26 instances)
app/bots/stylebot/StyleBotClient.tsx — UNLOCKED (24 instances)
app/bots/antiquebot/AntiqueBotClient.tsx — UNLOCKED (23 instances)
app/bots/pricebot/PriceBotClient.tsx — UNLOCKED (22 instances)
app/bots/shipbot/ShipBotClient.tsx — UNLOCKED (21 instances)
app/bots/listbot/PublishHubClient.tsx — UNLOCKED (16 instances)
app/bots/BotDashboardClient.tsx — UNLOCKED (11 instances)
app/bots/page.tsx — UNLOCKED (6 instances)
app/bots/photobot/PhotoBotClient.tsx — UNLOCKED (4 instances)
app/bots/BotItemSelector.tsx — UNLOCKED (2 instances)
app/bots/collectiblesbot/page.tsx — UNLOCKED (1 instance)
app/bots/antiquebot/certificate/[itemId]/page.tsx — UNLOCKED (2 instances)

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

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  Upload system — shared UploadModal with 6 methods, wired into both pages
  Light Mode Round 1 — 600 replacements across 22 core files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command: UI-only color fix. Zero logic changes. Zero API changes.
Replace hardcoded colors with CSS variables. Nothing else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

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
  - Change any component logic, state, handlers, or functionality
  - Change any bot AI or prompt logic
  - Change any bot output format or result rendering logic
  - Deviate from inline style={{}}
  - Add unapproved npm packages
  - Add routes beyond scope
  - Change schema without explicit approval
  - Change the design directive wording

CRITICAL FOR BOT PAGES: Many bot pages have complex result rendering sections
with structured data displays. Only change COLOR values. Do NOT change any
data formatting, conditional rendering, or result structure.

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

OBJECTIVE — Fix Light Mode Visibility: Round 2 — All Bot Pages

Round 1 fixed 600 instances across 22 core files (navigation, dashboard, item views).
Round 2 fixes the bot pages — 18 files with ~495 instances. These pages are where
the AI power of LegacyLoop is showcased. They must look stunning in both modes.

THE REPLACEMENT RULES (same as Round 1):

  TEXT COLORS:
  color: "rgba(255,255,255,0.9-0.8)"   →  color: "var(--text-primary)"
  color: "rgba(255,255,255,0.7-0.55)"  →  color: "var(--text-secondary)"
  color: "rgba(255,255,255,0.5-0.2)"   →  color: "var(--text-muted)"
  color: "#fff" (on theme surfaces)     →  color: "var(--text-primary)"
  color: "white" (on theme surfaces)    →  color: "var(--text-primary)"
  color: "#e2e8f0"                      →  color: "var(--text-primary)"
  color: "#cbd5e1"                      →  color: "var(--text-secondary)"
  color: "#94a3b8"                      →  color: "var(--text-muted)"

  BORDER COLORS:
  border*: "*rgba(255,255,255,0.04-0.12)*" → var(--border-default)

  BACKGROUND COLORS:
  background: "rgba(255,255,255,0.02-0.03)" → "var(--bg-card)"
  background: "rgba(255,255,255,0.04-0.08)" → "var(--ghost-bg)"
  background: "rgba(255,255,255,0.1-0.14)"  → "var(--bg-card-hover)"

  EXCEPTIONS — DO NOT REPLACE:
  1. White text on teal/accent/gradient buttons (color: "#fff" on background: "linear-gradient(135deg, #00bcd4...)")
  2. White text on status-colored backgrounds (green/red/yellow badges)
  3. Elements inside always-dark containers (check parent background)
  4. Photo overlays, progress bars on dark backgrounds
  5. Some bot pages have dark-themed result cards with backgrounds like
     "rgba(0,0,0,...)" or "linear-gradient(135deg, #0f0c29...)" — white text
     inside those containers is correct

  HOW TO IDENTIFY EXCEPTIONS:
  If the element or its PARENT has a hardcoded dark background, KEEP white text.
  If the element renders on a theme-aware surface (var(--bg-card), var(--bg-primary),
  or no explicit background), USE CSS variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE.

For EACH of the 18 unlocked bot files:
1. Read the FULL file
2. Count rgba(255,255,255 instances
3. Identify which are on theme-aware surfaces (REPLACE)
4. Identify which are in always-dark containers or on colored backgrounds (KEEP)
5. Print: "File X: Y to replace, Z to keep"

Start with the biggest files:
  - CollectiblesBotClient.tsx (126)
  - MegaBotClient.tsx (78)
  - CarBotClient.tsx (38)
  - ListBotClient.tsx (35)
  Then remaining in decreasing order

NOTE: Some bot clients have result display sections with dark-themed backgrounds
(MegaBotClient has gradient backgrounds for the consensus panel). Check EVERY
parent container before replacing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Apply Replacements File by File

For EACH unlocked file:
1. Read the full file
2. Identify every rgba(255,255,255,...) instance
3. Determine: theme-aware surface (REPLACE) or dark container (KEEP)
4. Apply the replacement mapping
5. Do NOT change any component logic, state, props, handlers, result rendering,
   or data formatting
6. Only change color/border/background values

Work through ALL 18 files. Do not skip any.

Use a batch approach (Node script or bulk sed with verification) for efficiency.
Verify TypeScript compiles after ALL replacements:
  npx tsc --noEmit 2>&1 | grep "error" | head -10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A reads completed for all 18 files: yes / no
BOT PAGES:
3. CollectiblesBotClient.tsx fixed: [X replaced, Y kept]
4. MegaBotClient.tsx fixed: [X replaced, Y kept]
5. CarBotClient.tsx fixed: [X replaced, Y kept]
6. ListBotClient.tsx fixed: [X replaced, Y kept]
7. ReconBotClient.tsx fixed: [X replaced, Y kept]
8. BuyerBotClient.tsx fixed: [X replaced, Y kept]
9. AnalyzeBotClient.tsx fixed: [X replaced, Y kept]
10. StyleBotClient.tsx fixed: [X replaced, Y kept]
11. AntiqueBotClient.tsx fixed: [X replaced, Y kept]
12. PriceBotClient.tsx fixed: [X replaced, Y kept]
13. ShipBotClient.tsx fixed: [X replaced, Y kept]
14. PublishHubClient.tsx fixed: [X replaced, Y kept]
15. BotDashboardClient.tsx fixed: [X replaced, Y kept]
16. bots/page.tsx fixed: [X replaced, Y kept]
17. PhotoBotClient.tsx fixed: [X replaced, Y kept]
18. BotItemSelector.tsx fixed: [X replaced, Y kept]
19. collectiblesbot/page.tsx fixed: [X replaced, Y kept]
20. certificate/[itemId]/page.tsx fixed: [X replaced, Y kept]
QUALITY:
21. All bot result rendering logic UNCHANGED: yes / no
22. All bot handlers/state UNCHANGED: yes / no
23. Dark-themed containers kept hardcoded white: yes / no
24. Teal/gradient buttons kept white text: yes / no
25. Dark mode still looks correct: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

PER-FILE REPORT:
  CollectiblesBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  MegaBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  CarBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  ListBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  ReconBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  BuyerBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  AnalyzeBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  StyleBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  AntiqueBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  PriceBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  ShipBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  PublishHubClient.tsx: [X replaced, Y kept] — [pass / issue]
  BotDashboardClient.tsx: [X replaced, Y kept] — [pass / issue]
  bots/page.tsx: [X replaced, Y kept] — [pass / issue]
  PhotoBotClient.tsx: [X replaced, Y kept] — [pass / issue]
  BotItemSelector.tsx: [X replaced, Y kept] — [pass / issue]
  collectiblesbot/page.tsx: [X replaced, Y kept] — [pass / issue]
  certificate/page.tsx: [X replaced, Y kept] — [pass / issue]

TOTAL: [X instances replaced across Y files]
TOTAL KEPT: [Z instances in dark containers]

DARK MODE REGRESSION: [Confirm no regressions]
BOT LOGIC UNTOUCHED: [Confirm zero logic/handler changes]

FILES REMAINING FOR ROUNDS 3-4:
  [List all files NOT yet fixed]

FLAGS FROM CLAUDE CODE:
  [All gaps, risks, missed opportunities]

Files modified: [list all]
New files: none
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Light Mode Fix Round 2 — Bot Pages
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
