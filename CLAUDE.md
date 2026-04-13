# ════════════════════════════════════════════════════════════════
# LEGACYLOOP MVP — CLAUDE CODE SKILL PACK
# Read every session. Non-negotiable. This is law.
# ════════════════════════════════════════════════════════════════

## WHO WE ARE

LegacyLoop is an AI-powered resale automation platform.
Mission: "Connecting Generations" — never misspell, never alter.
App: app.legacy-loop.com | Landing: legacy-loop.com
Company: Legacy-Loop Tech LLC | EIN: 42-1834363
Founder: Ryan Hallee — sole decision-maker and final QA authority.
Standard: Awwwards.com + Stripe Dashboard + Linear.app aesthetic. Non-negotiable.
Reference benchmarks: Stripe, Linear, eBay, Mercari, Shopify Admin.

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

4. **V15 REPORT at the end of EVERY command.**
   Even if not asked. Even for small changes. Always.

5. **PRESERVE what works.** Fix only what is broken.
   Never rewrite working code. Never replace — upgrade.
   If a component works and renders correctly, do not touch it.

6. **One focused scope per command.**
   Never expand scope uninvited. If you find a bug outside scope,
   log it in FLAGS section. Do not fix it without approval.

7. **Read AGENTS.md for cross-project standards.**
   This file handles project-specific config.
   AGENTS.md handles engineering patterns shared across all repos.

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
## SECTION 3: DESIGN SYSTEM — LOCKED
## ═══════════════════════════════════════════

### Colors (source of truth: app/globals.css)
```
Background:     #0D1117 (--bg-primary)
Surface:        #161B22 (--bg-secondary)
Card:           #1C2128 (--bg-tertiary)
Teal accent:    #00BCD4 (--accent)
Teal bright:    #22D3EE (--accent-bright)
Teal deep:      #0097A7 (--accent-deep)
Gold (estate):  #D4AF37 (--estate-warm)
Error:          #EF4444 (--error)
Success:        #22C55E (--success)
Warning:        #F59E0B (--warning)
Antique:        #D4AF37 (--antique-text)
Text primary:   #F0F6FC (--text-primary)
Text secondary: #8B949E (--text-secondary)
Text muted:     #484F58 (--text-muted)
```

### Typography (Google Fonts loaded in layout.tsx)
```
Headings:        Exo 2 (weights: 400, 500, 600, 700, 800)
Body:            Plus Jakarta Sans (weights: 400, 500, 600, 700)
Numbers/metrics: Barlow Condensed (weights: 300-800)

CSS Variables:
  --font-heading: var(--exo2)
  --font-body:    var(--plusJakarta)
  --font-data:    var(--barlowCondensed)
```

### Styling Rules
- Tailwind CSS 4 via className for utility classes.
- CSS custom properties (globals.css) for theme tokens.
- Light AND dark mode supported via CSS variables.
- 7 breakpoints defined: xxl, xl, large, main, medium, small, tiny.
- globals.css is 840 lines — read it before modifying any styles.

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
- Report ALL schema changes in V15 FLAGS section.
- Never delete a model or field without explicit approval.
- Prisma singleton lives at `lib/prisma.ts` — NEVER modify.

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
ryanroger11@gmail.com / Freedom26$
```

---

## ═══════════════════════════════════════════
## SECTION 6: API ARCHITECTURE — 181 ROUTES
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
Messages layout:        position:fixed, top:108px — NEVER change.
```

### Locked Files — NEVER MODIFY WITHOUT EXPLICIT COMMAND
```
lib/constants/pricing.ts   — Pricing SSOT
lib/prisma.ts              — Prisma singleton
lib/bots/skills/           — Skill packs (additive only)
lib/adapters/auth.ts       — Auth adapter (critical path)
public/images/logos/       — Logo assets
public/manifest.json       — PWA manifest
prisma/schema.prisma       — Schema (modify only with approval)
app/globals.css            — Theme tokens (modify only with approval)
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
- Report commit hash in every V15 report.
- One commit per logical change. Not one giant commit.
- Never force-push to main.
- Never commit .env, .env.local, or any secrets.

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
lib/prisma.ts                — Prisma singleton (LOCKED)
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

## ═══════════════════════════════════════════
## SECTION 18: V15 REPORT FORMAT — REQUIRED
## ═══════════════════════════════════════════

Every command ends with this. No exceptions.

```
┌──────────────────────────────────────────────────┐
│  [CMD-NAME] V15 REPORT                           │
│  [Date] | V15                                    │
├──────────────────────────────────────────────────┤
│  CHECKPOINT BEFORE: tsc=0, build=PASS ([N])      │
│  CHECKPOINT AFTER:  tsc=0, build=PASS ([N])      │
├──────────────────────────────────────────────────┤
│  PART A — DIAGNOSTIC                             │
│  [What was read, what was found]                 │
├──────────────────────────────────────────────────┤
│  FIXES / CHANGES                                 │
│  [File | Line | What changed | Why]              │
├──────────────────────────────────────────────────┤
│  LOCKED FILES: UNTOUCHED / [list if touched]     │
│  SCHEMA CHANGES: NONE / [what changed]           │
├──────────────────────────────────────────────────┤
│  FILES MODIFIED: [list]                          │
│  FILES CREATED: [list]                           │
├──────────────────────────────────────────────────┤
│  FLAGS                                           │
│  Gaps: [incomplete items found during work]      │
│  Risks: [what could break]                       │
│  Carry-forward: [banked commands for next]       │
│  Suggestions: [ideas for Ryan to decide]         │
│  Opportunities: [business/product value]         │
├──────────────────────────────────────────────────┤
│  tsc: 0 errors                                   │
│  build: PASS ([N] routes)                        │
│  Commit: [hash] on main                          │
└──────────────────────────────────────────────────┘
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
# END OF CLAUDE.md — LEGACY-LOOP MVP SKILL PACK
# If you read this far, you're ready to build. Let's ship.
# ════════════════════════════════════════════════════════════════
