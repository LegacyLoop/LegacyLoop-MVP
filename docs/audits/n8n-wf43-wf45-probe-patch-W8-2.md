# n8n WF43+WF45 Probe-Patch · Wave 8 W8-2 · 2026-05-27

> **Status:** WF43 PATCHED (sentinel v3) · WF45 DIAGNOSTIC-only (Apify-bug banked W9)
> **Anchor:** HEAD `1b608a1` · Agent A agent-1 worktree
> **CMD:** CMD-WF43-WF45-PROBE-PATCH V20 LOW
> **Doctrine yield:** DOC-N8N-SPLIT-URLS-LOOP-EARLY-TERMINATE-OBSERVABILITY sustains 5/5

---

## §0 · Context

W7-2 fleet audit catalog flagged:
- WF43 V12 IC3+FBI+FTC: MEDIUM priority · avg ratio 0.62 · weekly cron `0 10 * * 0`
- WF45 V8 KBB: LOW priority · avg ratio 0.0 · daily cron `0 8 * * *`

GATE A: WF66 v3 sentinel verified (Extract 6749 bytes sentinel=True · BP 826 bytes filter=True).
W8-1 v3 pattern proven. Clone applied to WF43.

---

## §1 · WF43 Sentinel Patch

| Metric | Before | After |
|---|---|---|
| Extract bytes | 6384 | 6749 (+365) |
| BP bytes | 471 | 738 (+267) |
| sentinel= | False | True |
| BP filter= | False | True |
| PUT response | — | 200 OK |
| Corpus metadata | V12 · fraud · wf-v12-ic3-fbi-ftc-2026-05-22 | preserved |

### Post-patch execution

- exec_id: 1755
- status: success
- mode: manual (CEO Manual Execute)
- Source URLs: 10 items emitted
- Split URLs: 10 iterations completed
- Extract+Format: 10 items (1 per iter)
- Webhook Callback: 10 items delivered
- **Yield: 10-of-10 (1.0) · pre-patch avg was 0.62**

---

## §2 · WF45 Diagnostic Findings

### Topology

12 nodes including 3 Apify-specific:
- `Apify · Kick Run (Cars.com)` → `https://api.apify.com/v2/acts/fatihtahta~cars-com-scraper/runs?waitForFinish=300`
- `Apify · Poll Run Status` → dynamic URL from Kick Run response
- `Apify · Fetch Dataset Items` → dynamic dataset URL

### Last 5 execs (2026-05-23 through 2026-05-27)

| exec_id | Date | Status | Error |
|---|---|---|---|
| 1723 | 2026-05-27 | error | `Forbidden - perhaps check your credentials?` |
| 1654 | 2026-05-26 | error | `Forbidden - perhaps check your credentials?` |
| 1634 | 2026-05-25 | error | `Forbidden - perhaps check your credentials?` |
| 1614 | 2026-05-24 | error | `Forbidden - perhaps check your credentials?` |
| 1594 | 2026-05-23 | error | `Forbidden - perhaps check your credentials?` |

All 5 execs: Source URLs emits 4 items → Apify Kick Run 403 Forbidden → pipeline halts.
Split URLs receives 0 items (never iterates).

### Diagnosis

**Root cause: Apify budget cap-saturation ($54.97/$50 since pre-W6)**
- Apify API returns 403 "Forbidden" when account exceeds monthly budget
- NOT Split URLs early-terminate bug class
- NOT credential rotation issue (same error = budget enforcement)
- Sentinel passthrough WILL NOT FIX (pipeline halts at Apify HTTP node, not at Extract loop-back)
- **BANK: CMD-WF45-APIFY-RECOVERY V20 LOW · Wave 9 post-vendor-reset (2026-05-30)**

---

## §3 · Push-Back Documentation

### PB3 (BINDING #31 · 26× sustained)

WF45 ratio=0.0 is Apify-saturation NOT Split URLs bug.
- Devin §0 hypothesis: Apify cap-saturated → confirmed by IT FIX 3 diagnostic
- Replacement path: BANK W9 post-Apify-reset · do NOT patch sentinel (would not fix)
- Original MC directive: patch + execute WF45 → replaced with diagnostic-only

### PB4 (BINDING #28 · 117× sustained)

WF43 cron `0 10 * * 0` = Sundays only.
- Catalog ratio 0.62 derived from weekly execs spanning weeks
- CEO Manual Execute = primary recovery path (not waiting for next Sunday)
- Post-patch exec 1755: 10-of-10 yield (ratio 1.0) confirms sentinel fix

---

## §4 · Doctrine Progression

**DOC-N8N-SPLIT-URLS-LOOP-EARLY-TERMINATE-OBSERVABILITY**
- W8-1 ratified 5/5 → BINDING #50
- This W8-2 sustains: WF43 sentinel applied + 10-of-10 yield confirmed
- WF45 correctly excluded (different bug class · Apify-saturation)

Proof chain:
1. W5-2 WF66 PARTIAL discovery (1/5)
2. W6-1 root cause diagnostic (2/5)
3. W7-1 sentinel patch WF66+WF69 (3/5)
4. W7-2 fleet catalog 45 candidates (4/5)
5. W8-1 fleet rollout WF64+WF57 → BINDING #50 ratification (5/5)
6. **W8-2 WF43 sustains** (post-ratification sustain)
