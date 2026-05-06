# ════════════════════════════════════════════════════════════════
# LEGACYLOOP MVP — CLAUDE CODE SKILL PACK
# Read every session. Non-negotiable. This is law.
# ════════════════════════════════════════════════════════════════

@WORLD_CLASS_STANDARDS.md
@AGENTS.md

## ═══════════════════════════════════════════
## STANDARDS IMPORT — READ FIRST
## ═══════════════════════════════════════════

Before anything else you MUST have internalized `WORLD_CLASS_STANDARDS.md`
in this directory. That file defines the identity we build to:

- The 7 pillars (motion, type, purpose, depth, micro, story, craft)
- The 12 Awwwards effects with canonical recipes
- The 18 reference benchmarks (Agency · SaaS · Meta)
- The 7-point billion-dollar acceptance test
- The 5 build laws
- The CMD vocabulary and active 12-CMD sequence

Every command, commit, and V17.1 report is evaluated against that doc.
If a change does not meet that bar, it is not done. This CLAUDE.md
handles project-specific config. That doc handles the standard.

Reference benchmarks (short list): Linear · Stripe · Perplexity ·
Tesla · SpaceX · Superhuman · StockX · Apple Wallet · Manus ·
Mercari · Airbnb · Notion · Dennis Snellenberg · Olivier Larose ·
Lenis · Vercel · Arc · Instagram · WhatsApp · Threads.

## WHO WE ARE

LegacyLoop is an AI-powered resale automation platform.
Mission: "Connecting Generations" — never misspell, never alter.
App: app.legacy-loop.com | Landing: legacy-loop.com
Company: Legacy-Loop Tech LLC | EIN: 42-1834363
Founder: Ryan Hallee — sole decision-maker and final QA authority.
Standard: "Elon Musk / $1B product standard. Awwwards-level." Non-negotiable.
Reference benchmarks: Linear, Stripe, Perplexity, Tesla, SpaceX, Superhuman, StockX.

## TEAM ROLES — WHO DOES WHAT (V17.1 §1)

Ryan (Boss): Vision, final QA, fires commands to IT, all decisions.
Mission Control (Strategy): Writes V17.1 commands, logs to Slack, tracks flags. No code.
Sylvia (Cowork): Deep dives, command drafts, docs, brand, CLAUDE.md, investor ops.
Claude Code (IT): Reads command, builds, returns V17.1 report. tsc=0 + build PASS before every commit.
Jarvis: Business ops, marketing, investor support, n8n.

Rule: All agents post every step to #all-legacyloop. Slack is source of truth.

---

## ═══════════════════════════════════════════
## SECTION 1: NON-NEGOTIABLE PROCESS RULES
## ═══════════════════════════════════════════

These rules apply to EVERY command. No exceptions. No shortcuts.

1. **DIAGNOSTIC BEFORE EVERY BUILD.**
   Read the exact files you will modify BEFORE touching anything.
   Never build blind. Never assume. Always verify current state.

2. **tsc --noEmit BEFORE AND AFTER every change.** Must be 0 errors.
   If tsc fails after your change, fix it before moving on.

3. **npm run build must PASS before any commit.**
   Build = `prisma generate && next build`. Both must succeed.

4. **V17.1 REPORT at the end of EVERY command.**
   Even if not asked. Even for small changes. Always. Use §12 format.

5. **PRESERVE what works.** Fix only what is broken.
   Never rewrite working code. Never replace — upgrade.
   If a component works and renders correctly, do not touch it.

6. **One focused scope per command.**
   Never expand scope uninvited. If you find a bug outside scope,
   log it in FLAGS section. Do not fix it without approval.

7. **Read AGENTS.md for cross-project standards.**
   This file handles project-specific config.
   AGENTS.md handles engineering patterns shared across all repos.

8. **BUILD PATTERN (V17.1 §6):**
   a. READ all files in scope before editing anything — no exceptions.
   b. Database → API → AI → Enrichment → UI → Dashboard → DB update.
   c. tsc --noEmit after EACH file save. Fix errors immediately.
   d. npm run build after ALL parts complete.
   e. One commit per command. Descriptive commit message.
   f. Diagnostic rule: If fixing a bug that has failed before — READ
      and diagnose root cause first. State why previous fix failed
      before writing any new code.

9. **DATA COLLECTION (V17.1 §7):**
   Every feature must answer: Does it collect signal? Make AI better?
   Create unique compounding data? Flag missed opportunities.

10. **CREATIVE LATITUDE (V17.1 §8):**
    MAY: improve beyond spec, flag gaps, add error handling, Elon-standard polish.
    MAY NOT: touch locked files, change AI/prompts, use Tailwind/className,
    add packages without approval, change schema without approval.
    "Never assume. Never guess. Read first. Build second."

---

## ═══════════════════════════════════════════
## SECTION 2: TECH STACK — EXACT VERSIONS
## ═══════════════════════════════════════════

| Layer          | Technology                  | Version    |
|----------------|-----------------------------|------------|
| Framework      | Next.js                     | 16.1.6     |
| UI             | React                       | 19.2.3     |
| Language       | TypeScript                  | 5.x        |
| ORM            | Prisma                      | 6.19.2     |
| DB Adapter     | @prisma/adapter-libsql      | 6.19.3     |
| Database (dev) | SQLite (dev.db)             | local      |
| Database (prod)| Turso (LibSQL edge)         | hosted     |
| Hosting        | Vercel                      | auto-deploy|
| Payments       | Stripe                      | 22.0.1     |
| Payments (alt) | Square                      | sandbox    |
| Photos         | Cloudinary                  | 2.9.0      |
| AI: OpenAI     | openai                      | 6.25.0     |
| AI: Anthropic  | Claude (via API)            | direct     |
| AI: Google     | Gemini (via API)            | direct     |
| AI: xAI        | Grok (via API)              | direct     |
| Email          | SendGrid                    | configured |
| SMS            | Twilio                      | 5.13.0     |
| Shipping       | Shippo + ShipEngine + EasyPost + FedEx + ARTA | multi |
| Comps          | eBay API + Rainforest API   | configured |
| Automation     | n8n                         | cloud      |
| Auth           | Custom JWT + bcrypt         | jose 6.1.3 |
| Icons          | Lucide React                | 0.575.0    |
| Media          | ffmpeg-static + fluent-ffmpeg | 5.3.0    |
| Styling        | Tailwind CSS 4 + CSS custom properties | ^4 |
| Smooth scroll  | (landing only — not in MVP) | N/A        |

### Build Commands
```
npm run dev          # Local development
npm run build        # prisma generate && next build
npm run start        # Production server
npm run lint         # ESLint
npx prisma db push   # Push schema to Turso
npx prisma generate  # Regenerate Prisma client
npx prisma studio    # Visual DB browser
tsc --noEmit         # Type check (no output)
```

---

## ═══════════════════════════════════════════
## SECTION 3: DESIGN SYSTEM — V17.1 (verified against globals.css)
## ═══════════════════════════════════════════

### CSS Variables (V17.1 §3 — LOCKED. See WORLD_CLASS_STANDARDS.md §3 for full token reference)
```
--accent:         #00BCD4
--accent-dim:     rgba(0,188,212,0.12)
--accent-border:  rgba(0,188,212,0.3)
--accent-glow:    rgba(0,188,212,0.35)
--accent-deep:    #009688
--bg-primary:     #0D1117 (dark) / #f8fafc (light)
--bg-secondary:   #1A1F2E (dark) / #ffffff (light)
--bg-card-solid:  #16161e (dark) / #ffffff (light)
--ghost-bg:       rgba(255,255,255,0.07) (dark) / rgba(0,0,0,0.04) (light)
--border-default: rgba(255,255,255,0.12) (dark) / rgba(0,0,0,0.08) (light)
--border-card:    rgba(255,255,255,0.12) (dark) / rgba(0,0,0,0.08) (light)
--text-primary:   #f1f5f9 (dark) / #0f172a (light)
--text-secondary: #cbd5e1 (dark) / #475569 (light)
--text-muted:     #94a3b8 (both)
--badge-bg:       rgba(0,188,212,0.14)
--badge-border:   rgba(0,188,212,0.35)
--purple-bg:      rgba(139,92,246,0.1)
--purple-border:  rgba(139,92,246,0.25)
--font-data:      "Barlow Condensed", sans-serif

Semantic (CORRECT — enforce these):
  success=#22c55e (NOT #4caf50) | warning=#f59e0b (NOT #ff9800) | error=#ef4444 (NOT #f44336)
  antique=#D4AF37 | estate-warm=#D4A017 (estate sections only)

MegaBot providers: OpenAI=#22c55e | Claude=#a78bfa | Gemini=#3b82f6 | Grok=#f97316
```

### Typography (Google Fonts loaded in layout.tsx)
```
Headings:           Exo 2 (weights: 400, 500, 600, 700, 800) — letterSpacing: "-0.02em" on H1–H3
Body:               Plus Jakarta Sans (weights: 400, 500, 600, 700) — lineHeight: 1.6
Numbers/prices/     Barlow Condensed (weights: 300-800) — on EVERY number, price, stat, credit, count
stats/credits:

CSS Variables:
  --font-heading: var(--exo2)
  --font-body:    var(--plusJakarta)
  --font-data:    var(--barlowCondensed)
```

### Styling Rules (V17.1 §2)
- ALL styles: inline style={{}} ONLY. Zero Tailwind. Zero className for styling.
- Exception: CSS @keyframes and media query classes in globals.css only.
- Theme-aware surfaces: CSS variables only.
- Always-dark panels (modals/overlays/bot consoles): #e2e8f0 text, rgba(255,255,255,0.05) bg.
- Brand teal: var(--accent) = #00BCD4. NEVER #0f766e.
- Border radius: cards 16px, buttons 0.75rem, pills 9999px, sub-cards 0.6rem.
- Card surface: bg rgba(255,255,255,0.03), border 1px solid rgba(0,188,212,0.15).
- Animations: CSS transitions + rAF only. No framer-motion in app.
- Existing keyframes: orbFloat1/2/3, fadeSlideUp, floatDot, skeleton-pulse, accentPulse, pulse, spin, fadeUp, softPulse.
- GRID RULE (enforced): ALL gridTemplateColumns must use minmax(0,1fr) — NOT plain 1fr.
  Plain 1fr = minmax(auto,1fr) = cells cannot shrink on mobile = right-side clipping.
  This caused 7 failed fix attempts. Never use plain 1fr again.
- FLEX-SHRINK RULE (enforced — added Apr 18 after V8 pills 8th attempt, 9fd024c):
  Flex parents of overflow-scrolling children MUST have minWidth: 0. Default
  min-width:auto on flex items blocks the shrink contract on iOS/Safari and
  prevents overflow-x:auto from engaging. Applies to BOTH: (a) the scroll
  container itself (element with overflow-x:auto), AND (b) every flex
  ancestor up to the nearest non-flex parent. Symptoms without this rule:
  right-side clipping on mobile, scroll container never engages because its
  width exceeds viewport. Pair rule: prefer max-width:100% over 100vw in
  mobile media queries — 100vw includes scrollbar width on some Android
  browsers.
- CollectiblesBot = gold standard for bot panel design. PriceBot is NOT the standard.
- Light AND dark mode supported via CSS variables.
- 7 breakpoints defined: xxl, xl, large, main, medium, small, tiny.
- globals.css is 840+ lines — read it before modifying any styles.
- Senior-friendly: body never below 13px, buttons 14px+, touch targets 44px min.
  See WORLD_CLASS_STANDARDS.md §5 for full senior-friendly rules.

### Logo Rules
- **UNTOUCHABLE.** Never alter, approximate, or regenerate any logo.
- All logos live at `/public/images/logos/` — NEVER modify these files.
- Ryan handles all logo work in Adobe Illustrator.
- Favicon variants: favicon.png, favicon-bw.png, favicon-32.png, favicon-bw-64.png.

---

## ═══════════════════════════════════════════
## SECTION 4: DATABASE — 51 MODELS
## ═══════════════════════════════════════════

### Schema: prisma/schema.prisma
**51 models total.** Read the schema before touching any data layer.

**Core Models:**
User, Item, ItemPhoto, ItemDocument, Subscription, SubscriptionChange,
UserCredits, CreditTransaction, UserAddon, Addon

**AI/Bot Models:**
AiResult, AntiqueCheck, BuyerBot, BuyerLead, ReconBot, ReconAlert,
Valuation, PriceSnapshot, MarketComp, ScraperComp, ScraperUsageLog

**Commerce Models:**
Transaction, Offer, OfferEvent, PaymentLedger, SellerEarnings,
ShipmentLabel, ListingPublish, ConnectedPlatform

**Estate/Services Models:**
WhiteGloveBooking, WhiteGloveProject, WhiteGlovePhase,
EstateCareContract, ServiceQuote, Project, ContractorJob, Contractor

**Communication Models:**
Conversation, Message, Notification, Testimonial, Referral

**Auth/System Models:**
MagicLink, OtpCode, PasswordReset, HeroVerification,
DataCollectionConsent, EventLog, UserEvent, BudgetPreferences,
ItemEngagementMetrics

**Key Enums:**
ItemStatus: DRAFT → ANALYZED → READY → LISTED → INTERESTED →
            OFFER_PENDING → SOLD → SHIPPED → COMPLETED →
            RETURN_REQUESTED → RETURNED → REFUNDED
SaleMethod: LOCAL_PICKUP | ONLINE_SHIPPING | BOTH

### Schema Rules
- Run ALL pending field additions at once — never partial migrations.
- After ANY schema change: `npx prisma db push` to sync Turso.
- After push: `npx prisma generate` to regenerate client.
- Report ALL schema changes in V17.1 FLAGS section.
- Never delete a model or field without explicit approval.
- Prisma singleton lives at `lib/db.ts` — NEVER modify.

---

## ═══════════════════════════════════════════
## SECTION 5: AUTHENTICATION SYSTEM
## ═══════════════════════════════════════════

**Custom implementation. NOT NextAuth. NOT Auth.js.**

### File: lib/adapters/auth.ts
```
signup(email, password)         — bcrypt hash, create User
login(email, password)          — verify bcrypt, issue JWT (7-day)
loginWithRemember(email, pw, r) — 30-day JWT if remember=true
issueSession(userId, tier, r)   — for OAuth/phone/magic-link flows
getSession()                    — read JWT from HttpOnly cookie
logout()                        — delete auth-token cookie
```

### Auth Architecture
- Token: JWT signed with HS256 (jose library)
- Storage: HttpOnly cookie named "auth-token"
- Session: 7-day default, 30-day with "remember me"
- Password: bcrypt via bcryptjs
- No middleware.ts — auth checked per-route via getSession()
- Magic link + OTP flows exist for passwordless auth
- Google OAuth integration configured

### Test Accounts (Tier 4 Estate Manager)
```
annalyse07@gmail.com / LegacyLoop123!
Note: ryanroger11@gmail.com may not be seeded in local dev DB. Use annalyse07 only.
```

---

## ═══════════════════════════════════════════
## SECTION 6: API ARCHITECTURE (200 build routes total)
## ═══════════════════════════════════════════

### 57 Top-Level API Directories
```
addons, admin, agents, analytics, analyze, auth, billing,
blur-plate, bots, budget, bundles, catalog, consent,
conversations, credits, cron, demo, donation, ebay,
enrichment, estate-care, export, feedback, founding-members,
help, heroes, integrations, intelligence, items, listing,
listings, market-intelligence, megabot, messages, notifications,
offers, onboarding, outreach, payments, payouts, photobot,
projects, quote, ratings, receipts, recon, referrals, refunds,
shipping, spending, subscription, testimonials, trades, user,
webhooks, white-glove
```

### API Patterns (enforce these)
- All routes: `app/api/[resource]/route.ts`
- Nested: `app/api/[resource]/[action]/route.ts`
- Auth check: Call `authAdapter.getSession()` at top of every protected route
- Response format: `NextResponse.json({ data })` or `NextResponse.json({ error }, { status: N })`
- Error codes: 400 bad request, 401 unauthorized, 403 forbidden, 404 not found, 500 server error
- Always validate input before processing
- Always wrap in try/catch with meaningful error messages
- Never expose internal error details to client

### Webhook Endpoints
- `/api/webhooks/stripe` — Stripe payment events
- `/api/webhooks/` — n8n automation callbacks
- Webhook verification required on all inbound hooks

---

## ═══════════════════════════════════════════
## SECTION 7: AI / BOT SYSTEM — 201 SKILL PACKS
## ═══════════════════════════════════════════

### 14 AI Systems Total

**11 Analysis Bots:**
| Bot | Purpose | Skill Packs |
|-----|---------|-------------|
| AnalyzeBot | Core item identification & metadata | 16 |
| PriceBot | Market valuation & comps | 16 |
| PhotoBot | Photo quality & enhancement guidance | 15 |
| ListBot | Listing generation & optimization | 16 |
| BuyerBot | Buyer matching & lead scoring | 16 |
| ReconBot | Reconnaissance & market intelligence | 17 |
| AntiqueBot | Antique detection & authentication | 15 |
| CollectiblesBot | Collectible grading & valuation | 15 |
| CarBot | Vehicle VIN decode & valuation | 15 |
| VideoBot | Video analysis & transcription | 16 |
| MegaBot | 4-AI consensus engine (orchestrator) | shared |

**3 Platform Systems (always free):**
| System | Purpose | Skill Packs |
|--------|---------|-------------|
| DocumentBot | Document generation & export | 3 |
| Intel Panel AI | Market intelligence dashboard | 2 |
| Shipping Center AI | Carrier selection & logistics | 2 |

**Shared skill libraries:** _shared (3 files), _shared_megabot (4 files)

### MegaBot Consensus Engine
Runs 4 AI providers IN PARALLEL and cross-references results:
- GPT-4o-mini (OpenAI)
- Claude (Anthropic)
- Gemini 1.5 Flash (Google)
- Grok 3 (xAI)

Supporting files: disagreement.ts, accuracy.ts, demand-score.ts,
megabot-enrichment.ts, sequencer.ts, router-analytics.ts

### Bot Access Model
```
Tier-unlocked bots = FREE (no credit deduction)
Above-tier bots   = Credits (soft gate — never hard block)
VideoBot           = ALWAYS credits (real API cost)
DocumentBot        = FREE to all users
Shipping Center AI = FREE to all users
Credits            = universal key (soft gates, never hard blocks)
```

### Skill Pack Rules
- All packs: `lib/bots/skills/[botname]/*.md`
- **ADDITIVE ONLY** — never delete or rewrite existing skill packs.
- New skills: create new .md file in the appropriate bot directory.
- Skill loader: `lib/bots/skill-loader.ts` — reads .md files dynamically.
- Vercel config ensures skills bundled: `outputFileTracingIncludes: lib/bots/skills/**`

### 🏁 F1 ENGINE DOCTRINE (enforced — added Apr 18 2026 after saleMethod inline-text violation)
**Bot capability upgrades are additive skill packs, NEVER inline prompt text in route files.**

- **Static policy → skill pack.** Any rule, discipline, instruction, or capability description that tells the LLM HOW to behave must live in `lib/bots/skills/[bot]/NN-name.md`. Never hardcoded into bot route files.
- **Dynamic context → route.** Per-item interpolation (item fields, user context) belongs in the sellerContext string at the route level — that's by design.
- **Version tags in command names.** When a bot gains new capability, the CMD name carries the engine version: `CMD-PRICEBOT-V11-SALE-METHOD`, `CMD-LISTBOT-V10-*`. Cross-cutting capability names (e.g., `CMD-SALE-METHOD-FOUNDATION`) hide version bumps and leave the scoreboard stale — AVOID for bot engine work.
- **Scoreboard update mandatory.** Every version bump requires updating the engine scoreboard in `memory/project_bot_v12_roadmap.md` + `memory/MEMORY.md`. Silent capability additions = F1 audit failure.
- **One cylinder at a time.** Per canonical V17.1 §7 — engine tunes ship per-bot. Cross-cutting commands touching 5+ bot routes in one commit violate the "tactically" F1 rule.

Why this rule exists: on Apr 18 2026, CMD-SALE-METHOD-SYSTEMIC-RESPECT added inline LOCAL_PICKUP prompt discipline directly to PriceBot/ListBot/AnalyzeBot routes AND extracted none of it to skill packs. Three bots silently got capability upgrades that weren't versioned, weren't in skill packs, weren't on the scoreboard. CMD-BOT-ENGINE-CANONIZE-SALE-METHOD restored the doctrine by extracting the inline text to skill packs 18/NN/21 and bumping versions to V11/V10/V9b. This rule now prevents the violation class permanently.

---

## ═══════════════════════════════════════════
## SECTION 8: PAGE ROUTES — 87 PAGES
## ═══════════════════════════════════════════

### Core Pages
```
/dashboard              — Main seller dashboard (command center)
/items/[id]             — Item detail (MOST IMPORTANT page in app)
/items/[id]/edit        — Item editor
/bots                   — Bot hub
/bots/[botname]         — Individual bot interface
/marketplace            — Public marketplace
/store/[userId]         — Seller storefront
```

### Commerce Pages
```
/billing                — Billing management
/subscription           — Plan selection
/pricing                — Public pricing page
/credits                — Credit balance & purchase
/purchases              — Purchase history
/receipts               — Receipt viewer
/offers                 — Offer management
/shipping               — Shipping center
/returns                — Returns management
```

### Auth Pages
```
/auth/login             — Login
/auth/signup            — Registration
/auth/forgot-password   — Password reset request
/auth/reset-password    — Password reset form
```

### Admin Pages
```
/admin                  — Admin dashboard
/admin/heroes           — Hero verification
/admin/quotes           — Service quotes
```

### Profile & Settings
```
/profile                — User profile
/settings               — Account settings
/referral               — Referral program
/testimonials           — Testimonials
```

### Content Pages
```
/help                   — Help center
/about                  — About page
/terms                  — Terms of service
/privacy                — Privacy policy
```

---

## ═══════════════════════════════════════════
## SECTION 9: COMPONENT ARCHITECTURE — 47 COMPONENTS
## ═══════════════════════════════════════════

### All components: app/components/

**Navigation & Layout:**
AppNav.tsx (772 lines — CRITICAL), BottomNav.tsx, Breadcrumbs.tsx,
Footer.tsx, CommandPalette.tsx

**Modals & Overlays:**
UploadModal.tsx, WelcomeModal.tsx, BugReportModal.tsx,
DataConsentModal.tsx, TradeProposalModal.tsx, CookieConsent.tsx

**Widgets & Panels:**
ActiveOffersWidget.tsx, CronStatusWidget.tsx, HelpWidget.tsx,
ItemActionPanel.tsx, OfferManagerPanel.tsx, CollapsiblePanel.tsx

**Commerce:**
BudgetGuard.tsx, ProcessingFeeTooltip.tsx, ShareButtons.tsx,
BundleSuggestions.tsx, OfferHistoryTimeline.tsx

**UI Utilities:**
BotLoadingState.tsx, DemoBanner.tsx, EnrichmentBadge.tsx,
FoundingMemberBadge.tsx, InstallPrompt.tsx, KeyboardShortcuts.tsx,
TestimonialGrid.tsx, ThemeProvider.tsx

**Subdirectories:**
billing/ — Billing-specific components
effects/ — Visual effects (NoiseOverlay, GradientOrbs, etc.)
messaging/ — Chat/conversation components

### Mobile Standards
- BottomNav.tsx: visible < 1024px, hidden >= 1024px
- All breakpoints at 1024px for tablet/mobile split
- Touch targets: minimum 44px (Apple HIG)
- Safe area: env(safe-area-inset-bottom) for iPhone home bar
- No horizontal scroll: overflow-x: hidden on html,body

---

## ═══════════════════════════════════════════
## SECTION 10: LOCKED CONSTANTS
## ═══════════════════════════════════════════

### Pricing (SSOT: lib/constants/pricing.ts)
```
TIER enum: FREE (1), DIY_SELLER (2), POWER_SELLER (3), ESTATE_MANAGER (4)

Monthly:
  Free:           $0/mo   | 12% commission
  DIY Seller:     $20/mo  | 8% commission
  Power Seller:   $49/mo  | 5% commission
  Estate Manager: $99/mo  | 4% commission

Annual:
  DIY Seller:     $200/yr
  Power Seller:   $490/yr
  Estate Manager: $990/yr

PROCESSING_FEE: 3.5% (Stripe transaction fee)
```

### System Constants
```
DEMO_MODE=true          — bypasses payment gates in dev. NEVER remove.
SYSTEM_USER_ID:         cmmqpoljs0000pkwpl1uygvkz
Messages layout:        position:fixed, top:108px — LOCKED FOREVER.
Fee model:              1.75% buyer + 1.75% seller = 3.5% total
layout.tsx:             Server Component — NEVER add event handlers
Cloudinary:             ONLY valid photo storage on Vercel. NEVER local disk.
shouldBypassGates:      isDemoMode() || isAdminUser()
Go live:                DEMO_MODE=false + Stripe sk_live_ + pk_live_ in Vercel env
```

### Locked Files — V17.1 §5 (surgical unlock required per command)
```
lib/adapters/ai.ts | lib/adapters/auth.ts | lib/adapters/storage.ts
lib/adapters/multi-ai.ts | lib/adapters/pricing.ts | lib/adapters/rainforest.ts
lib/antique-detect.ts | lib/collectible-detect.ts
lib/megabot/run-specialized.ts | lib/megabot/prompts.ts (ADD-ONLY)
lib/shipping/* | All /app/api/shipping/* routes
lib/credits.ts | lib/billing.ts | lib/billing/pro-rate.ts | lib/billing/commission.ts
lib/constants/pricing.ts | lib/pricing/constants.ts | lib/pricing/market-data.ts
lib/offers/negotiate.ts | lib/offers/expiry.ts | lib/offers/magic-link.ts
lib/market-intelligence/aggregator.ts | All scraper adapter files
lib/bots/sequencer.ts | lib/bots/accuracy.ts | lib/bots/demand-score.ts
lib/bots/disagreement.ts | lib/bot-mode.ts
app/components/AppNav.tsx | app/components/UploadModal.tsx
app/components/ThemeProvider.tsx | app/components/Footer.tsx
app/globals.css | app/layout.tsx
lib/enrichment/index.ts | lib/enrichment/item-context.ts
All /app/api/auth/* routes
prisma/schema.prisma (unless migration explicitly approved)
lib/db.ts
ItemDashboardPanels.tsx (9,000+ lines — surgical unlock required per command)
public/images/logos/* — NEVER modify logo files
```

---

## ═══════════════════════════════════════════
## SECTION 11: SECURITY STANDARDS
## ═══════════════════════════════════════════

### Headers (configured in next.config.ts)
- X-Frame-Options: DENY
- Content-Security-Policy: AI API endpoints whitelisted (OpenAI, Anthropic, Gemini, xAI)
- Permissions-Policy: camera=(self), microphone=(self)
- Strict-Transport-Security: enforced via Vercel

### Auth Security
- Passwords: bcrypt hashed, never stored in plaintext
- Tokens: JWT with HS256, HttpOnly cookies only
- Sessions: 7-day expiry default, 30-day with remember
- CSRF: SameSite cookie attribute
- Rate limiting: implement on all auth endpoints
- Input validation: sanitize all user input before DB operations

### API Security
- Always verify session in protected routes
- Never expose internal error stack traces
- Validate webhook signatures (Stripe, n8n)
- Never log sensitive data (passwords, tokens, keys)
- Environment variables: NEVER commit .env files

### Data Privacy
- DataCollectionConsent model tracks user consent
- CookieConsent component required on first visit
- GDPR-ready: consent tracking, data export, deletion support
- User data: encrypted at rest via Turso

---

## ═══════════════════════════════════════════
## SECTION 12: PERFORMANCE STANDARDS
## ═══════════════════════════════════════════

### Core Web Vitals Targets
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB: < 800ms (Vercel edge)

### Image Optimization
- Cloudinary for all user-uploaded images
- Next.js Image component for static assets
- WebP/AVIF format preference
- Lazy loading for below-fold images
- HEIC support via heic-convert for iPhone uploads

### Bundle Performance
- Dynamic imports for heavy components (ffmpeg, html2canvas)
- Route-based code splitting (automatic via Next.js)
- Skill packs loaded server-side only (not shipped to client)
- Sharp for image processing in API routes

### Database Performance
- Turso edge database (low-latency reads)
- Prisma query optimization: select only needed fields
- Avoid N+1 queries — use include/select wisely
- Index critical lookup fields (userId, itemId, status)

---

## ═══════════════════════════════════════════
## SECTION 13: ACCESSIBILITY — SENIOR-FRIENDLY
## ═══════════════════════════════════════════

This is not optional. Our primary users include seniors.

### Requirements
- WCAG 2.1 AA minimum on all pages
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Touch targets: 44px minimum (already enforced)
- Font sizes: never below 14px for body text
- Focus indicators: visible on all interactive elements
- Keyboard navigation: all features accessible without mouse
- Screen reader: semantic HTML, ARIA labels on icons/buttons
- Reduced motion: respect prefers-reduced-motion media query
- Error states: never color-only — always include text/icon

### Testing
- Tab through every new feature with keyboard only
- Test with browser zoom at 200%
- Verify with Lighthouse accessibility audit (target: 90+)

---

## ═══════════════════════════════════════════
## SECTION 14: DEPLOYMENT & ENVIRONMENTS
## ═══════════════════════════════════════════

### Vercel (Production)
- Auto-deploys on git push to main
- Preview deploys on every PR
- Edge functions for API routes
- Environment variables configured in Vercel dashboard

### Environment Variables (.env.example is truth)
```
# Database
DATABASE_URL           — SQLite (dev) or PostgreSQL (prod)
TURSO_DATABASE_URL     — Turso connection
TURSO_AUTH_TOKEN       — Turso auth

# AI Providers
OPENAI_API_KEY         — GPT-4o-mini
ANTHROPIC_API_KEY      — Claude
GEMINI_API_KEY         — Gemini 1.5 Flash
XAI_API_KEY            — Grok 3

# Payments
STRIPE_SECRET_KEY      — Stripe server key
STRIPE_WEBHOOK_SECRET  — Stripe webhook signing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe client key
SQUARE_ACCESS_TOKEN    — Square payments
SQUARE_LOCATION_ID     — Square location

# Shipping
SHIPPO_API_TOKEN       — Shippo
SHIPENGINE_API_KEY     — ShipEngine
EASYPOST_API_KEY       — EasyPost
FEDEX_API_KEY          — FedEx Parcel
FEDEX_SECRET_KEY       — FedEx auth
ARTA_API_KEY           — ARTA (white-glove)

# Media
CLOUDINARY_CLOUD_NAME  — Cloudinary
CLOUDINARY_API_KEY     — Cloudinary
CLOUDINARY_API_SECRET  — Cloudinary

# Email & SMS
SENDGRID_API_KEY       — Email
TWILIO_ACCOUNT_SID     — SMS
TWILIO_AUTH_TOKEN       — SMS

# Auth
JWT_SECRET             — JWT signing key
GOOGLE_CLIENT_ID       — Google OAuth
GOOGLE_CLIENT_SECRET   — Google OAuth

# Comps
EBAY_APP_ID            — eBay comparables
RAINFOREST_API_KEY     — Amazon/retail comps

# Automation
N8N_WEBHOOK_URL        — n8n callbacks
SLACK_WEBHOOK_URL      — Slack notifications
CRON_SECRET            — Cron job auth
```

---

## ═══════════════════════════════════════════
## SECTION 15: GIT & COMMIT STANDARDS
## ═══════════════════════════════════════════

### Commit Format
```
CMD-[NAME]: [concise description of what changed]
```
Examples:
- `CMD-PRICING: Update Power Seller tier to $49/mo`
- `CMD-MEGABOT: Add consensus confidence thresholding`
- `CMD-SHIPPING: Integrate EasyPost rate comparison`

### Rules
- Push immediately after commit.
- Never leave uncommitted changes.
- Report commit hash in every V17.1 report.
- One commit per logical change. Not one giant commit.
- Never force-push to main.
- Never commit .env, .env.local, or any secrets.

---

## ═══════════════════════════════════════════
## SECTION 15.5: MULTI-AGENT WORKTREE PATTERN
## ═══════════════════════════════════════════

Parallel IT execution uses **per-agent git worktrees** — each terminal
operates in its own checkout with its own `.git/index`. Eliminates the
shared-index race window that produced multi-agent commit-label drift
incidents Round 11 (`ca0bbd7`) + Round 12 (`20bf67a`/`e4cafdf`/`dd7aa96`).

**Topology:**
- `/Users/ryanhallee/legacy-loop-mvp/` — main worktree (Devin L1 + L3)
- `/Users/ryanhallee/legacy-loop-mvp-agent-{1,2,3}/` — IT slots

**Helper scripts:** `scripts/worktree-setup.sh` · `scripts/worktree-reset.sh` · `scripts/agent-ship.sh`

**Full reference:** `docs/MULTI_AGENT_WORKTREE.md`

**Workflow:** Devin verifies parallel-safety → CEO opens 3 terminals (`cd` to slot) → IT agent commits to slot branch → `bash scripts/agent-ship.sh` runs FF-push to main (no force-push) → §12 cites Vercel `dpl_<id>` READY + curl HTTP=200.

**Daemon QUARTET stays anchored to main worktree.** Per-worktree dev.db (isolation by default) · symlinked `.env.local` (single secret SOT) · APFS-cloned node_modules (near-zero disk).

---

## ═══════════════════════════════════════════
## SECTION 16: KEY FILES — READ BEFORE TOUCHING
## ═══════════════════════════════════════════

### Layout & Navigation
```
app/layout.tsx              — Root layout, PWA meta, all providers, nav render
app/components/AppNav.tsx   — Main navigation (772 lines — read ALL of it)
app/components/BottomNav.tsx — Mobile 5-tab bottom nav
app/globals.css             — Theme variables, 840 lines, 7 breakpoints
```

### Core Business Logic
```
app/dashboard/page.tsx      — Main dashboard
app/items/[id]/page.tsx     — Item detail (MOST IMPORTANT page in app)
lib/constants/pricing.ts    — ALL pricing (single source of truth)
lib/pricing/garage-sale.ts  — 3-price garage sale engine
lib/adapters/auth.ts        — Authentication (custom JWT)
```

### AI System
```
lib/bots/skill-loader.ts    — Dynamic .md skill loading
lib/bots/sequencer.ts       — Bot execution orchestration
lib/bots/megabot-enrichment.ts — Consensus engine logic
lib/bots/item-spec-context.ts — Item specification context (15KB)
lib/bots/accuracy.ts        — Accuracy scoring
lib/bots/disagreement.ts    — Multi-model disagreement handling
```

### Data Layer
```
prisma/schema.prisma         — 51 models, all enums
lib/db.ts                    — Prisma singleton (LOCKED)
```

### Config
```
next.config.ts               — Security headers, CSP, skill bundling
tsconfig.json                — Strict mode, path aliases (@/*)
.env.example                 — All required env vars documented
```

---

## ═══════════════════════════════════════════
## SECTION 17: WHAT MAKES LEGACYLOOP DIFFERENT
## ═══════════════════════════════════════════

- Only resale platform with in-person garage sale pricing (3-price engine).
- Location-aware pricing — rural Maine ≠ Boston suburbs.
- 201 skill packs across 14 AI systems — no competitor has this depth.
- MegaBot 4-AI consensus — no single model bias.
- DocumentBot + Shipping Center AI = FREE — drives commission revenue.
- White Glove estate service = 60% deposit / 40% at completion.
- Senior-friendly UX + billion-dollar aesthetic — both at once.
- Credits = universal key (soft gates, never hard blocks on bots).
- Full commerce: offers, negotiations, transactions, payouts, returns.
- Vehicle intelligence: VIN decode, market value, condition grading.
- PWA-installable: works as native app on phone/tablet.

LegacyLoop is not just a resale site.
It is a full resale automation engine that connects generations.

---

## SECTION 18: V17.1 COMMAND + REPORT FORMAT — REQUIRED
## ═══════════════════════════════════════════

All commands use V17.1 format. No exceptions.

### §10 COMMAND BLOCK (fill per command)
```
CMD-[NAME]
LegacyLoop | [Date] | V17.1

OBJECTIVE:
[1-3 sentences. What problem is solved. Why now.]

SURGICAL UNLOCKS:
[Exact file paths this command may touch]

DIAGNOSTIC (required for bug fixes — skip for new features):
[What to read first. Questions to answer before writing code.
Root cause. Why previous attempts failed if applicable.]

FIX 1 — [NAME] (P0/P1/P2):
File: [exact path:line range]
[Precise instructions. Find/replace. Expected result.]

FIX 2 — [NAME] (P0/P1/P2):
[Same format. Add FIX 3-N as needed.]

SCOPE — EXACTLY THESE FILES:
[List only files IT may touch]
DO NOT TOUCH: [anything that must stay untouched]
```

### §11 ACCEPTANCE TEST (customize per command)
```
□ tsc --noEmit = 0 errors
□ npm run build = PASS
□ All files read before editing
□ Locked files untouched
□ inline style={{}} throughout — zero Tailwind/className
□ gridTemplateColumns uses minmax(0,1fr) — never plain 1fr
□ Always-dark panels = hardcoded | Theme-aware = CSS vars
□ Light mode: PASS | Dark mode: PASS
□ Mobile 375px: no scroll, no right-side clipping
□ Desktop: layout unchanged
□ [Command-specific checks here]

8-Point World Class Check:
1. Investor: Would Dr. Clark be impressed?
2. Senior: Readable for a 70-year-old?
3. Awwwards: Looks like a $1B product?
4. Stripe: Data-dense without clutter?
5. Apple: All touch targets ≥44px?
6. A11y: Color values have text labels?
7. Mobile: Zero clipping at 375px?
8. Theme: Correct in both light and dark?
```

### §12 V17.1 REPORT FORMAT (every command returns this)
```
┌──────────────────────────────────────────────────┐
│  CMD-[NAME] §12 REPORT                          │
│  [DATE] | V17.1                                 │
├──────────────────────────────────────────────────┤
│  CHECKPOINT BEFORE: tsc=0, build=PASS ([N])      │
│  CHECKPOINT AFTER:  tsc=0, build=PASS ([N])      │
├──────────────────────────────────────────────────┤
│  PART A — READ CONFIRMATION                      │
│  [Each file read + line range confirmed]         │
├──────────────────────────────────────────────────┤
│  DIAGNOSTIC (bug fixes only):                    │
│  Root cause: [exact cause]                       │
│  Why previous fixes failed: [specific reason]   │
├──────────────────────────────────────────────────┤
│  FIX 1 — [NAME]: DONE/SKIPPED                   │
│    [What changed | line numbers | why]           │
│  FIX 2 — [NAME]: DONE/SKIPPED                   │
│  [Continue for all fixes]                        │
├──────────────────────────────────────────────────┤
│  THEME: Light PASS/FAIL | Dark PASS/FAIL        │
│  Always-dark panels: PASS/FAIL/N/A              │
├──────────────────────────────────────────────────┤
│  FILES MODIFIED: [file | +N/-N]                 │
│  FILES CREATED: NONE / [list]                   │
│  FILES DELETED: NONE / [list]                   │
│  LOCKED FILES: UNTOUCHED                        │
│  SCHEMA CHANGES: NONE / [describe]              │
├──────────────────────────────────────────────────┤
│  FLAGS                                           │
│  Gaps: [incomplete items]                        │
│  Risks: [potential issues]                       │
│  Missed data: [collection opportunities]        │
│  Carry-forward: [banked commands]               │
│  Suggestions: [improvements]                    │
│  Opportunity: [higher-tech upgrades]            │
├──────────────────────────────────────────────────┤
│  tsc: 0 errors                                  │
│  build: PASS ([N] routes)                       │
│  Commit: [hash] on main                         │
└──────────────────────────────────────────────────┘

CRITICAL: IF POST-CHECKPOINT FAILS → REVERT IMMEDIATELY.
Report exactly what broke and what was touched.
```

---

## ═══════════════════════════════════════════
## SECTION 19: ERROR HANDLING PATTERNS
## ═══════════════════════════════════════════

### API Routes
```typescript
export async function POST(req: Request) {
  try {
    const session = await authAdapter.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // validate input...
    // business logic...
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[API_NAME]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Client Components
- Use try/catch around all async operations
- Show user-friendly error messages (never raw error objects)
- Log errors to console for debugging
- Provide fallback UI for failed states
- Never let a crash propagate to white screen

---

## ═══════════════════════════════════════════
## SECTION 20: SCALING ARCHITECTURE NOTES
## ═══════════════════════════════════════════

### Current State (Pre-Seed)
- Single developer (Ryan + Claude Code)
- SQLite (dev) → Turso (prod)
- Vercel serverless (auto-scaling)
- ~$475/mo operational burn

### Post-Seed Architecture Targets
- Add Redis for session caching and rate limiting
- Add queue system for bot orchestration (BullMQ or similar)
- Add error monitoring (Sentry)
- Add analytics (PostHog or Mixpanel)
- Add CDN for static assets (already via Vercel)
- Database read replicas when traffic warrants
- Webhook retry system for failed deliveries

### Never Prematurely Optimize
- Ship working features first
- Optimize when metrics prove a bottleneck
- Maintain clean architecture so optimization is possible later
- Document performance-sensitive code paths

---

# ════════════════════════════════════════════════════════════════
# END OF CLAUDE.md — LEGACY-LOOP MVP SKILL PACK | V17.1
# All commands use V17.1 format. No exceptions.
# If you read this far, you're ready to build. Let's ship.
# ════════════════════════════════════════════════════════════════
