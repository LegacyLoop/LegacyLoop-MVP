LEGACYLOOP — COMMAND TEMPLATE v8
Onboarding Quiz Upgrade — Feel, Flow, White Glove, Neighborhood, Both Themes
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

LIGHT MODE RULE: All colors MUST use CSS variables from globals.css.
The quiz currently uses hardcoded light-theme colors (#f0fdfa, #fff, #1c1917).
These MUST be replaced with CSS variables that work in both modes.

SPECIAL NOTE: The onboarding quiz is the FIRST impression for new users.
It must feel personal, warm, and premium. Seniors managing estate transitions
need to feel that someone CARES. Families decluttering need to feel supported.
This is not a cold survey — it's the beginning of a relationship.

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
lib/data/** — ALL LOCKED

# ─── Enrichment ───
lib/enrichment/** — ALL LOCKED

# ─── Credits + Billing ───
lib/credits.ts — LOCKED
lib/tier-enforcement.ts — READ ONLY
lib/billing/** — ALL LOCKED

# ─── Offers ───
lib/offers/** — ALL LOCKED

# ─── Email System ───
lib/email/** — ALL LOCKED

# ─── Pricing Constants ───
lib/constants/pricing.ts — LOCKED
lib/pricing/constants.ts — READ ONLY (quiz reads tier data from here)
lib/adapters/pricing.ts — LOCKED
lib/pricing/calculate.ts — LOCKED

# ─── All API Routes ───
app/api/** — ALL LOCKED

# ─── All UI Files (not quiz) ───
app/items/** — ALL LOCKED
app/dashboard/** — ALL LOCKED
app/bots/** — ALL LOCKED
app/messages/** — ALL LOCKED
app/components/** — ALL LOCKED
app/subscription/** — ALL LOCKED
app/credits/** — ALL LOCKED
app/marketplace/** — ALL LOCKED
app/shipping/** — ALL LOCKED
app/pricing/** — ALL LOCKED
app/projects/** — ALL LOCKED

# ─── Infrastructure ───
globals.css — LOCKED (CSS variables are correct — quiz must USE them)
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY
app/page.tsx — LOCKED

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/onboarding/quiz/page.tsx — UNLOCKED (upgrade quiz UI, theme support, tone, White Glove preview, optional notes field)
app/onboarding/results/page.tsx — UNLOCKED (upgrade results UI, theme support, Neighborhood Bundle surfacing, stronger CTAs)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these.

PASS 1-3 LOCKED: All bot AI logic, output formats, MegaBot, antique/collectible
detection, shipping, offers, credits, billing, subscriptions, marketplace,
bundles, trade proposals, sold price tracking, message center, data pipelines.

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  Upload system — shared UploadModal with 6 methods, wired into both pages
  Edit Item Form — 14 new fields with full section organization
  Item Control Center V1+V2 — consolidated Trade+Sale, info strip, tighter
  Light Mode Rounds 1-4 — ~1,554 replacements across 88 files
  Message Center — light mode, Weekly Report, functional AI inbox, star buyers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

For this command: The quiz data (answers, scores, recommended tier) is already
saved via the /api/quote route. Ensure the optional "anything else" field
is included in the saved data. This free-text input gives us natural language
context about each user's situation — incredibly valuable for personalizing
their experience and for understanding our customer base.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

For this command: UI upgrade only. The quiz scoring logic is solid — keep it.
The tier routing logic is solid — keep it. We're upgrading the FEEL, the TONE,
the VISUAL DESIGN, and adding White Glove/Neighborhood surfacing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

LegacyLoop serves two audiences:
  1. ESTATE SIDE — seniors, families, estate transitions, inherited belongings
  2. GARAGE/YARD SALE SIDE — families, movers, declutterers, casual sellers

The quiz must feel appropriate for BOTH audiences. Warm and dignified for
estate situations. Easy and energetic for garage sale situations.

White Glove services: ESSENTIALS ($1,495), PROFESSIONAL ($2,995), LEGACY ($4,995+)
These are on-site, full-service estate management. The quiz should surface these
naturally when the user's answers indicate they need full-service help.

Neighborhood Bundle: A group/community sale service. The quiz tracks a
"neighborhood" score. When it's high, the results should surface this service.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY:
  - Improve beyond minimum spec
  - Make the quiz feel personal, warm, and premium
  - Improve question wording for emotional resonance
  - Add micro-animations and transitions that feel polished
  - Add a White Glove preview/explainer within the quiz flow
  - Add contextual hints or helper text that guides the user
  - Improve the progress indicator
  - Make the results page feel like a personalized consultation
  - Add polish that serves the Elon standard
  - Make this feel like a $1B product

You MAY NOT:
  - Touch any locked files
  - Change the core scoring dimensions (estate, garage, neighborhood, whiteGlove, diy)
  - Change the tier routing logic fundamentals
  - Change the API route for saving quiz data
  - Deviate from inline style={{}}
  - Add unapproved npm packages
  - Change schema

You MAY refine:
  - Question wording (better tone, more empathetic)
  - Option text (clearer, more relatable)
  - Score weights (if improvements are obvious)
  - Results page layout and messaging
  - CTA text and routing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env — active now.
Admin account bypasses ALL tier gates and credit deductions.
TO GO LIVE: Set DEMO_MODE=false, switch Square to production keys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Upgrade Onboarding Quiz: Both Themes + White Glove + Warmth + Polish

The onboarding quiz is the first impression for new users. It currently
works functionally but uses hardcoded light-theme colors, has a transactional
tone, and doesn't surface White Glove or Neighborhood Bundle services.

This command upgrades both files:

1. quiz/page.tsx — Theme support, warmer tone, White Glove preview, optional
   "anything else" field, improved visual design, micro-animations

2. results/page.tsx — Theme support, Neighborhood Bundle surfacing, stronger
   personalization, improved CTAs, White Glove explanation

SPECIFIC UPGRADES:

A) THEME SUPPORT (both files):
  Replace ALL hardcoded colors with CSS variables:
    background: "#f0fdfa" → background: "var(--bg-primary)"
    background: "#fff" → background: "var(--bg-card-solid)"
    color: "#1c1917" → color: "var(--text-primary)"
    color: "#78716c" → color: "var(--text-muted)"
    color: "#0f766e" → color: "var(--accent)"
    background: "#e7e5e4" → background: "var(--ghost-bg)"
    boxShadow with rgba(0,0,0,0.08) → var(--card-shadow)
  The quiz must look STUNNING in both light and dark mode.

B) WARMER TONE (quiz/page.tsx):
  The quiz currently asks clinical questions. Make them warmer:
  - Q1: "What brings you to LegacyLoop?" → "What's happening in your life right now?"
    Add subtitle: "We're here to help — no matter the situation."
  - Q4: "How much help do you want?" → "How would you like us to help?"
    Subtitle: "There's no wrong answer. We meet you where you are."
  - Q5: "What's your budget?" → "What level of investment feels right?"
    Subtitle: "Every option includes AI-powered pricing and analysis."

C) WHITE GLOVE PREVIEW (quiz/page.tsx):
  After Q4, if the user selected "Do it all for me" or "Help with complicated parts",
  show a brief inline preview (not a new question, just a contextual hint):
    "✨ Based on your answers, you might love our White Glove service.
     Our team comes to your home, photographs everything, prices with AI,
     and handles all buyers. You just approve sales."
  This is a soft introduction, not a hard sell.

D) OPTIONAL "ANYTHING ELSE" FIELD (quiz/page.tsx):
  Add a 7th step (after specialItems) — optional, skippable:
  Question: "Anything else we should know?"
  Subtitle: "Share anything that helps us personalize your experience."
  Type: textarea (free text)
  A "Skip" button and a "Continue" button.
  Include this text in the recommendation payload passed to results page.

E) NEIGHBORHOOD BUNDLE SURFACING (results/page.tsx):
  When primaryCategory is "neighborhood" and neighborhood score > 8,
  add a prominent section in the results:
    "🏘️ Neighborhood Bundle — Perfect for group and community sales.
     Coordinate with your neighbors, share the costs, and make it an event.
     [Learn more about Neighborhood Bundles →]"
  Link to /services/neighborhood-bundle

F) RESULTS PERSONALIZATION (results/page.tsx):
  The results page currently shows a recommendation with generic reasons.
  Make it feel like a consultation:
  - Add the user's situation context at the top: "Based on your [estate/garage/neighborhood]
    sale with [few/many/200+] items and a [flexible/urgent] timeline..."
  - Add a confidence indicator: "We're X% confident this is the right plan for you"
  - For White Glove recommendations, add pricing transparency:
    "Starting at $1,495 — includes on-site visit, AI photography, and buyer management"

G) VISUAL POLISH (both files):
  - Smooth fade transitions between questions (already exists, enhance)
  - Progress bar with gradient (already exists, match teal theme)
  - Selected option: teal border glow + checkmark icon
  - Hover states on all interactive elements
  - Card shadow and border radius matching the app design system
  - LegacyLoop logo at top should link back to "/"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/onboarding/quiz/page.tsx — FULL file (710 lines)
   Find: Lines 39-253 — QUIZ_QUESTIONS array (all 6 questions)
   Find: Lines 255-343 — scoring and recommendation logic
   Find: Lines 347-431 — component state and handlers
   Find: Lines 433-710 — JSX rendering (light-theme hardcoded colors)

2. Read app/onboarding/results/page.tsx — FULL file (721 lines)
   Find: Lines 15-71 — helper functions (tier names, prices, descriptions)
   Find: Lines 73-165 — recommendation reasons builder
   Find: Entire JSX rendering section (light-theme hardcoded colors)

3. Read lib/pricing/constants.ts — READ ONLY
   Find: WHITE_GLOVE_TIERS export (for pricing data)
   Find: DIGITAL_TIERS export (for subscription data)

4. Read app/white-glove/page.tsx — READ ONLY
   Understand what the White Glove landing page shows (for consistency)

5. Read app/services/neighborhood-bundle/page.tsx — READ ONLY
   Understand what the Neighborhood Bundle page shows (for consistency)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Upgrade quiz/page.tsx

Apply ALL changes from the OBJECTIVE section (A through G) to the quiz page.
Keep the scoring logic and recommendation calculation UNCHANGED.
Keep the 6 existing questions (with improved wording).
Add the optional 7th step (anything else).
Replace ALL hardcoded colors with CSS variables.

PART C — Upgrade results/page.tsx

Apply ALL changes from the OBJECTIVE section (A, E, F, G) to the results page.
Keep the tier routing logic UNCHANGED.
Add Neighborhood Bundle surfacing.
Improve personalization messaging.
Replace ALL hardcoded colors with CSS variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. All reads completed: yes / no
THEME SUPPORT:
3. Quiz page: zero hardcoded #f0fdfa, #fff, #1c1917 remaining: yes / no
4. Quiz page: works in dark mode: yes / no
5. Results page: zero hardcoded light-theme colors remaining: yes / no
6. Results page: works in dark mode: yes / no
WARMTH + TONE:
7. Question wording improved (warmer, more empathetic): yes / no
8. Subtitles added with supportive messaging: yes / no
WHITE GLOVE:
9. White Glove preview shows after help-level question: yes / no
10. Results show White Glove pricing for relevant recommendations: yes / no
NEIGHBORHOOD:
11. Neighborhood Bundle section shows when neighborhood score > 8: yes / no
12. Link to /services/neighborhood-bundle works: yes / no
OPTIONAL FIELD:
13. "Anything else?" step added as 7th question: yes / no
14. Skip button works: yes / no
15. Free text included in recommendation payload: yes / no
VISUAL:
16. Progress bar uses teal gradient: yes / no
17. Selected options have teal glow: yes / no
18. Transitions smooth between questions: yes / no
SCORING:
19. Core scoring logic UNCHANGED: yes / no
20. Tier routing logic UNCHANGED: yes / no
21. All 7 tiers still reachable: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]

Fix B — Quiz page upgrade: [fixed / issue]
  - Theme support (dark + light): [yes / no]
  - Warmer question wording: [yes / no]
  - White Glove preview: [yes / no]
  - Optional "anything else" step: [yes / no]
  - Hardcoded colors replaced: [count]

Fix C — Results page upgrade: [fixed / issue]
  - Theme support (dark + light): [yes / no]
  - Neighborhood Bundle surfacing: [yes / no]
  - Improved personalization: [yes / no]
  - Hardcoded colors replaced: [count]

SCORING LOGIC UNCHANGED: [Confirm]
TIER ROUTING UNCHANGED: [Confirm]
LIGHT + DARK MODE: [Both clean]

FLAGS: [Any gaps or issues]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Onboarding Quiz Upgrade
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
