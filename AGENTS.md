<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LEGACYLOOP — SHARED ENGINEERING STANDARDS (AGENTS.md)
# Applies to ALL LegacyLoop repositories. Read alongside CLAUDE.md.
# Verbose reference banked at docs/AGENTS_HISTORY.md.

## ENGINEERING PHILOSOPHY

Build to a billion-dollar standard. Every line of code written as if a senior engineer at Stripe, Linear, or Apple will review it tomorrow. Clean. Typed. Tested. Documented.

### Core Principles

1. **Ship working software.** Done > perfect. But never sloppy.
2. **Preserve what works.** Never rewrite for style. Upgrade for function.
3. **Read before you write.** Diagnostic first. Always.
4. **Type everything.** TypeScript strict mode. No `any`. No `as unknown`.
5. **One scope per command.** Stay focused. Log discoveries for later.
6. **Never break the build.** tsc=0 and build=PASS at all times.

---

## CODE QUALITY — RULES

### TypeScript
- Strict mode. No exceptions.
- Prefer explicit types over inference for function signatures.
- No `any`. Use `unknown` + type guards if truly needed.
- No `@ts-ignore` / `@ts-expect-error` without comment explaining why.
- No `as` type assertions unless provably safe with comment.
- Export types/interfaces alongside their implementations.

### React / Next.js
- Server Components by default. `'use client'` only when needed.
- Async Server Components for data fetching (no `useEffect` for loads).
- Error boundaries around dynamic content. Loading states for all async ops.
- No `useEffect` for data fetching in client components — use SWR or server actions.

### Naming Conventions
- Components: PascalCase (ItemDetailPage)
- Utilities: kebab-case (.ts) · Components: PascalCase (.tsx)
- Functions: camelCase (getSession) · Constants: UPPER_SNAKE_CASE (PROCESSING_FEE)
- Types/Interfaces: PascalCase descriptive
- API routes: kebab-case directories (/api/buyer-leads/route.ts)
- CSS variables: kebab-case (--bg-primary)

### File Organization
- One component per file (unless tightly coupled helpers).
- Co-locate tests with source files when added.
- Utilities in `lib/` — never in `app/`.
- Constants in `lib/constants/` — single source of truth.
- API types shared between client and server in `lib/types/`.

---

## ERROR HANDLING — RULES

- Every async operation wrapped in try/catch.
- User-facing errors: friendly messages · never raw errors.
- Developer errors: full context logged to console.
- API errors: consistent format `{ error: string, status: number }`.
- Never swallow errors silently — always log or surface.

API route + client component error templates: `docs/AGENTS_HISTORY.md` §ERROR_PATTERNS.

---

## TESTING STANDARDS — pointer

**Current state:** manual QA by Ryan · `tsc --noEmit` on every change · `npm run build` integration check.

**Post-seed targets** (when team scales · banked): unit tests for business logic · integration tests for API routes · E2E for critical paths · visual regression for landing · Lighthouse CI.

**Test priority order** (when team hires): pricing → auth → bot routing → payment webhooks → item lifecycle.

Verbose strategy + testing doctrine: `docs/AGENTS_HISTORY.md` §TESTING_STANDARDS.

---

## DOCUMENTATION — RULES

- Comment the WHY · not the WHAT.
- Document non-obvious business rules inline.
- `// TODO(ryan):` or `// HACK:` for temporary workarounds.
- JSDoc on exported functions used by multiple files.

**§12 V19 Report required on EVERY command.** See `CLAUDE.md` for the format. Engineering log · Ryan reviews every one. FLAGS section surfaces risks/gaps/ideas. Never skip — even small changes.

---

## DEPLOYMENT — RULES

**Pre-deploy checklist:**
1. `tsc --noEmit` = 0 errors
2. `npm run build` = PASS
3. No `console.log` with sensitive data
4. No `.env` values hardcoded
5. No TODO items blocking the feature
6. Git committed with `CMD-` prefix message

**Vercel:** auto-deploys main · preview deploys on PRs · env vars in Vercel dashboard NEVER in code · check build logs if deploy fails.

**Database:** schema changes → `npx prisma db push` (dev only · libsql incompatibility for Turso prod · see CLAUDE.md BINDING #6) → `npx prisma generate`. Never delete models/fields without approval. Always additive.

---

## SECURITY — NON-NEGOTIABLE

- Never commit secrets (`.env*` · API keys · passwords).
- Never log passwords · tokens · or full API keys.
- Never expose internal errors to users.
- Validate all user input before DB ops.
- Sanitize all user-generated content before rendering.
- HTTPS everywhere (Vercel-enforced).
- HttpOnly cookies for auth tokens.
- CORS properly configured.
- CSP headers set (`next.config.ts`).
- Rate limiting on auth + payment endpoints.

---

## SCALING MINDSET

Build for today. Architect for tomorrow.

- Clean modular code · maintainable by team.
- Consistent patterns so new devs onboard fast.
- Decisions documented in §12 reports (engineering log).
- Composition over inheritance · small focused components · shared logic in hooks/utilities.
- DB queries: think N+1 + index usage. API responses: return only what client needs. State: server > client whenever possible.

Verbose scaling architecture (post-seed targets · concurrency patterns): `docs/AGENTS_HISTORY.md` §SCALING_MINDSET_VERBOSE.

---

## THE STANDARD

> "LegacyLoop is not a side project. It is a company being built to a billion-dollar standard by a founder who cares about every detail. Treat every line of code, every commit, every §12 report as if it will be reviewed by the best engineers in the world. Because eventually, it will be."

# END OF AGENTS.md — RULES + GOTCHAS · ~120 lines · verbose ref at docs/AGENTS_HISTORY.md
