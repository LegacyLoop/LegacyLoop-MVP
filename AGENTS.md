<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ════════════════════════════════════════════════════════════════
# LEGACYLOOP — SHARED ENGINEERING STANDARDS (AGENTS.md)
# Applies to ALL LegacyLoop repositories.
# Read by Claude Code automatically alongside CLAUDE.md.
# ════════════════════════════════════════════════════════════════

## ENGINEERING PHILOSOPHY

We build to a billion-dollar standard. Every line of code should be
written as if a senior engineer at Stripe, Linear, or Apple will
review it tomorrow. Clean. Typed. Tested. Documented.

### Core Principles
1. **Ship working software.** Done > perfect. But never sloppy.
2. **Preserve what works.** Never rewrite for style. Upgrade for function.
3. **Read before you write.** Diagnostic first. Always.
4. **Type everything.** TypeScript strict mode. No `any`. No `as unknown`.
5. **One scope per command.** Stay focused. Log discoveries for later.
6. **Never break the build.** tsc=0 and build=PASS at all times.

---

## CODE QUALITY STANDARDS

### TypeScript
- Strict mode enabled. No exceptions.
- Prefer explicit types over inference for function signatures.
- No `any` type. Use `unknown` + type guards if truly needed.
- No `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- No `as` type assertions unless provably safe with a comment.
- Export types/interfaces alongside their implementations.

### React / Next.js
- Server Components by default. 'use client' only when needed.
- Async Server Components for data fetching (no useEffect for loads).
- Error boundaries around dynamic content.
- Loading states for all async operations.
- Suspense boundaries where appropriate.
- No useEffect for data fetching in client components — use SWR or server actions.

### Naming Conventions
- Components: PascalCase (ItemDetailPage, BotLoadingState)
- Files: kebab-case for utilities, PascalCase.tsx for components
- Functions: camelCase (getSession, calculatePrice)
- Constants: UPPER_SNAKE_CASE (PROCESSING_FEE, SYSTEM_USER_ID)
- Types/Interfaces: PascalCase with descriptive names (UserSession, ItemStatus)
- API routes: kebab-case directories (/api/buyer-leads/route.ts)
- CSS variables: kebab-case (--bg-primary, --accent-bright)

### File Organization
- One component per file (unless tightly coupled helpers).
- Co-locate tests with source files when tests are added.
- Keep utilities in lib/ — never in app/.
- Keep constants in lib/constants/ — single source of truth.
- API types shared between client and server in lib/types/.

---

## ERROR HANDLING

### General Rules
- Every async operation wrapped in try/catch.
- User-facing errors: friendly messages, never raw errors.
- Developer errors: full context logged to console.
- API errors: consistent format { error: string, status: number }.
- Never swallow errors silently. Always log or surface them.

### API Route Pattern
```typescript
try {
  // 1. Auth check
  // 2. Input validation
  // 3. Business logic
  // 4. Return success
} catch (error) {
  console.error("[ROUTE_NAME]", error);
  return NextResponse.json({ error: "..." }, { status: 500 });
}
```

---

## TESTING STANDARDS (as we scale)

### Current State
- Manual QA by Ryan (founder is the test suite right now)
- tsc --noEmit = type checking on every change
- npm run build = integration check on every change

### Target State (post-seed hire)
- Unit tests for business logic (pricing, bot routing, credit calc)
- Integration tests for API routes (auth, payments, bot calls)
- E2E tests for critical paths (signup → list item → sell → ship)
- Visual regression for landing page animations
- Lighthouse CI in deployment pipeline

### What to Test First (priority order)
1. Pricing calculations (commission, credits, subscriptions)
2. Auth flows (signup, login, session, logout)
3. Bot routing and skill loading
4. Payment webhook handling
5. Item lifecycle (DRAFT → COMPLETED)

---

## DOCUMENTATION STANDARDS

### Code Comments
- Comment the WHY, not the WHAT.
- Document non-obvious business rules inline.
- Mark temporary workarounds with `// TODO(ryan):` or `// HACK:`.
- JSDoc on exported functions used by multiple files.

### V16 Report (required on EVERY command — see CLAUDE.md for format)
- Serves as the engineering log for the entire company.
- Ryan reviews these to understand what changed and why.
- FLAGS section is where you surface risks, gaps, and ideas.
- Never skip it. Even for small changes.

---

## DEPLOYMENT RULES

### Pre-Deploy Checklist
1. tsc --noEmit = 0 errors
2. npm run build = PASS
3. No console.log with sensitive data
4. No .env values hardcoded
5. No TODO items that block the feature
6. Git committed with proper CMD- prefix message

### Vercel
- Auto-deploys main branch to production.
- Preview deploys on PRs.
- Environment variables in Vercel dashboard — never in code.
- Check Vercel build logs if deploy fails.

### Database (MVP only)
- After schema changes: `npx prisma db push`
- After push: `npx prisma generate`
- Never delete models or fields without explicit approval.
- Always additive. Migrations over deletions.

---

## SECURITY — NON-NEGOTIABLE

- Never commit secrets (.env, API keys, passwords).
- Never log passwords, tokens, or full API keys.
- Never expose internal errors to users.
- Validate all user input before database operations.
- Sanitize all user-generated content before rendering.
- HTTPS everywhere (enforced by Vercel).
- HttpOnly cookies for auth tokens.
- CORS properly configured.
- CSP headers set (next.config.ts).
- Rate limiting on auth and payment endpoints.

---

## SCALING MINDSET

Build for today. Architect for tomorrow.

- Write clean, modular code that a team can maintain.
- Use consistent patterns so new devs onboard fast.
- Document decisions in V16 reports (they are the engineering log).
- Prefer composition over inheritance.
- Keep components small and focused.
- Extract shared logic into hooks or utilities.
- Database queries: always think about N+1 and index usage.
- API responses: return only what the client needs.
- State management: server state > client state whenever possible.

---

## THE STANDARD

> "LegacyLoop is not a side project. It is a company being built
> to a billion-dollar standard by a founder who cares about every
> detail. Treat every line of code, every commit, every V16 report
> as if it will be reviewed by the best engineers in the world.
> Because eventually, it will be."

# ════════════════════════════════════════════════════════════════
# END OF AGENTS.md
# ════════════════════════════════════════════════════════════════
