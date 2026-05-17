# Legacy-Loop · AGENTS.md History — Banked Reference

This file holds verbose reference content that used to live in `AGENTS.md`. Banked here on 2026-05-08 PM as part of the WCS+AGENTS trim cylinder (193 → ~120 lines · saves ~5K tokens per API call).

**Loaded on demand · NOT auto-imported.** Read when you need:
- Full API route error pattern template
- Full client component error handling guidance
- Verbose testing strategy + post-seed targets
- Full priority order for testing
- Verbose scaling architecture mindset

For active rules + gotchas, see `AGENTS.md`. For full operational doctrine, see `CLAUDE.md` + `WORLD_CLASS_STANDARDS.md`.

---

## §ERROR_PATTERNS · API + Client templates

### API Route Pattern (canonical)

```typescript
export async function POST(req: Request) {
  try {
    const session = await authAdapter.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    // 1. Validate input...
    // 2. Business logic...
    // 3. Return success
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[ROUTE_NAME]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Client Components

- Use try/catch around all async operations.
- Show user-friendly error messages (never raw error objects).
- Log errors to console for debugging.
- Provide fallback UI for failed states.
- Never let a crash propagate to white screen.

### Sylvia / Truth Gate special case

For the Truth Gate dispatcher (`app/api/sylvia/consensus/route.ts`):
- Auth helper fail-closes when env missing (`SYLVIA_API_INTERNAL_SECRET` absent → HTTP 500 with `{error: "Server misconfigured", traceId}`).
- This is **contract-correct fail-closed**. NOT a bug. Activates 401 path only after Vercel env-add (Saturday).
- Per `BINDING #28` candidate (DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE).

---

## §TESTING_STANDARDS · Full strategy

### Current State (Pre-Seed · 2026)

- Manual QA by Ryan (founder is the test suite right now)
- `tsc --noEmit` = type checking on every change
- `npm run build` = integration check on every change

### Target State (Post-Seed · when team hires)

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

### Testing doctrine

- Test the seam, not the implementation.
- Tests that change every refactor are noise · cut them.
- Real DB integration tests for migrations (per BINDING #6 DEV-PROD-DB-ISOLATION lesson — mocked tests can pass while migrations break in prod).
- E2E tests run against real Stripe test keys + Cloudinary sandbox + Twilio test numbers.

---

## §SCALING_MINDSET_VERBOSE

Build for today. Architect for tomorrow.

### Code organization
- Write clean, modular code that a team can maintain.
- Use consistent patterns so new devs onboard fast.
- Document decisions in §12 V19 reports (engineering log).
- Prefer composition over inheritance.
- Keep components small and focused.
- Extract shared logic into hooks or utilities.

### Database
- Always think about N+1 queries and index usage.
- API responses: return only what the client needs.
- State management: server state > client state whenever possible.

### Performance
- Bundle splitting via Next.js route-based code splitting.
- Dynamic imports for heavy client modules (ffmpeg · html2canvas).
- Image optimization via Next.js Image + Cloudinary.

### Concurrency / multi-agent
- Per-agent worktree pattern (per BINDING #20).
- `agent-ship.sh` FF-push convention.
- BINDING #12 multi-agent index isolation precheck before any scoped `git add`.

---

## §HISTORY_LOG · AGENTS provenance

- **2026-05-08 PM** — AGENTS.md trim cylinder · 193 → ~120 lines · banked verbose ref into this file. Companion: WCS trim (538 → ~165 lines · banked at `docs/WORLD_CLASS_STANDARDS_HISTORY.md`). Pair completes CodeBurn's #1 finding from morning baseline (CLAUDE.md trim earlier today captured ~80% of $46K/call savings · this WCS+AGENTS trim captures remaining ~10-20%).
