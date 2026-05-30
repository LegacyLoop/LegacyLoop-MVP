# W27-D · Sentinel-Skip Inventory (per-WF)

**CMD:** CMD-W27-D-DRAIN-AUDIT-SENTINEL-FIREWALL · V20 MED · Track A
**Date:** 2026-05-30 · **Agent:** C (agent-3) · **Anchor:** `b7e822e` · **Budget:** $0

---

## Method

"Sentinel-skip" = a corpus-ingest WF that detects an all-sentinel (placeholder)
extraction and returns `{skip:true, reason:"all-entries-sentinel"}` rather than
writing rows (W22-L1 lineage). Measured from n8n execution data (API, not Turso).

Data source: `GET /api/v1/executions` (last ~2 days · 250 executions) + sampled
`includeData=true` payloads. n8n API only — no Turso, no classifier dependency.

---

## Findings

### Fleet execution health (last ~2 days)
- **250 executions · 230 success (92%) · 20 error (8%).**
- 74 active WFs produced executions; span `2026-05-28 → 2026-05-30`.

### Sentinel-skip rate — NOT directly observable for the regional corpus pipe
- The WFs most prone to sentinel-skip (the **WF87 V4 regional** cohort) are
  currently in an **error state upstream** (parse/cron error · W21-L2 signature).
  They fail **before** reaching the skip-filter node, so they emit neither rows
  nor a `{skip:true}` payload. **Live sentinel-skip rate for these pipes = N/A
  (pipe broken upstream).**
- A sampled non-corpus success execution (5.4 MB payload) contained **no**
  sentinel/skip markers — expected (non-ingest WF).
- Full per-WF skip-payload extraction across all corpus WFs requires
  `includeData=true` on each execution (multi-MB each) — deferred as
  cost-disproportionate for this measurement pass; **logged, not silently
  skipped.**

### What IS established
| Metric | Value |
|---|---|
| Fleet error rate | 8% (20/250) |
| Top error cohort | WF87 V4 regional (5 of top-8 error WFs) |
| Regional sentinel-skip | Moot — pipe errors before skip-filter |
| Idempotency-skip | Sylvia ingest uses INSERT OR IGNORE (dedupe) — quantifiable only via Turso (blocked) |

---

## Recommendation

1. Fix WF87 regional cohort (Lane C) **before** any sentinel-skip rate is
   meaningful — a broken pipe has no skip rate, only an error rate.
2. After regional fix + CEO Turso grant: re-measure landed-vs-skipped ratio by
   joining n8n delivery counts against `sylvia_corpus_queue` status counts.

## Flags

1. Sentinel-skip un-measurable while regional pipe errors upstream (Lane C dependency).
2. Idempotency-skip needs Turso (classifier-blocked 6×).
3. Per-WF deep payload scan deferred (cost) — method documented for next pass.

**Connecting Generations · Built in Maine · World-class everywhere.**
