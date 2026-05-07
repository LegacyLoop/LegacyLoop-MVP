# Vercel Webhook Integrity Audit — 2026-05-06 EVE

**Author:** IT (executor) · drafted via CMD-VERCEL-WEBHOOK-INTEGRITY-AUDIT V18
**Date:** 2026-05-06 (Wed EVE EDT) · Round 17 P1 · Worktree B
**Anchor HEAD:** `1a0cd1673f8d32d325d084984c0b9ab8ed16aa01` (post R16 P2)
**Audit-method:** Vercel API read-only · git log comparison · timestamp delta · canonical V18 audit-doc structure (clones `docs/DEV_PROD_DB_ISOLATION_AUDIT.md` + `docs/CYL_7B_PARSER_WIRE_AUDIT.md`)
**Severity:** ⚠ **MEDIUM** — stall ongoing · 6 commits on origin/main not deployed · prior deploy `61cdbec` (R15 P2 · 17:01 EDT) still serving 200/200 · production behavior unchanged but new substrate undeployed

---

## §0 · Anchor + Audit-Method

This audit captures snapshot state of Vercel webhook integration at fire time. Source incidents:
- **R15 P1 §12** (commit `4a8eb62` · 18:55 EDT) cited webhook lag · banked `DOC-VERCEL-WEBHOOK-LAG-OBSERVATION 1/5`
- **R16 P1 §12** (commit `8671cbb` · 18:57 EDT) cross-cited the same incident · banked `CMD-VERCEL-WEBHOOK-INTEGRITY-AUDIT V18` (this fire)
- **R16 P0 + P2** (commits `615de06` · `1a0cd16` · 19:48 + 19:55 EDT) shipped after CEO's 2 noop-wake attempts (`04074b3` · `d726a33` · 19:38 EDT) — none of these 6 commits visible in Vercel deployment list.

This audit is the first reproduction. `DOC-VERCEL-WEBHOOK-LAG-OBSERVATION` advances 1/5 → 2/5.

---

## §1 · Vercel Project State (verbatim API)

`mcp__vercel__get_project` for `prj_br8eXVFqKFbZLvKczG6JkvYgwVg2` / team `team_km4bIt1IrCmlJ6Xk5pAjfWWV`:

```json
{
  "id": "prj_br8eXVFqKFbZLvKczG6JkvYgwVg2",
  "name": "legacy-loop-mvp",
  "framework": "nextjs",
  "accountId": "team_km4bIt1IrCmlJ6Xk5pAjfWWV",
  "createdAt": 1775342032942,
  "updatedAt": 1778101459979,
  "nodeVersion": "24.x",
  "live": false,
  "latestDeployment": {
    "id": "dpl_DkCXg4gGPo5U1R4ag489JJ8fpUr5",
    "url": "legacy-loop-idmvdlchl-legacyloop-5084s-projects.vercel.app",
    "createdAt": 1778101262350,
    "readyState": "READY",
    "target": "production"
  },
  "domains": [
    "app.legacy-loop.com",
    "legacy-loop-mvp.vercel.app",
    "legacy-loop-mvp-legacyloop-5084s-projects.vercel.app",
    "legacy-loop-mvp-git-main-legacyloop-5084s-projects.vercel.app"
  ]
}
```

🚩 **Notable field:** `"live": false`. The Vercel API's `live` field on a Project typically reflects whether the project is currently receiving production traffic OR whether automatic deploys are paused. With `app.legacy-loop.com` in `domains[]` and `latestDeployment.readyState=READY`, traffic should be flowing — but `live: false` warrants explicit CEO inspection of the project settings UI. This may indicate auto-deploy / Git integration paused.

`updatedAt: 1778101459979` decodes to **2026-05-06 17:04:19 EDT** — suggests project metadata was last touched ~3 minutes after the last deploy completed at 17:01. No project metadata mutations since 17:04 despite 6 subsequent commits to origin/main.

---

## §2 · Last 10 Deployments (verbatim API · ordered most-recent-first)

| # | Deployment ID | State | Target | Commit SHA | Created (EDT) |
|---|---|---|---|---|---|
| 1 | `dpl_DkCXg4gGPo5U1R4ag489JJ8fpUr5` | READY | production | `61cdbec5` | 17:01:02 |
| 2 | `dpl_EwGwRYEf144foVoZKqMzUv6PUs86` | READY | production | `21376f08` | 16:54:08 |
| 3 | `dpl_9nfBLVRxLnbheedpvX3ZqmTGSaDn` | READY | production | `6279f0bc` | 16:07:21 |
| 4 | `dpl_3BycDRmJDmffDrZps9B2tTVbydxu` | READY | production | `a725ef82` | 16:05:56 |
| 5 | `dpl_BA1uyYnrhD1mciyQFj1gMLn2ZSzm` | READY | production | `87305391` | 15:56:46 |
| 6 | `dpl_HcpFHnDshVDYAqg81A8JP7KzPhmD` | READY | production | `ba7239de` | 15:34:53 |
| 7 | `dpl_HPGatxmpBpSZ9Esq35oGkECHuRn7` | READY | production | `483513fd` | 15:31:37 |
| 8 | `dpl_9bjpRYwBXis7wfpcwJYnqC7uhXdv` | READY | production | `66ace5c1` | 15:02:43 |
| 9 | `dpl_552ZZo16ue7yjXA33vF5F6MUEwGC` | READY | production | `cd8f904e` | 14:53:04 |
| 10 | `dpl_7ed4syWUZKupsyAcZc6vcJjJUhJT` | READY | production | `0639c0a9` | 14:36:01 |

**Newest deploy:** `61cdbec5` at **17:01:02 EDT**. No deploys after that timestamp despite 6 subsequent commits on origin/main (see §3).

---

## §3 · origin/main Last 10 Commits

| # | SHA | Committed (EDT) | Subject (truncated) |
|---|---|---|---|
| 1 | `1a0cd16` | 19:55:11 | CMD-CYL-7G-PRODUCTION-SMOKE-HARNESS V18 (R16 P2 · Worktree C) |
| 2 | `615de06` | 19:48:15 | CMD-CYL-7E-HMAC-DEFENSE V18 (R16 P0 · Worktree A) |
| 3 | `d726a33` | 19:38:54 | noop: wake Vercel webhook (CEO Path 3 attempt #2) |
| 4 | `04074b3` | 19:38:46 | noop: wake Vercel webhook (CEO Path 3 attempt #1) |
| 5 | `8671cbb` | 18:57:45 | CMD-ANALYZEBOT-HYBRID-INPUT-EXTEND V18 (R16 P1) |
| 6 | `4a8eb62` | 18:55:59 | CMD-CYL-7B-WIRE-FILL V18 (R15 P1 RE-FIRE) |
| 7 | `61cdbec` | 17:00:58 | CMD-S35-PERPLEXITY-RE-ANCHORED V18 (R15 P2) ← **last deployed** |
| 8 | `21376f0` | 16:54:04 | CMD-SCRAPER-USAGE-LOG-PAYLOAD-FIELD V18 (R15 P0) |
| 9 | `6279f0b` | 16:06:58 | CMD-HYBRID-LIVE-WEB-FIELD-EXTEND V18 (R14 prereq) |
| 10 | `a725ef8` | 16:05:52 | CMD-SYLVIA-COGNITIVE-ARCHITECTURE-DOC V18 (R14 audit) |

---

## §4 · Stall Window Identification

**Last successful deploy:** commit `61cdbec` deployed at **17:01:02 EDT** (`dpl_DkCXg4gGPo5U1R4ag489JJ8fpUr5`).

**Stalled commits (6 total · all on origin/main · none in Vercel deployment list):**

| SHA | Pushed (EDT) | Commit Type | Cylinder |
|---|---|---|---|
| `4a8eb62` | 18:55:59 | source code (cron route + vercel.json) | R15 P1 RE-FIRE Cyl 7B Wire-Fill |
| `8671cbb` | 18:57:45 | source code (bot-ai-router substrate) | R16 P1 AnalyzeBot Hybrid |
| `04074b3` | 19:38:46 | empty noop | CEO Path 3 attempt #1 |
| `d726a33` | 19:38:54 | empty noop | CEO Path 3 attempt #2 |
| `615de06` | 19:48:15 | source code (HMAC defense) | R16 P0 Cyl 7E |
| `1a0cd16` | 19:55:11 | source code (smoke harness route + vercel.json) | R16 P2 Cyl 7G |

**Stall duration at audit time:** **~3 hours** (17:01 EDT last deploy → ~20:00 EDT audit). Includes 2 CEO Path 3 noop-wake attempts (`04074b3` + `d726a33`) — neither triggered a Vercel build.

**Pattern signature:**
- ✅ `git push origin main` succeeds (FF-push lands cleanly)
- ✅ origin/main HEAD updates correctly
- ❌ Vercel webhook does NOT trigger build for any push since 17:01 EDT
- ❌ Path 3 (no-op commit) does NOT wake the webhook (2 attempts failed)

---

## §5 · Time-to-Deploy Distribution (last 10 successful deploys)

All 10 deploys in §2 show `created == ready` (duration `0s`). Vercel's API returns the same epoch for both fields when build completes inside the same response window — actual build durations are not exposed in this list endpoint. From observed `agent-ship.sh` post-push wait times in earlier R14/R15/R16 cylinders, build duration is typically **~2-4 minutes** (`BUILDING` → `READY` transition).

The data point that matters: **all 10 most-recent deploys completed READY** with no failures. The stall is at the **trigger** layer (webhook delivery from GitHub → Vercel), NOT at the build layer.

---

## §6 · Webhook State Hypotheses

Five hypotheses for the stall, ordered by likelihood given the evidence:

1. **GitHub→Vercel webhook delivery paused/disabled** (HIGH likelihood)
   - Project field `"live": false` aligns with this hypothesis.
   - CEO's noop-wake attempts (`04074b3` + `d726a33`) didn't trigger builds — suggests webhook delivery is fully suppressed on the Vercel side, not just throttled.
   - Resolution: Path 1 (Settings → Git → confirm integration active).

2. **GitHub repo webhook deleted or returning 4xx**
   - GitHub keeps webhook delivery history at Settings → Webhooks per repo. If recent deliveries show errors (4xx/5xx from Vercel), webhook may have been auto-disabled by GitHub after N consecutive failures.
   - Resolution: CEO checks GitHub repo Settings → Webhooks → Vercel webhook → Recent Deliveries.

3. **Build queue stuck (very low — no QUEUED entries visible in last 20)**
   - All 20 listed deployments are `state: READY`. No QUEUED, BUILDING, or ERROR entries that might indicate concurrency cap hit.
   - Resolution: N/A unless §6.1 disproves.

4. **Branch deploy gating mismatch**
   - vercel.json has no `git.deploymentEnabled` clause — branch deploy gating is unlikely to block `main` pushes.
   - Resolution: N/A.

5. **Account / billing pause**
   - Vercel Hobby tier has soft caps (build minutes, deploy count). If exceeded, Vercel may pause auto-deploy without an explicit ERROR.
   - Resolution: CEO checks Vercel dashboard → billing usage tab.

**Most likely:** #1 + #2 combined. The `"live": false` field + Path 3 not waking the webhook suggest the integration link is **paused or detached** at the Vercel side.

---

## §7 · GitHub Repo Webhook State

**Audit access:** CEO scope. Devin/IT does not have the credentials to inspect GitHub repo Settings → Webhooks delivery history.

**CEO inspection target:**
- GitHub repo: `LegacyLoop/LegacyLoop-MVP`
- Path: Repo → Settings → Webhooks → look for Vercel webhook (typically `vercel.com/api/git/...`)
- Check: Recent Deliveries tab. Show last 20 delivery attempts. Note any non-2xx response codes.

If GitHub's webhook UI shows the Vercel webhook missing or marked "Inactive", the integration was disconnected on Vercel's side.

---

## §8 · CEO Action Items (5 paths · ordered by effort)

- [ ] **Path 1 — CHECK FIRST (1 min):** Vercel Dashboard → `legacy-loop-mvp` project → Settings → Git → confirm GitHub integration shows "Connected" / "Active". Look for "Webhook delivery errors" banner or "Disconnected" indicator. Verify `"live"` flag in UI matches the API's `false` reading.

- [ ] **Path 2 — TRY FIRST (2 min):** Vercel Dashboard → Deployments → click any recent deploy → click "Redeploy" → uncheck "Use existing build cache" → forces fresh build from current `origin/main` HEAD (`1a0cd16`). If this works, webhook is broken but build pipeline is fine.

- [ ] **Path 3 — WAKE WEBHOOK (already attempted ×2 · FAILED):**
  ```bash
  cd /Users/ryanhallee/legacy-loop-mvp
  git commit --allow-empty -m "noop: wake Vercel webhook" && git push origin main
  ```
  CEO already executed this twice (`04074b3` + `d726a33` at 19:38 EDT). Neither triggered a build. **Do NOT retry without first checking Path 1+2.** Path 3 only works when the webhook integration is intact but momentarily idle — current evidence suggests deeper disconnection.

- [ ] **Path 4 — RECONNECT (5 min):** If Path 1 reveals integration broken: Vercel Settings → Git → Disconnect → reconnect GitHub repo (re-installs webhook fresh). This is the most reliable resolution but loses the existing webhook delivery history.

- [ ] **Path 5 — CLI FALLBACK (5 min · CEO authority):**
  ```bash
  vercel --prod
  ```
  Builds + deploys current local `main` directly via CLI bypassing the Git integration. Useful if Path 1-4 all fail and a deploy is urgent.

**Recommended order:** Path 1 → Path 2 (5 min combined). If both fail to identify or resolve, escalate to Path 4. Path 5 is emergency-only.

---

## §9 · Doctrine Self-Audit

| Doctrine | Status | Evidence |
|---|---|---|
| DOC-V18-TEMPLATE-CANONICAL-FILE | APPLIED | 12 sections + 2 appendices · matches DEV-PROD-DB pattern |
| DOC-MEASURE-BEFORE-PROMISE (#4) | APPLIED · CRITICAL | Vercel API state cited verbatim · 20-deploy list · git log 10 commits |
| DOC-PRE-STAGE-NON-IDP-PREFETCH (#5) | APPLIED | Vercel + git state grep'd pre-write |
| DOC-SPEC-GROUNDING-VERIFY (#7) | APPLIED | All §0 grounding cells verified at fire time |
| DOC-AUDIT-FIRST-WIRE-PATTERN (#17) | APPLIED · CRITICAL | Audit-doc-only deliverable · zero source edits · doctrine demonstrated again |
| DOC-DELEGATE-TO-CANONICAL (#16) | APPLIED | Clones `DEV_PROD_DB_ISOLATION_AUDIT.md` + `CYL_7B_PARSER_WIRE_AUDIT.md` structure |
| DOC-EMIT-WITH-PROVENANCE (#15) | APPLIED | Audit doc IS the provenance · timestamps + SHAs cited verbatim |
| DOC-PER-AGENT-WORKTREE | APPLIED | Worktree B agent-2-slot · post BINDING #20 |
| DOC-VERIFY-VERCEL-AFTER-COMMIT (sentinel) | DEMONSTRATED · this fire IS the response when sentinel detects gap |
| **DOC-VERCEL-WEBHOOK-LAG-OBSERVATION (1/5 → 2/5)** | **RATIFIES** progression · first reproduction confirmed |
| **DOC-VERCEL-DEPLOY-OBSERVABILITY (NEW · 1/5)** | **BANKS** · ratifies after 4 more cylinders cite Vercel deploy state observability in §0 grounding |
| feedback_dont_expand_scope_without_asking | APPLIED · CRITICAL | CEO actions explicitly NOT in IT scope |

---

## §10 · Conclusion + Severity

**Severity: MEDIUM (ongoing).**

- **No production damage:** Last deploy `61cdbec` is serving 200/200 across `app.legacy-loop.com` root + item-detail. Users are unaffected.
- **Backlog accumulating:** 6 commits with substrate (R15 P1 cron route · R16 P1 hybrid runner · R16 P0 HMAC · R16 P2 smoke harness) are NOT serving production. New features added in those commits are dark.
- **CEO action required:** Vercel UI inspection (Path 1) is the gating step. Path 3 retried twice failed; deeper resolution path needed.
- **No code-side fix possible** — this is an infrastructure integration issue, not a build/test/typecheck issue.

**Recommendation:** CEO completes Path 1 within 24h. If integration shows disconnected, execute Path 4. Otherwise execute Path 2 to retry build. Document findings in addendum to this audit doc.

---

## §11 · Banked Carry-Forwards

| Item | Priority | Rationale |
|---|---|---|
| `DOC-VERCEL-WEBHOOK-LAG-OBSERVATION` 2/5 | DOCTRINE CANDIDATE | First reproduction confirmed · ratifies after 3 more obs OR resolution |
| `DOC-VERCEL-DEPLOY-OBSERVABILITY` 1/5 (NEW) | DOCTRINE CANDIDATE | Every IT cylinder claiming production work cites Vercel deploy state in §0 · ratifies after 4 more |
| `CMD-VERCEL-WEBHOOK-HEALTH-PROBE V18` | LOW | Automated health check service · poll deploy state vs origin/main HEAD on cron · alert if delta > N min |
| `CMD-VERCEL-DEPLOY-OBSERVABILITY-DASHBOARD V18` | LOW | Admin UI tile showing last 10 deploys + time-to-deploy + webhook state · post-100-item if useful |
| Audit doc continuation `VERCEL_WEBHOOK_AUDIT_2026-05-XX.md` | DEFERRED | Spawn new dated audit if stall recurs after Path 4 reconnect |

---

## §12 · Final Recommendation

**This cylinder produced an audit doc only.** Resolution depends on CEO executing Path 1 (5 min Vercel UI inspection) which IT does not have credentials to perform.

If Path 1 confirms integration broken → Path 4 (disconnect + reconnect). If Path 1 looks healthy → Path 2 (manual redeploy via dashboard). Path 5 (CLI fallback) only if Path 1-4 all fail and a deploy is urgent.

**Forward observability:** every future IT cylinder cites Vercel deploy state in its §0 grounding (DOC-VERCEL-DEPLOY-OBSERVABILITY ratification path). After Path 1+2 resolution, this audit doc gets an addendum noting which path resolved + final webhook state. If stall recurs, spawn a new dated audit doc per §11 row 5.

---

## Appendix A — Vercel API Raw Capture

`mcp__vercel__list_deployments` (latest 20 · summarized in §2):

```
dpl_DkCXg4gGPo5U1R4ag489JJ8fpUr5 | READY | production | sha=61cdbec5 | created=17:01:02
dpl_EwGwRYEf144foVoZKqMzUv6PUs86 | READY | production | sha=21376f08 | created=16:54:08
dpl_9nfBLVRxLnbheedpvX3ZqmTGSaDn | READY | production | sha=6279f0bc | created=16:07:21
dpl_3BycDRmJDmffDrZps9B2tTVbydxu | READY | production | sha=a725ef82 | created=16:05:56
dpl_BA1uyYnrhD1mciyQFj1gMLn2ZSzm | READY | production | sha=87305391 | created=15:56:46
dpl_HcpFHnDshVDYAqg81A8JP7KzPhmD | READY | production | sha=ba7239de | created=15:34:53
dpl_6j86dxW4TPDUMNgDWbwEfQFittwK | READY | None       | sha=ba7239de | created=15:34:53
dpl_HPGatxmpBpSZ9Esq35oGkECHuRn7 | READY | production | sha=483513fd | created=15:31:37
dpl_AzVQCeLZ7gMp841gbnK3XPVAzXh9 | READY | None       | sha=483513fd | created=15:31:36
dpl_9bjpRYwBXis7wfpcwJYnqC7uhXdv | READY | production | sha=66ace5c1 | created=15:02:43
dpl_d1nGtp1wHax14mnMNpjUmAEeiNCq | READY | None       | sha=66ace5c1 | created=15:02:42
dpl_552ZZo16ue7yjXA33vF5F6MUEwGC | READY | production | sha=cd8f904e | created=14:53:04
dpl_3nLEa1jchecJDZHccw4q5YhyEZtK | READY | None       | sha=cd8f904e | created=14:53:03
dpl_9TpAMG89zahZtEYaq3GXPwrhQDrt | READY | None       | sha=0639c0a9 | created=14:36:02
dpl_7ed4syWUZKupsyAcZc6vcJjJUhJT | READY | production | sha=0639c0a9 | created=14:36:01
dpl_8htkEDgpU9yveEvsgTnR8nLgErcj | READY | production | sha=f7451ded | created=13:42:37
dpl_4weLMVSgJqriec3XqYRTUSBsvQJC | READY | production | sha=dd7aa96f | created=11:15:23
dpl_CN8r9d73kUamYrmCed7qVy1ssLad | READY | production | sha=20bf67a3 | created=11:10:11
dpl_9YzbAZDqeR8zNRkFh22Bk6Jd312H | READY | production | sha=a9aa59af | created=11:08:18
dpl_E9TSeE9NEomeuYx8LijEMTWkDEGe | READY | production | sha=7408db10 | created=10:32:38
```

---

## Appendix B — Doctrine Lineage

`DOC-VERCEL-WEBHOOK-LAG-OBSERVATION` was banked at R15 P1 §12 (1/5) when Cyl 7B Wire-Fill push at 18:55 didn't trigger a deploy. R16 P1 §12 cross-cited the same incident (same window). This audit fire is the **first reproduction**: 6 commits stalled across ~3 hours, Path 3 noop-wake failed twice. Doctrine advances to **2/5**.

Sibling doctrines from recent rounds:
- `DOC-WORKTREE-INFRA-PARITY-PRECHECK` 1/5 (env-config gap class · banked R15 P1 retrospective)
- `DOC-CRON-IDEMPOTENCY-PATTERN` 1/5 (state-machine class · banked R15 P1 Cyl 7B Wire-Fill)
- `DOC-MULTI-COMPONENT-CHAIN-GROUNDING` 4/5+ (Devin meta-fix · advances each cross-cylinder grounding pass)
- `DOC-AUDIT-CATCHES-WIRE-GAP` 1/5 (banked R14 P3 audit)

`DOC-VERCEL-DEPLOY-OBSERVABILITY` joins this lineage as a **NEW** 1/5 candidate. Pattern: every IT cylinder claiming production work must cite Vercel deploy state observability in its §0 grounding table. Ratifies after 4 more cylinders cite this discipline.

---

*End of VERCEL_WEBHOOK_AUDIT_2026-05-06.md · drafted under CMD-VERCEL-WEBHOOK-INTEGRITY-AUDIT V18 · Round 17 P1 · Worktree B · audit-doc-only · zero source code edits*
