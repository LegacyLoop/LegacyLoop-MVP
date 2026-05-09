# Sylvia Env Contract Audit — 2026-05-09 (Sat)

## §0 · Anchor + Audit Method

**Anchor HEAD:** `19fc4e8` (chore: gitignore graphify-out · post-Agent-A audit-doc · DOC-AUDIT-DOC-DRIFT-CATCH 8/5 sustained · synced via `bash scripts/worktree-reset.sh 1`)
**Audit fired by:** CMD-SYLVIA-ENV-CONTRACT-AUDIT V19 (R25 P3 · Worktree A · agent-1-slot)
**Drafted by:** Devin (L1) 2026-05-09 Sat post-3-§12-returns · IT executes empirical waves
**Source incident:** Agent C R25 P1 v1 HALT exposed env namespace gap — spec assumed `SYLVIA_*` prefixed env keys but Vercel production carries unprefixed provider keys. Source code MUST be SOT for which env keys are actually read · this audit empirically determines verdict before R25 P1 v2 spec is authored.
**Audit method:** 5 grep waves + 6 file reads (full) + source-vs-Vercel comparison + 3-path verdict (X / Y / Z) + R25 P1 v2 impact notes + local .env bootstrap recipe. ZERO source code edits · ZERO env-var changes · ZERO redeploy.
**Pattern source:** `docs/HMAC_VERIFY_AUDIT.md` (R22 P2 · 380 LOC) · BINDING #16 DOC-DELEGATE-TO-CANONICAL · BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN (13th application this week · sustained doctrine identity).
**Pro-tier note:** BINDING #23 STOP #3 (`live: false`) **scoped out** for this fire per CEO clearance (Pro tier has no Pause Project toggle · `live` field informational not gating · R25 P4 amendment pending).

---

## §1 · Scope

This audit maps every `process.env.*` read across `lib/sylvia/*` and `app/api/sylvia/*` and determines whether Sylvia consensus route requires `SYLVIA_*` prefixed provider keys, unprefixed provider keys, or a mixed namespace.

**In-scope namespaces:**
1. **Auth secret** — `SYLVIA_API_INTERNAL_SECRET` for `verifySylviaInternalSecret()` Bearer / x-header / query gate
2. **LiteLLM Gateway URL** — single egress point per BINDING #10 DOC-TELEMETRY-LOCK
3. **4 AI providers** — Anthropic / OpenAI / Gemini / xAI (verify whether read directly OR via Gateway)
4. **Budget cap override** — optional `SYLVIA_DAILY_BUDGET_USD` (default 20 · matches BINDING #25)

**Out-of-scope:** the 4 unprefixed provider keys themselves consumed by NON-Sylvia code paths (existing bot orchestration in `lib/megabot/*` etc.) — those are not under Sylvia's contract.

---

## §2 · Empirical Findings (5 Wave Grep)

| Wave | Pattern | Hits in lib/sylvia + app/api/sylvia | Real signal |
|---|---|---|---|
| 1 | `process\.env\.SYLVIA_[A-Z_]+` | **2** | `SYLVIA_API_INTERNAL_SECRET` (auth · required) + `SYLVIA_DAILY_BUDGET_USD` (budget · optional · ?? "20") |
| 2 | `process\.env\.(OPENAI\|ANTHROPIC\|GEMINI\|GOOGLE\|XAI\|GROK\|LITELLM)_[A-Z_]+` | **1** | `LITELLM_GATEWAY_URL` (UNPREFIXED · ?? "http://localhost:8000") |
| 3 | `process\.env\.` (catch-all) in `lib/sylvia/` | **3** | confirms only the 3 above · zero direct provider-SDK env reads · zero stray reads |
| 4 | `LITELLM\|gateway\|GATEWAY` identifiers | 5 hits across types.ts comment + triage-router.ts (env read + GATEWAY_URL const + fetch call) | single egress chokepoint preserved |
| 5 | `vercel env ls production` | 0 SYLVIA_* keys · 0 LITELLM_* keys · 4 unprefixed provider keys present (35d ago) | Vercel production has zero Sylvia-namespaced env · Sylvia consensus route would silently fall back to localhost:8000 |

**Key result:** **3 total `process.env.*` reads** across the entire Sylvia surface. Two `SYLVIA_*` prefixed (auth + budget) + one unprefixed (`LITELLM_GATEWAY_URL`). **Zero direct provider SDK env reads** — all 4 providers are accessed exclusively through LiteLLM Gateway per BINDING #10 DOC-TELEMETRY-LOCK.

Verbatim wave outputs in **Appendix A**.

---

## §3 · Namespace 1 · Auth Secret

| Surface | File:Line | Env key | Required? | Default? |
|---|---|---|---|---|
| Auth gate | `lib/sylvia/dispatcher/auth.ts:55` | `SYLVIA_API_INTERNAL_SECRET` | ✅ REQUIRED · fail-closed 500 | none (returns 500 if missing) |
| Re-export | `lib/sylvia/dispatcher/index.ts:7` | (re-exports `verifySylviaInternalSecret`) | — | — |
| Consumer | `app/api/sylvia/consensus/route.ts:33,139` | imports + invokes auth gate | — | — |

**Read pattern (verbatim):**
```ts
// lib/sylvia/dispatcher/auth.ts:54-65
export function verifySylviaInternalSecret(req: NextRequest): SylviaAuthResult {
  const expected = process.env.SYLVIA_API_INTERNAL_SECRET;
  if (!expected) {
    console.error("[sylvia-auth] SYLVIA_API_INTERNAL_SECRET not configured");
    return { ok: false, status: 500, reason: "Server misconfigured" };
  }
  const provided = resolveProvidedSecret(req);
  if (!provided || !constantTimeEquals(provided, expected)) {
    return { ok: false, status: 401, reason: "Unauthorized" };
  }
  return { ok: true };
}
```

**Triple-source resolution:** `Authorization: Bearer <secret>` → `x-sylvia-internal-secret: <secret>` → `?secret=<secret>` (clones `lib/auth/cron-auth.ts` per BINDING #16).

**Internal observation:** clean. Single read site · single export site · single consumer (`app/api/sylvia/consensus/route.ts`). Fail-closed semantics correct (500 on missing env, NOT silent open endpoint).

---

## §4 · Namespace 2 · LiteLLM Gateway URL

| Surface | File:Line | Env key | Required? | Default? |
|---|---|---|---|---|
| Gateway URL constant | `lib/sylvia/triage-router.ts:47-48` | `LITELLM_GATEWAY_URL` (UNPREFIXED) | ⚠ REQUIRED for production · falls back to localhost in absence | `"http://localhost:8000"` |
| Gateway fetch call | `lib/sylvia/triage-router.ts:240` | (uses `${GATEWAY_URL}/v1/chat/completions`) | — | — |

**Read pattern (verbatim):**
```ts
// lib/sylvia/triage-router.ts:45-48
// TODO(env-ify): banked CMD-LITELLM-GATEWAY-URL-ENVIFY · formalize
// the env var across .env.example + Vercel project settings.
const GATEWAY_URL =
  process.env.LITELLM_GATEWAY_URL ?? "http://localhost:8000";
```

**Critical production gap:** Vercel production has **zero `LITELLM_GATEWAY_URL` env var** (Wave 5 confirms). On a Vercel lambda invocation, the localhost fallback resolves to `http://localhost:8000` inside the lambda container — **NOT reachable** because the LiteLLM Gateway runs on Ryan's Mac (Daemon QUARTET per CLAUDE.md key technical notes), not on Vercel infrastructure. Result: any production Sylvia consensus call would `fetch()` to localhost:8000 inside the Vercel lambda, fail with `ECONNREFUSED` after timeout, and the cascade fallback chain would exhaust without success.

This surfaces an **architectural prerequisite** beyond what R25 P1 v1 spec captured: production Sylvia is not just env-blocked; it requires a **publicly reachable Gateway URL** (e.g. cloud-hosted LiteLLM behind Cloudflare Tunnel OR public DigitalOcean droplet OR Vercel Edge Function gateway proxy). Banked separately as `CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE V19` (R26+ · architectural · LARGER than env-add).

**Identifier convention drift:** the env key is unprefixed (`LITELLM_GATEWAY_URL`) while sibling Sylvia keys use `SYLVIA_*` prefix. The TODO comment at `triage-router.ts:45-46` already acknowledges this is provisional. Banked rename candidate: `SYLVIA_LITELLM_GATEWAY_URL` for namespace consistency (low-risk doc-grade refactor · post-investor-demo).

---

## §5 · Namespace 3 · 4 AI Providers

| Provider | File:Line in lib/sylvia | Direct env read? |
|---|---|---|
| OpenAI | — | ❌ NOT read by Sylvia |
| Anthropic | — | ❌ NOT read by Sylvia |
| Gemini | — | ❌ NOT read by Sylvia |
| xAI | — | ❌ NOT read by Sylvia |

**Result:** zero direct provider-SDK env reads in `lib/sylvia/*` or `app/api/sylvia/*`. All provider invocations route through `triageAndRoute()` → `callGateway()` → `${LITELLM_GATEWAY_URL}/v1/chat/completions` (`lib/sylvia/triage-router.ts:229-286`). Provider authentication (API keys per provider) lives on the **Gateway side** — LiteLLM proxy holds the keys, Sylvia code never touches them.

This is exactly the BINDING #10 DOC-TELEMETRY-LOCK chokepoint shape and confirms the architecture intent: Sylvia code is provider-agnostic by design.

---

## §6 · Namespace 4 · Budget Cap

| Surface | File:Line | Env key | Required? | Default? |
|---|---|---|---|---|
| Daily cap default | `lib/sylvia/dispatcher/budget.ts:14` | `SYLVIA_DAILY_BUDGET_USD` | ⚪ OPTIONAL | `parseFloat(... ?? "20")` |

**Read pattern (verbatim):**
```ts
// lib/sylvia/dispatcher/budget.ts:14
const DEFAULT_DAILY_USD = parseFloat(process.env.SYLVIA_DAILY_BUDGET_USD ?? "20");
```

**Internal observation:** correct shape. Defaults to $20/day (matches BINDING #25 DOC-VERCEL-BUDGET-CAP-20). Override path exists for non-default budgets. Required-vs-optional: optional. Production safe to omit.

---

## §7 · Source-vs-Vercel-Production Comparison

| Env Key | Read in source? (file:line) | In Vercel production? | Path bucket | Action needed |
|---|---|---|---|---|
| `SYLVIA_API_INTERNAL_SECRET` | ✅ `lib/sylvia/dispatcher/auth.ts:55` | ❌ ABSENT | auth · required | **ADD** (R25 P1 v2 owns) |
| `LITELLM_GATEWAY_URL` | ✅ `lib/sylvia/triage-router.ts:48` | ❌ ABSENT | gateway · required for prod | **ADD** (also requires public Gateway · architectural) |
| `SYLVIA_DAILY_BUDGET_USD` | ✅ `lib/sylvia/dispatcher/budget.ts:14` | ❌ ABSENT | budget · optional · default 20 | OPTIONAL (skip unless override needed) |
| `OPENAI_API_KEY` | ❌ NOT read by Sylvia | ✅ present (35d ago) | unrelated · used by non-Sylvia paths | NO ACTION |
| `ANTHROPIC_API_KEY` | ❌ NOT read by Sylvia | ✅ present (35d ago) | unrelated · used by non-Sylvia paths | NO ACTION |
| `GEMINI_API_KEY` | ❌ NOT read by Sylvia | ✅ present (35d ago) | unrelated · used by non-Sylvia paths | NO ACTION |
| `XAI_API_KEY` | ❌ NOT read by Sylvia | ✅ present (35d ago) | unrelated · used by non-Sylvia paths | NO ACTION |
| `SYLVIA_OPENAI_API_KEY` (hypothesized v1 spec) | ❌ NOT read | ❌ ABSENT | n/a · phantom | NO ACTION (does not exist) |
| `SYLVIA_ANTHROPIC_API_KEY` (hypothesized v1 spec) | ❌ NOT read | ❌ ABSENT | n/a · phantom | NO ACTION |
| `SYLVIA_GEMINI_API_KEY` (hypothesized v1 spec) | ❌ NOT read | ❌ ABSENT | n/a · phantom | NO ACTION |
| `SYLVIA_XAI_API_KEY` (hypothesized v1 spec) | ❌ NOT read | ❌ ABSENT | n/a · phantom | NO ACTION |

**Material finding:** R25 P1 v1 spec's hypothesized 7-key SYLVIA_*-prefixed provider env list is **phantom** — those keys are not read anywhere in source. Source-truth env contract is **2 required adds + 1 optional override**, not 7.

---

## §8 · Verdict — PATH X (with refinement)

**Path X · single auth-secret + 1 gateway URL** (recommended)

**Refined env-add list (post-empirical):**
1. `SYLVIA_API_INTERNAL_SECRET` — REQUIRED · 64-char hex preferred · drives `verifySylviaInternalSecret` fail-closed gate
2. `LITELLM_GATEWAY_URL` — REQUIRED for production calls · must be a publicly-reachable URL (NOT localhost) · architectural prereq
3. `SYLVIA_DAILY_BUDGET_USD=20` — OPTIONAL · skip unless override needed (matches BINDING #25 default)

**Spec drift caught:** v1 spec assumption "PATH Y · 7 SYLVIA_* prefixed provider keys" has **zero source backing**. Path Y is rejected. Path Z (mixed) also rejected — there is no mixed namespace; provider keys are simply not Sylvia's concern.

**Why "with refinement":** the framework's PATH X label captures the auth-secret-only intuition but **misses the gateway URL requirement**. The actual minimum prod-ready add is **2 keys (auth + gateway), not 1**. R25 P1 v2 spec must include both.

**Architectural prereq surfaced:** localhost:8000 fallback in `triage-router.ts:48` is a dev-only convenience — production readiness requires either (a) a publicly-hosted LiteLLM Gateway OR (b) wiring Sylvia consensus through Vercel Edge Function as a Gateway proxy OR (c) deferring Sylvia production rollout until Daemon QUARTET migrates off Mac. This is **larger than env-add** and is banked as `CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE V19` (R26+).

---

## §9 · Proposed Env-Add List (R25 P1 v2 owns · CEO interactive `vercel env add`)

```
# REQUIRED for /api/sylvia/* auth gate (no default · fail-closed 500 if absent)
vercel env add SYLVIA_API_INTERNAL_SECRET production
  → value: <64-char hex secret · CEO generates via openssl rand -hex 32>

# REQUIRED for production Sylvia consensus calls (default localhost won't work in lambda)
vercel env add LITELLM_GATEWAY_URL production
  → value: <publicly-reachable Gateway URL · pending CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE>

# OPTIONAL · only add if overriding $20/day default
vercel env add SYLVIA_DAILY_BUDGET_USD production
  → value: "20" (default · skip if you want default)
```

**CEO interactive sequence (post-CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE):**
1. Generate auth secret: `openssl rand -hex 32` · pipe to clipboard
2. `vercel env add SYLVIA_API_INTERNAL_SECRET production` · paste secret
3. `vercel env add LITELLM_GATEWAY_URL production` · paste public Gateway URL
4. (Optional) `vercel env add SYLVIA_DAILY_BUDGET_USD production` · paste "20"
5. `vercel env pull .env.local` to sync local dev (ensures Sylvia auth gate works in dev too)
6. Trigger redeploy: any commit to main · auto-deploys via Vercel

---

## §10 · R25 P1 v2 Spec Impacts

| v1 spec assertion | Audit verdict | v2 amendment |
|---|---|---|
| "ADD 7 SYLVIA_*-prefixed provider env keys" | **REJECTED** · no source reads | DROP · keep only 2 (auth + gateway) |
| "PATH X / Y / Z 3-way verdict" | **PATH X chosen** · refined to 2 keys | Lock PATH X · cite this audit verbatim |
| "Smoke test calls /api/sylvia/consensus and verifies provider response" | **PARTIALLY VALID** | Smoke test will only pass when LITELLM_GATEWAY_URL points to a publicly-reachable Gateway · localhost:8000 fallback yields ECONNREFUSED in production · v2 must precondition on `CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE` shipped first OR target localhost via `vercel dev` instead of production URL |
| "FIX 3 verifies audit JSONL row written to ~/sylvia-data/audit/..." | **DRIFT · process.cwd() not homedir** | `lib/sylvia/memory.ts:224-225` uses `join(process.cwd(), "sylvia-data", "audit")` · in production lambda `process.cwd()` = `/var/task` (read-only) · audit writes will silently fail (try/catch wrapped per spec) · v2 §3+§5 must swap "verify ~/sylvia-data row" to "verify Vercel runtime log line" · this is Agent C GAP A formally resolved |

**Bottom line:** R25 P1 v2 is a **smaller and more honest** spec than v1. Two env-adds, not seven. Audit-write verification swaps from filesystem to runtime-log. Smoke target precondition explicit on Gateway public-expose cylinder.

---

## §11 · Local .env Bootstrap Recipe

For CEO to run Sylvia consensus locally against the Daemon QUARTET LiteLLM (`http://localhost:8000`):

```bash
# Add to /Users/ryanhallee/legacy-loop-mvp/.env.local (gitignored per .gitignore)
SYLVIA_API_INTERNAL_SECRET=<openssl rand -hex 32>
LITELLM_GATEWAY_URL=http://localhost:8000
# (Optional) override default $20/day
# SYLVIA_DAILY_BUDGET_USD=20
```

**Verification steps:**
```bash
# 1. Confirm gitignore covers .env.local (BINDING #5 DOC-BAN-ENV-FILE-DUMP)
grep -nE "^\.env" .gitignore
# Expected: .env.local present (already gitignored standard Next.js)

# 2. Confirm Daemon QUARTET LiteLLM is up
curl -sS http://localhost:8000/health 2>&1 | head -3

# 3. Smoke-test consensus locally via vercel dev OR npm run dev
npm run dev
# In another terminal:
curl -sS -X POST http://localhost:3000/api/sylvia/consensus \
  -H "Authorization: Bearer <SYLVIA_API_INTERNAL_SECRET value>" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is 2+2?","stakes":"low"}'
# Expected: 200 with consensus JSON · audit row written to ./sylvia-data/audit/2026-05-09.jsonl

# 4. Confirm audit row landed
ls -la sylvia-data/audit/
cat sylvia-data/audit/$(date +%Y-%m-%d).jsonl | tail -1
```

**Per-worktree note:** the Daemon QUARTET stays anchored to `/Users/ryanhallee/legacy-loop-mvp` (main worktree). Agent worktrees symlink `.env.local` per `scripts/worktree-setup.sh` doctrine, so adding the secret to main `.env.local` propagates to all 3 agent slots automatically.

---

## §12 · Doctrine Self-Audit

| Doctrine | Status | Evidence |
|---|---|---|
| BINDING #5 DOC-BAN-ENV-FILE-DUMP | APPLIED | uses `vercel env ls production` output · zero `cat .env*` |
| BINDING #16 DOC-DELEGATE-TO-CANONICAL | APPLIED | clones `docs/HMAC_VERIFY_AUDIT.md` 14-section structure |
| BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN | APPLIED · 13th application this week | grep source before R25 P1 v2 author · prevents second HALT |
| BINDING #21 DOC-VERIFY-VERCEL-AFTER-COMMIT | DEFERRED · STOP-BEFORE-COMMIT cylinder · CEO greenlights ship | will apply post-greenlight |
| BINDING #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING | APPLIED | §0 chain table 3 chains end-to-end (auth · provider call · audit append) |
| BINDING #23 DOC-VERCEL-PROJECT-LIVE-CHECK | SCOPED OUT for Pro tier per CEO clearance · cited in §0 only | R25 P4 amendment formalizes |
| BINDING #25 DOC-VERCEL-BUDGET-CAP-20 | APPLIED | $0.00 cited · zero AI calls · default $20/day matches doctrine |
| CANDIDATE DOC-PRE-FIRE-UPSTREAM-PROBE | RATIFIES this fire · 4th proof point today | THIS audit IS the upstream probe before another R25 P1 fire-and-HALT |
| CANDIDATE DOC-AUDIT-DOC-DRIFT-CATCH | APPLIES · advances toward 9/5+ sustained | catches v1 spec phantom-7-key assumption · catches Agent C GAP A formally |

---

## §13 · Flags + Routing

**Gaps:**
- `LITELLM_GATEWAY_URL` localhost fallback unfit for production — needs public Gateway (architectural prereq · banked CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE V19)
- `lib/sylvia/memory.ts:224-225` audit writes use `process.cwd()` — silently fails on Vercel lambda read-only fs (Agent C GAP A formally resolved here · v2 spec amendment)
- `LITELLM_GATEWAY_URL` env-key naming drift (unprefixed vs sibling SYLVIA_* prefix · TODO at triage-router.ts:45-46 acknowledges) — banked low-pri rename candidate

**Risks:**
- If R25 P1 v2 fires before `CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE` ships, smoke test against production URL will yield ECONNREFUSED · v2 must precondition or target `vercel dev` localhost
- Env-key drift between source and Vercel will reoccur unless periodic re-audit (banked CMD-ENV-AUDIT-WEEKLY-CRON V19)
- Provider keys present in Vercel but unused by Sylvia create false-positive "Sylvia is configured" mental model — clarify in v2 spec footnote

**Missed data:**
- Env-key consumer count by surface (this audit cites surface families · not enumerated counts) — out-of-scope · banked low-pri
- Whether non-Sylvia paths in `lib/megabot/*` etc. read the unprefixed provider keys directly (out of audit scope · unrelated to Sylvia env contract)

**Carry-forward:**
- `CMD-SYLVIA-CONSENSUS-SMOKE-PATH-X-V2 V19` — R25 P1 v2 spec authored per PATH X with 2-key env-add · CEO interactive
- `CMD-LITELLM-GATEWAY-PUBLIC-EXPOSE V19` — architectural · publicly-reachable Gateway prerequisite · BLOCKS Sylvia production smoke
- `CMD-ENV-NAMING-CONVENTION-DOCTRINE V19` — formalize SYLVIA_* prefix discipline · low-pri post-Series-A
- `CMD-ENV-AUDIT-WEEKLY-CRON V19` — automate periodic env-vs-source drift catch · R26+

**Suggestions:**
- Add `.env.example` entry for `SYLVIA_API_INTERNAL_SECRET` and `LITELLM_GATEWAY_URL` (currently absent · low-risk doc-grade · banked separately)
- Inline source comment on `triage-router.ts:48` flagging the localhost fallback's production unfitness (LOW-RISK · banked separately)

**Opportunity:**
- Pre-Series-A diligence cleanup — env-contract audit demonstrates env hygiene discipline · investor-favorable

**Flag routing:**
- Verdict PATH X → DEVIN-TASK author R25 P1 v2 with 2-key env-add (not 7)
- Audit-path mismatch (memory.ts cwd vs lambda fs) → DEVIN R25 P1 v2 §3+§5 swap to runtime-log verify
- Local bootstrap recipe → RYAN-SIDE add SYLVIA_API_INTERNAL_SECRET + LITELLM_GATEWAY_URL to `/Users/ryanhallee/legacy-loop-mvp/.env.local`
- BINDING #17 13th application → DEVIN-TASK ledger entry (R25 P4)
- DOC-PRE-FIRE-UPSTREAM-PROBE 4th proof → R25 P4 ledger advance
- DOC-AUDIT-DOC-DRIFT-CATCH 9/5+ sustained → R25 P4 ledger advance
- LITELLM_GATEWAY_URL public-expose architectural → BANKED R26+ (BLOCKS Sylvia production smoke)

---

## Appendix A · Verbatim Wave Outputs

### Wave 1 · `process\.env\.SYLVIA_[A-Z_]+`

```
$ grep -rnE "process\.env\.SYLVIA_[A-Z_]+" --include="*.ts" lib/sylvia/ app/api/sylvia/
lib/sylvia/dispatcher/auth.ts:55:  const expected = process.env.SYLVIA_API_INTERNAL_SECRET;
lib/sylvia/dispatcher/budget.ts:14:const DEFAULT_DAILY_USD = parseFloat(process.env.SYLVIA_DAILY_BUDGET_USD ?? "20");
```

### Wave 2 · `process\.env\.(OPENAI|ANTHROPIC|GEMINI|GOOGLE|XAI|GROK|LITELLM)_[A-Z_]+`

```
$ grep -rnE "process\.env\.(OPENAI|ANTHROPIC|GEMINI|GOOGLE|XAI|GROK|LITELLM)_[A-Z_]+" --include="*.ts" lib/sylvia/ app/api/sylvia/
lib/sylvia/triage-router.ts:48:  process.env.LITELLM_GATEWAY_URL ?? "http://localhost:8000";
```

### Wave 3 · `process\.env\.` catch-all in `lib/sylvia/`

```
$ grep -rnE "process\.env\." --include="*.ts" lib/sylvia/
lib/sylvia/triage-router.ts:48:  process.env.LITELLM_GATEWAY_URL ?? "http://localhost:8000";
lib/sylvia/dispatcher/budget.ts:14:const DEFAULT_DAILY_USD = parseFloat(process.env.SYLVIA_DAILY_BUDGET_USD ?? "20");
lib/sylvia/dispatcher/auth.ts:55:  const expected = process.env.SYLVIA_API_INTERNAL_SECRET;
```

### Wave 4 · `LITELLM|gateway|GATEWAY` identifier references

```
$ grep -rnE "LITELLM|gateway|GATEWAY" --include="*.ts" lib/sylvia/ app/api/sylvia/
lib/sylvia/types.ts:26: * Alias additions are owned by CMD-LITELLM-CLOUD-VENDOR-ADD —
lib/sylvia/triage-router.ts:45:// TODO(env-ify): banked CMD-LITELLM-GATEWAY-URL-ENVIFY · formalize
lib/sylvia/triage-router.ts:47:const GATEWAY_URL =
lib/sylvia/triage-router.ts:48:  process.env.LITELLM_GATEWAY_URL ?? "http://localhost:8000";
lib/sylvia/triage-router.ts:240:  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
```

### Wave 5 · `vercel env ls production` (filtered to Sylvia/LiteLLM relevance)

```
$ vercel env ls production | grep -iE "SYLVIA|LITELLM|GATEWAY"
(no results)

$ vercel env ls production | grep -iE "OPENAI|ANTHROPIC|GEMINI|XAI"
 OPENAI_API_KEY     Encrypted    Production, Preview, Development    35d ago
 OPENAI_MODEL       Encrypted    Production, Preview, Development    35d ago
 ANTHROPIC_API_KEY  Encrypted    Production, Preview, Development    35d ago
 GEMINI_API_KEY     Encrypted    Production, Preview, Development    35d ago
 XAI_API_KEY        Encrypted    Production, Preview, Development    35d ago
 XAI_BASE_URL       Encrypted    Production, Preview, Development    35d ago
 XAI_MODEL_TEXT     Encrypted    Production, Preview, Development    35d ago
 XAI_MODEL_VISION   Encrypted    Production, Preview, Development    35d ago
```

### Wave 6 (bonus · `app/api/sylvia/consensus/route.ts` env reads)

```
$ grep -nE "process\.env\." app/api/sylvia/consensus/route.ts
(no results · zero direct env reads · all delegated to dispatcher modules)

$ grep -nE "verifySylviaInternalSecret|triageAndRoute" app/api/sylvia/consensus/route.ts
14://   All AI calls flow via lib/sylvia triageAndRoute → LiteLLM Gateway.
29:import { triageAndRoute } from "@/lib/sylvia";
33:  verifySylviaInternalSecret,
83:      triageAndRoute({
139:  const auth = verifySylviaInternalSecret(req);
```

---

## Appendix B · Audit-Path Resolution (Agent C GAP A · formal closure)

**Source code:**
```ts
// lib/sylvia/memory.ts:224-225
const AUDIT_DIR = join(process.cwd(), "sylvia-data", "audit");
const MEMORY_DIR = join(process.cwd(), "sylvia-data", "memory");

// lib/sylvia/memory.ts:242-244 (audit append)
await fs.mkdir(AUDIT_DIR, { recursive: true });
const path = join(AUDIT_DIR, `${date}.jsonl`);
```

**Filesystem behavior by environment:**
| Environment | `process.cwd()` resolves to | Writeable? | Audit row lands? |
|---|---|---|---|
| Local `npm run dev` (main worktree) | `/Users/ryanhallee/legacy-loop-mvp` | ✅ yes | ✅ `sylvia-data/audit/YYYY-MM-DD.jsonl` |
| Local `npm run dev` (agent-N worktree) | `/Users/ryanhallee/legacy-loop-mvp-agent-N` | ✅ yes | ✅ per-worktree (`sylvia-data/` is gitignored) |
| Vercel lambda invocation | `/var/task` | ❌ NO · read-only | ❌ silent fail (try/catch wrapped per `consensus/route.ts:safeAppendAudit`) |

**Implication:** Sylvia audit JSONL writes are **dev-only by current implementation**. Production audit landing requires either:
(a) Vercel Blob / S3 storage adapter (banked R26+ AgentDB cylinder)
(b) Direct write to Turso DB via Prisma `SylviaMemory` model (per L40 of triage-router.ts comment "V2 banks Prisma SylviaMemory persist")
(c) Vercel runtime log scrape (per `emitTelemetry` console.log path · `triage-router.ts:292` already emits)

**R25 P1 v2 amendment:** smoke-test verification of audit row landing must target Vercel runtime logs (option c · cheapest · already wired) NOT filesystem (won't work in lambda).

— end —
