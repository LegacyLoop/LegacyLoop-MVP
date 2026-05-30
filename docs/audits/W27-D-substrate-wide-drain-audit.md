# W27-D · Substrate-Wide Drain Audit (per-vertical row yield)

**CMD:** CMD-W27-D-DRAIN-AUDIT-SENTINEL-FIREWALL · V20 MED · Track A
**Date:** 2026-05-30 · **Agent:** C (agent-3) · **Anchor:** origin/main `b7e822e` · **Budget:** $0
**Resumes:** W23-L4 banked drain audit.

---

## ⚠️ Status: PARTIAL — Turso prod read classifier-blocked (6th time)

Per-vertical row yield requires a `sylvia_corpus_queue` / `sylvia_episodic` read on
**prod Turso**. The OP-B path (`node --env-file=.env @libsql/client`) was
**auto-mode-classifier-blocked for the 6th time** (W16-T6 · W19-L4 · W20-R4-L4 ·
W23-L4 · W24-L4 · **W27-D**). No CEO `turso grant` in this lane. Per §9 → cited,
partial report, **probe not faked**.

**To complete FIX 1:** CEO grants a one-time Turso read window, then re-run the
prepared probe (grouped counts below). Doctrine `DOC-AUTO-MODE-CLASSIFIER-BANK`
re-banked at 6 blocks.

### Prepared probe (ready to run on grant)

```sql
-- per-vertical corpus yield, last 7d, by status
SELECT verticalId, domain, status, COUNT(*) n
FROM sylvia_corpus_queue
WHERE createdAt >= datetime('now','-7 days')
GROUP BY verticalId, domain, status ORDER BY n DESC;

-- all-time per-vertical completion ratio
SELECT verticalId, COUNT(*) n,
       SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) completed
FROM sylvia_corpus_queue GROUP BY verticalId ORDER BY n DESC;

-- episodic 7d by source/eventType
SELECT source, eventType, COUNT(*) n
FROM sylvia_episodic
WHERE timestamp >= datetime('now','-7 days')
GROUP BY source, eventType ORDER BY n DESC;
```

Schema confirmed (read-only, repo): `sylvia_corpus_queue` (verticalId · domain ·
status · createdAt) · `sylvia_episodic` (source · eventType · timestamp).

---

## Supplement (measurable without Turso — n8n delivery side)

n8n is the **delivery** layer (webhook POST → Sylvia). It does not confirm Turso
**landed rows**, but it bounds upstream supply:

- **86 workflows · 74 active.**
- Last ~2 days: **250 executions · 230 success · 20 error (8% error rate).**
- **Dark pipe (drain candidate · upstream):** the **WF87 V4 regional cohort**
  (MTN / PAC / SC / MW / SE …) dominates the error cluster (5 of top-8 error WFs).
  Matches W21-L2 + W23-L4 "7/7 regions DEAD". These pipes error **before** any
  row reaches Turso → zero yield regardless of the Turso read. **Owner: Lane C
  (WF cron) — not drained here.**

---

## Recommendation matrix (CEO decides per source · ZERO auto-drain)

| Source / cohort | Signal | Candidate | Decision needed |
|---|---|---|---|
| WF87 V4 regional (7 WFs) | erroring upstream · zero delivery | **DRAIN or FIX** | CEO + Lane C |
| Per-vertical corpus rows | **unmeasured (Turso blocked)** | — | **CEO turso grant** then re-run probe |
| Episodic by source | **unmeasured (Turso blocked)** | — | same |

No source drained. No kill/revive. All decisions deferred to CEO per §8/§9.

## Flags

1. Turso read blocked 6× — classifier doctrine re-banked; CEO grant unblocks full yield audit.
2. WF87 regional cohort = confirmed dark pipe (erroring), independent of Turso.
3. Delivery≠landed: n8n success ≠ Turso row (idempotent INSERT OR IGNORE may dedupe).

**Connecting Generations · Built in Maine · World-class everywhere.**
