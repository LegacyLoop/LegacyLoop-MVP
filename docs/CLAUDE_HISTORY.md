# Legacy-Loop · CLAUDE.md History — Banked Reference

This file holds the verbose reference content that used to live in `CLAUDE.md`. Banked here on 2026-05-08 as part of the CLAUDE.md trim cylinder (1025 lines → ~150 lines · saves ~46K tokens per API call · CodeBurn-validated).

**Loaded on demand · NOT auto-imported.** Read this file when you need:
- Full schema model inventory · full API directory tree · full component list
- Full env var checklist · full V17.1 templates
- Tech stack version pins
- Scaling notes · post-seed architecture targets
- Error handling pattern reference

For active rules + gotchas, see `CLAUDE.md`. For doctrine ledger, see `docs/DOCTRINE_LEDGER.md`. For design tokens, see `WORLD_CLASS_STANDARDS.md`.

---

## §TECH_STACK · Exact versions (snapshot 2026-05-08)

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
| Photos         | Cloudinary                  | 2.9.0      |
| AI: OpenAI     | openai                      | 6.25.0     |
| AI: Anthropic  | Claude (via API)            | direct     |
| AI: Google     | Gemini (via API)            | direct     |
| AI: xAI        | Grok (via API)              | direct     |
| AI: Perplexity | Sonar (via API)             | direct     |
| Email          | SendGrid                    | configured |
| SMS            | Twilio                      | 5.13.0     |
| Shipping       | Shippo + ShipEngine + EasyPost + FedEx + ARTA | multi |
| Comps          | eBay API + Rainforest API   | configured |
| Automation     | n8n                         | cloud      |
| Auth           | Custom JWT + bcrypt         | jose 6.1.3 |
| Icons          | Lucide React                | 0.575.0    |
| Media          | ffmpeg-static + fluent-ffmpeg | 5.3.0    |
| Styling        | Tailwind CSS 4 + CSS custom properties | ^4 |

Build commands: `npm run dev` · `npm run build` (= `prisma generate && next build`) · `npm run lint` · `npx prisma generate` · `npx prisma studio` · `tsc --noEmit`. **Note `prisma db push` is libsql-incompatible for Turso prod** (P1012 error · use `@libsql/client` + token-bypass · R22.5 OP-B canonical).

---

## §CSS_TOKENS · Full variable list (canonical: globals.css + WORLD_CLASS_STANDARDS.md §3)

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

Typography: Exo 2 (headings · letterSpacing -0.02em on H1-H3) · Plus Jakarta Sans (body · lineHeight 1.6) · Barlow Condensed (numbers/prices/stats/credits — every numeric value).

Existing keyframes: orbFloat1/2/3 · fadeSlideUp · floatDot · skeleton-pulse · accentPulse · pulse · spin · fadeUp · softPulse.

7 breakpoints: xxl · xl · large · main · medium · small · tiny. globals.css ~840 lines.

---

## §SCHEMA_MODELS · 53 models in prisma/schema.prisma (canonical)

**Core:** User · Item · ItemPhoto · ItemDocument · Subscription · SubscriptionChange · UserCredits · CreditTransaction · UserAddon · Addon

**AI/Bot:** AiResult · AntiqueCheck · BuyerBot · BuyerLead · ReconBot · ReconAlert · Valuation · PriceSnapshot · MarketComp · ScraperComp · ScraperUsageLog · SylviaMemory · SellingPipeline

**Commerce:** Transaction · Offer · OfferEvent · PaymentLedger · SellerEarnings · ShipmentLabel · ListingPublish · ConnectedPlatform

**Estate/Services:** WhiteGloveBooking · WhiteGloveProject · WhiteGlovePhase · EstateCareContract · ServiceQuote · Project · ContractorJob · Contractor

**Communication:** Conversation · Message · Notification · Testimonial · Referral

**Auth/System:** MagicLink · OtpCode · PasswordReset · HeroVerification · DataCollectionConsent · EventLog · UserEvent · BudgetPreferences · ItemEngagementMetrics

**Enums:**
- `ItemStatus`: DRAFT → ANALYZED → READY → LISTED → INTERESTED → OFFER_PENDING → SOLD → SHIPPED → COMPLETED → RETURN_REQUESTED → RETURNED → REFUNDED
- `SaleMethod`: LOCAL_PICKUP | ONLINE_SHIPPING | BOTH
- `SellingPipelineState`: LISTED | MONITORING | NEGOTIATING | ACCEPTED | SHIPPED | CLOSED | WITHDRAWN

Schema rules: additive only · run all field additions at once · `prisma db push` (dev only) → `prisma generate` → report changes in §12 FLAGS · never delete model/field without approval · `lib/db.ts` Prisma singleton LOCKED.

---

## §AUTH_SURFACE · `lib/adapters/auth.ts` exports (canonical: read the file)

```
signup(email, password)         — bcrypt hash, create User
login(email, password)          — verify bcrypt, issue JWT (7-day)
loginWithRemember(email, pw, r) — 30-day JWT if remember=true
issueSession(userId, tier, r)   — for OAuth/phone/magic-link flows
getSession()                    — read JWT from HttpOnly cookie
logout()                        — delete auth-token cookie
```

Architecture: JWT HS256 via jose · HttpOnly cookie `auth-token` · 7-day default · 30-day with remember · bcryptjs · NO `middleware.ts` · per-route check via `getSession()` · magic link + OTP + Google OAuth flows configured.

Test accounts: `annalyse07@gmail.com / Legacy-Loop123!` (Tier 4 Estate Manager). `ryanroger11@gmail.com` may not be seeded in dev DB.

---

## §API_TREE · 57 top-level directories under `app/api/` (200+ build routes)

```
addons · admin · agents · analytics · analyze · auth · billing · blur-plate · bots · budget · bundles · catalog · consent · conversations · credits · cron · demo · donation · ebay · enrichment · estate-care · export · feedback · founding-members · help · heroes · integrations · intelligence · items · listing · listings · market-intelligence · megabot · messages · notifications · offers · onboarding · outreach · payments · payouts · photobot · projects · quote · ratings · receipts · recon · referrals · refunds · shipping · spending · subscription · sylvia · testimonials · trades · user · webhooks · white-glove
```

Plus `internal/` subtree (scraper-comp-count etc.).

Patterns: `app/api/[resource]/route.ts` · nested `app/api/[resource]/[action]/route.ts` · auth via `authAdapter.getSession()` at top of protected routes · response format `NextResponse.json({ data })` or `NextResponse.json({ error }, { status: N })` · 400/401/403/404/500 status codes · always validate input · always wrap try/catch · never expose internal stacks.

Webhooks: `/api/webhooks/stripe` · `/api/webhooks/n8n` · all inbound require signature verification.

---

## §AI_SYSTEMS · 11 analysis bots + 3 platform systems

**11 Analysis Bots (skill pack counts):**

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

**3 Platform Systems (always free):** DocumentBot · Intel Panel AI · Shipping Center AI.

**Shared libraries:** `_shared` (3 files) · `_shared_megabot` (4 files).

**MegaBot consensus** (4 providers in parallel · cross-references): GPT-4o-mini · Claude · Gemini 1.5 Flash · Grok 3. Supporting files: disagreement.ts · accuracy.ts · demand-score.ts · megabot-enrichment.ts · sequencer.ts · router-analytics.ts.

**Bot access model:** Tier-unlocked = FREE · above-tier = credits soft gate · VideoBot ALWAYS credits · DocumentBot + Shipping Center AI = FREE all users · credits = universal soft-gate key (never hard block).

**Skill pack location:** `lib/bots/skills/[botname]/*.md`. Loader: `lib/bots/skill-loader.ts`. Vercel includes via `outputFileTracingIncludes: lib/bots/skills/**`.

---

## §PAGE_ROUTES · 87 pages

**Core:** `/dashboard` · `/items/[id]` (MOST IMPORTANT) · `/items/[id]/edit` · `/items/[id]/dossier` (NB Seed 1 · orphan) · `/bots` · `/bots/[botname]` · `/marketplace` · `/store/[userId]`

**Commerce:** `/billing` · `/subscription` · `/pricing` · `/credits` · `/purchases` · `/receipts` · `/offers` · `/shipping` · `/returns`

**Auth:** `/auth/login` · `/auth/signup` · `/auth/forgot-password` · `/auth/reset-password`

**Admin:** `/admin` · `/admin/heroes` · `/admin/quotes`

**Profile:** `/profile` · `/settings` · `/referral` · `/testimonials`

**Content:** `/help` · `/about` · `/terms` · `/privacy`

---

## §COMPONENTS · `app/components/` (47 files)

**Navigation:** AppNav.tsx (772 lines · CRITICAL) · BottomNav.tsx · Breadcrumbs.tsx · Footer.tsx · CommandPalette.tsx

**Modals:** UploadModal.tsx · WelcomeModal.tsx · BugReportModal.tsx · DataConsentModal.tsx · TradeProposalModal.tsx · CookieConsent.tsx

**Widgets:** ActiveOffersWidget.tsx · CronStatusWidget.tsx · HelpWidget.tsx · ItemActionPanel.tsx · OfferManagerPanel.tsx · CollapsiblePanel.tsx

**Commerce:** BudgetGuard.tsx · ProcessingFeeTooltip.tsx · ShareButtons.tsx · BundleSuggestions.tsx · OfferHistoryTimeline.tsx

**UI utils:** BotLoadingState.tsx · DemoBanner.tsx · EnrichmentBadge.tsx · FoundingMemberBadge.tsx · InstallPrompt.tsx · KeyboardShortcuts.tsx · TestimonialGrid.tsx · ThemeProvider.tsx

**Subdirs:** billing/ · effects/ (NoiseOverlay · GradientOrbs etc.) · messaging/

**Mobile:** BottomNav visible <1024px · 44px touch targets · `env(safe-area-inset-bottom)` · `overflow-x: hidden` on html+body.

---

## §LOCKED_CONSTANTS · System constants

```
DEMO_MODE=true          — bypasses payment gates in dev. NEVER remove.
SYSTEM_USER_ID:         cmmqpoljs0000pkwpl1uygvkz
Messages layout:        position:fixed, top:108px — LOCKED FOREVER.
Fee model:              1.75% buyer + 1.75% seller = 3.5% total
PROCESSING_FEE:         3.5% (Stripe)
layout.tsx:             Server Component — NEVER add event handlers
Cloudinary:             ONLY valid photo storage on Vercel. NEVER local disk.
shouldBypassGates:      isDemoMode() || isAdminUser()
Go live:                DEMO_MODE=false + Stripe sk_live_ + pk_live_ in Vercel env
```

**Pricing** (SSOT: `lib/constants/pricing.ts`):

```
TIER enum: FREE (1), DIY_SELLER (2), POWER_SELLER (3), ESTATE_MANAGER (4)
Monthly:  Free $0/12% · DIY $20/8% · Power $49/5% · Estate $99/4%
Annual:   DIY $200 · Power $490 · Estate $990
```

---

## §SECURITY · Headers + auth + privacy

**Headers (next.config.ts):** X-Frame-Options DENY · CSP whitelists OpenAI/Anthropic/Gemini/xAI/Perplexity · Permissions-Policy camera/microphone self · HSTS via Vercel.

**Auth security:** bcrypt passwords · JWT HS256 · HttpOnly cookies · 7d default / 30d remember · SameSite CSRF · rate limit auth endpoints · sanitize all input.

**API security:** verify session on protected routes · never expose internal stack traces · validate webhook signatures (Stripe · n8n) · never log secrets · `.env*` never committed.

**Data privacy:** DataCollectionConsent model · CookieConsent component on first visit · GDPR-ready (consent · export · deletion) · Turso encryption at rest.

---

## §PERFORMANCE · Targets + practices

Core Web Vitals: LCP <2.5s · FID <100ms · CLS <0.1 · TTFB <800ms (Vercel edge).

Image optimization: Cloudinary for uploads · Next.js Image for static · WebP/AVIF · lazy load below fold · HEIC support via heic-convert.

Bundle: dynamic imports for heavy (ffmpeg · html2canvas) · route-based code splitting · skill packs server-only · Sharp for image processing.

DB: Turso edge · Prisma `select` for narrow fields · avoid N+1 via include/select · index userId/itemId/status.

---

## §A11Y · WCAG 2.1 AA minimum (senior-friendly is non-optional)

Color contrast: 4.5:1 normal · 3:1 large. Touch targets 44px min. Body never below 14px. Focus indicators on all interactive. Keyboard accessible. Semantic HTML + ARIA. `prefers-reduced-motion` respected. Error states never color-only.

Testing: keyboard-only tab through · 200% browser zoom · Lighthouse a11y target 90+.

---

## §ENV_VARS · `.env.example` is truth

```
# Database
DATABASE_URL                        — SQLite (dev) or PostgreSQL (prod)
TURSO_CONNECTION_URL                — Turso (canonical · matches lib/db.ts L28+L38+L49)
TURSO_AUTH_TOKEN                    — Turso auth

# AI Providers (Legacy-Loop)
OPENAI_API_KEY                      — GPT-4o-mini
ANTHROPIC_API_KEY                   — Claude
GEMINI_API_KEY                      — Gemini 1.5 Flash
XAI_API_KEY                         — Grok 3

# Sylvia (separate budget · isolated · loaded via .env.sylvia chmod 600)
SYLVIA_API_INTERNAL_SECRET          — internal auth gate
ANTHROPIC_API_KEY_SYLVIA
OPENAI_API_KEY_SYLVIA
GEMINI_API_KEY_SYLVIA
XAI_GROK_API_KEY_SYLVIA
PERPLEXITY_API_KEY_SYLVIA
DEEPSEEK_API_KEY_SYLVIA             — forward-compat (unused until LITELLM-CLOUD-VENDOR-ADD-DEEPSEEK)

# Payments
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
SQUARE_ACCESS_TOKEN                  — (legacy · removed)
SQUARE_LOCATION_ID                   — (legacy · removed)

# Shipping
SHIPPO_API_TOKEN
SHIPENGINE_API_KEY
EASYPOST_API_KEY
FEDEX_API_KEY
FEDEX_SECRET_KEY
ARTA_API_KEY                         — white-glove

# Media
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Email & SMS
SENDGRID_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN

# Auth
JWT_SECRET                           — generate via openssl rand -base64 64
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

# Comps
EBAY_APP_ID                          — placeholder · AI fallback used
RAINFOREST_API_KEY                   — Amazon/retail comps

# Automation
N8N_WEBHOOK_URL
N8N_WEBHOOK_SECRET                   — HMAC verification · canonical receiver app/api/webhooks/n8n/route.ts
SLACK_WEBHOOK_URL
CRON_SECRET                          — cron auth · constant-time compare via lib/auth/cron-auth.ts
```

---

## §KEY_FILES · Read before touching

**Layout:** `app/layout.tsx` · `app/components/AppNav.tsx` (772 lines) · `app/components/BottomNav.tsx` · `app/globals.css` (~840 lines · 7 breakpoints)

**Core business logic:** `app/dashboard/page.tsx` · `app/items/[id]/page.tsx` (MOST IMPORTANT) · `lib/constants/pricing.ts` (SSOT) · `lib/pricing/garage-sale.ts` (3-price engine) · `lib/adapters/auth.ts` (JWT)

**AI system:** `lib/bots/skill-loader.ts` · `lib/bots/sequencer.ts` · `lib/bots/megabot-enrichment.ts` · `lib/bots/item-spec-context.ts` (15KB) · `lib/bots/accuracy.ts` · `lib/bots/disagreement.ts`

**Sylvia:** `lib/sylvia/{index,memory,memory-types,triage-router,types}.ts` · `lib/sylvia/dispatcher/{auth,classify,agreement,budget,index}.ts` · `lib/sylvia-kb/types.ts` · `app/api/sylvia/consensus/route.ts`

**Data:** `prisma/schema.prisma` (53 models) · `lib/db.ts` (Prisma singleton · LOCKED)

**Config:** `next.config.ts` (security headers · CSP · skill bundling) · `tsconfig.json` (strict · `@/*` aliases) · `.env.example`

---

## §LARGE_FILES · Surgical-unlock-required

- `app/components/ItemDashboardPanels.tsx` — 9000+ lines · per-command surgical unlock
- `app/components/ShippingCenterClient.tsx` — 6744 lines

---

## §LEGACYLOOP_DIFFERENTIATORS · Marketing/investor narrative

- Only resale platform with in-person garage sale pricing (3-price engine)
- Location-aware pricing (rural Maine ≠ Boston suburbs)
- 201 skill packs across 14 AI systems · no competitor has this depth
- MegaBot 4-AI consensus · no single-model bias
- DocumentBot + Shipping Center AI = FREE · drives commission revenue
- White Glove estate service: 60% deposit / 40% completion
- Senior-friendly UX + billion-dollar aesthetic (both at once)
- Credits = universal key · soft gates · never hard blocks
- Full commerce: offers · negotiations · transactions · payouts · returns
- Vehicle intelligence: VIN decode · market value · condition grading
- PWA-installable

> "Legacy-Loop is not just a resale site. It is a full resale automation engine that connects generations."

---

## §V19_TEMPLATE · Command + report format (verbose · per V17.1 § canonical)

### §10 COMMAND BLOCK

```
CMD-[NAME]
Legacy-Loop | [Date] | V19

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

### §11 ACCEPTANCE TEST

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

### §12 V19 REPORT (every command emits)

```
┌──────────────────────────────────────────────────┐
│  CMD-[NAME] §12 REPORT                          │
│  [DATE] | V19                                   │
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
│  Vercel: dpl_<id> READY · curl 200/200          │
└──────────────────────────────────────────────────┘

CRITICAL: IF POST-CHECKPOINT FAILS → REVERT IMMEDIATELY.
```

---

## §ERROR_PATTERNS · Reference

### API route pattern

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

### Client components

- try/catch around all async operations
- user-friendly error messages (never raw error objects)
- log to console for debugging
- fallback UI for failed states
- never let crashes propagate to white screen

---

## §SCALING_NOTES · Pre-seed → post-seed

**Current (pre-seed):** single dev (Ryan + Claude Code) · SQLite (dev) → Turso (prod) · Vercel serverless · ~$475/mo operational burn.

**Post-seed targets (banked · activate when metrics warrant):**
- Redis for session caching + rate limiting
- Queue system for bot orchestration (BullMQ or similar)
- Sentry error monitoring
- PostHog or Mixpanel analytics
- DB read replicas when traffic warrants
- Webhook retry system

**Doctrine:** never prematurely optimize. Ship working features first. Optimize when metrics prove a bottleneck. Maintain clean architecture so future optimization is possible.

---

## §HISTORY_LOG · CLAUDE.md change provenance

- **2026-05-08 PM** — CLAUDE.md trim cylinder · 1025 lines → ~150 lines · banked verbose reference into this file. Trigger: CodeBurn flagged ~46K tokens per API call savings if total expanded content under 200 lines. Actual savings (CLAUDE.md alone) ~80% of that. WCS + AGENTS trim banked Saturday.
- **2026-05-08 AM** — R24 Z drift cleanup · "51 models" → "53 models" at L242 + L816 (post-SylviaMemory + SellingPipeline schema additions) · added libsql-incompatible caveat to §4 Schema Rules. Hash: 5a47edb.
- **Apr 18 2026** — F1 Engine Doctrine added (§7) after CMD-SALE-METHOD-SYSTEMIC-RESPECT inline-text violation. Three bots silently got capability upgrades not in skill packs / scoreboard. CMD-BOT-ENGINE-CANONIZE-SALE-METHOD restored doctrine by extracting inline text to skill packs 18/NN/21 + bumping versions V11/V10/V9b.
- **Apr 18 2026** — FLEX-SHRINK RULE (§3 styling) added after V8 pills 8th attempt (commit 9fd024c). iOS/Safari shrink contract pain.
- **Earlier 2026** — GRID RULE (§3 styling) added after 7 failed mobile-clipping fix attempts.
