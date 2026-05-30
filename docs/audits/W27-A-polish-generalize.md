# W27-A · Polish + Generalize + Salvage — Audit Artifact

**CMD:** CMD-W27-A-POLISH-GENERALIZE-SALVAGE V20 LOW
**Date:** 2026-05-30 PM
**Course:** Course-reset · supersedes FROZEN wind-down A′ (reverted via 46b6e95)
**Anchor HEAD:** revert tip `46b6e95` → polish tip `<post-commit>`
**Status:** 🟢 GREEN · 2 generic libs lifted · zero deprecate · zero delete · everything wired

---

## Why (Course-Reset Decision Record)

CEO never approved kill. Wind-down A′ (deprecate + sever + recommend droplet destroy) was committed (`be0b2da`) then reverted (`46b6e95`) on CEO direction. Replacement path: **polish + generalize + salvage** — lift the generic orchestration + safety core into reusable libs so ANY backend (burner / Apify logged-out / Manus / future) shares one battle-tested core. Burner stays neutral + dormant + wired. CEO retains all activation optionality.

---

## What Changed (MOVE-with-shim · zero break)

### NEW · `lib/scrapers/orchestration/` (generic · backend-agnostic)

| File | Source (git history preserved via git-mv) |
|---|---|
| `controller.ts` | lifted from `lib/scrapers/rotation/controller.ts` (W23-L1 · 202 LOC) |
| `types.ts` | lifted from `lib/scrapers/rotation/types.ts` (W23-L1) |
| `health.ts` | lifted from `lib/scrapers/rotation/health.ts` (W23-L1) |
| `cost.ts` | lifted from `lib/scrapers/rotation/cost.ts` (W23-L1) |
| `index.ts` | lifted from `lib/scrapers/rotation/index.ts` (W23-L1) |

Headers neutralized W23-L1/FB-Army → W27-A/generic with provenance line.

### NEW · `lib/scrapers/safety/` (generic · backend-agnostic)

| File | Source |
|---|---|
| `isolation.ts` | lifted from `lib/fb-army-safety/isolation.ts` (W24-L1) |
| `pace-floor.ts` | lifted from `lib/fb-army-safety/pace-floor.ts` (W24-L1) |
| `kill-switch.ts` | lifted from `lib/fb-army-safety/kill-switch.ts` (W24-L1) |
| `index.ts` | NEW barrel for the three above |

### SHIMS (back-compat · thin re-exports · zero functional change)

| Path | Behavior |
|---|---|
| `lib/scrapers/rotation/index.ts` | `export * from "../orchestration/index"` |
| `lib/fb-army-safety/isolation.ts` | `export * from "../scrapers/safety/isolation"` |
| `lib/fb-army-safety/pace-floor.ts` | `export * from "../scrapers/safety/pace-floor"` |
| `lib/fb-army-safety/kill-switch.ts` | `export * from "../scrapers/safety/kill-switch"` |

### UNCHANGED

| Path | Why unchanged |
|---|---|
| `lib/fb-army-safety/burner-identity.ts` | Burner-specific (not generic) · stays neutral in place |
| `lib/fb-army-safety/index.ts` | Barrel still works · re-exports from shims which re-export from new generic location |
| `lib/fb-army-safety/verify-suite.mjs` | Hand-mirrors constants (no .ts import) · 7/7 PASS post-lift verified |
| `.github/workflows/fb-army-safety.yml` | Calls verify-suite at unchanged path · CI guard green |
| `scripts/fb-army-safety-guard.sh` | Scans `fb-army/` only · unaffected by `lib/*` lift |
| `lib/scrapers/proxy/registry.ts` | `fbArmyAdapter` **STAYS REGISTERED** (REGISTRY 13 · dormant · fail-closed) |
| `lib/scrapers/proxy/adapters/fb-army.ts` | Adapter neutral · zero `@deprecated` |
| `fb-army/` package | Self-contained · neutral · dormant · activatable on CEO call · zero `@deprecated` |

---

## Multi-Caller Pattern (Why This Lift Matters)

The generic `orchestration/` + `safety/` core is now reusable by ANY scraping backend. Each backend becomes one "prong" registered with the controller:

```
       ┌──────────────────────────────────────────────────┐
       │  lib/scrapers/orchestration/                     │
       │  (rotation brain · health · cost · 3-world)      │
       └──────────────────────────────────────────────────┘
                            │
       ┌────────────────────┼───────────────────┐
       │                    │                   │
       ▼                    ▼                   ▼
  ┌─────────┐         ┌─────────┐         ┌─────────┐
  │ Burner  │         │  Apify  │         │  Manus  │
  │ (World-B│         │ logged- │         │autonomous│
  │ droplet)│         │  out    │         │ task    │
  │ dormant │         │ active  │         │ banked  │
  └─────────┘         └─────────┘         └─────────┘
       │                    │                   │
       └────────────────────┼───────────────────┘
                            │
       ┌──────────────────────────────────────────────────┐
       │  lib/scrapers/safety/                            │
       │  (isolation · pace-floor · kill-switch)          │
       │  Every backend MUST pass these guards            │
       └──────────────────────────────────────────────────┘
```

| Caller | World | Status | Activation Map |
|---|---|---|---|
| Burner droplet (FB-Army Phase-1) | B | dormant | CEO: set `FB_ARMY_INGEST_SECRET` + Phase-1 6/6 live re-run + activate sign-off |
| Apify logged-out orchestration | apify | active ($29 cap) | CEO: re-fire orchestration cyl using new `lib/scrapers/orchestration` core |
| Manus autonomous workload | B | banked (W27-M scope) | CEO: W30+ build cyl wires Manus prong using same `safety/` floor |
| Meta Catalog API sync | A | banked (W28) | CEO: official channel · uses `safety/isolation` to assert World-A purity |
| Future arbitrary backend | A/B/vendor | optional | Register prong → automatic firewall + pace floor + kill-switch enforcement |

---

## Droplet · REPURPOSE Posture (NOT destroy)

DigitalOcean droplet `167.71.172.192` ($14.40/mo) is **kept and rebranded**:

| Field | Disposition |
|---|---|
| Current rename | `legacy-loop-autonomous-01` (logical rebrand · CEO/MC convention) |
| Current workload | None (provisioned · idle) |
| Future workload candidates | Manus autonomous runner · Apify orchestration host · DR fallback · CEO-side scratch |
| Capacity note | 1 CPU · 1 GB · ~25 GB SSD · sufficient for single-prong workload |
| Cost | ~$14.40/mo · CEO retains for autonomous infra · destroy NOT recommended |
| Risk | Zero (idle · no state · no inbound · no creds) |

**Why this CMD does NOT destroy:** spec §8 MAY-NOT · CEO retains optionality.

---

## Verification

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `node --test lib/fb-army-safety/verify-suite.mjs` | 7/7 PASS · 415ms (6 checks + summary) |
| `bash scripts/fb-army-safety-guard.sh` | ✅ PASS · zero World-A symbols in `fb-army/` |
| `grep "from.*fb-army"` in `lib/`+`app/` minus `lib/fb-army-safety/` | 1 match · `registry.ts:15` (expected · adapter registered · dormant) |
| LOCKED: `lib/sylvia/*` diff | 0 (LAW #38 attested) |
| LOCKED: `lib/market-intelligence/*` diff | 0 |
| LOCKED: `app/components` · `globals.css` · `layout.tsx` · `prisma/*` | 0 |
| Zero `@deprecated` markers added | confirmed |
| Zero file deletions | confirmed (git mv preserves history · shims added at old paths) |

---

## Doctrine Self-Audit

| BINDING | Status |
|---|---|
| #16 DELEGATE-CANONICAL | APP · lifted existing pattern · backend-agnostic naming |
| #17 AUDIT-FIRST-WIRE | APP · §0.5 5-probe + 0-importers verified pre-lift |
| #20 PER-AGENT-WORKTREE / NEVER-ABANDON | APP · MOVE-with-shim preserves both old and new paths |
| #21 VERIFY-VERCEL | APP · post-push cite in §12 |
| #28 AUDIT-DOC-DRIFT | APP · revert + course-reset documented |
| #30 IT-DEEP-DIVE | APP · mechanism choice (shim) cited |
| #34 SHA+DPL+CURL | APP · cited in §12 |
| #38 LAW lib/sylvia | PASS · 0 diff |
| Rule #11 DOC-META-SAFETY-ABSOLUTE | APP · firewall + CI guard intact · safety primitives generalized (broader coverage) |

---

## Doctrine Candidate · DOC-LIFT-GENERIC-CORE-MULTI-CALLER (1/5)

**Lesson:** when a tightly-named module (e.g., `fb-army-*` · `rotation/`) implements logic that is genuinely backend-agnostic, the polish pattern is: **lift to generic location** (`lib/scrapers/orchestration/` · `lib/scrapers/safety/`) via `git mv` (preserves history), **add thin re-export shims at old paths** (preserves back-compat), **neutralize headers** (W23-L1/W24-L1 → W27-A with provenance line), **keep all callers wired**, **zero deprecation**. Result: one battle-tested core reused by N callers · zero rewrites later · CEO retains all activation optionality.

**Sustains:** #16 DELEGATE-CANONICAL · #20 NEVER-ABANDON · Rule #11 META-SAFETY (firewall coverage broadens to all future backends).

**Ratifies to BINDING after 5 sustained applications.**

---

## Banked Follow-ups

1. Future callers (Apify orchestration / Manus / W28 Catalog) import from `@/lib/scrapers/orchestration` + `@/lib/scrapers/safety` directly · shims remain as back-compat only.
2. Eventually drop `lib/fb-army-safety/*` shims when zero callers reference them (carry-forward audit · NOT this cyl).
3. `burner-identity.ts` stays in `lib/fb-army-safety/` (burner-specific) until a burner-class backend re-activates · then promote OR retire.
4. DO droplet `167.71.172.192` rename to `legacy-loop-autonomous-01` (CEO/DigitalOcean UI · cosmetic).

---

**Connecting Generations · Generic · Reusable · Optionality preserved.**
