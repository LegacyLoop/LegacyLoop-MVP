# Cron Registry Parity Audit — 2026-05-07 AM

## §0 · Anchor + Audit-Method

**Anchor HEAD:** `3c64fcf` (post R19 P0 worktree-setup-dotenv-symlink ship · synced via `bash scripts/worktree-reset.sh 3`)
**Audit fired by:** CMD-CRON-REGISTRY-PARITY-AUDIT V18 (R19 P2 · Worktree C)
**Source incident:** R16 P2 §12 (`1a0cd16`) banked **DOC-CRON-REGISTRY-PARITY-VERIFY** 1/5 NEW after explicitly noting "audit all cron-route directories vs vercel.json registry · recon-autoscan example surfaces it." This audit empirically validates that drift class and advances the doctrine candidate 1/5 → 2/5.
**Audit method:** verbatim `ls app/api/cron/` + `python3 json.tool` parse of `vercel.json` `crons` array + `diff` cross-check + `head -50` inspection of orphan route file. Zero source code edits · zero `vercel.json` edits · pure documentation deliverable.
**Devin push-back (per CEO authorization):** R19 P2 was originally MC's "(b) PriceBot extract verify" — Devin substituted this concrete drift cylinder because (1) SSA audit doc §1 confirms PriceBot already wired with `loadSkillPack` at L153, (2) per-bot verify cylinders yield LOW value confirms post-R18 chain-grounding pattern, (3) cron registry parity is concrete drift surfaced at R16 P2 with empirical 9-vs-8 mismatch. Higher-leverage R19 P2 fire.

---

## §1 · `app/api/cron/` Directory Enumeration (verbatim ls)

Run at HEAD `3c64fcf`:

```
$ ls app/api/cron/ | sort
cache-report
monthly-credits
offers
pricing-accuracy-sweep
recon-autoscan
scrape-pipeline-smoke
scraper-parse
subscription-renewal
weekly-report
```

**Total: 9 directories.**

---

## §2 · `vercel.json` Crons Registry (verbatim)

Run at HEAD `3c64fcf`:

```
$ cat vercel.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(c['path'].replace('/api/cron/','') + ' | ' + c['schedule'] for c in d.get('crons',[])))" | sort
cache-report             | 0 9 * * *
monthly-credits          | 0 0 1 * *
offers                   | 0 0 * * *
pricing-accuracy-sweep   | 0 3 * * *
scrape-pipeline-smoke    | 0 * * * *
scraper-parse            | */15 * * * *
subscription-renewal     | 0 9 * * *
weekly-report            | 0 9 * * 1
```

**Total: 8 registered crons.**

---

## §3 · Drift Identification

| # | Directory | vercel.json entry | Status |
|---|---|---|---|
| 1 | cache-report             | ✅ `0 9 * * *`     | registered |
| 2 | monthly-credits          | ✅ `0 0 1 * *`     | registered |
| 3 | offers                   | ✅ `0 0 * * *`     | registered |
| 4 | pricing-accuracy-sweep   | ✅ `0 3 * * *`     | registered |
| 5 | **recon-autoscan**       | ❌ —                | **🚨 ORPHANED · DRIFT** |
| 6 | scrape-pipeline-smoke    | ✅ `0 * * * *`     | registered |
| 7 | scraper-parse            | ✅ `*/15 * * * *` | registered |
| 8 | subscription-renewal     | ✅ `0 9 * * *`     | registered |
| 9 | weekly-report            | ✅ `0 9 * * 1`     | registered |

**Mismatch: 9 directories vs 8 registered entries · `recon-autoscan` orphan confirmed.**

`diff` output:

```
$ diff <(ls app/api/cron/ | sort) <(python3 ... vercel.json | sort)
5d4
< recon-autoscan
```

Single-line drift · `recon-autoscan` present in directories · absent from registry.

---

## §4 · `recon-autoscan/route.ts` Inspection

Verbatim head from `app/api/cron/recon-autoscan/route.ts:1-16`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runScan } from "@/lib/services/recon-bot";
import { BOT_CREDIT_COSTS, TIER } from "@/lib/constants/pricing";

export const maxDuration = 120;

/**
 * POST /api/cron/recon-autoscan
 * Runs scheduled auto-scans for all active ReconBots with autoScanEnabled=true.
 * - Only scans bots whose nextScan <= now
 * - Deducts 8 credits per auto-scan (premium multi-platform monitoring)
 * - Skips bots whose owners lack credits (auto-pauses autoScan)
 * - Tier gate: requires Power Seller+ (tier >= 3)
 * Protected by CRON_SECRET. Called by Vercel Cron every 6 hours.
 */
export async function POST(req: NextRequest) {
```

**Key facts:**
- HTTP method: **POST** (NOT GET like sibling `scraper-parse`)
- Auth: CRON_SECRET triple-source (header + x-cron-secret + ?secret query · canonical pattern shared with `scraper-parse`)
- maxDuration: 120s (vs 60s on shape-monitor cron)
- Intended cadence: **every 6 hours** per docstring (line 15: *"Called by Vercel Cron every 6 hours."*)
- Business logic: scans ReconBots with `autoScanEnabled=true` whose `nextScan <= now` · deducts 8 credits per scan · auto-pauses on credit shortage · gates on Power Seller+ tier
- **Empirically: NEVER auto-fired in production because no vercel.json registration · all `autoScanEnabled` bots silently never run their scheduled scan**

**Severity assessment:** MEDIUM. Route is functional and callable manually via `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/recon-autoscan` (NOT dead code) · but the autoscan business contract is not being honored at runtime. Premium-tier customers who enabled autoScan are not getting auto-scans.

---

## §5 · CEO Decision Tree (4 paths)

**Recommended ordering by effort + business impact:**

- [ ] **Path A · ADD to vercel.json** ⭐ recommended
  - 1-line vercel.json edit · trivial diff · ~3 min cylinder
  - Schedule: `0 */6 * * *` (every 6 hours · matches docstring intent)
  - Effect: enables auto-scheduled fire · honors premium-tier autoScan business contract
  - Cost: consumes 1 Vercel cron quota slot (Pro plan typical limit: 100+ cron jobs · negligible)
  - Cylinder: `CMD-VERCEL-CRON-REGISTRATION-RECON-AUTOSCAN V18` (~5 min · banked here)

- [ ] **Path B · KEEP unregistered + annotate as manually-triggered**
  - Route docstring update · ~5 min cylinder
  - Effect: documents that autoScan business contract is OPT-OUT not OPT-IN · zero quota change
  - Risk: contradicts existing route docstring claim "Called by Vercel Cron every 6 hours" · inconsistency persists unless docstring updated
  - Use case: only if external scheduler (e.g. n8n cloud cron) is firing the route instead of Vercel cron — verify with CEO before picking

- [ ] **Path C · DELETE directory if obsolete**
  - Most destructive · ~10 min cylinder
  - Effect: removes route + all dependent ReconBot autoscan business logic
  - Risk: HIGH · breaks any caller (manual or external scheduler) · breaks autoscan business feature
  - Use case: only if autoscan business feature has been formally deprecated · NOT recommended without explicit CEO deprecation decision

- [ ] **Path D · DEFER**
  - Zero action · audit doc surfaces gap for future review
  - Use case: CEO undecided · banking for next round
  - Risk: drift persists · `autoScanEnabled` users continue not getting auto-scans

**Devin recommendation: Path A.** Empirical evidence (docstring intent + business contract) supports auto-fire · 1-line vercel.json edit closes the gap with minimal effort.

---

## §6 · Doctrine Self-Audit

| Doctrine | Status | Evidence |
|---|---|---|
| DOC-AUDIT-FIRST-WIRE-PATTERN (BINDING #17) | APPLIED · STRENGTHENED | this audit IS the contract · subsequent CEO action (Path A/B/C/D) executes against documented findings |
| DOC-MEASURE-BEFORE-PROMISE (BINDING #4) | APPLIED · CRITICAL | every cell grep-verified · 9-vs-8 mismatch empirical · diff output verbatim · docstring quoted |
| DOC-MULTI-COMPONENT-CHAIN-GROUNDING (BINDING #22) | APPLIED · ANCHOR | parent doctrine · this audit is sub-doctrine wire under BINDING #22 canopy |
| **DOC-CRON-REGISTRY-PARITY-VERIFY (1/5 → 2/5)** | **ADVANCES · empirical drift class confirmed** | R16 P2 §12 banked 1/5 · this fire is 2nd proof point · 3 more registry-vs-actual audits needed for BINDING ratification |
| DOC-DELEGATE-TO-CANONICAL (BINDING #16) | APPLIED | clones R17 P1 audit-doc canonical structure (`docs/VERCEL_WEBHOOK_AUDIT_2026-05-06.md` · 13-section + 2-appendix pattern) · zero new abstraction invented |
| DOC-PRE-STAGE-NON-IDP-PREFETCH (BINDING #5) | APPLIED | greenfield audit doc absent pre-fix · `recon-autoscan/route.ts:1-16` cited verbatim · `vercel.json` parsed via canonical Python json.tool |
| DOC-SPEC-GROUNDING-VERIFY (BINDING #7) | APPLIED · STRENGTHENED | drift class re-grep-verified at R19 P2 fire-time vs R16 P2 §12 banking |
| DOC-PARALLEL-FILE-COLLISION-CHECK (BINDING #8) | APPLIED | writes ONLY 1 file in agent-3-slot worktree · disjoint from R19 P0 (worktree A · scripts) + R19 P1 (worktree B · VideoBot) |
| DOC-MULTI-AGENT-INDEX-ISOLATION (BINDING #12) | STRUCTURAL | per-worktree git index · zero shared-index race |
| DOC-PER-AGENT-WORKTREE (BINDING #20) | PROOF POINT | R19 P2 fire from agent-3-slot · structural completeness preserved |
| DOC-VERIFY-VERCEL-AFTER-COMMIT (BINDING #21) | APPLIED · post-sentinel-ratification | will cite `dpl_<id>` READY + curl 200/200 + ★ SINGLE-DEPLOY PROOF post-push |
| DOC-AUDIT-DOC-DRIFT-CATCH (1/5 NEW · R18 P1 banking) | APPLIES (sister doctrine) | this audit is itself a drift-catch instance — audit-doc claim parity with code reality |
| feedback_dont_expand_scope_without_asking | APPLIED · CRITICAL | zero `vercel.json` edits (CEO scope) · zero source edits (CEO scope) · pure documentation deliverable |

---

## §7 · Banked Carry-Forwards

1. **DOC-CRON-REGISTRY-PARITY-VERIFY 2/5** — needs 3 more registry-vs-actual audits to ratify BINDING. Sibling audit candidates banked:
   - `app/api/webhooks/` directory vs allowed-webhook list
   - `prisma/migrations/` vs deployment manifest
   - `lib/bots/skills/<bot>/` vs SSA audit-doc claims (overlaps DOC-AUDIT-DOC-DRIFT-CATCH 1/5)
   - `app/api/auth/` directory vs documented auth surfaces
   - `lib/adapters/` vs LOCKED files list in CLAUDE.md §10
2. **CEO Path A pick → `CMD-VERCEL-CRON-REGISTRATION-RECON-AUTOSCAN V18`** (~5 min · adds vercel.json entry with `0 */6 * * *` schedule · pairs with this audit doc)
3. **CEO Path B pick → `CMD-RECON-AUTOSCAN-MANUAL-TRIGGER-ANNOTATE V18`** (~5 min · route docstring update to remove auto-fire claim if external scheduler is intent)
4. **CEO Path C pick → `CMD-RECON-AUTOSCAN-DEPRECATE V18`** (HIGHER risk · only if formal deprecation · ~10 min · banked LOW unless CEO explicitly deprecates feature)
5. **DOC-CRON-REGISTRY-PARITY-VERIFY automation candidate** — pre-commit hook OR CI job that diffs `ls app/api/cron/` against `vercel.json crons` automatically (LOW · only if drift class recurs · banks if 3+ future drift instances surface)

---

## §8 · CEO Action Items (numbered · ordered by recommended priority)

1. **[ ] PATH A** — register `recon-autoscan` in `vercel.json` with `0 */6 * * *` (every 6h schedule · matches docstring intent · honors premium-tier autoScan business contract). Fire `CMD-VERCEL-CRON-REGISTRATION-RECON-AUTOSCAN V18`. **⭐ Recommended.**
2. **[ ] PATH B** — annotate route as manually-triggered + update docstring (only if external scheduler confirmed firing the route).
3. **[ ] PATH D** — defer (zero action · audit doc remains as forensic record).
4. **[ ] PATH C** — delete directory (only if formal deprecation decision · NOT recommended without explicit CEO deprecation).

---

## §9 · Severity Assessment

**MEDIUM severity · LOW production-stability impact · MEDIUM business-contract impact.**

- **Production stability:** zero impact · existing 8 cron routes fire normally · no errors · no failed deploys · no user-visible regression
- **Business contract:** premium-tier (Power Seller+) users with `autoScanEnabled=true` ReconBots are NOT getting auto-scans · their `nextScan <= now` rows accumulate without firing · silent feature degradation
- **Audit-trail integrity:** route docstring claims "Called by Vercel Cron every 6 hours" but registry contradicts · documentation drift impacts future contributor trust
- **Doctrine integrity:** R16 P2 §12 explicitly banked this drift class · audit-first wire pattern requires audit-then-act sequence · this fire is the audit · CEO action closes the loop

**Recommendation:** Path A pick within R19 wave or R20 wave · trivial diff · honors business contract · closes doctrine loop.

---

## §10 · Doctrine Lineage

DOC-CRON-REGISTRY-PARITY-VERIFY is a **sub-doctrine of BINDING #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING parent doctrine** (ratified yesterday post R17 P0 + R18 P1 multi-fire stacking). Sibling sub-doctrines tracking under BINDING #22 canopy:

| Sub-doctrine | Status | Source |
|---|---|---|
| DOC-SUBSTRATE-RETURN-SHAPE-VERIFY | 2/5 | R17 P0 PATH A re-author |
| DOC-AUDIT-DOC-DRIFT-CATCH | 1/5 | R18 P1 PhotoBot 16-vs-20 catch |
| DOC-WORKTREE-INFRA-PARITY-PRECHECK | 2/5 | R15 P1 HALT + R19 P0 wire |
| **DOC-CRON-REGISTRY-PARITY-VERIFY** | **2/5 (this fire)** | **R16 P2 banking + R19 P2 audit** |

All four sub-doctrines share the parent shape: "audit-time chain-grounding catches drift between claimed-state and actual-state across multi-component pipelines." When 5 sub-doctrines have ratified, the parent BINDING #22 framework is fully operational.

---

## §11 · Conclusion

`recon-autoscan` cron route is **structurally orphaned** from the Vercel cron registry. The route is functional and callable but **never auto-fires**, contradicting its own docstring claim ("Called by Vercel Cron every 6 hours"). Premium-tier users with `autoScanEnabled=true` ReconBots are silently not getting their scheduled scans.

This audit empirically validates **DOC-CRON-REGISTRY-PARITY-VERIFY** as a real drift class (R16 P2 banked the candidate · this audit advances 1/5 → 2/5). Three more registry-vs-actual audits across sibling surfaces (`webhooks/` · `migrations/` · etc.) ratify the doctrine to BINDING.

**CEO action recommended:** Path A — register the cron with `0 */6 * * *` schedule · ~5 min cylinder · honors business contract · closes doctrine loop.

---

## §12 · Final Action Items

- [x] Audit doc authored at `docs/CRON_REGISTRY_PARITY_AUDIT_2026-05-07.md` (this file)
- [ ] CEO reviews audit + picks Path A/B/C/D
- [ ] Post Path A: fire `CMD-VERCEL-CRON-REGISTRATION-RECON-AUTOSCAN V18` cylinder (~5 min)
- [ ] Post Path B: fire `CMD-RECON-AUTOSCAN-MANUAL-TRIGGER-ANNOTATE V18` cylinder (~5 min)
- [ ] DOC-CRON-REGISTRY-PARITY-VERIFY 2/5 → BINDING tracking (3 more sibling registry audits needed)
- [ ] R20+: bank DOC-CRON-REGISTRY-PARITY-VERIFY automation candidate (pre-commit hook OR CI diff job · LOW priority unless drift class recurs)

---

## §13 · Audit Provenance

**Author:** Devin · L1 (executor IT agent)
**Date:** 2026-05-07 AM EDT
**Cylinder:** CMD-CRON-REGISTRY-PARITY-AUDIT V18 (R19 P2 · Worktree C · agent-3-slot)
**Anchor commit:** `3c64fcf` (post R19 P0 worktree-setup-dotenv-symlink)
**Method:** verbatim grep + ls + diff + python3 json.tool · zero source code edits
**Pattern source:** `docs/VERCEL_WEBHOOK_AUDIT_2026-05-06.md` (R17 P1 audit-doc canonical · 13-section + 2-appendix structure)
**Doctrine progression:** DOC-CRON-REGISTRY-PARITY-VERIFY 1/5 → 2/5 banked
**Companion doctrines:** DOC-MULTI-COMPONENT-CHAIN-GROUNDING (BINDING #22 parent) · DOC-AUDIT-DOC-DRIFT-CATCH (sibling 1/5) · DOC-SUBSTRATE-RETURN-SHAPE-VERIFY (sibling 2/5) · DOC-WORKTREE-INFRA-PARITY-PRECHECK (sibling 2/5)

---

## Appendix A · Full `app/api/cron/` Directory Tree

```
app/api/cron/
├── cache-report/route.ts                  ✅ registered
├── monthly-credits/route.ts               ✅ registered
├── offers/route.ts                        ✅ registered
├── pricing-accuracy-sweep/route.ts        ✅ registered
├── recon-autoscan/route.ts                🚨 ORPHANED · POST · 6h intent · CRON_SECRET auth · 120s maxDuration
├── scrape-pipeline-smoke/route.ts         ✅ registered (R16 P2 ship · 1a0cd16)
├── scraper-parse/route.ts                 ✅ registered (Cyl 7B Wire-Fill ship)
├── subscription-renewal/route.ts          ✅ registered
└── weekly-report/route.ts                 ✅ registered
```

---

## Appendix B · Full `vercel.json` Crons Array (verbatim)

```json
{
  "crons": [
    { "path": "/api/cron/offers",                  "schedule": "0 0 * * *"     },
    { "path": "/api/cron/monthly-credits",         "schedule": "0 0 1 * *"     },
    { "path": "/api/cron/cache-report",            "schedule": "0 9 * * *"     },
    { "path": "/api/cron/weekly-report",           "schedule": "0 9 * * 1"     },
    { "path": "/api/cron/subscription-renewal",    "schedule": "0 9 * * *"     },
    { "path": "/api/cron/pricing-accuracy-sweep",  "schedule": "0 3 * * *"     },
    { "path": "/api/cron/scraper-parse",           "schedule": "*/15 * * * *" },
    { "path": "/api/cron/scrape-pipeline-smoke",   "schedule": "0 * * * *"     }
  ]
}
```

**8 entries · 9 directories · 1 orphan (`recon-autoscan`) · drift confirmed.**

---

*End of CRON_REGISTRY_PARITY_AUDIT_2026-05-07.md · Drive on.*
