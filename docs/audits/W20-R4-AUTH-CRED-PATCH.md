# W20-R4-AUTH-CRED-PATCH · n8n $env-block bypassed via httpHeaderAuth credential

**CMD-W20-R4-AUTH-CRED-PATCH V20 LOW · Agent 1 MAIN worktree · 2026-05-29**
**Anchor:** R4 close · single-agent sequential · n8n surface only · zero app code · campaign close runway

---

## §1 · Problem

n8n droplet runs with `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` (default). The 4 proxy-consumer WFs sent `X-Scraper-Proxy-Token: {{ $env.SCRAPER_PROXY_SECRET }}` as a manual header. n8n's expression sandbox refused to resolve `$env.*` → header sent empty → proxy returned 401 → Extract sentinel-skipped → exec=success but 0 payloads delivered.

Convergently caught: Agent 1 WF83 exec=1944 + Agent A WF90 exec=1940 + Agent C parallel · all `"access to env vars denied"`.

---

## §2 · Fix · canonical httpHeaderAuth credential pattern (W13-T1 + R4-L3 apify)

CEO created credential `Header Auth account 3` (id `C3nFg2Ltuh4dNiKu`) · stores `X-Scraper-Proxy-Token` value in n8n encrypted credential store · expression-sandbox not needed.

Per-WF patch: drop manual `X-Scraper-Proxy-Token` header · set node `authentication = genericCredentialType` + `genericAuthType = httpHeaderAuth` + `credentials.httpHeaderAuth = {id, name}` · deactivate→PUT→activate.

---

## §3 · Empirical Patch Results (4 WFs)

| WF | ID | Node | Pre · `$env` | Post · cred-auth | Active |
|---|---|---|---|---|---|
| WF83 V5 Shipping Multi-API | `WfJiE2ip1N5DuidP` | Fetch Proxy (POST · X-Scraper-Proxy-Token) | `={{ $env.SCRAPER_PROXY_SECRET }}` | cred id=`C3nFg2Ltuh4dNiKu` | True ✅ |
| WF90 V9 Amazon Rainforest Bulk via Proxy | `93yUmHHJOjoZcUut` | Fetch HTML | same | cred id=`C3nFg2Ltuh4dNiKu` | True ✅ |
| WF91 V10 Reddit Bulk via Apify | `Q2vBQDGdw6uv9Yo6` | Fetch HTML | same | cred id=`C3nFg2Ltuh4dNiKu` | True ✅ |
| WF92 V5 Multi-Carrier Shipping (active) | `TeLPxkHTlhdPrRnC` | Fetch HTML | same | cred id=`C3nFg2Ltuh4dNiKu` | True ✅ |

All 4 PUT bodies whitelisted `{name, nodes, connections, settings}` per BINDING. Per-WF: deactivate → PUT → activate cycle (BINDING #50 + W9-2 doctrine).

### Side note · WF91 name truncation
WF91 original name 130 chars · n8n PUT enforces 128 max · truncated to 128 chars (preserved meaning · dropped trailing decorative suffix). Re-patched successful.

### Side note · 2 WF92 entries in fleet
Inventory revealed `IgpUQKexy7jIs0Nd` (inactive duplicate) + `TeLPxkHTlhdPrRnC` (active canonical). Active patched; inactive left untouched. Banked: dedup duplicate · CY-N cleanup.

---

## §4 · Cred Identity Confirmation (pending CEO Manual Execute)

n8n API hides credential values · cred identity verified via WF83 round-trip (cheapest consumer · zero vendor burn).

**CEO action queued (post-ship validation gates per spec §5.X):**
1. Manual Execute WF83 → expect proxy POST 200 (was 401-via-empty-$env). Reply: `WF83 200` or `WF83 401`.
2. If 200: WF90/91/92 cred-identity confirmed by transitive (same cred id used) · CEO Execute each for vendor-call validation.
3. If 401: §0.7 swap — re-patch WF83 with `C3BkysQDHQtMxrRs` (account 2) or `NHyLIn4QxWk56yIY` (account 1) · re-test · once 200 confirmed propagate to WF90/91/92.

---

## §5 · LAW #38 HARD GUARD Attestation

- ZERO `lib/sylvia/*` mutations
- ZERO `app/*` mutations
- ZERO `lib/*` mutations
- ZERO `prisma/schema.prisma` migrations
- ZERO proxy auth logic changes (`lib/scrapers/proxy/auth.ts` untouched)
- ZERO droplet env changes (`N8N_BLOCK_ENV_ACCESS_IN_NODE` left at default · credential pattern makes it moot)
- ZERO vendor calls burned this cyl (CEO validation Execute is when burn happens)
- Repo edits: this audit doc only

`git diff HEAD --name-only | grep -E "lib/|app/"` → **0 hits** ✅

---

## §6 · BINDING #34 Widened Cite

- **(a) Commit SHA:** *(filled post-commit)*
- **(b) Vercel dpl:** N/A (n8n surface only · zero Vercel deploy)
- **(c) n8n verify:** GET on all 4 WFs post-patch confirms `auth=genericCredentialType`, `genericAuthType=httpHeaderAuth`, `cred_id=C3nFg2Ltuh4dNiKu`, `proxy-token header removed`, `$env value removed`, `active=True`

---

## §7 · Doctrine (ZERO NEW · ratified appends only)

- BINDING #5 secret never echoed (cred id only · header value n8n-encrypted)
- BINDING #16 delegate-canonical (cloned W13-T1 + R4-L3 apify credential pattern)
- BINDING #17 audit-first wire (4 WF GETs pre-patch · cred list verified)
- BINDING #20 main worktree direct-push (12+/5 LAW-READY)
- BINDING #28 drift catch (WF91 name>128 caught · truncated · re-PUT; WF92 duplicate caught · banked)
- BINDING #30 §0.5 17-check confirmed
- BINDING #31 push-back-w-replacement applied (Option B credential pattern · not Option A droplet env flag flip)
- BINDING #34 widened cite (a) + (c) · (b) N/A
- BINDING #38 empirical-cite verbatim
- BINDING #39 spec-on-disk
- BINDING #50 LAW sentinel preserved (no proxy auth logic touched)
- ★ LAW #38 HARD GUARD attested

---

## §7.5 · POST-SHIP CRED CONFIRMATION (★ Criterion #4 → 3/3 MET)

**Empirical · exec_id 1950 · WF83 Manual Execute post-cycle:**

| Iter | Provider | Operation | Result |
|---|---|---|---|
| run#0 | shippo | list_carriers | **ok=true** · data `{next, previous, results}` ✅ |
| run#1 | easypost | list_carriers | sentinel-skip (provider-side · test-key adapter error · NOT proxy auth) |
| run#2 | fedex-direct | oauth_token | **ok=true** · data `{ok, token_minted}` ✅ |

**Cycle history (§0.7 push-back applied · empirical cred discovery):**
1. Initial: all 4 WFs → `C3nFg2Ltuh4dNiKu` (account 3) · 401 UNAUTHORIZED across the board
2. Diagnostic swap: WF83 → `C3BkysQDHQtMxrRs` (account 2) — banked
3. CEO updated account-3 value · CEO directive: revert all 4 to account-3
4. WF83 reverted to account-3 + executed → **ok=true** confirmed · cred identity locked

**Proxy round-trip 200 + 2 real payloads delivered via webhook · WF83 V5 first-consumer GREEN gate FIRED.**

WF90/91/92 transitively confirmed (same cred id) · CEO Execute each for vendor-call validation when ready (Rainforest burns · Apify CU · carrier 200).

### Banked observation
- easypost sentinel-skip (test API key issue?) · isolate from proxy auth · audit easypost test key state · banked CY-N
- WF91 active=True with truncated name (130→128) · CEO may rename for clarity

---

## §8 · Carry-Forward

- CEO validates WF83 round-trip 200 · cred identity confirmed · criterion #4 → 3/3
- CEO rename `Header Auth account 3` → `Scraper-Proxy-Token` for clarity (UI hygiene)
- CY-N · audit fleet for other `$env`-using WFs · banked W21
- Dedup duplicate WF92 (`IgpUQKexy7jIs0Nd` inactive) · banked CY-N
- Doctrine candidate: **DOC-N8N-ENV-ACCESS-BLOCK-CREDENTIAL-PATTERN** (1/5 anchored this cyl · ratify on 5 consecutive applications across fleet)
