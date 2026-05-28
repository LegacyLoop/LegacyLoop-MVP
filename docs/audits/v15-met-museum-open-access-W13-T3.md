# V15 Met Museum Open Access · W13-T3 Audit

**CMD-V15-MET-MUSEUM-OPEN-ACCESS V20 LOW · Agent B agent-2 worktree (T3 canonical)**
**Date:** 2026-05-28 · **Wave 13 Lane T3**

> Class: T1 CC0 public-domain API · 2-stage search→object · ZERO auth · ZERO Apify
> Pair: parallel with W13-T2 Smithsonian (×2 V15 velocity · "Connecting Generations" mission anchor)

---

## §1 · Build Summary

| Field | Value |
|---|---|
| n8n ID | `THxg2wFG2UFSV4Jd` |
| Name | WF79 V15 Met Museum Open Access (6 resale queries · CC0 · 470K items) · Connecting Generations |
| Clone source | WF63 (`2PFlNsFr0VWQ9SIy`) · 16th LAW canonical · sentinel-armed |
| Cron | `31 7 * * *` (next free post WF78 :30) |
| Active | true |
| API host | `collectionapi.metmuseum.org` (per Phase C audit §6.3 SoT) |
| Auth | NONE (ZERO authentication required) |
| Budget | $0.00 |

### Met API Verification (pre-fire empirical)

| Endpoint | Method | Status | Notes |
|---|---|---|---|
| `/search?q=furniture&hasImages=true` | GET | 200 | 274 objectIDs returned · 1920b |
| `/objects/45734` | GET | 200 | Full metadata · title/dept/artist/etc |

HEAD requests return 405 (API only allows GET).

### 6-Query Seed

| Query | Source label |
|---|---|
| furniture | met-furniture |
| silver | met-silver |
| pottery | met-pottery |
| porcelain | met-porcelain |
| coin | met-coin |
| vase | met-vase |

### 2-Stage Pattern

- **Stage 1**: GET `/search?q={query}&hasImages=true` → returns `objectIDs[]` array (up to 274/query)
- **Stage 2**: GET `/objects/{objectID}` per ID (cap 50/query · throttle 250ms = 4 req/sec · safely under 80/sec public limit)

Stage-2 implemented inline inside Extract Code node via `this.helpers.httpRequest()`. Per-query max yield: 50 items. Total fan-out per cron: 6 × 50 = 300 items.

### V15 Metadata

| Field | Value |
|---|---|
| verticalId | V15 |
| domain | provenance-met-museum |
| corpusId | `wf-v15-met-{date}` |
| source | met-museum-open-access-2stage |
| extractionMode | met-2stage-json-branch |

### Sentinel (inherited from WF63 clone · BINDING #50 sustained)

- Extract returns `_loopPassthrough` on:
  - `stage-1-parse-fail`
  - `no-objectIDs-in-search`
  - `stage-2-all-failed`
- BP filters `_loopPassthrough` items pre-webhook

### Per-object metadata captured

`metObjectId · title · artist · period · culture · medium · classification · objectDate · objectURL · primaryImage · creditLine · isPublicDomain · query · sourceName`

---

## §2 · Execution Status

**Awaiting CEO Manual Execute** from n8n UI (`https://n8n.legacy-loop.com`).

n8n REST API has no `/run` endpoint (confirmed W11-T3 lesson). CEO must click "Execute Workflow" in WF79 editor → cite exec_id for 17th LAW.

Expected yield: up to 300 items (6 queries × 50 IDs cap). Sentinel catches any per-query zero-yield.

---

## §3 · Legal Posture

- **T1 CC0** highest tier (per Phase C Legal Compendium §V15)
- ZERO ToS friction
- ZERO authentication
- ZERO Apify cost
- `isPublicDomain` flag captured per object for downstream verification
- API host `collectionapi.metmuseum.org` (NOT www.metmuseum.org HTML) per Phase C §6.3

---

## §4 · Doctrine Sustained (ZERO NEW per CEO rule)

- BINDING #16 clone-to-canonical (WF63 clone)
- BINDING #17 audit-first (Met API GET probe pre-fire)
- BINDING #20 PB3 (agent-2 pre-fire pull)
- BINDING #28 drift catch (HEAD/GET distinction caught early)
- BINDING #38 empirical cite (Met API 200 verified · 274 IDs · sample objectID 45734)
- BINDING #39 spec on disk (read 408 LOC end-to-end)
- BINDING #50 LAW sentinel sustained (clone inherits + adapted for 2-stage failure modes)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V15 metadata)
- DOC-N8N-POST-MINIMAL-FIELDS (binaryMode + availableInMCP stripped from settings)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE
- Phase C Legal Compendium §V15 verbatim (T1 CC0 highest posture)
- "Connecting Generations" mission anchor advance ×2 with W13-T2 (Smithsonian sibling)
- T3 canonical · Agent B = agent-2 (CEO direct)

---

## §5 · Banked

- CMD-W14-V15-LOC-INTERNET-ARCHIVE V20 LOW (2 remaining V15 keystone sources)
- WF79 yield verification post CEO Manual Execute (cite exec_id + per-query items + Turso V15 delta)
- 50-ID cap may be raised to 100 if first exec latency comfortable
- 250ms throttle may be reduced to 125ms (still safe 8/sec under 80/sec public)
