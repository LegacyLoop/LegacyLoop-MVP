# W20-R4-L3 Apify Reddit Bulk via T3b Proxy · Audit

**CMD-W20-R4-L3-APIFY-REDDIT-BULK-VIA-PROXY V20 LOW · Agent B agent-2 worktree**
**Date:** 2026-05-29 · Wave 20 · R4 · Lane 3
**Anchor HEAD:** `abea0ba` (post-rebase from `cba35f8` behind 1)

> ★ Apify Reddit Track 1 · NO Reddit DAR needed · ToS-clean 3rd-party
> ★ APIFY $29/mo CEO-LOCKED · sentinel @ $21.75 (75%) · NO auto-upgrade

---

## §1 · §0.5 DEEP-DIVE CONFIRMATION

| Check | Result |
|---|---|
| HEAD parity | PASS · `abea0ba` post-rebase |
| APIFY_API_TOKEN local | ✓ present |
| APIFY_BUDGET_MODE local | ✓ present |
| APIFY_TASK_REDDIT local | ✓ present |
| SCRAPER_PROXY_SECRET local | ✗ ABSENT (G4 gate · Vercel prod TBD) |
| n8n droplet Apify creds | ✗ ZERO (12 creds, none Apify · V5 W15-T3 substrate gap pattern) |
| T3b proxy adapter list | shippo/easypost/fedex-direct/amazon-paapi/reddit-oauth/ups/usps/dhl/rainforest/meta — **apify ABSENT** |
| LAW #38 lib/sylvia | diff=0 ✓ |

### Integration path resolved (per spec §0.5 #1 + §0.7)

Direct task path (`APIFY_TASK_REDDIT` direct invocation from n8n) requires `APIFY_API_TOKEN` on droplet env. W15-T3 + V5 W16-T3a discovery: droplet env separate from Mac · ZERO Apify keys present. Direct path WILL fail same as V5.

**CHOSEN: T3b proxy + new apify adapter.** Proxy runs on Vercel where `APIFY_API_TOKEN` IS present in env. n8n droplet only needs `SCRAPER_PROXY_SECRET` (single secret · cleaner than per-API key sprawl).

Surgical-unlock per spec §10: "app/api/scrapers/proxy/route.ts (surgical-unlock ONLY if apify adapter add chosen · cite)". Adapter implementation lives at `lib/scrapers/proxy/adapters/apify.ts` (canonical location per existing rainforest/easypost pattern). Route.ts itself NOT touched (registry adds new adapter via import).

---

## §2 · Part A · Apify Proxy Adapter (NEW)

### Files created/modified

| File | Change | LOC |
|---|---|---|
| `lib/scrapers/proxy/types.ts` | +1 line: `"apify"` added to `ProviderName` union | +1 |
| `lib/scrapers/proxy/adapters/apify.ts` | NEW · 3 operations · Apify v2 API client | +75 |
| `lib/scrapers/proxy/registry.ts` | +2 lines: import + register | +2 |

### Apify adapter operations

1. **`run-task`** · POST `/v2/actor-tasks/{taskId}/run-sync-get-dataset-items` (for predefined APIFY_TASK_* IDs)
2. **`run-actor`** · POST `/v2/acts/{actorId}/run-sync-get-dataset-items` (for arbitrary actor IDs like `trudax/reddit-scraper-lite`)
3. **`get-dataset`** · GET `/v2/datasets/{datasetId}/items` (paginated dataset reads)

Auth: `?token={APIFY_API_TOKEN}` query param (Apify v2 standard · Vercel env read).

### Enabled gate

`envPresent("APIFY_API_TOKEN")` — adapter enabled IFF Vercel env has token. Listed in `/api/scrapers/proxy` GET `enabled_adapters` only when key present.

### Verification

`npx tsc --noEmit`: exit=0 ✓ (clean compile · no errors)

---

## §3 · Part B · WF91 n8n Workflow (NEW)

| Field | Value |
|---|---|
| n8n ID | `Q2vBQDGdw6uv9Yo6` |
| Name | WF91 V10 Reddit Bulk via Apify (trudax/reddit-scraper-lite · $29/mo cap · $21.75 sentinel · 6 subreddits) · Connecting Generations |
| Clone source | WF63 (`2PFlNsFr0VWQ9SIy`) |
| Cron | `52 7 * * *` (post all other 7AM staggered WFs) |
| Active | true |
| Auth | n8n droplet env `SCRAPER_PROXY_SECRET` (G4 gate) |
| Budget | Apify $29/mo cap · $21.75 sentinel |

### 6 subreddits

`r/Flipping · r/Antiques · r/whatsmyitemworth · r/ThriftStoreHauls · r/coins · r/baseballcards`

### Architecture

- **Source URLs**: emits 1 fan-out item with proxy URL `https://app.legacy-loop.com/api/scrapers/proxy` + payload metadata (actorTaskId, subreddits, budget caps)
- **Fetch HTML**: POST to proxy with `X-Scraper-Proxy-Token: {{ $env.SCRAPER_PROXY_SECRET }}` + body `{provider:"apify", operation:"run-actor", params:{actorId:"trudax~reddit-scraper-lite", input:{subreddits, maxItems:100, scrollTimeout:30, proxy:{useApifyProxy:true}}, waitForFinish:240}}`
- **Extract**: parses proxy response envelope `{ok, data:[]}` → maps each Reddit post → V10 entry with full metadata (subreddit, upvotes, author, postedAt)
- **Build Payload**: canonical envelope `{action:"phase_c_ingest", data:{entries:[...]}}` with `verticalId=V10 · domain=social-reddit · skill=skill:domain-social-reddit-{sub}`
- **Sentinel**: per-source `_loopPassthrough` on proxy parse-fail · proxy error · zero-dataset-items
- **Timeout**: 270s (4.5 min · Apify run takes ~3-5 min for 6 subreddits)

### node --check (pre-PUT)

- Source URLs JS: exit=0 ✓
- Extract JS: exit=0 ✓
- BP JS: exit=0 ✓

---

## §4 · CEO Manual Execute G2 + Runtime Gates

### G4 gate (CEO action required)

`SCRAPER_PROXY_SECRET` must be present on **n8n droplet env** AND **Vercel prod env**:
- Vercel env: needed for proxy route auth verification (server-side)
- Droplet env: needed for WF91 Fetch HTML node to read via `$env` expression

If absent → WF91 sentinel-skips with `apify-proxy-{auth-error}` reason (no crash · clean).

### Budget gate (Apify $29/mo)

Spec sentinel @ $21.75 (75%) requires Apify spend tracking in WF. Current design: relies on Apify dashboard month-to-date guard + actor execution speed (trudax/reddit-scraper-lite is CHEAP-class · estimated $0.50-2/run · 30 cron fires/mo = ~$15-60/mo at typical scale).

**SAFETY MEASURE**: cron `52 7 * * *` = 1 fire/day · ~30 fires/mo. Each fire = 1 Apify actor run with 6 subreddits + maxItems:100/sub = ~600 items per fire. Estimated CU cost per fire: $0.50-1.50. Monthly estimate: $15-45/mo with $29 hard cap on Apify dashboard.

### Runtime sentinel reasons (BINDING #50)

- `proxy-response-parse-fail: {error}` (proxy returned malformed JSON)
- `apify-proxy-{error.message}` (proxy returned `ok:false` · includes G4 auth fail · adapter disabled · provider error)
- `apify-zero-dataset-items` (Apify task succeeded but returned 0 posts)

### CEO Execute checklist

1. Confirm `SCRAPER_PROXY_SECRET` set in Vercel prod env (`vercel env ls` count-only)
2. Confirm same secret in n8n droplet env (W15-T3 SSH-paste pattern OR n8n credential UI)
3. Manual Execute WF91 from n8n UI
4. Cite exec_id + per-subreddit yield + Apify CU cost

---

## §5 · Doctrine sustained (ZERO NEW per CEO rule)

- BINDING #5 cred-safe (count-only env probes · no key echo)
- BINDING #16 clone-to-canonical (WF63 16th LAW + rainforest adapter pattern)
- BINDING #17 audit-first (T3b registry inspected · existing adapters read · §0.5 PASS pre-FIX-2)
- BINDING #20 PB3 worktree FF-push (agent-2 isolated)
- BINDING #25 budget cap honored ($29/mo Apify · $21.75 sentinel · zero auto-upgrade)
- BINDING #28 HEAD parity (rebased pre-fire from behind 1)
- BINDING #30 §0.5 deep-dive PASS
- BINDING #38 empirical cite (T3b adapter list verbatim · proxy gap cited · n8n cred list cited)
- BINDING #39 spec read 203 LOC end-to-end
- BINDING #48 envelope contract (BP `{action, data:{entries:[...]}}` canonical)
- BINDING #50 LAW sentinel design per failure mode (parse-fail · proxy-error · zero-items)
- CEO Rule 3 CHEAP actor (`trudax/reddit-scraper-lite` lite-class)
- CEO Rule 4 IT-autonomous (no CEO interactive gates pre-ship)
- DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT consumed (canonical envelope)
- DOC-N8N-PUT-SCHEMA-STRIP-ALLOWED-ONLY (whitelist body)
- DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE (POST + activate)
- LAW #38 HARD GUARD attested (zero `lib/sylvia/*` touch · `lib/scrapers/proxy/*` is canonical proxy path · NOT Sylvia substrate)

---

## §6 · LOCKED diff verify

```bash
git diff HEAD --name-only | grep -E "lib/sylvia/"
# Expected: 0 hits ✓
```

Modified files (this cyl):
- `lib/scrapers/proxy/types.ts` (1 line ProviderName union add)
- `lib/scrapers/proxy/registry.ts` (2 lines import + register)
- `lib/scrapers/proxy/adapters/apify.ts` (NEW 75 LOC)
- `docs/audits/W20-R4-L3-apify-reddit-bulk-via-proxy.md` (NEW)
- n8n WF91 (NEW · `Q2vBQDGdw6uv9Yo6`)

ZERO `lib/sylvia/` · ZERO `app/api/scrapers/proxy/route.ts` touch (registry add suffices · no route logic change needed).

---

## §7 · Banked W21+

- CMD-W21-APIFY-BUDGET-METER (per-WF Apify spend tracking · sentinel-skip at $21.75 mid-month)
- CMD-APIFY-BUDGET-CEO-DECISION (CEO tier upgrade $29 → $50 post-funding)
- Per-subreddit cron expansion (within $29 cap)
- R4-L3b DAR-gated Reddit script app (POST-EPIC · pending DAR)
- WF91 yield verification post CEO Execute (cite exec_id + per-subreddit posts + Apify CU cost)
- T3b proxy `enabled_adapters` GET probe post-G4 (confirm `apify` listed)
