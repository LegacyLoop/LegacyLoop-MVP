# W21-L2 · Regional Cron Verify · ★ CRITERION #2 NOT CLOSED

> CMD-W21-L2-REGIONAL-CRON-VERIFY V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `2292c5a` (post rebase)
> Date: 2026-05-29 · Wave 21 Lane 2 · READ-ONLY

## §0 · §0.5 Deep-Dive 4-Check

| Check | Result |
|-------|--------|
| 1. Per-region exec probed | ✓ all 7 GET'd · status cited |
| 2. Per-region Turso count cited | ✓ all 7 regions = 0 (no region-tagged V4 rows) |
| 3. Residual-dead check | ★ ALL 7 DEAD at today's cron |
| 4. LAW #38 read-only attested | ✓ zero mutation · git diff HEAD = audit doc only |

**Verdict: §0.5 PASS · honest empirical**

## §1 · ★ CRITICAL · ALL 7 REGIONALS DEAD AT TODAY'S CRON

Last execution probe (cron fire 2026-05-29 11:40-11:46 UTC = 7:40-7:46 AM EDT):

| Region | WF ID | Exec | Status | Extract Real | Sentinels | Webhook Fires |
|--------|-------|------|--------|--------------|-----------|----------------|
| NE | `FnZAE5EfeGPgnolQ` | 1902 | **error** | 0 | 36 | **0** |
| MA | `i9IOLD8zsAXUdwxC` | 1903 | **error** | 0 | 23 | **0** |
| SE | `hrK2miE2rZuZ2wUK` | 1904 | **error** | 0 | 31 | **0** |
| MW | `mfLE8L4p5gfOpbRg` | 1905 | **error** | 0 | 28 | **0** |
| SC | `m8mHgzs3gugQvpM6` | 1906 | **error** | 0 | 25 | **0** |
| MTN | `PkLoCtz5Sn1zlMkz` | 1907 | **error** | 0 | 25 | **0** |
| PAC | `14bmGvd4bAjlyycq` | 1908 | **error** | 0 | 26 | **0** |
| **TOTAL** | — | — | **7/7 error** | **0** | **194 sentinels** | **0 webhooks** |

**Every region · zero Sylvia ingest from today's cron cycle.**

## §2 · Root Cause: Build Payload Runtime Error

Error captured from NE exec=1902:
```
top-level error: Unexpected token '{'
NODE [Build Payload (action=phase_c_ingest)] error: Unexpected token '{'
```

BP jsCode (NE · 768 chars) is statically VALID JavaScript (balanced braces · valid `return [{json:{action,data:{entries,corpusId,...}}}]`). Runtime error suggests upstream data shape mismatch — `_aggregated.entries` may be a JSON string or unexpected type from Aggregate Batch output, not the expected array.

Same BP template used in all 7 regions (NE/MA/SE/MW/SC/MTN/PAC) · same error pattern · cluster-wide blocker.

NE prior exec: 1862 (2026-05-28 23:56 · manual · also `error`) — bug not transient · sustained since W19-L3 ship.

## §3 · Turso V4 Per-Region Probe · ALL ZERO

| Region | V4 rows (payload region-tag) |
|--------|------------------------------|
| NE | 0 |
| MA | 0 |
| SE | 0 |
| MW | 0 |
| SC | 0 |
| MTN | 0 |
| PAC | 0 |

V4 overall: **560 COMPLETED** · ALL come from `domain='garage-yard-sale-craigslist'` · pre-deactivation monolith path. Zero rows tagged with region (regional payload shape never reached Sylvia · BP failure stops at n8n side).

The `+283 V4 delta` cited in spec §0 came from EARLIER source (possibly stale monolith leftovers · OR a different V4 path not the 7 regionals). NOT from W19-L3 repair empirical proof.

## §4 · V4 by Sample Payload (top 10)

All samples are `{"source":"n8n-workflow","corpusId":"wf-v4-craigslist-2026-05-29",...,"domain":"garage-yard-sale-craigslist","entries":[{"id":"v4-cl-...`. Same shape · same domain · no region · no regional cluster signature.

## §5 · Verdict · §0.7 PUSH-BACK PROTOCOL

**CRITERION #2 V4 REGIONAL CLUSTER LIVE: NOT CLOSED · honest partial cite.**

All 7 regions DEAD at today's cron · cluster-wide BP runtime error · zero Sylvia ingest from regional path. CEO Rule `honest partial beats fake complete` applied.

## §6 · Banked Targeted Re-Fix

- **CMD-W22-V4-REGIONAL-BP-DEBUG V20 LOW (fix-class)** · root-cause investigate BP `Unexpected token '{'` · likely Aggregate output shape vs `_aggregated.entries` expectation mismatch · single-spot fix applies to all 7 regions (shared template)
- **CMD-W22-V4-REGIONAL-MANUAL-EXECUTE-POST-FIX V20 LOW** · CEO Manual Execute each of 7 post-fix · cite per-region exec_id + items webhooked + Turso row delta
- Bank also: investigate whether 560 existing V4 rows came from W19-L3 repair OR are leftover pre-W16-R3-L2 monolith data (provenance audit)

## §7 · LOCKED Diff Verify

```
git diff HEAD --name-only | grep -E "lib/|app/|scripts/"
→ 0 hits ✓ (audit doc only)
```

## §8 · Doctrine Sustained

- BINDING #6 read-only Turso pattern
- BINDING #17 audit-first-wire (per-WF GET + Turso SELECT · zero mutation)
- BINDING #20 PB3 rebase
- BINDING #28 drift catch (W19-L3 repair claim caught as un-validated · BP regression sustained)
- BINDING #30 §0.5 4-check
- BINDING #38 empirical-cite (per-region exec status + Turso count cited verbatim)
- BINDING #50 sentinel observability
- LAW #38 HARD GUARD: read-only attested (zero Turso writes · zero n8n PUT/activate · zero code edit)
- ZERO new doctrines

## §9 · Flags

- Gaps: 7/7 regionals broken at cron · cluster delivery=0
- Risks: criterion #2 "live" claim was premature · W19-L3 ship missed BP runtime validation
- Missed: BP smoke run (Manual Execute) post-W19-L3 repair would have caught this
- Carry-forward: CMD-W22-V4-REGIONAL-BP-DEBUG (root cause + fix)
- Suggestions: post-ship Manual Execute discipline for any cluster-wide template patch
- Opportunity: single-spot fix unlocks 7× regional cluster simultaneously
