# V8 NHTSA 2015-2019 Backfill · W12-T1 Audit

**CMD-V8-NHTSA-2015-2019-BACKFILL V20 LOW · Agent 1 MAIN worktree**
**Date:** 2026-05-27 · **Wave 12 Lane T1**

> Class: Density-fill backfill · 5-year window expansion 2020-2024 → 2015-2024
> Apify: ZERO · NHTSA vPIC + Recalls API free public

---

## §1 · Patch Summary

| WF | ID | Patch | Entries |
|---|---|---|---|
| WF69 | `t5C9CyzH35bks2tg` | Source URLs 25 → 50 entries | Honda Civic + Ford F-150 + Toyota Camry + Chevrolet Silverado + Nissan Altima × 10yr |
| WF70 | `IZJgcnX8ZQROy8mZ` | Source URLs 25 → 50 entries | Subaru Outback + Hyundai Elantra + Kia Sorento + Jeep Wrangler + GMC Sierra × 10yr |

- Combined coverage: 10 makes × 10 years (2015-2024) × top models = 100 URLs per cron cycle
- Deactivate-cycle applied per DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE
- Minimal PUT fields per DOC-N8N-POST-MINIMAL-FIELDS
- Sentinel JS UNCHANGED (BINDING #50 preserved)

---

## §2 · Exec Citations (17th LAW)

| WF | exec_id | Status | Source items | Extract | Webhook |
|---|---|---|---|---|---|
| WF69 | **1768** | success | 50 | 50 (0 sentinel) | 50 accepted |
| WF70 | **1769** | success | 50 | 50 (0 sentinel) | 50 accepted |

100 total webhook callbacks · 0 sentinel · all nodes 50/50 clean pipeline.

---

## §3 · Turso Delta

| Metric | Value |
|---|---|
| V8 pre-backfill | 1,788 (verified spec §0.3) |
| V8 post-backfill | **1,818** |
| Delta | **+30** |
| Spec target | ~280 (overestimate) |

Delta gap analysis: 100 records sent to webhook, +30 net new in Turso. 70 records deduped by ingest pipeline (existing recall data overlap + empty-recall make/model/year combos for 2015-2019 that returned no unique recall content). NHTSA recall density for 2015-2019 models lower than projected 70% — actual ~30%.

+30 is verified real delta. 2015-2019 backfill data now in production.

---

## §4 · Doctrine Sustained

- BINDING #17 audit-first-wire (WF JSON read pre-patch · Source URLs pattern identified)
- BINDING #20 main worktree direct-push (DOC-AGENT-SHIP-SLOT-ONLY-MAIN 4/5+)
- BINDING #28 drift catch (year array empirical pattern verified · explicit URL entries not literal array)
- BINDING #38 empirical-cite (exec_ids 1768+1769 + Turso delta cited)
- BINDING #50 sentinel sustained (WF69+WF70 sentinel JS UNCHANGED by patch)
- DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE applied (deactivate → PUT → reactivate)
- DOC-N8N-POST-MINIMAL-FIELDS applied ({name,nodes,connections,settings} only)
- 17th LAW × 2 exec_ids cited (1768, 1769)
