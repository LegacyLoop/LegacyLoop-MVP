# LEGACYLOOP MVP — CLAUDE CODE LAW
# Read every session. Doctrine + gotchas only. Reference is in docs/CLAUDE_HISTORY.md.

@WORLD_CLASS_STANDARDS.md
@AGENTS.md

## WHO WE ARE

LegacyLoop is an AI-powered resale automation platform. Mission: "Connecting Generations" (never alter spelling/case). Legacy-Loop Tech LLC · EIN 42-1834363. App: app.legacy-loop.com · Landing: legacy-loop.com. Founder Ryan Hallee = sole decision-maker + final QA. Standard: Awwwards-level / $1B product. Reference benchmarks: Linear · Stripe · Perplexity · Tesla · Apple · Manus (full set in `WORLD_CLASS_STANDARDS.md` §7).

## TEAM ROLES

- **Ryan (Boss)** — vision · final QA · all decisions
- **Mission Control (MC · strategy)** — V19 commands · Slack · flags · NO code
- **Sylvia (Cowork)** — deep dives · drafts · docs · brand · investor ops
- **Devin (Spec authoring)** — V19 paste-pointers · audit-first chain-grounding
- **Claude Code (IT)** — reads command · builds · returns §12. tsc=0 + build PASS before EVERY commit
- **Jarvis** — business ops · marketing · n8n

All agents post every step to Slack #all-legacyloop. Slack = source of truth.

## NON-NEGOTIABLE PROCESS RULES

1. **DIAGNOSTIC BEFORE EVERY BUILD.** Read exact files before editing. Never assume.
2. **READ BEFORE EDIT.** Before modifying ANY file, read it. Before modifying a function, grep all callers. Research before edit.
3. **`tsc --noEmit` BEFORE AND AFTER every change.** Must be 0 errors.
4. **`npm run build` PASS before any commit.** Build = `prisma generate && next build`.
5. **§12 V19 REPORT every command.** Auto-emit regardless of outcome (PASS/FAIL/HALT/PRE-STAGE).
6. **PRESERVE what works.** Fix only what is broken. Upgrade · never rewrite.
7. **One focused scope per command.** Found a bug outside scope? Log in FLAGS · don't fix.
8. **CREATIVE LATITUDE.** MAY: improve beyond spec · flag gaps · add error handling. MAY NOT: touch locked files · change AI prompts · use Tailwind/className · add packages without approval · change schema without approval.
9. **"Never assume. Never guess. Read first. Build second."**
10. **Polish-mode only.** Additive · audit-first · single cylinder per ship · zero scope creep.

## LOCKED FILES — surgical unlock per command

```
lib/adapters/{ai,auth,storage,multi-ai,pricing,rainforest}.ts
lib/{antique-detect,collectible-detect,credits,billing,db,bot-mode}.ts
lib/megabot/{run-specialized,prompts}.ts (prompts.ts ADD-ONLY)
lib/shipping/* | All app/api/shipping/* routes
lib/billing/{pro-rate,commission}.ts
lib/constants/pricing.ts | lib/pricing/{constants,market-data}.ts
lib/offers/{negotiate,expiry,magic-link}.ts
lib/market-intelligence/aggregator.ts | All scraper adapters
lib/bots/{sequencer,accuracy,demand-score,disagreement}.ts
lib/enrichment/{index,item-context}.ts
app/components/{AppNav,UploadModal,ThemeProvider,Footer}.tsx
app/components/ItemDashboardPanels.tsx (9000+ lines · surgical unlock)
app/{globals.css,layout.tsx} | All app/api/auth/* routes
prisma/schema.prisma (migration must be approved)
public/images/logos/* — NEVER modify
```

## DESIGN SYSTEM GOTCHAS — non-derivable pain

WCS holds the full token reference. These specific gotchas are LegacyLoop pain that cost rebuilds:

- **All styles inline `style={{}}` only.** ZERO Tailwind. ZERO `className` for styling. (Exception: CSS @keyframes + media queries in globals.css.)
- **`gridTemplateColumns` MUST use `minmax(0, 1fr)` — not plain `1fr`.** Plain `1fr` = `minmax(auto, 1fr)` = mobile clipping. Cost: 7 failed fix attempts.
- **Flex parents of overflow-x children MUST have `minWidth: 0`.** iOS/Safari shrink contract gotcha. Cost: 8 failed fix attempts.
- **Brand teal: `var(--accent)` = `#00BCD4`. NEVER `#0f766e`.**
- **Always-dark panels (modals/bot consoles): `#e2e8f0` text, `rgba(255,255,255,0.05)` bg — hardcode · don't use vars.**
- **CollectiblesBot = gold standard for bot panel design. PriceBot is NOT.**
- **BottomNav visible <1024px · hidden ≥1024px. Touch targets 44px min. Body never below 13px.**
- **Logo files at `/public/images/logos/` — UNTOUCHABLE.** Ryan handles in Adobe Illustrator.

## AUTHENTICATION GOTCHA

**Custom JWT — NOT NextAuth, NOT Auth.js.** `lib/adapters/auth.ts` exposes `getSession()`. Per-route auth check (no `middleware.ts`). Test account: `annalyse07@gmail.com / LegacyLoop123!`. Full surface in `docs/CLAUDE_HISTORY.md` §AUTH_SURFACE.

## F1 ENGINE DOCTRINE — bot capability upgrades

Bot capability upgrades are **additive skill packs · NEVER inline prompt text** in route files.

- **Static policy → skill pack** at `lib/bots/skills/[bot]/NN-name.md`. NEVER hardcoded in routes.
- **Dynamic context → route's `sellerContext` string** (per-item interpolation only).
- **Version tags in CMD names:** `CMD-PRICEBOT-V11-X` not `CMD-CROSS-CUTTING-X`. Cross-cutting hides version bumps.
- **Scoreboard update mandatory** in `memory/project_bot_v12_roadmap.md` + `memory/MEMORY.md`. Silent capability adds = F1 audit failure.
- **One cylinder at a time.** Cross-cutting commits touching 5+ bot routes violate.

History: Apr 18 2026 · CMD-SALE-METHOD-SYSTEMIC-RESPECT added inline LOCAL_PICKUP discipline directly to PriceBot/ListBot/AnalyzeBot routes without skill packs. CMD-BOT-ENGINE-CANONIZE-SALE-METHOD restored doctrine. Rule prevents that violation class permanently.

## MULTI-AGENT WORKTREE PATTERN

Parallel IT execution uses **per-agent git worktrees** · each terminal has its own `.git/index`. Eliminates shared-index race window (incidents R11 ca0bbd7 + R12 20bf67a/e4cafdf/dd7aa96).

- `/Users/ryanhallee/legacy-loop-mvp/` — main worktree (Devin L1 + L3)
- `/Users/ryanhallee/legacy-loop-mvp-agent-{1,2,3}/` — IT slots
- Helpers: `scripts/{worktree-setup,worktree-reset,agent-ship}.sh`
- Workflow: Devin verifies parallel-safety → CEO opens N terminals (cd to slot) → IT commits to slot branch → `bash scripts/agent-ship.sh` runs FF-push to main · NEVER force-push → §12 cites Vercel `dpl_<id>` READY + curl 200.
- Daemon QUARTET stays anchored to main worktree. Per-worktree dev.db · symlinked `.env.local` (single secret SOT) · APFS-cloned node_modules.
- Full reference: `docs/MULTI_AGENT_WORKTREE.md`.

## DOCTRINE BINDINGS — gotchas worth blood

Full ledger at `docs/DOCTRINE_LEDGER.md`. Top BINDINGS to honor every command:

- **#5 DOC-BAN-ENV-FILE-DUMP.** Never `cat`/`tail`/`head` `.env*`. Read via `grep -cE` (count-only) or `node --env-file=.env`. Token-leak prevention.
- **#1 DOC-BAN-BASH-X.** Never `set -x` or `bash -x` near tokens.
- **#6 DOC-DEV-PROD-DB-ISOLATION.** `prisma db push` works only against `dev.db`. For Turso prod use `@libsql/client` + `.env` token via `node --env-file=.env script.mjs` (R22.5 OP-B canonical).
- **#10 DOC-TELEMETRY-LOCK.** Single chokepoint preserved. AI calls go through `lib/sylvia/triage-router.ts` or LiteLLM gateway. NO direct AI provider HTTP from bots.
- **#12 DOC-MULTI-AGENT-INDEX-ISOLATION.** Before any scoped `git add`, run `git diff --cached --stat`. Detect cross-agent pre-staged files. `git restore --staged <foreign>` BEFORE adding own scope.
- **#16 DOC-DELEGATE-TO-CANONICAL.** Clone canonical patterns verbatim · do NOT reinvent abstractions.
- **#17 DOC-AUDIT-FIRST-WIRE-PATTERN.** Read the actual file/substrate before any code-write action. No "imagined" file contents.
- **#21 DOC-VERIFY-VERCEL-AFTER-COMMIT.** local tsc=0 ≠ deployed. Cite `dpl_<id>` READY + curl 200 in every §12 claiming production work landed.
- **#25 DOC-VERCEL-BUDGET-CAP-20.** Sylvia spend isolated · daily $20 cap matches LegacyLoop production cap. Per-question $0.50 default.

## COMMIT STANDARDS

- Format: `CMD-[NAME]: <concise description>`
- Push immediately after commit · never leave uncommitted changes
- Cite commit hash + Vercel dpl_id in every §12
- **Never force-push to main** · never commit `.env*` or any secrets

## V19 SPEC + §12 REPORT FORMAT

Devin authors V19 specs (§0 grounding through §12 emission shell). IT executes + emits §12 with: BEFORE/AFTER tsc + build state · PART A read confirmation · FIX 1-N status · FILES MODIFIED/CREATED/DELETED · LOCKED files UNTOUCHED · SCHEMA/PACKAGE/ENV changes · FLAGS (gaps · risks · carry-forward · suggestions) · COMMIT hash + Vercel `dpl_<id>` + curl status.

**Full V19 template** (verbose · §10 command block · §11 acceptance test · §12 report shell): `docs/CLAUDE_HISTORY.md` §V19_TEMPLATE.

## DEEPER DOCS — read on demand · NOT loaded per call

- **`WORLD_CLASS_STANDARDS.md`** — design tokens · 7 pillars · 12 effects · 18 benchmarks (auto @-imported)
- **`AGENTS.md`** — engineering patterns shared across repos (auto @-imported)
- **`docs/CLAUDE_HISTORY.md`** — full schema list · API directory tree · component inventory · env vars · scaling notes · V19 template verbose
- **`docs/DOCTRINE_LEDGER.md`** — all 32 BINDING doctrines + candidates (#27 reserved for R25 P3 CRYPTO-CTC pending · #32 reserved for DOC-HARDWARE-CAPABILITY-VERIFY 3/5 progressing · #31 ratified 2026-05-14 DOC-PUSHBACK-WITH-REPLACEMENT · #33 ratified 2026-05-14 DOC-FLAG-RIDER-PER-CYLINDER · #34 ratified 2026-05-14 DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY)
- **`docs/MULTI_AGENT_WORKTREE.md`** — worktree topology + helper script reference
- **`docs/sylvia/{SYLVIA_FOLDER_ARCHITECTURE,SYLVIA_API_CONTRACT,SYLVIA_MIGRATION_PLAN}.md`** — Sylvia substrate canon
- **`prisma/schema.prisma`** — 53 models (canonical · always read for data layer questions)
- **`app/components/`, `app/api/`, `app/`, `lib/`** — paths Claude reads via `ls`/`grep` (no need to enumerate here)

# END OF CLAUDE.md — V19 LAW · Doctrine + gotchas only · ~150 lines.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## long-running-agentic-pattern

This project uses a long-running agentic pattern for cascades >2hrs OR >5 sub-cylinders (per docs/skills/LONG_RUNNING_AGENTIC_PATTERN.md).

Rules:
- Use plan mode (`--permission-mode plan`) for northstar formulation BEFORE any execution
- Use PAUL `paul:plan` + `paul:apply` + `paul:resume` for structured execution
- Cap LLM spend per session via `--max-budget-usd $20` (BINDING #25)
- Emit §12 V19 at every sub-cylinder close
- CEO authors northstar · Devin verifies feasibility · IT cascades · CEO confirms end-state

`/goal` is NOT a built-in Claude Code command (per Devin §0 2026-05-13 push-back · CEO ref #26 corrected). Use the documented pattern instead.
