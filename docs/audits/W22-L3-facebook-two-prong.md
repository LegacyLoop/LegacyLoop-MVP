# W22-L3 Facebook Two-Prong · Audit

**CMD-W22-L3-FACEBOOK-TWO-PRONG V20 LOW · Agent B agent-2 worktree**
**Date:** 2026-05-29 · Wave 22 · Lane 3
**Anchor HEAD:** `b20d14b` (post worktree-reset.sh 2 + rebase)

> Two-prong: Part A Apify Marketplace+Groups (LIVE) · Part B Graph-API scope-pending spec

---

## §1 · §0.5 DEEP-DIVE CONFIRMATION

| Check | Result |
|---|---|
| HEAD parity | PASS · `b20d14b` post worktree-reset + rebase |
| Apify cap re-probe | PASS · STARTER $50/mo · current usage 0 |
| Sentinel (75%) | $37.50 |
| WF91 pattern read | PASS · 10-node clone source |
| account-3 cred (httpHeaderAuth `C3nFg2Ltuh4dNiKu`) | PASS · inherited by WF93+WF94 |
| LAW #38 lib/sylvia | diff=0 ✓ |

---

## §2 · Part A · Apify WFs (LIVE)

### Apify cap empirical (BINDING #38)

```
GET /v2/users/me
plan: STARTER
maxMonthlyUsageUsd: 50
current month usage (USD): undefined (0)
sentinel (75%): 37.50
```

CEO planning to raise to $80 tonight · sentinel scales to $60 if/when raised. Lane fires at LIVE cap ($50 · sentinel $37.50) per §0.7 (not date-gated).

### WF93 · Facebook Marketplace

| Field | Value |
|---|---|
| n8n ID | `WmDdCswwOiavAX9B` |
| Name | WF93 V11 Facebook Marketplace via Apify (CHEAP $5/1k · proxy apify · $50 cap · $37.50 sentinel) |
| Actor | `apify~facebook-marketplace-scraper` ($5/1k CHEAP) |
| Active | True |
| Cron | `53 7 * * *` |
| Cred | account-3 httpHeaderAuth (inherited WF91 post-R4 pattern) |
| Input | `startUrls: marketplace antiques + collectibles · maxItems: 100 · Apify proxy` |
| node --check | 3/3 ✓ (Source · Extract · BP) |

### WF94 · Facebook Groups

| Field | Value |
|---|---|
| n8n ID | `9XOwy4VgmbK09kc7` |
| Name | WF94 V11 Facebook Groups via Apify (CHEAP $4/1k · proxy apify · $50 cap · $37.50 sentinel) |
| Actor | `apify~facebook-groups-scraper` ($4/1k CHEAP) |
| Active | True |
| Cron | `54 7 * * *` |
| Cred | account-3 httpHeaderAuth (inherited WF91 post-R4 pattern) |
| Input | `startUrls: /groups/flipping + /groups/antiquesdealers · maxItems: 100 · Apify proxy` |
| node --check | 3/3 ✓ |

### Architecture (both WFs)

- **Source URLs**: emits 1 fan-out item with proxy URL + actor config + budget caps
- **Fetch HTML**: POST T3b proxy `https://app.legacy-loop.com/api/scrapers/proxy` with `{provider:"apify", operation:"run-actor", params:{actorId, input, waitForFinish:240}}` · auth via account-3 httpHeaderAuth credential (post-R4 cred-pattern · NOT `$env`)
- **Extract**: parses proxy envelope → V11 entries with FB-specific metadata (title, price, location, author, groupName, postedAt)
- **Build Payload**: canonical envelope `{action:"phase_c_ingest", data:{entries:[...]}}` · `verticalId=V11` · `domain=social-facebook-marketplace|groups`
- **Sentinel BINDING #50**: `proxy-parse-fail` · `apify-proxy-{error}` · `apify-zero-dataset-items`
- **Timeout**: 270s (Apify run + 30s headroom)

---

## §3 · Part B · Graph-API Scope-Pending Spec

### File created

`~/Desktop/skills/Commands/CMD_PHASE_D_META_GRAPH_API_APP_WIRE_V20_SCOPE_PENDING.md`

### Status

🟡 PRE-WIRE · awaiting CEO Meta Developer Console approved scope paste.

### Coverage map (Apify Part A vs Graph Part B)

| FB surface | Channel | Status |
|---|---|---|
| Marketplace | Apify WF93 LIVE | covered |
| Groups | Apify WF94 LIVE | covered |
| Pages (public business) | Graph API (spec) | scope-pending |
| Page Posts (own) | Graph API (spec) | scope-pending |
| Page Insights | Graph API (spec) | scope-pending |

### CEO paste template

```yaml
approved_scopes: [pages_read_engagement, pages_show_list, ...]
app_id: <16-digit Meta App ID>
env names: META_GRAPH_ACCESS_TOKEN · META_GRAPH_APP_ID · META_GRAPH_APP_SECRET
```

Post-paste: Devin parses → Agent B builds `lib/scrapers/proxy/adapters/meta-graph.ts` (3 surgical TS edits per apify-adapter pattern) → WF95 spec authored → ship.

---

## §4 · CEO Manual Execute G2

### Pending

| WF | n8n ID | exec_id | Apify CU cost |
|---|---|---|---|
| WF93 (marketplace) | WmDdCswwOiavAX9B | PENDING | PENDING |
| WF94 (groups) | 9XOwy4VgmbK09kc7 | PENDING | PENDING |

### Expected per-run (CHEAP actor estimates)

- WF93 · marketplace · 100 items × $5/1k = ~$0.50/run
- WF94 · groups · 100 items × $4/1k = ~$0.40/run
- Daily cron ($0.90/day) × 30 = ~$27/mo (under $37.50 sentinel · headroom for ad-hoc Manual Executes)

### Acceptance criteria

- proxy returns 200 (envelope-correct `{ok, data:[]}`)
- entries land COMPLETED in Sylvia queue (canonical envelope · BINDING #48)
- per-WF Apify CU cost cited
- sentinel intact (no actual halt at first run · CU well under $37.50)

---

## §5 · Doctrine sustained (ZERO NEW per CEO rule)

- BINDING #5 cred-safe (count-only env probe · zero key echo)
- BINDING #10 TELEMETRY-LOCK (proxy-routed · no direct Apify HTTP from droplet)
- BINDING #16 DELEGATE-CANONICAL (clone WF91 pattern verbatim)
- BINDING #17 audit-first (WF91 pattern read · proxy adapter confirmed · cap probed pre-FIX-2)
- BINDING #20 PB3 worktree FF-push
- BINDING #25 budget cap honored (Apify $50/mo live cap · $37.50 sentinel · CHEAP actors only)
- BINDING #28 HEAD parity (worktree-reset + rebase pre-fire)
- BINDING #30 §0.5 deep-dive PASS
- BINDING #38 empirical cite (Apify users/me probed · WF91 cred ID cited verbatim · cap+sentinel computed)
- BINDING #39 spec read 252 LOC end-to-end
- BINDING #48 envelope contract (BP canonical `{action, data:{entries:[...]}}`)
- BINDING #50 LAW sentinel per failure mode (parse-fail · proxy-error · zero-items)
- CEO Rule 3 CHEAP actors ($5+$4/1k · NEVER $750 6-in-1)
- CEO Rule 4 IT-autonomous pre-Execute gate
- DOC-N8N-PUT-SCHEMA-STRIP-ALLOWED-ONLY (whitelist body)
- DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE (POST + activate × 2)
- DOC-N8N-ENV-ACCESS-BLOCK-CREDENTIAL-PATTERN sustained (account-3 cred inheritance · zero `$env`)
- DOC-META-DEV-ACCOUNT-OFFICIAL-PATH (Part B candidate progression)
- LAW #38 HARD GUARD attested (zero `lib/sylvia/*` · `lib/scrapers/proxy/*` UNTOUCHED this lane)

---

## §6 · LOCKED Diff Verify

```bash
git diff HEAD --name-only | grep -E "lib/sylvia/"
# Expected: 0 hits ✓
```

This cyl touches:
- 2 new n8n WFs (WF93 + WF94) · clone WF91 pattern
- 1 new spec doc (`~/Desktop/skills/Commands/CMD_PHASE_D_META_GRAPH_API_APP_WIRE_V20_SCOPE_PENDING.md`)
- 1 new audit doc

ZERO `lib/sylvia/` · ZERO `app/` · ZERO `scripts/` · ZERO `prisma/` · ZERO droplet.

---

## §7 · Banked W23+

- CMD-PHASE-D-META-GRAPH-API-APP-WIRE post-scope-paste finalize + WF95 build
- Apify cap raise watch (CEO $50 → $80 tonight · re-probe + sentinel recompute)
- Per-WF Apify CU-per-1k actuals (refine $5/$4 estimate post-first-run)
- FB Pages dedicated WF (Graph-only · NOT Apify · ToS-clean)
- WF93+WF94 yield verification post CEO Manual Execute
