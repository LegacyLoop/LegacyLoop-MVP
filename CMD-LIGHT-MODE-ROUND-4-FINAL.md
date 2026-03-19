LEGACYLOOP — COMMAND TEMPLATE v8
CRITICAL: Light Mode Fix Round 4 — FINAL PASS (Auth, Credits, Addons, Remaining)
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

# All files fixed in Rounds 1-3 — LOCKED
app/items/** — ALL LOCKED
app/dashboard/** — ALL LOCKED
app/bots/** — ALL LOCKED
app/projects/** — ALL LOCKED
app/shipping/** — ALL LOCKED
app/pricing/** — ALL LOCKED
app/messages/** — ALL LOCKED
app/analytics/** — ALL LOCKED
app/payments/** — ALL LOCKED
app/offers/** — ALL LOCKED
app/marketplace/** — ALL LOCKED
app/bundles/** — ALL LOCKED
app/bundle/** — ALL LOCKED
app/search/** — ALL LOCKED
app/connected-accounts/** — ALL LOCKED
app/components/AppNav.tsx — LOCKED (always-dark glass nav)
app/components/UploadModal.tsx — LOCKED
app/components/DemoBanner.tsx — LOCKED
app/components/CollapsiblePanel.tsx — LOCKED
app/components/OfferManagerPanel.tsx — LOCKED
app/components/OfferHistoryTimeline.tsx — LOCKED
app/components/ActiveOffersWidget.tsx — LOCKED
app/components/CronStatusWidget.tsx — LOCKED
app/components/BundleSuggestions.tsx — LOCKED
app/components/billing/EarningsBreakdown.tsx — LOCKED
app/components/messaging/** — ALL LOCKED

# Always-dark overlays — LOCKED (white text is correct on dark bg)
app/components/ItemActionPanel.tsx — LOCKED (always-dark overlay)
app/components/billing/CancelFlowModal.tsx — LOCKED (always-dark modal)
app/components/billing/UpgradeFlowModal.tsx — LOCKED (always-dark modal)
app/components/TradeProposalModal.tsx — LOCKED (always-dark modal)
app/components/CommandPalette.tsx — LOCKED (always-dark)
app/components/HelpWidget.tsx — LOCKED (always-dark)
app/components/BotLoadingState.tsx — LOCKED (always-dark)

# Photo overlays / badges — LOCKED (on top of images, need guaranteed contrast)
app/components/EnrichmentBadge.tsx — LOCKED
app/items/[id]/PhotoGallery.tsx — LOCKED
app/items/[id]/AntiqueAlert.tsx — LOCKED
app/components/ProcessingFeeTooltip.tsx — LOCKED

# Config and infrastructure
globals.css — LOCKED
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY
app/page.tsx — LOCKED

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

Round 4 FINAL — Auth pages, credits, subscription, addons, remaining pages
(20 files, ~243 instances):

# ─── Auth Pages ───
app/auth/login/page.tsx — UNLOCKED (48 instances)
app/auth/forgot-password/page.tsx — UNLOCKED (18 instances)
app/auth/reset-password/page.tsx — UNLOCKED (11 instances)
app/auth/signup/page.tsx — UNLOCKED (10 instances)
app/auth/layout.tsx — UNLOCKED (5 instances)

# ─── Credits + Subscription ───
app/credits/CreditsClient.tsx — UNLOCKED (11 instances)
app/subscription/SubscriptionClient.tsx — UNLOCKED (17 instances)

# ─── Addons ───
app/addons/market-report/page.tsx — UNLOCKED (26 instances)
app/addons/buyer-outreach/page.tsx — UNLOCKED (21 instances)
app/addons/listing-optimizer/page.tsx — UNLOCKED (17 instances)

# ─── Heroes + Veterans ───
app/heroes/page.tsx — UNLOCKED (7 instances)
app/heroes/apply/HeroApplyClient.tsx — UNLOCKED (8 instances)
app/veterans/page.tsx — UNLOCKED (11 instances)

# ─── Other Pages ───
app/api-access/page.tsx — UNLOCKED (9 instances)
app/services/neighborhood-bundle/page.tsx — UNLOCKED (9 instances)
app/onboarding/results/page.tsx — UNLOCKED (6 instances)
app/admin/quotes/page.tsx — UNLOCKED (2 instances)
app/opengraph-image.tsx — UNLOCKED (2 instances)
app/store/[userId]/StoreFront.tsx — UNLOCKED (1 instance)
app/store/[userId]/item/[itemId]/BuyNowModal.tsx — UNLOCKED (1 instance)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

All bot AI logic, output formats, MegaBot, antique/collectible detection,
shipping, offers, credits, billing, subscriptions, marketplace, bundles,
trade proposals, sold price tracking, message center, data pipelines.

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  Upload system — shared UploadModal with 6 methods
  Light Mode Rounds 1-3 — 1,320 replacements across 68 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Flag all missed data collection opportunities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

UI-only color fix. Zero logic changes. Zero API changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY: Improve beyond spec, flag gaps, choose cleanest path, make investor-ready.
You MAY NOT: Touch locked files, change logic, change bot output, add packages.
CRITICAL: Only change COLOR values. Zero logic changes in any file.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env. Admin bypasses all gates. TO GO LIVE: set false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — FINAL PASS: Fix Light Mode on All Remaining Pages

This is Round 4 of 4 — the FINAL light mode fix. After this, every theme-aware
surface in the entire app will use CSS variables. No more invisible text or
buttons in light mode. Anywhere.

Round 1: 600 across 22 files (core nav + item views) ✅
Round 2: 495 across 18 files (bot pages) ✅
Round 3: 225 across 28 files (supporting pages) ✅
Round 4: ~243 across 20 files (auth, credits, subscription, addons, remaining) ← THIS

THE REPLACEMENT RULES (same as Rounds 1-3):

  TEXT: rgba(255,255,255,0.8-0.9) → var(--text-primary)
        rgba(255,255,255,0.55-0.7) → var(--text-secondary)
        rgba(255,255,255,0.2-0.5) → var(--text-muted)
        #fff/#e2e8f0 on theme surfaces → var(--text-primary)
        #cbd5e1 → var(--text-secondary)

  BORDERS: rgba(255,255,255,0.04-0.12) → var(--border-default)

  BACKGROUNDS: rgba(255,255,255,0.02-0.03) → var(--bg-card)
               rgba(255,255,255,0.04-0.08) → var(--ghost-bg)
               rgba(255,255,255,0.1-0.14) → var(--bg-card-hover)

  KEEP: White text on teal/accent/gradient buttons. White text on status badges.
        Elements inside always-dark containers.

SPECIAL NOTE FOR AUTH PAGES:
The login, signup, forgot-password, and reset-password pages may have custom
background gradients or dark sections. Check each page's root background.
If the page itself has a hardcoded dark background (e.g., the login page often
has a dark gradient), then white text on THAT page is fine. Only replace if
the page renders on a theme-aware background.

AFTER THIS ROUND: Run a FINAL verification scan:
  grep -rc 'rgba(255,255,255' app/ --include="*.tsx" | grep -v ':0$' | sort -t: -k2 -rn
Report the results. Any remaining instances should be in the LOCKED always-dark
files only. If any theme-aware surface files still have instances, flag them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ + REPLACE

For EACH of the 20 unlocked files:
1. Read the FULL file
2. Check the page's root/container background — is it theme-aware or always-dark?
3. Count rgba(255,255,255 instances
4. Identify theme-aware (REPLACE) vs dark-container (KEEP)
5. Apply replacements
6. Zero logic changes

Use bulk approach for efficiency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — FINAL VERIFICATION SCAN

After ALL replacements, run this scan to verify completeness:

  echo "=== FINAL SCAN — ALL REMAINING rgba(255,255,255) ===" && \
  grep -rc 'rgba(255,255,255' app/ --include="*.tsx" 2>/dev/null | \
  grep -v ':0$' | sort -t: -k2 -rn

Report EVERY file that still has instances. Categorize each as:
  - INTENTIONAL: always-dark overlay/modal (e.g., ItemActionPanel, CancelFlowModal)
  - INTENTIONAL: photo overlay/badge (e.g., EnrichmentBadge, PhotoGallery)
  - INTENTIONAL: always-dark nav (e.g., AppNav)
  - NEEDS FIX: missed in this round (flag for immediate attention)

The goal: ZERO "NEEDS FIX" entries after this round.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. All 20 files processed: yes / no
AUTH PAGES:
3. login/page.tsx fixed: [X replaced, Y kept]
4. signup/page.tsx fixed: [X replaced, Y kept]
5. forgot-password/page.tsx fixed: [X replaced, Y kept]
6. reset-password/page.tsx fixed: [X replaced, Y kept]
7. auth/layout.tsx fixed: [X replaced, Y kept]
CREDITS + SUBSCRIPTION:
8. CreditsClient.tsx fixed: [X replaced, Y kept]
9. SubscriptionClient.tsx fixed: [X replaced, Y kept]
ADDONS:
10. market-report/page.tsx fixed: [X replaced, Y kept]
11. buyer-outreach/page.tsx fixed: [X replaced, Y kept]
12. listing-optimizer/page.tsx fixed: [X replaced, Y kept]
REMAINING:
13. All other files fixed: [X replaced total]
FINAL SCAN:
14. Final grep scan run: yes / no
15. All remaining instances are in INTENTIONAL always-dark files: yes / no
16. ZERO "NEEDS FIX" entries: yes / no
QUALITY:
17. All component logic UNCHANGED: yes / no
18. Dark mode still correct: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]

PER-FILE REPORT (all 20 files):
  [File: X replaced, Y kept — pass/issue]

TOTAL ROUND 4: [X instances replaced across Y files]

GRAND TOTAL (ALL 4 ROUNDS):
  Round 1: 600 across 22 files
  Round 2: 495 across 18 files
  Round 3: 225 across 28 files
  Round 4: [X] across 20 files
  GRAND TOTAL: [sum] across [sum] files

FINAL VERIFICATION SCAN:
  [Paste the full output of the grep scan]
  [Categorize every remaining file as INTENTIONAL or NEEDS FIX]

DARK MODE REGRESSION: [Confirm no regressions]
ALL LOGIC UNTOUCHED: [Confirm]

FLAGS: [Any remaining issues]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Light Mode Fix Round 4 FINAL
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
