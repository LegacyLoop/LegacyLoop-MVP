<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LEGACYLOOP — SHARED ENGINEERING STANDARDS (AGENTS.md)
# Applies to ALL Legacy-Loop repositories. Read alongside CLAUDE.md.
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

> "Legacy-Loop is not a side project. It is a company being built to a billion-dollar standard by a founder who cares about every detail. Treat every line of code, every commit, every §12 report as if it will be reviewed by the best engineers in the world. Because eventually, it will be."

# END OF AGENTS.md — RULES + GOTCHAS · ~120 lines · verbose ref at docs/AGENTS_HISTORY.md

---

# APPENDIX · ANTHROPIC AGENTS.MD 6-SECTION PLAYBOOK (R28 P7 · 2026-05-13)

Per CEO ideas ref #2 (Anthropic official agents.md playbook · 9-month deployment framework). Appended additive · zero existing content modified.

## MEMORY ROUTING

Where Claude/Devin/MC/Sylvia/IT write durable state. Per BINDING #6 DOC-DEV-PROD-DB-ISOLATION · BINDING #5 DOC-BAN-ENV-FILE-DUMP.

| Write target | Lives at | Owner |
|---|---|---|
| CEO identity | `~/.claude/identity/me.md` (R28 P2 trio · plain file) | R28 P2 trio |
| Vault navigation | `~/.claude/identity/vault-map.md` | R28 P2 trio |
| Skill conventions | `~/.claude/identity/skill-map.md` | R28 P2 trio |
| Session memory index | `~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/memory/MEMORY.md` | Auto-managed (claude-mem candidate · agent-memory winner R28 P6) |
| Cross-session memory | post-R28 P6: rohitg00/agentmemory MCP layer | Phase A8 winner |
| Sylvia persistent state | `lib/sylvia/memory.ts` Prisma `SylviaMemory` table | Per-cyl recordTriage() |
| Doctrine canon | `docs/DOCTRINE_LEDGER.md` (BINDING list) | Append-only · R25 P4/P7 pattern |
| Project state | `~/.claude/projects/.../memory/project_*.md` | Per-project context |
| Flag registries | `~/Downloads/skills/Flags/Flag_Registry_*.md` | Per-round Devin captures |
| Spec authoring | `~/Downloads/skills/Commands/CMD_*_V19_FIRE.md` | Devin L1 |
| Audit docs | `<repo>/docs/audits/*.md` | Per-investigation |

---

## HARD RULES (NEVER VIOLATE · ABSOLUTE)

- **Never paste credentials** in transcript · file · message · §12 (BINDING #9)
- **Never `cat`/`tail`/`head` `.env*`** files (BINDING #5 · use `grep -cE` count-only)
- **Never `set -x` / `bash -x`** near tokens (BINDING #1)
- **Never force-push to main** · never commit `.env*` or secrets
- **Never push to remote** unless CEO explicitly asks
- **Never claim traction we don't have** (pre-revenue · BINDING-implicit)
- **Polish-mode only** — additive · audit-first · single cylinder per ship · zero scope creep
- **Never abandon · always bank** — default deprio = BANKED-LOW · `feedback_never_abandon_always_bank`
- **Never dictate Ryan's schedule** · never wrap sessions · DOC-CEO-SCHEDULE-AUTHORITY
- **§12 V19 report every command** · `feedback_mandatory_v12_emission`
- **Pre-fire §0.5 IT deep-dive** mandatory per BINDING #30 (2026-05-13)
- **Push-back authors replacement** per DOC-PUSHBACK-WITH-REPLACEMENT (9/5 SUSTAINED)
- **Audit-first wire** before any code-write per BINDING #17 (27x sustained)
- **Drift catch** every cyl per BINDING #28 (25x sustained)

---

## SMALLEST CONTEXT RULE

Don't waste tokens loading what isn't needed. Per CodeBurn lesson (81-skill metadata-budget hit · Round 1 prior) and Sean Facer ideas ref #19 "monthly audit · delete what you don't use."

### Load-order priority
1. **Identity layer** · `~/.claude/identity/me.md` (CEO voice · always-loaded)
2. **CLAUDE.md** · 28 (or 29) BINDING canonical (auto-import)
3. **WORLD_CLASS_STANDARDS.md** · 7 pillars + 12 effects + tokens (auto-import)
4. **AGENTS.md** · this file · engineering principles (auto-import)
5. **Active skill** · per current task (lazy-load)
6. **Memory MEMORY.md** · session context (auto-load)

### Skip
- Skill metadata for skills not in scope
- Memory topic files for projects not active
- Audit docs unless cited in current cyl
- Plugin tools when not invoked

### Audit cadence
- Weekly · cyclic per Flag Registry CY-2 (graphify cost.json review)
- Monthly · per Sean Facer pattern (delete unused skills)
- Per-cyl · §0.5 IT verify deep-dive (BINDING #30)

---

## LEARN SECTION (corrections → permanent rules)

Every empirical correction becomes a doctrine candidate · ratifies after N clean applications · graduates to BINDING in DOCTRINE_LEDGER. This section captures lived lessons per CEO ideas ref #2 "9 months of client deployments · every mistake logged."

### Recent ratifications (2026-04 → 2026-05)
| Date | Lesson | Ratified to |
|---|---|---|
| 2026-04-30 | Per-agent worktree isolation prevents git index races | BINDING #20 |
| 2026-05-06 | Multi-component chain grounding catches cross-component bugs pre-edit | BINDING #22 |
| 2026-05-07 | MCP introspection FIRST before noop-wake/disconnect | BINDING #23 |
| 2026-05-07 | Vercel plan-limit validation in §0 grounding | BINDING #24 |
| 2026-05-08 | $20/month Vercel budget cap · pause-on-overage | BINDING #25 |
| 2026-05-09 | Audit-doc drift catch · 10/5+ sustained | BINDING #28 |
| 2026-05-09 | Pre-fire upstream probe (5/5) | BINDING #29 |
| **2026-05-13** | **IT must re-verify §0 Devin findings BEFORE FIX 1** | **BINDING #30** |

### Tracking candidates (close to ratification)
- DOC-PUSHBACK-WITH-REPLACEMENT (9/5 SUSTAINED · ratify-ready)
- DOC-IT-AGENT-PROMPT-COMPACT (12+/5 cumulative)
- DOC-VERCEL-BUDGET-CAP-20 (8+/5)

### Permanent rule writing protocol
1. Empirical surprise → flag as candidate in Flag Registry
2. Re-surface in N≥3 cylinders (cumulative cite count)
3. Ratifies to BINDING on Devin §12 + CEO + MC trio review
4. Appended to `docs/DOCTRINE_LEDGER.md` via append cyl (R25 P4/P7 + R28 P5 pattern)
5. Inherits to V19 template + AGENTS.md learn section update
6. Sylvia Phase B inherits doctrine via `sylvia-data/identity/me.md` mirror

---

## WORKSPACE ORGANIZATION

Cross-link `~/.claude/identity/vault-map.md` (R28 P2 trio) for full vault structure. Repo layer below.

### Repo · `/Users/ryanhallee/legacy-loop-mvp/`
- `app/` · Next.js 16 routes + components (`ItemDashboardPanels.tsx` 9000+ LOC LOCKED)
- `lib/` · TypeScript modules · `sylvia/*` + `bots/*` + `adapters/*` + many LOCKED
- `prisma/schema.prisma` · 53 models · LOCKED (migration approval required)
- `docs/` · 26+ audit docs · `DOCTRINE_LEDGER.md` canon · `runbooks/` · `specs/` · `audits/` · `skills/`
- `scripts/` · launchctl daemon installers + worktree helpers + agent-ship.sh
- `graphify-out/` · gitignored · auto-managed by R27 P1 hook

### Per-agent worktrees (BINDING #20)
- `legacy-loop-mvp-agent-1/` · slot
- `legacy-loop-mvp-agent-2/` · slot
- `legacy-loop-mvp-agent-3/` · slot
- Each has own `.git/index` · prevents race per BINDING #12

### Daemon QUARTET (launchctl · main worktree)
- `com.legacyloop.ollama` · local LLM
- `com.legacyloop.litellm` · Gateway PID 1930 listening :8000
- `com.legacyloop.openwebui` · UI (TRIO drift caught R4 · restore banked per CEO D21)
- `com.legacyloop.stayawake` · prevents sleep mid-cyl

### Doctrine doc tree
- CLAUDE.md → @-imports WORLD_CLASS_STANDARDS.md + AGENTS.md (this)
- AGENTS.md cross-links `~/.claude/identity/` trio · `docs/DOCTRINE_LEDGER.md`

---

## PLATFORM FORMATTING (per-target conventions)

Output shape differs per platform · Slack ≠ commit ≠ §12 ≠ chat.

### Slack `#all-legacyloop` (channel `C08S7BGQABH`)
- STATUS reports only · never directives · never agent-addressed
- CMD-style block format per V19 PART F
- Markdown mrkdwn syntax (bold `*` not `**` · italic `_`)
- Time discipline · relative markers (no fabricated wall-clock)
- Banned words: "genuinely" · "honestly" · "straightforward"

### Git commits
- Format: `CMD-[NAME] V19 [tier] [section] · <description>`
- Cite BINDING numbers applied · `dpl_<id>` if Vercel · curl 200 if production
- HEREDOC commit messages (multi-line · structured)
- Never `--amend` (V19 workflow #9 STOP discipline)

### §12 V19 reports
- Verbatim canonical box per V19 PART D
- BEFORE/AFTER · FIX-by-FIX · LOCKED untouched · DOCTRINE self-audit · FLAGS routing · COMMIT
- §0.5 IT DEEP-DIVE CONFIRMATION sub-section mandatory per BINDING #30 (post 2026-05-13)
- ASCII box format · pipe-padded · 53-char width

### Chat (CEO ↔ Devin / MC)
- Caveman mode active (current session)
- Bottom-line first · tables/bullets over prose
- Drop articles · fragments OK · short synonyms
- Technical exact (code · commits · errors verbatim)

### Codebase comments
- Comment the WHY · not the WHAT
- `// TODO(ryan):` · `// HACK:` for temporary
- JSDoc on exported functions used cross-file

---

# END OF APPENDIX · R28 P7 6-section playbook · 2026-05-13
