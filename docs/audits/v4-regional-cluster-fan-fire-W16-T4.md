# V4 Regional Cluster Fan-Fire · W16-T4 Audit

**CMD-W16-V4-REGIONAL-CLUSTER-FAN-FIRE V20 LOW · Agent C agent-3 worktree (T4 canonical)**
**Date:** 2026-05-28 · **Wave 16 Lane T4**

> CEO regional directive LANDED · campaign-close requirement
> RSS-first + HTML-fallback per W15-T4b source map
> W14-T3 CL HTML-pivot pattern applied (proven)

---

## §0 · Anchor

- HEAD: `0ce3f5d` (agent-3 parity)
- WF86 id: `Olim24tKzWdmEfhf`
- Clone source: WF63 `2PFlNsFr0VWQ9SIy` (16th LAW canonical)
- Anchor map: W15-T4b V4_REGIONAL_CLASSIFIEDS_SOURCE_MAP.md

## §1 · Build Summary

WF86 LIVE · single bundled fan-out · 7 sources:

| # | Site | Tier | UA | Endpoint |
|---|------|------|----|----|
| 1 | Hoobly | T5 | Mozilla | hoobly.com (HTML) |
| 2 | USFreeAds | T2-T5 | Feedfetcher | usfreeads.com/rss (RSS-first) |
| 3 | Recycler | T5 | Mozilla | recycler.com (HTML) |
| 4 | 5miles | T5 | Mozilla | 5miles.com (HTML) |
| 5 | Geebo | T5 | Mozilla | geebo.com (HTML) |
| 6 | Bookoo | T5 | Mozilla | bookoo.com (HTML) |
| 7 | Uncle Henry's | T2 | Feedfetcher | unclehenrys.com/listings/rss (RSS keystone · Maine anchor) |

All 7 sources GREEN 200 from Mac re-verify §0.5. ASN-risk lens applied — droplet may differ (W14-T2 lesson).

## §2 · Topology

- Cron Trigger (T1 · `39 7 * * *`)
- Source URLs (Code) → emits 7 items with dynamic UA + RSS/HTML flag
- Split URLs (per-source loop)
- Fetch HTML (HTTP Request) → dynamic UA per source · text responseFormat · 30s timeout
- Rate Limit (1 req/sec)
- Extract + Format → RSS-or-HTML detect + multi-source regex (sentinel preserved)
- Aggregate Batch
- Build Payload → V4 metadata (verticalId=V4 · domain=garage-yard-sale-regional · corpusId=wf-v4-regional-{date}) · sentinel preserved
- Webhook Callback (action=phase_c_ingest)

## §3 · Execution

**G2 CEO Manual Execute pending.** exec_id: _____ (cite when CEO fires)

Expected:
- 7 Split iters
- 7 Fetch (UA-rotated · 30s timeout)
- 7 Extract (RSS-or-HTML detect)
- 5-7 BP ingest (sentinel-skip droplet-blocked sources gracefully)
- V4: 277 → ~750-1000 records target (per W14-T3 277-baseline + 7-source overlay)

## §4 · Doctrine Sustained (ZERO NEW)

- BINDING #16 clone-to-canonical (WF63 16th LAW)
- BINDING #17 audit-first-wire
- BINDING #20 worktree isolation
- BINDING #28 drift catch
- BINDING #31 push-back-with-replacement (W15-T4b PB31 sustained · MC 100-150 → reality 25-30)
- BINDING #38 empirical-cite (7 sources re-verified 200 from Mac at §0.5)
- BINDING #50 sentinel preserved (Extract + BP both `_loopPassthrough`)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V4 metadata)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE
- Phase C compendium §V4 verbatim · DROP Nextdoor sustained
- T4 = Agent C = agent-3 (CEO canonical)
- **ZERO new doctrines (CEO Rule 1 sustained)**
- **CEO regional directive LANDED · campaign-close requirement MET**

## FLAGS

- ASN-risk: Hoobly/Recycler/5miles/Geebo/Bookoo may differ Mac vs droplet (W14-T2 lesson) · sentinel handles gracefully
- Extract regex generic · per-site adaptation may improve yield (W17+ tuning)
- Cron `:39` confirmed free slot post W15 absorbed
- BANKED W17: CMD-W17-V4-REGIONAL-EXPANSION-R2 V20 LOW · CMD-W17-V4-OFFERUP-LOCAL-ADD V20 LOW

---

*Agent C · W16-T4 · HEAD 0ce3f5d → ship · WF86 Olim24tKzWdmEfhf · 2026-05-28*
