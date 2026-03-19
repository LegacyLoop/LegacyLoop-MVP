LEGACYLOOP — COMMAND TEMPLATE v8
CRITICAL: Light Mode Fix Round 3 — Supporting Pages + Components
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

LIGHT MODE CRITICAL RULE:
NEVER use hardcoded rgba(255,255,255,...) for text, borders, or backgrounds on
theme-aware surfaces. ALWAYS use CSS variables from globals.css.

EXCEPTION: Always-dark overlays, photo badges, tooltips on dark backgrounds —
keep hardcoded white. White text on teal/accent/gradient button backgrounds — keep white.

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

ALWAYS LOCKED — Never touch without explicit surgical unlock:

# All backend files — ALL LOCKED
lib/** — ALL LOCKED
app/api/** — ALL LOCKED

# All files fixed in Rounds 1-2 — LOCKED
app/items/** — ALL LOCKED
app/dashboard/** — ALL LOCKED
app/bots/** — ALL LOCKED
app/components/AppNav.tsx — LOCKED
app/components/UploadModal.tsx — LOCKED
app/components/DemoBanner.tsx — LOCKED
app/components/CollapsiblePanel.tsx — LOCKED

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
app/page.tsx — LOCKED

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

Round 3 — Supporting pages + components (28 files, ~239 instances):

# ─── Projects ───
app/projects/ProjectsClient.tsx — UNLOCKED (28 instances)
app/projects/[id]/ProjectDetailClient.tsx — UNLOCKED (12 instances)

# ─── Shipping ───
app/shipping/ShippingCenterClient.tsx — UNLOCKED (15 instances)
app/shipping/loading.tsx — UNLOCKED (10 instances)

# ─── Pricing ───
app/pricing/PricingClient.tsx — UNLOCKED (15 instances)

# ─── Messages ───
app/messages/MessagesClient.tsx — UNLOCKED (14 instances)

# ─── Analytics ───
app/analytics/page.tsx — UNLOCKED (14 instances)

# ─── Billing Components ───
app/components/billing/EarningsBreakdown.tsx — UNLOCKED (17 instances)

# ─── Offer Components ───
app/components/OfferManagerPanel.tsx — UNLOCKED (13 instances)
app/components/OfferHistoryTimeline.tsx — UNLOCKED (7 instances)
app/components/ActiveOffersWidget.tsx — UNLOCKED (2 instances)
app/offers/[token]/page.tsx — UNLOCKED (8 instances)

# ─── Messaging Components ───
app/components/messaging/InboxCommandCenter.tsx — UNLOCKED (11 instances)
app/components/messaging/BuyerIntelligenceCard.tsx — UNLOCKED (6 instances)
app/components/messaging/NegotiationCoach.tsx — UNLOCKED (5 instances)
app/components/messaging/AgentSettings.tsx — UNLOCKED (3 instances)
app/components/messaging/AiSuggestionsPanel.tsx — UNLOCKED (3 instances)
app/components/messaging/WeeklyReportCard.tsx — UNLOCKED (2 instances)
app/components/messaging/AiMessageToolbar.tsx — UNLOCKED (1 instance)

# ─── Marketplace + Bundles ───
app/marketplace/MarketplaceClient.tsx — UNLOCKED (8 instances)
app/bundle/[slug]/BundlePublicClient.tsx — UNLOCKED (7 instances)
app/bundles/create/page.tsx — UNLOCKED (6 instances)
app/bundles/page.tsx — UNLOCKED (5 instances)
app/components/BundleSuggestions.tsx — UNLOCKED (4 instances)

# ─── Other Pages ───
app/payments/page.tsx — UNLOCKED (4 instances)
app/components/CronStatusWidget.tsx — UNLOCKED (2 instances)
app/connected-accounts/ConnectedAccountsClient.tsx — UNLOCKED (2 instances)
app/search/SearchClient.tsx — UNLOCKED (1 instance)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these.

All bot AI logic, output formats, MegaBot, antique/collectible detection,
shipping, offers, credits, billing, subscriptions, marketplace, bundles,
trade proposals, sold price tracking, message center, data pipelines.

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  Upload system — shared UploadModal with 6 methods, wired into both pages
  Light Mode Round 1 — 600 replacements across 22 core files
  Light Mode Round 2 — 495 replacements across 18 bot files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Flag all missed data collection opportunities. We decide together.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

For this command: UI-only color fix. Zero logic changes. Zero API changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY: Improve beyond minimum spec, flag gaps, choose cleanest path,
add defensive handling, make it investor-ready.

You MAY NOT: Touch locked files, change logic/handlers/state, change bot
output, deviate from inline style={{}}, add packages, add routes, change schema.

CRITICAL: Only change COLOR values. Zero logic changes in any file.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env. Admin bypasses all gates. TO GO LIVE: set false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Fix Light Mode: Round 3 — Supporting Pages + Components

Round 1 fixed 600 instances (core nav + item views). Round 2 fixed 495
(bot pages). Round 3 fixes ~239 instances across 28 supporting pages:
projects, shipping, pricing, messages, analytics, offers, billing,
marketplace, bundles, payments, and messaging components.

THE REPLACEMENT RULES (same as Rounds 1-2):

  TEXT COLORS:
  color: "rgba(255,255,255,0.9-0.8)"   →  "var(--text-primary)"
  color: "rgba(255,255,255,0.7-0.55)"  →  "var(--text-secondary)"
  color: "rgba(255,255,255,0.5-0.2)"   →  "var(--text-muted)"
  color: "#fff" (on theme surfaces)     →  "var(--text-primary)"
  color: "white" (on theme surfaces)    →  "var(--text-primary)"
  color: "#e2e8f0"                      →  "var(--text-primary)"
  color: "#cbd5e1"                      →  "var(--text-secondary)"

  BORDERS:
  border*: "*rgba(255,255,255,0.04-0.12)*" →  var(--border-default)

  BACKGROUNDS:
  background: "rgba(255,255,255,0.02-0.03)" →  "var(--bg-card)"
  background: "rgba(255,255,255,0.04-0.08)" →  "var(--ghost-bg)"
  background: "rgba(255,255,255,0.1-0.14)"  →  "var(--bg-card-hover)"

  EXCEPTIONS (DO NOT REPLACE):
  1. White text on teal/accent/gradient buttons
  2. White text on status-colored backgrounds
  3. Elements inside always-dark containers (check parent bg)
  4. Photo overlays, progress bars on dark backgrounds

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

For EACH of the 28 unlocked files:
1. Read the FULL file
2. Count rgba(255,255,255 instances
3. Identify theme-aware (REPLACE) vs dark-container (KEEP)
4. Apply replacements
5. Zero logic changes

Use bulk approach for efficiency. Verify TypeScript after all replacements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Apply Replacements Across All 28 Files

Process all files. Use batch approach (Node script or bulk sed with verification).
Verify build after ALL replacements complete.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. All 28 files processed: yes / no
3. ProjectsClient.tsx fixed: [X replaced, Y kept]
4. ProjectDetailClient.tsx fixed: [X replaced, Y kept]
5. ShippingCenterClient.tsx fixed: [X replaced, Y kept]
6. PricingClient.tsx fixed: [X replaced, Y kept]
7. MessagesClient.tsx fixed: [X replaced, Y kept]
8. analytics/page.tsx fixed: [X replaced, Y kept]
9. EarningsBreakdown.tsx fixed: [X replaced, Y kept]
10. OfferManagerPanel.tsx fixed: [X replaced, Y kept]
11. All messaging components fixed: [X replaced total]
12. All marketplace/bundle files fixed: [X replaced total]
13. All remaining files fixed: [X replaced total]
14. All component logic UNCHANGED: yes / no
15. Dark mode still correct: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]

PER-FILE REPORT (all 28 files):
  [File: X replaced, Y kept — pass/issue]

TOTAL: [X instances replaced across Y files]
TOTAL KEPT: [Z in dark containers]

CUMULATIVE (Rounds 1+2+3):
  Round 1: 600 across 22 files
  Round 2: 495 across 18 files
  Round 3: [X] across 28 files
  Grand total: [sum]

DARK MODE REGRESSION: [Confirm no regressions]
ALL LOGIC UNTOUCHED: [Confirm]

FILES REMAINING FOR ROUND 4:
  [List all files NOT yet fixed]

FLAGS: [Any gaps or issues found]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Light Mode Fix Round 3
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
