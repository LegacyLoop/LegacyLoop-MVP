LEGACYLOOP — COMMAND TEMPLATE v9
Onboarding Quiz Upgrade — Feel, Flow, White Glove, Neighborhood, Both Themes + Routing Fixes
Updated: March 19, 2026 | Use this for EVERY build command

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

THE STANDARD: Every screen must feel like it belongs in a $1B product.
This quiz should feel like a concierge consultation, not a web form.
Think Apple onboarding meets Tesla delivery experience.

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

app/onboarding/quiz/page.tsx — UNLOCKED (upgrade quiz UI, theme support, tone, White Glove preview, optional notes field, routing guard fixes)
app/onboarding/results/page.tsx — UNLOCKED (upgrade results UI, theme support, Neighborhood Bundle surfacing, stronger CTAs, White Glove soft-surface)

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

For this command: UI upgrade + minor routing guard logic.
The core scoring dimensions are solid — keep them.
The tier routing fundamentals are solid — keep them.
We are upgrading the FEEL, the TONE, the VISUAL DESIGN,
adding White Glove/Neighborhood surfacing,
and adding THREE targeted routing guards (see Section H below).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Demo-ready. PHASE 2: Direct publish per platform.

LegacyLoop serves two audiences through one ecosystem:
  1. ESTATE SIDE — seniors, families, estate transitions, inherited belongings
  2. GARAGE/YARD SALE SIDE — families, movers, declutterers, casual sellers

The quiz must feel appropriate for BOTH audiences. Warm and dignified for
estate situations. Easy and energetic for garage sale situations.

FULL SERVICE CATALOG (the quiz should surface ALL of these naturally):

  DIGITAL TIERS (self-service with AI):
    Free:           $0/mo,  12% commission, 3 items
    DIY Seller:     $10-20/mo, 8% commission, 25 items
    Power Seller:   $25-49/mo, 5% commission, 100 items
    Estate Manager: $75-99/mo, 4% commission, unlimited items

  WHITE GLOVE TIERS (on-site, full-service estate management):
    Essentials:     $1,495 (up to 100 items, 1-2 bedrooms)
    Professional:   $2,995 (200+ items, 3-4 bedrooms) — RECOMMENDED
    Legacy:         $4,995+ (unlimited items, dedicated PM, printed legacy book)

  NEIGHBORHOOD BUNDLE (group/community sales):
    Coordinate with neighbors, share costs, create a selling event.
    Route: /services/neighborhood-bundle

  CREDIT ADD-ONS (premium AI tools):
    AI Listing Optimizer, Buyer Outreach Blast, AI Market Report,
    MegaBot Analysis, Expert Appraisal, Text/Audio/Video Story,
    Priority Processing, Inventory Report PDF, Print Story Book,
    Legacy Archive USB, White Glove Coordination, Estate Documentation,
    Social Media Pack, AI Price Drop Alert

  CREDIT PACKS:
    $25 → 30 credits, $50 → 65, $100 → 140, $200 → 300

The quiz must feel like it KNOWS about all of these services and guides
the user toward the right one. Not a hard sell — a warm recommendation
from someone who genuinely understands their situation.

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
  - Add hover states, focus states, and interaction feedback on EVERY element
  - Add a subtle welcome/header message that sets emotional tone

You MAY NOT:
  - Touch any locked files
  - Change the core scoring dimensions (estate, garage, neighborhood, whiteGlove, diy)
  - Change the tier routing logic fundamentals (the guards in Section H REFINE, not replace)
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

OBJECTIVE — Upgrade Onboarding Quiz: Both Themes + White Glove + Warmth + Polish + Routing Guards

The onboarding quiz is the first impression for new users. It currently
works functionally but uses hardcoded light-theme colors, has a transactional
tone, and doesn't surface White Glove or Neighborhood Bundle services.

This command upgrades both files:

1. quiz/page.tsx — Theme support, warmer tone, White Glove preview, optional
   "anything else" field, improved visual design, micro-animations, routing guards

2. results/page.tsx — Theme support, Neighborhood Bundle surfacing, stronger
   personalization, improved CTAs, White Glove soft-surface for borderline users

SPECIFIC UPGRADES (A through H):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A) THEME SUPPORT (both files):

  Replace ALL hardcoded colors with CSS variables.
  74 total instances across both files.
  EXACT MAPPING — use this reference:

    BACKGROUNDS:
    "#f0fdfa"                             → var(--bg-primary)
    "#eff6ff"                             → var(--bg-primary)
    "#fff" or "#ffffff"                   → var(--bg-card-solid)
    "#fafaf9"                             → var(--ghost-bg)
    "#ecfdf5"                             → var(--bg-primary)
    "linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%)"
                                          → linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)

    TEXT:
    "#1c1917"                             → var(--text-primary)
    "#78716c"                             → var(--text-muted)
    "#57534e"                             → var(--text-secondary)
    "#a8a29e"                             → var(--muted-color)
    "#d6d3d1"                             → var(--border-default)

    ACCENT:
    "#0f766e"                             → var(--accent-theme)
    "#0d9488"                             → var(--accent)
    "linear-gradient(90deg, #0f766e, #0d9488)"
                                          → linear-gradient(90deg, var(--accent-theme), var(--accent))

    BORDERS + SURFACES:
    "#e7e5e4"                             → var(--ghost-bg)
    "rgba(0,0,0,0.08)" or similar shadow  → var(--card-shadow)
    "rgba(0,0,0,0.06)" or similar shadow  → var(--card-shadow)

    SPECIAL CASES (keep hardcoded — intentional always-colored):
    "#fef9c3", "#fde68a", "#92400e", "#78350f" — appraisal upsell (always gold)
    "#eff6ff", "#bfdbfe", "#1e40af", "#1e3a8a" — vehicle note (always blue)
    "#fbbf24" — gold accent for White Glove pricing (always gold)
    White Glove card dark gradient "#1c1917" → "#292524" — intentionally always dark

  IMPORTANT: "#fff" used as button text color on accent backgrounds
  should stay "#fff" or use var(--btn-primary-text). Do NOT replace
  white text on teal/dark backgrounds with var(--bg-card-solid).

  The quiz must look STUNNING in both light and dark mode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B) WARMER TONE (quiz/page.tsx):

  The quiz currently asks clinical questions. Make them warmer:

  Q1 (situation):
    Old: "What brings you to LegacyLoop?"
    New: "What's happening in your life right now?"
    Subtitle: "We're here to help — no matter the situation."

  Q2 (itemCount):
    Keep question as-is ("How many items do you need to sell?")
    Add subtitle: "Don't worry about an exact count — a rough idea helps."

  Q3 (timeline):
    Keep question as-is ("What's your timeline?")
    Add subtitle: "We work at your pace. No pressure."

  Q4 (helpLevel):
    Old: "How much help do you want?"
    New: "How would you like us to help?"
    Subtitle: "There's no wrong answer. We meet you where you are."

  Q5 (budget):
    Old: "What's your budget for getting started?"
    New: "What level of investment feels right?"
    Subtitle: "Every option includes AI-powered pricing and analysis."

  Q6 (specialItems):
    Keep question and subtitle as-is.
    They already work well.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C) WHITE GLOVE PREVIEW (quiz/page.tsx):

  After Q4 (helpLevel), if the user selected "fullService" or "someHelp",
  show a brief inline preview BEFORE advancing to Q5.
  This is NOT a new question — it is a contextual info card that appears
  below the selected option with a smooth slide-down animation.

  Content:
    "✨ Based on your answers, you might love our White Glove service.
     Our team comes to your home, photographs everything, prices with AI,
     and handles all buyers and shipping. You just approve sales.
     Starting at $1,495 — we'll show you options at the end."

  Style: Subtle card with var(--accent-dim) background,
  var(--accent-border) border, var(--accent-theme) text.
  Dismisses automatically when next question loads.

  If user selected "diy" or "learning" — do NOT show.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D) OPTIONAL "ANYTHING ELSE" FIELD (quiz/page.tsx):

  Add a 7th step AFTER specialItems — optional, skippable:

  Question: "Anything else we should know?"
  Subtitle: "Share anything that helps us personalize your experience.
             Family situation, timeline details, special concerns — it all helps."
  Type: textarea (free text, max 500 characters)
  Placeholder: "e.g., My mother recently passed and I'm managing her estate alone..."

  Buttons: "Skip →" (muted style) and "Continue →" (accent style)
  Both advance to results.
  Skip passes empty string. Continue passes the text.

  CRITICAL: Include this text in the recommendation payload as a new field
  called "userNotes" so it is passed to the results page via the URL params.
  The results page does NOT need to display it — but it must be in the data.

  This textarea must NOT have points or affect scoring.
  It is pure qualitative data collection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E) NEIGHBORHOOD BUNDLE SURFACING (results/page.tsx):

  When primaryCategory is "neighborhood" AND neighborhood score > 8,
  add a prominent section BETWEEN the primary recommendation card
  and the "Why we recommend this" section:

  Content:
    Icon: 🏘️
    Title: "Neighborhood Bundle — Perfect for You"
    Body: "You mentioned organizing a group or community sale.
           Our Neighborhood Bundle lets you coordinate with neighbors,
           share the costs, and turn it into a real event.
           More buyers. Less hassle. Better prices for everyone."
    CTA: "Learn More About Neighborhood Bundles →"
    Link: /services/neighborhood-bundle

  Style: Card with var(--accent-dim) background, var(--accent-border) border,
  rounded 1.25rem, comfortable padding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F) RESULTS PERSONALIZATION (results/page.tsx):

  The results page currently shows a recommendation with generic reasons.
  Make it feel like a concierge consultation:

  1. SITUATION CONTEXT (above the recommendation card):
     Build a personalized sentence from the recommendation data:

     "Based on your [estate transition / garage sale / neighborhood sale]
      with [a few / quite a few / 200+] items and a [flexible / urgent] timeline,
      here's what we recommend:"

     Map primaryCategory:
       estate → "estate transition"
       garage → "garage sale"
       neighborhood → "neighborhood sale"

     This replaces the current generic "Based on your answers, here's what we recommend:"

  2. CONFIDENCE INDICATOR (already exists — enhance):
     Keep the confidence bar. Add text:
     "We're {confidence}% confident this is the right plan for you."

  3. WHITE GLOVE PRICING TRANSPARENCY:
     For White Glove recommendations (ESSENTIALS, PROFESSIONAL, LEGACY),
     add a brief explainer inside the primary card:
       ESSENTIALS: "Starting at $1,495 — on-site visit, AI photography,
                    up to 100 items, buyer management included."
       PROFESSIONAL: "Starting at $2,995 — full estate management,
                      3-4 bedrooms, multiple visits, MegaBot on every item."
       LEGACY: "Starting at $4,995 — unlimited items, dedicated project manager,
                printed legacy book, premium everything."

  4. CREDIT ADD-ONS MENTION:
     For ALL digital tier recommendations (FREE, STARTER, PLUS, PRO),
     add a small note below the primary card:
       "💡 Pro tip: Add AI-powered tools like Expert Appraisals,
        Buyer Outreach, and Market Reports with credit packs starting at $25."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

G) VISUAL POLISH (both files):

  1. PROGRESS BAR:
     Gradient: linear-gradient(90deg, var(--accent-theme), var(--accent))
     Height: 8px (up from 6px)
     Rounded full.
     Smooth transition on width change.
     Add a subtle glow: boxShadow 0 0 8px var(--accent-glow) on the filled portion.

  2. SELECTED OPTION GLOW:
     When an option is selected:
       border: 2px solid var(--accent-theme)
       boxShadow: 0 0 0 3px var(--accent-glow)
       background: var(--accent-dim)
     Unselected:
       border: 2px solid var(--ghost-bg)
       background: var(--bg-card-solid)
     Hover (unselected):
       border: 2px solid var(--border-hover)
       background: var(--bg-card-hover)

  3. TRANSITIONS:
     Keep the existing fade + translateX transition.
     Ensure timing is 220ms ease for fade-out, immediate snap for fade-in.
     Consider adding a subtle scale transform (0.98 → 1.0) on card entrance.

  4. CARDS:
     All cards: borderRadius 1.5rem, boxShadow var(--card-shadow),
     border: 1px solid var(--border-default).
     On hover (where interactive): boxShadow var(--card-shadow-hover).

  5. LOGO:
     Already links to "/" — good.
     Logo box background: var(--accent-theme)
     Logo text color: var(--text-primary)

  6. FOOTER TEXT:
     "No account needed · Takes about 2 minutes"
     Color: var(--muted-color)

  7. BUTTONS:
     Primary (Next, Continue, See Results):
       background: var(--accent-theme)
       color: #fff
       borderRadius: 0.875rem
       On hover: background var(--accent-theme-hover), subtle lift boxShadow

     Ghost (Back, Skip):
       background: transparent
       color: var(--text-muted)
       On hover: color var(--text-primary)

     Results page CTA:
       Pill shape (borderRadius 9999px)
       background: var(--accent-theme)
       On hover: var(--accent-theme-hover) + lift shadow

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

H) ROUTING GUARD FIXES (quiz/page.tsx — calculateRecommendation function):

  Three targeted refinements to the routing logic.
  These are GUARDS, not rewrites. The core logic stays the same.
  Add these checks INSIDE calculateRecommendation.

  FIX 1 — BUDGET GUARD FOR WHITE GLOVE PATH:

  PROBLEM: If a user's whiteGlove score >= 10 but they selected budget="free"
  or budget="affordable", they get routed to LEGACY/PROFESSIONAL/ESSENTIALS
  ($1,495-$4,995+). That's a bad experience — user said they want free/low cost.

  FIX: Before the White Glove tier assignment block, add a budget guard:

    // Budget guard: respect the user's stated budget
    // If they explicitly said free or affordable, route digital even if whiteGlove is high
    const budgetBlocksWhiteGlove = budget === "free" || budget === "affordable";

    if (budget === "premium" || (whiteGlove >= 10 && serviceLevel === "whiteGlove" && !budgetBlocksWhiteGlove)) {
      // White Glove path (unchanged inside)
    } else {
      // Digital path (unchanged inside)
    }

  RESULT: Users who say they want free/affordable get digital tiers.
  White Glove gets soft-surfaced on the results page instead (see Fix 3).

  FIX 2 — FULL-SERVICE INTENT FLAG:

  PROBLEM: User selects "Do it all for me" (helpLevel=fullService) but ends up
  with a digital tier because their diy score beats whiteGlove by a small margin
  from other answers.

  FIX: Track whether the user explicitly selected fullService or someHelp.
  Pass this as a new boolean field "wantsHelp" in the Recommendation object:

    const wantsHelp = answers.helpLevel === "fullService" || answers.helpLevel === "someHelp";

  Add to the return object:
    wantsHelp,

  NOTE: This does NOT change the tier routing. It is a signal the results page
  uses to show a "Consider White Glove" soft-sell section even when the
  recommended tier is digital. See Fix 3.

  UPDATE Recommendation interface: The Recommendation type is in
  lib/pricing/constants.ts which is LOCKED. DO NOT modify it.
  Instead, pass wantsHelp and userNotes as additional URL params
  alongside the existing ?r= param. For example:
    /onboarding/results?r={...}&wh=true&notes=...

  FIX 3 — WHITE GLOVE SOFT-SURFACE ON RESULTS (results/page.tsx):

  When the recommended tier is DIGITAL (FREE/STARTER/PLUS/PRO)
  BUT wantsHelp is true (from Fix 2) OR whiteGlove score >= 8,
  add a section on the results page AFTER the primary recommendation:

    "🤝 Want us to handle it all?
     Our White Glove service starts at $1,495.
     We come to your home, photograph everything, price with AI,
     and manage all buyers and shipping. You just approve sales.
     [Explore White Glove Options →]"

  Link: /white-glove

  This ensures users who expressed interest in help ALWAYS see the option,
  even when the scoring math routes them digital.

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
   Find: Recommendation interface (line 144)

4. Read app/white-glove/page.tsx — READ ONLY
   Understand what the White Glove landing page shows (for consistency)

5. Read app/services/neighborhood-bundle/page.tsx — READ ONLY
   Understand what the Neighborhood Bundle page shows (for consistency)

6. Read app/globals.css — READ ONLY (lines 1-160)
   Find: All CSS variable definitions for html.dark and html.light
   Use these EXACT variable names in all replacements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Upgrade quiz/page.tsx

Apply ALL changes from the OBJECTIVE sections (A through H) to the quiz page:
  1. Replace all 25 hardcoded colors with CSS variables (Section A)
  2. Update question wording for warmth (Section B)
  3. Add White Glove preview after Q4 for fullService/someHelp users (Section C)
  4. Add optional 7th "Anything else?" step with textarea (Section D)
  5. Apply all visual polish — glow, hover, progress bar, transitions (Section G)
  6. Add budget guard in calculateRecommendation (Section H, Fix 1)
  7. Add wantsHelp flag (Section H, Fix 2)
  8. Pass userNotes and wantsHelp to results page URL

Keep the 5 scoring dimensions UNCHANGED.
Keep the 6 existing questions (with improved wording).
Keep tier routing fundamentals UNCHANGED (guards only ADD safety checks).

PART C — Upgrade results/page.tsx

Apply ALL changes from the OBJECTIVE sections (A, E, F, G, H) to the results page:
  1. Replace all 49 hardcoded colors with CSS variables (Section A)
  2. Add Neighborhood Bundle surfacing when neighborhood > 8 (Section E)
  3. Add personalized situation context sentence (Section F)
  4. Add White Glove pricing transparency for WG tiers (Section F)
  5. Add credit add-ons mention for digital tiers (Section F)
  6. Apply all visual polish (Section G)
  7. Read wantsHelp param and show White Glove soft-surface (Section H, Fix 3)

Keep tier routing logic UNCHANGED.
Keep all helper functions UNCHANGED (refine messaging only).

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
8. Subtitles added with supportive messaging on ALL 6 questions: yes / no

WHITE GLOVE:
9. White Glove preview shows after Q4 when fullService or someHelp: yes / no
10. White Glove preview does NOT show when diy or learning: yes / no
11. Results show White Glove pricing for WG tier recommendations: yes / no
12. Results show White Glove soft-surface when wantsHelp=true but tier is digital: yes / no

NEIGHBORHOOD:
13. Neighborhood Bundle section shows when neighborhood score > 8: yes / no
14. Link to /services/neighborhood-bundle works: yes / no

OPTIONAL FIELD:
15. "Anything else?" step added as 7th question: yes / no
16. Skip button works (passes empty string): yes / no
17. Continue button works (passes text): yes / no
18. Free text included as userNotes in URL params: yes / no

ROUTING GUARDS:
19. Budget guard: budget="free" + high whiteGlove → digital tier (NOT White Glove): yes / no
20. Budget guard: budget="premium" still routes White Glove correctly: yes / no
21. wantsHelp flag passed when helpLevel is fullService or someHelp: yes / no

RESULTS PERSONALIZATION:
22. Situation context sentence shows correct category and item count: yes / no
23. Credit add-ons tip shows for ALL digital tier results: yes / no

VISUAL:
24. Progress bar uses teal gradient with glow: yes / no
25. Selected options have teal glow (boxShadow): yes / no
26. Hover states on all interactive elements: yes / no
27. Transitions smooth between questions: yes / no

SCORING:
28. Core 5 scoring dimensions UNCHANGED: yes / no
29. All 7 tiers still reachable: yes / no
30. Budget guard does NOT block any tier permanently: yes / no

INTEGRITY:
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
  - Hardcoded colors replaced: [count of 25]
  - Budget guard added: [yes / no]
  - wantsHelp flag added: [yes / no]

Fix C — Results page upgrade: [fixed / issue]
  - Theme support (dark + light): [yes / no]
  - Neighborhood Bundle surfacing: [yes / no]
  - Improved personalization: [yes / no]
  - White Glove soft-surface for digital+wantsHelp: [yes / no]
  - Credit add-ons mention: [yes / no]
  - Hardcoded colors replaced: [count of 49]

SCORING LOGIC UNCHANGED: [Confirm]
TIER ROUTING FUNDAMENTALS UNCHANGED: [Confirm]
BUDGET GUARD WORKING: [Confirm]
LIGHT + DARK MODE: [Both clean]

FLAGS: [Any gaps or issues]

Files modified: [list all — should be exactly 2]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Onboarding Quiz Upgrade
Approved: March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
