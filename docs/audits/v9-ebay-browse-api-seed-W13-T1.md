# V9 eBay Browse API Seed · W13-T1 Audit

**CMD-V9-EBAY-BROWSE-API-SEED V20 MEDIUM · Agent 1 MAIN worktree**
**Date:** 2026-05-28 · **Wave 13 Lane T1**

> Class: T1 OAuth API keystone seed · V9 Phase C MISSING vertical first-seed
> Apify: ZERO · eBay Browse API 5000 calls/day free tier
> Legal: Phase C Legal Compendium §1 V2/§1 V9 verbatim · MAJOR posture upgrade
> CEO eBay developer keyset `LegacyLo-LegacyLo-PRD-1f61c9ff1-00124d14` (Production)

---

## §1 · Build Summary

**WF77 created:** `8iJORHAYq8w7l2mL` · 11 nodes · active · cron `32 7 * * *`

OAuth strategy adaptation: n8n `oAuth2Api` credential REST POST schema rejected multi-subschema validation (requires UI provisioning). Pivoted to inline OAuth flow:

1. **eBay-Basic-Auth credential** (httpHeaderAuth · id `WFi45BtkklBuiD1b`): stores `Authorization: Basic base64(APP_ID:CERT_ID)`
2. **Mint eBay OAuth Token** HTTP node: POSTs client_credentials grant → returns access_token (1928 char · 7200s TTL)
3. **Fetch eBay Browse** HTTP node: uses `={{ "Bearer " + $("Mint eBay OAuth Token").first().json.access_token }}` header expression
4. Each WF execution mints fresh token (no caching staleness · no refresh logic)

**6 categories** (Phase C V9 resale-relevant):
| cat_id | Name |
|---|---|
| 1 | Collectibles |
| 20081 | Antiques |
| 625 | Cameras & Photo |
| 11116 | Coins & Paper Money |
| 64482 | Sports Mem · Cards & Fan Shop |
| 220 | Toys & Hobbies |

**Endpoint:** `GET /buy/browse/v1/item_summary/search?category_ids={id}&limit=100&offset=0`
**Marketplace:** `X-EBAY-C-MARKETPLACE-ID: EBAY_US`

V9 metadata: verticalId=V9 · domain=marketplace-deep-ebay · corpusId=wf-v9-ebay-browse-2026-05-28 · sourceTier=T1
Sentinel inline at Extract zero-yield (BINDING #50 sustained)

---

## §2 · Exec Citation (17th LAW)

| Metric | Value |
|---|---|
| **exec_id** | **1827** |
| Status | success · finished |
| OAuth mint | 1 run · success (1928 char token returned) |
| Source URLs | 1 run · 6 items emitted |
| Split URLs loop | 7 runs (6 iterations + done) |
| Fetch eBay Browse | 6 runs · all 200 OK |
| Rate Limit | 6 runs |
| Extract itemSummaries | 6 runs · **600 items total** (100 per cat exact) · 0 sentinel |
| Aggregate Batch | 6 runs · 1 each |
| Build Payload | 6 runs · 1 each (all phase_c_ingest · zero skip) |
| Webhook Callback | 6 runs · all accepted |

**6-cat yield breakdown:** 100 items × 6 = 600 items exact. No category zero-yield. All 6 webhook callbacks `processed=1, accepted=1`.

---

## §3 · Turso V9 Delta

| Metric | Pre-Seed | Post-Seed | Delta |
|---|---|---|---|
| V9 COMPLETED | 0 | 0 | +0 (Sylvia not yet processed) |
| V9 total (all statuses) | 0 | **600** | **+600** |

V9 keystone seed achieved. 600 records in sylvia_corpus_queue · COMPLETED will roll forward as Sylvia processes queue.

Phase C 5-MISSING (V4+V5+V6+V9+V10) → **4-MISSING** (V4+V5+V6+V10 remaining).

---

## §4 · Doctrine Sustained (existing only · ZERO NEW)

- BINDING #16 clone-to-canonical (WF63 source)
- BINDING #17 audit-first-wire (WF63 + Browse API + OAuth schema read pre-patch)
- BINDING #20 main worktree DIRECT-PUSH (5/5+ sustained)
- BINDING #28 drift catch (V9=0 pre-seed verified empirical · n8n oAuth2Api API rejection caught · pivot to httpHeaderAuth)
- BINDING #38 empirical-cite (exec_id 1827 + V9 +600 cited)
- BINDING #39 spec-on-disk
- BINDING #50 LAW sentinel sustained (Extract sentinel passthrough · 0 sentinel in this exec)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V9 metadata patched)
- DOC-N8N-POST-MINIMAL-FIELDS ({name,nodes,connections,settings} only)
- BINDING #9 credential safety (Cert ID never echoed · variables in process · file mode 600)
- Phase C Legal Compendium §1 V2/V9 cited verbatim (T1 Browse API canonical · ZERO scraping · ZERO ToS friction)

---

## §5 · Adaptive Findings

**n8n oAuth2Api REST POST schema rejection:** Multi-subschema validation requires `serverUrl`, `sendAdditionalBodyProperties`, etc. — when populated still rejects. UI provisioning is the canonical n8n path for oAuth2Api credentials.

**Replacement pattern (cleaner):** httpHeaderAuth credential + inline OAuth mint node. Advantages:
- Fresh token per execution (zero staleness)
- No n8n credential refresh edge cases
- Auditable token mint in execution data
- Generalizes to other OAuth2 client_credentials APIs

Banked for future T1 API integrations.

---

## §6 · Banked

- CMD-W14-V9-EBAY-MARKETPLACE-INSIGHTS-REQUEST: submit access request for `buy.marketplace.insights` scope (sold-price ground truth · gated)
- CMD-W14-V9-EBAY-SOLD-FILTER-EXPAND: add `itemEndDate:[..now]` filter once Marketplace Insights granted
- CMD-W14-V9-EBAY-DEEP-EXPAND: increase limit=200 + offset pagination + additional cats (Books/Music/Movies)
- CMD-W14-V9-EBAY-RATE-LIMIT-MONITOR: hourly poll /developer/analytics/v1_beta/rate_limit/ · alert 80%
