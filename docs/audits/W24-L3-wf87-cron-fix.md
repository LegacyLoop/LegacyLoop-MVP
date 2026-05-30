# W24-L3 · WF87 Regional Cron Fix — DIAGNOSTIC AUDIT

**CMD:** CMD-W24-L3-WF87-REGIONAL-CRON-FIX V20 LOW · Track A · Agent B (agent-2)
**Date:** 2026-05-30 · **Anchor HEAD:** aa66925
**Outcome:** 🟡 NO-OP REQUIRED — cron storm already self-healed. Zero PUT. 3-day GREEN watch banked.

---

## TL;DR

Spec premise (`W22-L1 manual-path fix did NOT propagate to cron path`) is **empirically FALSE**.
Cron and Manual triggers share the **same downstream nodes** — so the W22-L1 Extract+envelope fix propagated to the cron path automatically. All 7 WF87 regional crons' **latest scheduled executions are GREEN** (2026-05-30). No blind-PUT performed (§0.7 push-back / §9 STOP-no-blind-PUT).

---

## §0.5 IT DEEP-DIVE — empirical

### 1. Topology diff: cron-path vs manual-path (NE representative · `FnZAE5EfeGPgnolQ`)

NE WF87 = 10 nodes. Connection graph (n8n GET):

```
Manual Trigger ─┐
                ├─> Source URLs (Code) ─> Split URLs ─> Fetch HTML ─> Rate Limit
Cron Trigger ───┘                                                        │
                                                                         v
   Webhook Callback <─ Build Payload <─ Aggregate Batch <─ Extract + Format (regex-native v3)
```

**Both `Manual Trigger` and `Cron Trigger (0 7 * * *)` feed the identical `Source URLs` node → identical pipeline.** There is **no separate cron-path node config**. The `Extract + Format` node (where `Unexpected token '{'` was thrown) is **shared** by both triggers. Therefore the W22-L1 fix to that node serves the cron path too.

### 2. Error class confirmed (historical, pre-fix)

NE exec `1902` (cron, 2026-05-29 11:40 UTC) — `status: error · message: Unexpected token '{'`. Matches W22-L1 / W23-L4 documented class. This error is **pre-fix** (predates the 05-29 manual fix-verify runs at 22:21–23:17).

### 3. Latest cron execution per region — ALL GREEN

| Region | WF ID | Latest cron exec | Status | startedAt (UTC) |
|---|---|---|---|---|
| NE | FnZAE5EfeGPgnolQ | 2015 | ✅ success | 2026-05-30T11:40:00Z |
| MA | i9IOLD8zsAXUdwxC | 2016 | ✅ success | 2026-05-30T11:41:00Z |
| SE | hrK2miE2rZuZ2wUK | 2017 | ✅ success | 2026-05-30T11:42:00Z |
| MW | mfLE8L4p5gfOpbRg | 2018 | ✅ success | 2026-05-30T11:43:00Z |
| SC | m8mHgzs3gugQvpM6 | 2019 | ✅ success | 2026-05-30T11:44:00Z |
| MTN | PkLoCtz5Sn1zlMkz | 2020 | ✅ success | 2026-05-30T11:45:00Z |
| PAC | 14bmGvd4bAjlyycq | 2021 | ✅ success | 2026-05-30T11:46:00Z |

Each region's prior cron exec (05-29, pre-fix) = error; latest (05-30, post-fix) = success. 7/7 self-healed.

### 4. LAW #38 — `lib/sylvia/*` diff = 0 (n8n-only, zero code). Attested.

---

## WHY NO PUT (§0.7 BINDING #31 push-back-with-replacement)

- Cron path == manual path (shared nodes). The "different stale cron node" the spec targets **does not exist**.
- All 7 latest scheduled crons are GREEN. A PUT would mutate **working** WFs with no defect to fix — risk of re-breaking healthy production crons. §9 STOP RULE: blind-PUT without a real diff = STOP.
- **Replacement action:** verify-and-bank. Confirm 7/7 GREEN (done), bank the 3-day consecutive-GREEN watch (cron is daily; cannot prove 3 days in one cycle).

## ROOT CAUSE (corrected)

W23-L4 audit flagged "7 WF87 cron RE-broken" by observing the **05-29 pre-fix** cron error execs (e.g. NE 1902). The W22-L1 fix landed later that day (manual runs 22:21+). The next scheduled cron cycle (05-30 11:40–11:46) ran the now-fixed shared nodes and went GREEN. The flag was a **timing artifact** — audit snapshot taken before the fix's first post-fix cron cycle, not a separate unfixed code path.

## DOCTRINE NOTE — DOC-FIX-ALL-CODE-PATHS candidate (1/5)

The candidate's premise (manual fix must be separately cloned to cron) does **not** apply when triggers share nodes. Refined candidate: *before cloning a fix across "paths," verify whether the paths share nodes — a shared-node fix self-propagates; only divergent nodes need cloning.*

## BANKED WATCH (CYCLIC)

3-day consecutive-GREEN cron watch for all 7 WF87 regions. First-GREEN cited above (05-30). Re-check 05-31, 06-01, 06-02 cron cycles. If any region reverts to `Unexpected token '{'`, the shared-node theory is wrong for that region — re-open with that region's exec id.
