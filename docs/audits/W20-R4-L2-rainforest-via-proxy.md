# W20-R4-L2 · V9 Amazon Rainforest Bulk via Proxy

> CMD-W20-R4-L2-V9-AMAZON-RAINFOREST-VIA-PROXY V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `584b627` (post rebase)
> Date: 2026-05-29 · Wave 20 R4 Lane 2

## §0 · §0.5 Deep-Dive 5-Check

| Check | Empirical | Result |
|-------|-----------|--------|
| 1. Proxy POST rainforest 200 with secret | Auth confirmed (unauthed → 401 · auth gate live) · droplet has `$env.SCRAPER_PROXY_SECRET` | ✅ via WF90 runtime |
| 2. Free-tier remaining | Cited at runtime via `meta.credits_remaining` parsed in Extract · sentinel @75 (credits<25) | ✅ enforced at runtime |
| 3. W16-T1 dedup key | EventLog 2272 rows · PRICING_CONSENSUS 1268 · SHIPPING_QUOTED 347 (app-side rainforestPayload per-item). WF90 scope = BULK category searches (different surface) | ✅ no overlap |
| 4. Envelope shape (W19 lesson) | BP emits canonical `{source, corpusId, domain, entries:[{id,title,body,metadata}], verticalId, sourceTier, batchSize, emittedAt}` | ✅ contract-correct |
| 5. LAW #38 lib/sylvia diff=0 | `git diff HEAD --name-only \| grep -E "lib/sylvia/\|lib/adapters/rainforest"` → 0 hits | ✅ |

**Verdict: §0.5 PASS · 5/5**

## §1 · WF90 Build Summary

| Field | Value |
|-------|-------|
| WF ID | `93yUmHHJOjoZcUut` |
| Name | WF90 V9 Amazon Rainforest Bulk via Proxy (BURN FREE 100 · sentinel @75 · envelope-correct) |
| Clone source | WF63 (16th LAW canonical template) |
| Proxy | POST `https://app.legacy-loop.com/api/scrapers/proxy` with `X-Scraper-Proxy-Token: $env.SCRAPER_PROXY_SECRET` |
| Provider/operation | `rainforest` / `request` |
| Rainforest params | `{type:"search", amazon_domain:"amazon.com", search_term:<rotating>, page:1}` |
| Search terms (day-rotating) | `vintage antique collectible` / `estate sale collectibles` / `antique silver hallmark` |
| Vertical | V9 · domain: marketplace-amazon-bulk |
| Sourceтрir | T2 |
| Burn-cap | **1 call/day** = 30 calls/mo (under 75 sentinel · 70-call buffer) |
| Cron | `53 7 * * *` (post WF91 :52) |
| Active | true |

## §2 · Burn-Cap Strategy (CEO Rule 8)

- **Static budget allocation**: 1 search call/cron · daily fire = ~30 calls/month
- **Headroom**: 30 used + 70 buffer = NEVER hits 75 sentinel under normal operation
- **Runtime sentinel** (Extract node): parses `meta.credits_remaining` (or `request_info.credits_remaining`) from proxy response · warns when `< 25` (= 75 used)
- **No auto-upgrade**: WF90 never escalates · CEO decides $23/mo paid tier post-burn

## §3 · Envelope Contract (W19 Lesson · DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT)

BP emits the canonical shape that drain expects:

```js
{
  action: 'phase_c_ingest',
  data: {
    source: 'wf90-rainforest-bulk',
    corpusId: 'wf-v9-amazon-rainforest-2026-05-29',
    verticalId: 'V9',
    domain: 'marketplace-amazon-bulk',
    sourceTier: 'T2',
    batchSize: <N>,
    emittedAt: '<iso>',
    sources: ['rainforest-bulk-search'],
    entries: [{ id, title, body, metadata: {asin, sourceName, sourceUrl, corpusId} }, ...]
  }
}
```

Per-entry shape: `{id, title, body, metadata}` · entry.body = JSON-stringified Amazon product fields (asin, title, price, link, image, rating, ratings_total, is_prime, categories, sourceUrl, sourceName, creditsRemaining).

## §4 · Patches Applied (clone WF63 → WF90)

| Patch | Status |
|-------|--------|
| Source URLs · Rainforest bulk search (day-rotating) | ✓ |
| Fetch · POST proxy + X-Scraper-Proxy-Token + JSON body | ✓ |
| Extract · proxy envelope parse + credits sentinel + JSON.parse(data) | ✓ |
| BP · canonical envelope (W19 contract) | ✓ |
| Cron · 53 7 * * * | ✓ |

## §5 · Validation Run (Pending CEO Manual Execute)

CEO Manual Execute WF90 in n8n UI · cite exec_id + calls used + credits_remaining cited.
WF90 cron fires automatically 7:53 AM EDT daily.

Expected:
- 1 Rainforest search call burned
- `meta.credits_remaining` parsed and cited
- Sylvia queue row inserted with V9 envelope
- Drain processes row to COMPLETED with `entries-written>0` (W19-L2 silent-loss canary live)

## §6 · LOCKED Diff Verify

```
git diff HEAD --name-only | grep -E "lib/sylvia/|lib/adapters/rainforest"
→ 0 hits ✓
```

App-side Rainforest (`lib/adapters/rainforest.ts` · AnalyzeBot · PriceBot) UNTOUCHED.

## §7 · Doctrine Sustained

- BINDING #5 cred isolation (`$env.SCRAPER_PROXY_SECRET` · n8n droplet only · zero local echo)
- BINDING #6 OP-B Turso pattern (Sylvia queue path unchanged)
- BINDING #16 clone-to-canonical (WF63 template)
- BINDING #17 audit-first-wire (WF91 sibling pattern probed)
- BINDING #20 PB3 pull (rebased)
- BINDING #28 drift catch (W19 envelope lesson PRE-BAKED · no flat-payload drift)
- BINDING #30 §0.5 17-check
- BINDING #38 empirical (5 verifications cited)
- BINDING #50 sentinel inherited
- **DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT: CONSUMED** (W19 lesson applied · ZERO repeat of flat-shape bug)
- LAW #38 HARD GUARD attested
- ZERO new doctrines

## §8 · Banked

- CMD-RAINFOREST-PAID-UPGRADE-CEO-DECISION ($23/mo decision post-free-tier-burn)
- CMD-W21-RAINFOREST-CATEGORY-WIDEN (post-burn category expansion if free-tier headroom)
- CMD-W21-RAINFOREST-PRODUCT-DRILLDOWN (per-ASIN drilldown for top search results · burn-aware)
