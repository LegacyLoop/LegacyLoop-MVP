# LegacyLoop Pre-Launch Production Audit

## Your Role
You are a senior software auditor performing a READ-ONLY pre-launch review of LegacyLoop, an AI-powered estate resale platform built with Next.js 16.1.6 / React 19 / Tailwind 4 / Prisma 6 (SQLite) / OpenAI Vision. This is preparing for an investor demo and soft beta launch.

**CRITICAL: DO NOT EDIT ANY FILES. This is a read-only audit. Report findings only.**

## Stack Context
- Framework: Next.js 16.1.6 (App Router), React 19, TypeScript
- Database: Prisma 6 with SQLite (`prisma/dev.db`), 47 models
- Payments: Square (NOT Stripe), 3.5% processing fee charged to BUYER
- AI: OpenAI Responses API (`openai.responses.create`), NOT `chat.completions`
- Auth: JWT (jose) in HTTP-only cookies, multiple methods (email/password, Google OAuth, Magic Link, Phone OTP)
- Email: SendGrid (gated by `FEATURES.LIVE_EMAIL` flag)
- Shipping: Shippo adapter with mock fallback
- Bot System: 12+ specialized AI bots, credit-based usage
- Theme: Light/Dark/Auto with CSS custom properties
- Styling: ALL inline `style={{}}`, CSS variables from `globals.css`, brand teal `#00bcd4`
- 248 compiled routes, 153 API endpoints, 67 pages
- No test suite exists (this is known)

## Audit Scope — 8 Categories

### 1. SECURITY AUDIT
Scan every file under `app/api/` and check:
- [ ] Every POST/PATCH/DELETE route has auth check (`authAdapter.getSession()`) where appropriate
- [ ] Public routes (conversations POST, store pages, webhook endpoints) are intentionally public — verify they don't leak private data
- [ ] Admin routes use `isAdmin(user.email)` check (see `lib/constants/admin.ts`)
- [ ] No API keys, secrets, or tokens are hardcoded in source files (check all `.ts`, `.tsx` files, NOT `.env`)
- [ ] `.env` is in `.gitignore` (it should be — verify)
- [ ] Webhook endpoints (`/api/webhooks/square`, `/api/webhooks/n8n`, `/api/webhooks/arta`) validate signatures or have auth
- [ ] JWT secret is loaded from env, not hardcoded (check `lib/adapters/auth.ts`)
- [ ] Password hashing uses bcrypt (check signup and login routes)
- [ ] No SQL injection vectors (Prisma handles this but check for any raw queries)
- [ ] File upload endpoints validate file type and size (check `heroes/apply`, `items/create`, `items/photos`)
- [ ] CRON endpoints are protected by `CRON_SECRET` (check all files under `app/api/cron/`)

### 2. DATA INTEGRITY
- [ ] All Prisma `create` and `update` calls validate required fields before writing
- [ ] Status transitions are validated (ItemStatus has specific valid transitions — check `app/api/items/status/[itemId]/route.ts`)
- [ ] Credit transactions use `$transaction` for atomicity (check `lib/credits.ts` and any route that deducts credits)
- [ ] Cascade deletes are handled properly — deleting an item should clean up photos, AI results, conversations, etc. (check `app/api/items/delete/[itemId]/route.ts`)
- [ ] Offer expiration logic works correctly (check `app/api/cron/offers/route.ts`)
- [ ] Return/refund flow maintains payment ledger consistency (check `app/api/refunds/` routes)

### 3. ERROR HANDLING
- [ ] Every API route has try/catch and returns proper HTTP status codes
- [ ] No route can crash the server on malformed input (check JSON parsing with `.catch(() => ({}))`)
- [ ] External API calls (OpenAI, Square, Shippo, SendGrid) have error handling and don't block the response
- [ ] Email sending is always non-blocking (fire-and-forget with `.catch(() => {})`)
- [ ] Bot activation/scanning failures don't corrupt state

### 4. DEMO vs PRODUCTION READINESS
- [ ] `app/api/demo/seed/route.ts` — is this protected? Should it be disabled in production?
- [ ] `lib/bot-mode.ts` — check how `BOT_MODE` env var works. What happens when `BOT_MODE=live`?
- [ ] Search for all instances of "mock", "demo", "fake", "test", "TODO", "FIXME", "HACK" in the codebase
- [ ] Flag any hardcoded test data that would appear in production
- [ ] Check `FEATURES` flags in `lib/feature-flags.ts` — what's gated and what's live?
- [ ] Verify the demo seed doesn't auto-run or contaminate a clean database

### 5. UI/UX FLOW AUDIT
Walk through these critical user journeys and flag any broken links, missing pages, or dead ends:
- [ ] **Signup flow**: `/auth/signup` → dashboard → first item upload → AI analysis
- [ ] **Item lifecycle**: Upload → Analyze → Price → List → Buyer messages → Offer → Sold → Ship → Complete
- [ ] **Return flow**: Sold item → buyer requests return → seller approves/denies → refund
- [ ] **Hero verification**: `/heroes/apply` → upload proof → admin review → discount applied
- [ ] **Public storefront**: `/store/[userId]` → item detail → buyer sends message
- [ ] **Offer flow**: Buyer makes offer → seller sees notification → accept/counter/decline
- [ ] **Settings/Profile**: Can user update all their info? Are settings persisted?
- [ ] **Navigation**: Check `AppNav.tsx` — do all nav links point to real pages?

### 6. PERFORMANCE & OPTIMIZATION
- [ ] Check for N+1 query patterns in server components (Prisma `findMany` followed by individual `findUnique` calls)
- [ ] Large Prisma queries should use `select` to limit returned fields (check dashboard, admin pages)
- [ ] Client components that fetch data should have loading states
- [ ] Images are served from `/uploads/` — check if Next.js Image optimization is used
- [ ] Check for memory-intensive operations (large JSON parsing, base64 encoding of screenshots)
- [ ] The messaging system polls every 30 seconds — verify this doesn't stack or leak intervals

### 7. PRICING & BILLING INTEGRITY
This is CRITICAL for the investor demo:
- [ ] Single source of truth: `lib/constants/pricing.ts` — verify ALL pricing references point here
- [ ] Tier definitions (FREE=1, DIY_SELLER=2, POWER_SELLER=3, ESTATE_MANAGER=4) are consistent everywhere
- [ ] Credit costs match between constants and actual bot route deductions
- [ ] Commission rates are calculated from user's actual tier, not hardcoded
- [ ] Hero discount (25%) is applied correctly when `heroVerified=true`
- [ ] Pre-launch vs regular pricing is handled correctly
- [ ] Square webhook properly handles payment confirmation and ledger entries

### 8. MISSING PIECES / GAPS
Flag anything that looks incomplete or would embarrass us in an investor demo:
- [ ] Pages that render empty or with placeholder content
- [ ] API routes that return mock data without indicating it's mock
- [ ] Buttons that don't have click handlers
- [ ] Forms that don't validate or submit
- [ ] Features referenced in nav/UI that don't exist yet
- [ ] Any page that would show "undefined" or "null" to the user
- [ ] Error messages that expose stack traces or internal details

## Output Format

Organize your findings as:

```
## CATEGORY: [Security/Data/Error/Demo/UX/Performance/Pricing/Gaps]

### CRITICAL (must fix before demo)
- [File path] — [Description of issue]

### HIGH (should fix before demo)
- [File path] — [Description of issue]

### MEDIUM (fix before beta)
- [File path] — [Description of issue]

### LOW (backlog)
- [File path] — [Description of issue]
```

For each finding, include:
1. Exact file path
2. Line number or function name if possible
3. What the issue is
4. Suggested fix (1-2 sentences max)

## Key Files to Start With
- `prisma/schema.prisma` — all 47 models
- `lib/constants/pricing.ts` — pricing SSOT
- `lib/adapters/auth.ts` — auth system
- `lib/credits.ts` — credit system
- `lib/bot-mode.ts` — demo/live toggle
- `lib/feature-flags.ts` — feature gates
- `app/api/items/status/[itemId]/route.ts` — status transitions
- `app/api/refunds/route.ts` + `app/api/refunds/[itemId]/route.ts` — return flow
- `app/api/webhooks/square/route.ts` — payment webhook
- `app/components/AppNav.tsx` — navigation
- `app/dashboard/page.tsx` — main dashboard
- `next.config.ts` — security headers
- `.gitignore` — verify .env exclusion

## What NOT to Flag
- The SQLite database choice (intentional for MVP, Postgres migration planned)
- Missing test suite (known, will address post-launch)
- Console.log/console.error statements (these are intentional structured logging)
- `html2canvas` dependency (used for bug report screenshots)
- eBay API keys being placeholder values (intentional — AI pricing fallback is the primary path)
