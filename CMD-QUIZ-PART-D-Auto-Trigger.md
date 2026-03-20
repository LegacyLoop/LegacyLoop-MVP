LEGACYLOOP — COMMAND TEMPLATE v9 — PART D
Onboarding Quiz Auto-Trigger + Persistence + Retake
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

PREREQUISITE: Parts A, B, and C must be completed and passing.
Part D adds quiz auto-trigger for new users, persistence via localStorage,
and a retake assessment option.

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

  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
  NEVER hardcoded rgba(255,255,255,...) or #fff on theme surfaces.

  ELON MUSK STANDARD: This must feel like a $1B product.
  Every interaction must feel responsive and purposeful.
  Think Tesla center console — dense, smart, fast.

  ALWAYS-DARK PANELS: Modals and overlays that are always dark
  MUST use hardcoded colors (#e2e8f0 text, rgba(255,255,255,0.05) bg)
  NEVER CSS variables — they invert in light mode.

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
  grep 'DEMO_MODE' .env | head -2
  grep -n 'shouldBypassGates|isDemoMode' lib/constants/pricing.ts | head -3
  grep -n 'checkCredits|deductCredits' lib/credits.ts | head -3
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Verify Parts A+B+C completed ---'
  grep -c 'var(--' app/onboarding/quiz/page.tsx
  grep -c 'var(--' app/onboarding/results/page.tsx
  grep -c 'wantsHelp\|userNotes\|showNeighborhoodBundle\|showWhiteGloveSoftSurface' app/onboarding/results/page.tsx
  echo '=== CHECKPOINT COMPLETE ==='

Expected:
  quiz var(-- count: 40+
  results var(-- count: 40+
  results new features count: 4+

If results features count < 4, Part C was not completed — STOP and report.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALWAYS LOCKED — Never touch without explicit surgical unlock:

— Core Adapters —
✓ lib/adapters/ai.ts
✓ lib/adapters/rainforest.ts
✓ lib/adapters/auth.ts — EXTEND ONLY
✓ lib/adapters/storage.ts
✓ lib/adapters/multi-ai.ts

— AI Detection + Scoring —
✓ lib/antique-detect.ts
✓ lib/collectible-detect.ts

— MegaBot Engine —
✓ lib/megabot/run-specialized.ts
✓ lib/megabot/prompts.ts — ADD-ONLY

— Shipping —
✓ lib/shipping/package-suggestions.ts

— Data Pipelines —
✓ lib/data/backfill.ts
✓ lib/data/populate-intelligence.ts
✓ lib/data/project-rollup.ts
✓ lib/data/user-events.ts

— Enrichment —
✓ lib/enrichment/item-context.ts
✓ lib/addons/enrich-item-context.ts

— Credits + Billing —
✓ lib/credits.ts
✓ lib/tier-enforcement.ts — READ ONLY
✓ lib/billing/pro-rate.ts
✓ lib/billing/commission.ts

— Offers —
✓ lib/offers/expiry.ts
✓ lib/offers/notify.ts
✓ lib/offers/cron.ts

— Email System —
✓ lib/email/send.ts
✓ lib/email/templates.ts

— Pricing Constants —
✓ lib/constants/pricing.ts
✓ lib/pricing/constants.ts
✓ lib/adapters/pricing.ts
✓ lib/pricing/calculate.ts

— API Routes —
✓ app/api/** — ALL LOCKED

— Item + Dashboard + Bots —
✓ app/items/** — ALL LOCKED
✓ app/bots/** — ALL LOCKED

— Core UI —
✓ app/components/AppNav.tsx
✓ app/components/UploadModal.tsx
✓ app/page.tsx
✓ globals.css

— Commerce + Pages —
✓ app/subscription/** — LOCKED
✓ app/credits/** — LOCKED
✓ app/marketplace/** — LOCKED
✓ app/bundles/** — LOCKED
✓ app/shipping/** — LOCKED
✓ app/pricing/** — LOCKED
✓ app/projects/** — LOCKED
✓ app/offers/** — LOCKED

— Always-Dark Overlays —
✓ app/components/ItemActionPanel.tsx
✓ app/components/billing/CancelFlowModal.tsx
✓ app/components/billing/UpgradeFlowModal.tsx
✓ app/components/TradeProposalModal.tsx

— Messaging System — ALL LOCKED —
✓ app/messages/** — ALL LOCKED
✓ app/components/messaging/** — ALL LOCKED

— Add-On Tools — ALL LOCKED —
✓ app/addons/** — ALL LOCKED

— Infrastructure —
✓ vercel.json
✓ prisma/schema.prisma — READ ONLY

— Quiz Files (Parts A+B+C Complete) —
✓ app/onboarding/quiz/page.tsx — LOCKED

SURGICAL UNLOCK — These files are explicitly unlocked for THIS COMMAND ONLY:

  app/auth/signup/page.tsx — UNLOCKED (change post-signup CTA to route to quiz)
  app/dashboard/DashboardClient.tsx — UNLOCKED (add quiz completion banner)
  app/onboarding/results/page.tsx — UNLOCKED (add localStorage persistence on mount)
  app/settings/page.tsx — UNLOCKED (add "Retake Assessment" link)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-3 Locked Features:
  • All bot AI logic and prompt systems
  • All bot output formats
  • MegaBot 4-agent consensus system (OpenAI, Claude, Gemini, Grok)
  • Antique detection + Antique Alert (78 signals)
  • Collectible detection + scoring
  • Amazon/Rainforest enrichment adapter
  • Shipping calculator + package suggestions
  • Offer negotiation system (3-round, magic link)
  • Credit system (packs, custom, deductions, balance)
  • Subscription tiers (Free/DIY/Power/Estate Manager)
  • Pro-rate billing for upgrades/downgrades
  • Commission calculator
  • ListBot Publish Hub (13 platforms)
  • Marketplace and bundle system
  • Trade proposals
  • Sold price tracking
  • Data pipelines and enrichment

Pass 3 Final Locked (March 16-17, 2026):
  • Custom credit purchase with sliding scale
  • Subscription page
  • Email system
  • Gemini MegaBot reliability

Pass 4 Locked (March 18, 2026):
  • Amazon enrichment, Upload system, Edit Item Form
  • Item Control Center V1+V2, Light Mode, Message Center

Pass 5 Locked (March 19, 2026 — Parts A+B+C):
  • Quiz theme support — 60 hardcoded colors eliminated
  • Quiz visual polish — progress bar, glow, hover, transitions
  • Quiz warmer tone — Q1, Q4, Q5 updated, subtitles on all questions
  • White Glove preview after Q4
  • "Anything else?" optional 7th step
  • Budget guard + wantsHelp flag
  • Results personalization, Neighborhood Bundle, WG pricing transparency
  • Credit add-ons mention, WG soft-surface for digital users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  — Does this collect signal we learn from?
  — Does it make the next AI prediction better?
  — Does it create data nobody else has?
  — Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this part: We are persisting quiz completion status and quiz results
to localStorage. This is temporary — when the schema migration adds
quizCompletedAt to the User model, this data moves server-side.
The localStorage approach is a bridge, not the final solution.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Always follow this sequence. Never skip steps. Close the loop every time.

  Database → Storage → API → AI → Enrichment → UI → Dashboard → Database update

For this part: UI changes only across 4 files. No database changes.
No API changes. localStorage for persistence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

DEMO_MODE=true — admin accounts bypass all gates and credit deductions.
Both test accounts are Tier 4 Estate Manager with full access.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

  You MAY:
  — Improve beyond minimum spec
  — Flag gaps noticed while working
  — Choose cleanest technical path
  — Add defensive error handling
  — Make UI impressive for investor demo
  — Add polish that serves the Elon standard
  — Make this feel like a $1B product
  — Hardcode colors on always-dark panels

  You MAY NOT:
  — Touch any locked files
  — Touch quiz/page.tsx (completed in Parts A+B)
  — Change any bot AI or prompt logic
  — Change any bot output format
  — Deviate from inline style={{}}
  — Add unapproved npm packages
  — Add routes beyond scope
  — Change schema without explicit approval
  — Change business or pricing logic
  — Use Tailwind or external CSS
  — Use className for styling

  Flag everything outside scope.
  Do not fix silently. Always report flags clearly.
  Read FULL component code before writing any command.
  Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

  DEMO_MODE=true in .env — active now.
  Admin account bypasses ALL tier gates and credit deductions.
  shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)
  Admin: never locked out. No credits deducted. Full platform access.

  TEST ACCOUNTS:
  annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
  ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager
  SYSTEM_USER_ID=cmmqpoljs0000pkwpl1uygvkz

  TO GO LIVE:
  Set DEMO_MODE=false in .env
  Switch Square sandbox keys to production keys
  All gates enforce immediately for real users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — ENVIRONMENT VARIABLES STATUS

  Variable                  Status      Notes
  OPENAI_API_KEY            SET         GPT-4o — vision + analysis
  ANTHROPIC_API_KEY         SET         Claude — narrative + accuracy
  GEMINI_API_KEY            SET         Gemini — SEO + search
  XAI_API_KEY               SET         Grok — social + viral
  XAI_BASE_URL              SET         Grok endpoint
  XAI_MODEL_TEXT            SET         Text model
  XAI_MODEL_VISION          SET         Vision model
  SQUARE_APPLICATION_ID     SET         Sandbox
  SQUARE_ACCESS_TOKEN       SET         Sandbox
  SQUARE_LOCATION_ID        SET         Sandbox
  SQUARE_ENVIRONMENT        SET         sandbox
  SENDGRID_API_KEY          SET (new)   New account ryan@legacy-loop.com
  CRON_SECRET               SET         Vercel cron auth
  SYSTEM_USER_ID            SET         cmmqpoljs0000pkwpl1uygvkz
  DEMO_MODE                 true        Bypasses all gates
  DATABASE_URL              SET         PostgreSQL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — PENDING SCHEMA MIGRATION

DO ALL AT ONCE — Never piecemeal. Run after Monday walkthrough:

  • User.role field — 'admin' | 'user'
  • soldPrice Int → Float
  • soldVia String? on Item
  • estimatedValue Float? on Item
  • priceDelta Float? on Item
  • TradeProposal model
  • AgentSettings model
  • Bundle model
  • BundleItem model
  • quizCompletedAt DateTime? on User (replaces localStorage bridge)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Quiz Auto-Trigger + Persistence + Retake

Problem: New users who sign up land on the dashboard with no quiz prompt.
There is no tracking of whether a user has completed the quiz. There is no
way to retake the quiz from the dashboard or settings.

This command adds:
  1. Post-signup routes new users to the quiz (not dashboard)
  2. Dashboard shows a banner if quiz hasn't been completed
  3. Results page saves completion to localStorage on mount
  4. Settings page has a "Retake Assessment" link

APPROACH: localStorage-based persistence (no schema changes).
  Key: "legacyloop_quiz_completed" — ISO timestamp string
  Key: "legacyloop_quiz_results" — JSON string of recommendation
  These persist across sessions until cleared or the schema migration
  adds quizCompletedAt to the User model.

SURGICAL UNLOCK:
  app/auth/signup/page.tsx — change post-signup CTA
  app/dashboard/DashboardClient.tsx — add quiz banner
  app/onboarding/results/page.tsx — add localStorage save
  app/settings/page.tsx — add retake link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/auth/signup/page.tsx — FULL file (432 lines)
   Find: Lines 84-147 — success screen after signup
   Find: Lines 130-134 — "Go to Dashboard" button (THIS IS WHAT WE CHANGE)

2. Read app/dashboard/DashboardClient.tsx — FULL file (884 lines)
   Find: Component props and state (top of file)
   Find: Where to insert the quiz banner (top of the return JSX)

3. Read app/onboarding/results/page.tsx — FULL file (as modified by Part C)
   Find: ResultsContent component
   Find: Where recommendation data (rec) is parsed from URL params

4. Read app/settings/page.tsx — FULL file (80 lines)
   Find: The "Your Data" card section (lines 43-59)
   Find: Where to add a "Retake Assessment" card

Print ALL findings with exact line numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — SIGNUP PAGE: ROUTE NEW USERS TO QUIZ

File: app/auth/signup/page.tsx

Find the success screen (lines 84-147). Currently after signup it shows:
  "Welcome to LegacyLoop!"
  "Your account is ready. Let's start selling."
  Button: "Go to Dashboard" → router.push("/dashboard")

CHANGE TO:

  Keep the checkmark icon and "Welcome to LegacyLoop!" heading.

  Update the subtitle to:
    "Your account is ready. Let's find the perfect plan for you."

  Change the PRIMARY button to:
    "Take Your Personalized Assessment →"
    onClick: router.push("/onboarding/quiz")
    Style: Same as current button (full width, accent style)

  ADD a secondary link BELOW the button:
    "Skip to Dashboard →"
    onClick: router.push("/dashboard"); router.refresh();
    Style: text link, var(--text-muted) color, fontSize 0.82rem,
    marginTop 0.75rem, centered, no underline

  This ensures new users are guided to the quiz first,
  but can skip if they want.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — RESULTS PAGE: SAVE QUIZ COMPLETION TO LOCALSTORAGE

File: app/onboarding/results/page.tsx

In the ResultsContent component, add a useEffect that runs on mount
to save quiz completion data to localStorage:

  import { useEffect } from "react";
  (Add useEffect to the existing import from "react" if not already there)

  Inside ResultsContent, after the existing variable declarations, add:

  useEffect(() => {
    try {
      localStorage.setItem("legacyloop_quiz_completed", new Date().toISOString());
      localStorage.setItem("legacyloop_quiz_results", JSON.stringify(rec));
    } catch {
      // localStorage not available — silently fail
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  This saves:
    "legacyloop_quiz_completed" — ISO timestamp of when quiz was completed
    "legacyloop_quiz_results" — full recommendation JSON

  The empty dependency array means this runs once on mount.
  The eslint-disable comment prevents the warning about rec not being
  in the dependency array (we only want this to run once).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — DASHBOARD: SHOW QUIZ BANNER FOR NEW USERS

File: app/dashboard/DashboardClient.tsx

Add a quiz completion check and banner at the TOP of DashboardClient.

1. Add state for quiz banner:

  const [showQuizBanner, setShowQuizBanner] = useState(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("legacyloop_quiz_completed");
      if (!completed) {
        setShowQuizBanner(true);
      }
    } catch {
      // localStorage not available
    }
  }, []);

2. Add a dismiss handler:

  const dismissQuizBanner = () => {
    setShowQuizBanner(false);
    try {
      // Don't set completed — just dismiss for this session
      // User can still see it next time they load dashboard
      sessionStorage.setItem("legacyloop_quiz_banner_dismissed", "true");
    } catch {}
  };

  Update the useEffect to also check sessionStorage:

  useEffect(() => {
    try {
      const completed = localStorage.getItem("legacyloop_quiz_completed");
      const dismissed = sessionStorage.getItem("legacyloop_quiz_banner_dismissed");
      if (!completed && !dismissed) {
        setShowQuizBanner(true);
      }
    } catch {}
  }, []);

3. Render the banner at the TOP of the component's return JSX,
   BEFORE any existing content:

  {showQuizBanner && (
    <div
      style={{
        background: "var(--accent-dim)",
        border: "1px solid var(--accent-border)",
        borderRadius: "1.25rem",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🎯</span>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{
          fontWeight: 700,
          color: "var(--text-primary)",
          fontSize: "0.95rem",
          marginBottom: "0.2rem",
        }}>
          Find your perfect plan
        </div>
        <div style={{
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          lineHeight: 1.4,
        }}>
          Take our 2-minute assessment to get a personalized recommendation.
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <a
          href="/onboarding/quiz"
          style={{
            padding: "0.5rem 1.25rem",
            background: "var(--accent-theme)",
            color: "#fff",
            borderRadius: "0.75rem",
            fontWeight: 700,
            fontSize: "0.85rem",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Take Assessment →
        </a>
        <button
          onClick={dismissQuizBanner}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            padding: "0.5rem",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — SETTINGS PAGE: ADD RETAKE ASSESSMENT LINK

File: app/settings/page.tsx

Add a new card section BEFORE the "Your Data" card (before line 43).
This card lets users retake the quiz at any time:

  {/* Assessment */}
  <div className="card p-6 mt-4">
    <div style={{
      fontWeight: 700,
      fontSize: "1rem",
      color: "var(--text-primary, #1c1917)",
      marginBottom: "0.25rem",
    }}>
      Personalized Assessment
    </div>
    <div style={{
      color: "var(--text-muted, #78716c)",
      fontSize: "0.85rem",
      marginBottom: "1rem",
    }}>
      Retake the quiz to update your plan recommendation as your needs change.
    </div>
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <Link
        href="/onboarding/quiz"
        className="btn-ghost"
        style={{ fontSize: "0.85rem" }}
      >
        Retake Assessment →
      </Link>
    </div>
  </div>

  NOTE: The Link import already exists at the top of settings/page.tsx (line 4).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE IN THIS COMMAND:
  — quiz/page.tsx (completed in Parts A+B)
  — Scoring logic, routing logic, tier routing
  — Any bot, billing, credit, or API logic
  — Any locked files
  — Schema (localStorage bridge only)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Part A full reads completed and printed: yes / no

  SIGNUP:
  3. Primary button says "Take Your Personalized Assessment": yes / no
  4. Primary button routes to /onboarding/quiz: yes / no
  5. Secondary "Skip to Dashboard" link visible: yes / no
  6. Secondary link routes to /dashboard: yes / no

  DASHBOARD BANNER:
  7. Banner shows when legacyloop_quiz_completed NOT in localStorage: yes / no
  8. Banner does NOT show when legacyloop_quiz_completed IS in localStorage: yes / no
  9. Dismiss button hides banner for current session: yes / no
  10. Banner reappears on next session if quiz still not completed: yes / no
  11. "Take Assessment" button routes to /onboarding/quiz: yes / no
  12. Banner styling uses CSS variables (not hardcoded colors): yes / no

  RESULTS PERSISTENCE:
  13. localStorage.setItem called on results page mount: yes / no
  14. "legacyloop_quiz_completed" saved as ISO timestamp: yes / no
  15. "legacyloop_quiz_results" saved as JSON: yes / no
  16. try/catch wraps localStorage calls: yes / no

  SETTINGS:
  17. "Retake Assessment" card appears in settings: yes / no
  18. Link routes to /onboarding/quiz: yes / no

  FLOW TEST:
  19. New signup → sees "Take Assessment" button: yes / no
  20. Skip to dashboard → sees quiz banner: yes / no
  21. Take quiz → complete → results save to localStorage: yes / no
  22. Return to dashboard → banner gone: yes / no
  23. Settings → "Retake Assessment" → goes to quiz: yes / no
  24. Retake quiz → results update in localStorage: yes / no

  N+1. All locked files untouched: yes / no
  N+2. quiz/page.tsx UNTOUCHED: yes / no
  N+3. inline style={{}} throughout: yes / no
  N+4. Theme-aware surfaces use CSS variables: yes / no
  N+5. npx tsc --noEmit: 0 errors
  N+6. npm run build: pass
  N+7. CHECKPOINT post-change: pass
  N+8. Dev server: localhost:3000
  N+9. Light mode tested: no broken contrast
  N+10. Dark mode tested: all elements visible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part A printed: [yes / no]

  Part B — Signup CTA: [fixed / issue]
    - Primary button routes to quiz: [yes / no]
    - Secondary skip link works: [yes / no]

  Part C — Results persistence: [fixed / issue]
    - localStorage save on mount: [yes / no]
    - Both keys saved correctly: [yes / no]

  Part D — Dashboard banner: [fixed / issue]
    - Shows for new users: [yes / no]
    - Hides after quiz completion: [yes / no]
    - Dismiss button works: [yes / no]

  Part E — Settings retake: [fixed / issue]
    - Card renders: [yes / no]
    - Link routes to quiz: [yes / no]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  EXISTING LOGIC UNTOUCHED:
  — Quiz scoring unchanged: [Confirm]
  — Quiz routing unchanged: [Confirm]
  — All locked files verified as untouched

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, missed data collection, out-of-scope items]

  Files modified: [list all — should be exactly 4]
    - app/auth/signup/page.tsx
    - app/dashboard/DashboardClient.tsx
    - app/onboarding/results/page.tsx
    - app/settings/page.tsx
  New files: [none]
  Schema changes needed: [none — localStorage bridge]
  Build: [pass / fail]
  TypeScript: [0 errors / list errors]
  CHECKPOINT after: [pass / issue]
  Dev server: [localhost:3000]

  IF POST-CHECKPOINT FAILS:
  REVERT IMMEDIATELY.
  Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK REFERENCE — CUSTOMEVENTS IN USE

  Event Name                    Direction                  Purpose
  conversation-selected         Messages → InboxCmd        Conversation clicked
  conversation-counts-updated   Messages → InboxCmd        Update count badges
  agent-fill-message            InboxCmd → Messages        AI fills reply box
  agent-settings-toggle         InboxCmd → AgentSettings   Open settings panel
  inbox-filter-change           InboxCmd → Messages        Sidebar category clicked
  inbox-filter-reset            Messages → InboxCmd        Tab bar clicked — reset sidebar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Part D | Command Template v9 | LegacyLoop | Quiz Auto-Trigger + Persistence
Updated March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
