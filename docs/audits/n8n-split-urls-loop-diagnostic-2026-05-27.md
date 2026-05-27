# n8n Split URLs Loop Early-Terminate Diagnostic · 2026-05-27 · Wave 6 W6-1

> **Status:** Diagnostic-only · audit-doc · ZERO n8n substrate write · ZERO repo source change
> **Anchor:** HEAD `95c26f4` · Wave 5 W5-2 V14 WF66 Phase 4 PARTIAL (3-of-5 yield)
> **Verdict:** **Empty-pipeline loop-back starvation** — Extract+Format returns `[]` on failed fetch → `splitInBatches` receives zero items on loop-back → halts iteration prematurely
> **Blast radius:** 42 of 50 workflows use `splitInBatches` — all vulnerable to same bug class
> **Doctrine yield:** DOC-N8N-SPLIT-URLS-LOOP-EARLY-TERMINATE-OBSERVABILITY 1/5 → 2/5

---

## §1 · Problem Statement

WF66 (V14 DocumentBot Phase 4 · FDA + EPA + State + OPM + NIH) fired Manual Execute Tue 2026-05-26 PM. Execution `exec_id=1694` completed in **4 seconds** (expected 15s+ for 5 URLs at ~3s/source). Only 3-of-5 URLs processed. State.gov + OPM + NIH never reached webhook callback. Corpus delta: +2 (FDA + EPA only).

---

## §2 · Empirical Findings

### FIX 1 — Execution History Harvest (exec_id=1694)

| Node | Iterations | execTime (ms) | Items out per iter |
|------|-----------|---------------|-------------------|
| Source URLs | 1 | 17 | 5 items (all 5 URLs emitted) |
| Split URLs | 3 | 1, 2, 1 | [0,1], [0,1], [0,1] (branch 0=done: 0 items, branch 1=loop: 1 item each) |
| Fetch HTML | 3 | 47, 64, 36 | 1, 1, 1 (but iter 2 = `json: {}` empty) |
| Rate Limit | 3 | 1002, 1002, 1004 | 1 each |
| Extract+Format | 3 | 67, 57, 68 | 1, 1, **0** (iter 2 = zero items) |
| Aggregate Batch | 2 | 2, 1 | 1 each |
| Build Payload | 2 | 13, 18 | 1 each |
| Webhook Callback | 2 | 194, 122 | 1 each |

**Key observations:**
- Source URLs correctly emitted all 5 URLs (FDA, EPA, State, OPM, NIH)
- Split URLs only iterated 3 times (FDA=iter 0, EPA=iter 1, State=iter 2)
- Iterations 3 (OPM) and 4 (NIH) never executed
- Extract+Format iter 2 returned 0 items → loop-back starved → loop halted

### URLs processed vs dropped

| Iter | URL | Fetch result | Extract result | Webhook? |
|------|-----|-------------|---------------|----------|
| 0 | `fda.gov/news-events/fda-newsroom/press-announcements` | 36,950 bytes HTML | 1 item (title: "Press Announcements \| FDA") | ✅ |
| 1 | `epa.gov/newsreleases` | 69,689 bytes HTML | 1 item (title: "Browse News Releases") | ✅ |
| 2 | `state.gov/press-releases/` | **`json: {}` (empty)** | **0 items** | ❌ |
| 3 | `opm.gov/news` | never reached | never reached | ❌ |
| 4 | `nih.gov/news-events/news-releases` | never reached | never reached | ❌ |

### FIX 2 — WF66 vs WF63 Config Diff

Both workflows use identical `splitInBatches` configuration:

```
WF66 Split URLs:
  type: n8n-nodes-base.splitInBatches
  typeVersion: 3
  batchSize: 1
  options: {}

WF63 Split URLs:
  type: n8n-nodes-base.splitInBatches
  typeVersion: 3
  batchSize: 1 (default)
  options: {}
```

Both use identical `executionOrder: "v1"` and same settings. Connection topology also identical:
- `Extract+Format [branch 0]` → BOTH `Split URLs` (loop-back) AND `Aggregate Batch`
- `Split URLs [branch 1]` → `Fetch HTML` (loop body)

**WF63 exec_id=1683 ran 15s, processed all 5 URLs, 5 Extract iterations each yielding 1 item, 5 Webhook calls.** WF63 succeeded because ALL sources returned valid HTML — no empty fetch to break the loop.

### FIX 3 — Timeout Hypothesis Test

**REJECTED.** No timeout or batchInterval configured on `splitInBatches` in either WF66 or WF63. `options: {}` on both. The 36ms Fetch executionTime for State.gov iter 2 was faster than FDA (47ms) and EPA (64ms) — timeout cannot explain why iter 2 failed.

### FIX 4 — Downstream HTTP Probe (independent curl from local)

| Source | URL | HTTP Status | Size |
|--------|-----|------------|------|
| State.gov | `state.gov/press-releases/` | **200** | 659,508 bytes |
| OPM | `opm.gov/news` | **403 Forbidden** | anti-bot wall |
| NIH | `nih.gov/news-events/news-releases` | **200** | OK |

**State.gov returns 200/659KB from local curl** but returned `json: {}` from n8n server. Possible: n8n droplet IP is rate-limited or blocked by State.gov WAF, or transient n8n HTTP client failure silently swallowed by `neverError: true`.

**OPM returns 403** from local curl — anti-bot wall. Even if loop had continued, OPM would have yielded empty/error.

**NIH returns 200** — would have yielded data if loop reached it.

---

## §3 · Root Cause

**Root cause class: #5 (HTTP downstream) + structural loop fragility**

Two-layer failure:

### Layer 1: Fetch returned empty for State.gov (trigger)

Fetch HTML node with `neverError: true` and `responseFormat: text` received State.gov response but produced `json: {}` (empty object). The `outputPropertyName: "data"` setting should have placed HTML in `json.data`, but the property was absent. Possible causes:
- n8n droplet IP blocked/throttled by State.gov (returns 200 from local Mac but empty from n8n server)
- Transient HTTP client failure silently consumed by `neverError: true`
- Response body too large for n8n memory allocation (659KB — unlikely but possible on constrained droplet)

### Layer 2: Empty-pipeline loop-back kills remaining iterations (structural bug)

Extract+Format Code node logic:
```javascript
if (!html) return [];  // ← This kills the loop
```

When Fetch returns `json: {}`, Extract finds no HTML in any property (`item.json.data`, `item.json.body`, `item.json` as string). Variable `html` stays empty string. `return []` fires → 0 items emitted → loop-back connection to `splitInBatches` carries 0 items → n8n considers iteration done → **remaining URLs never processed**.

This is the structural bug. Any single URL failure in the batch kills ALL subsequent URLs.

---

## §4 · Fix Recommendation

### Immediate fix (WF66 + fleet template)

Modify Extract+Format Code node: instead of `return []` on empty HTML, return a **sentinel passthrough item** that keeps the loop alive:

```javascript
if (!html) {
  return [{
    json: {
      _loopPassthrough: true,
      _extractFailed: true,
      _failReason: 'empty-html-from-fetch',
      source: source,
      sourceUrl: sourceUrl,
    }
  }];
}
```

Downstream nodes (Aggregate Batch → Build Payload → Webhook) must filter out `_loopPassthrough` items before sending to webhook.

### In Build Payload:
```javascript
const entries = aggregated.entries || [];
const real = entries.filter(e => !e._loopPassthrough);
if (real.length === 0) return [{ json: { skip: true, reason: 'no-real-entries' }}];
```

### Source-specific fixes

1. **OPM** (`opm.gov/news`): returns 403 anti-bot. Replace with OPM RSS feed, OPM sitemap, or remove from source list.
2. **State.gov**: works from local but not from n8n server. Investigate n8n droplet IP reputation or add retry logic.

### Fleet-wide rollout

Apply sentinel passthrough pattern to all 42 workflows with `splitInBatches`. Recommend a template update to the canonical Extract+Format-v4 code block.

---

## §5 · Fleet-Wide Impact Assessment

**42 of 50 workflows** use `n8n-nodes-base.splitInBatches`. All share the same connection topology where Extract+Format loops back to Split URLs. Any URL in any workflow that returns empty/error from Fetch will silently kill remaining URLs.

### Known affected (PARTIAL yield confirmed)
- **WF66** V14 Phase 4: 3-of-5 yield (this diagnostic)
- **WF64** V12 Cascade: 2-of-5 yield (Wave 5, separate heredoc issue)

### At-risk (untested but same pattern)
- WF54 V15 Getty — 1+ URL may fail
- WF65 V13 GuitarCenter/Musicians Friend — 2-of-2 yield (OK if both succeed)
- WF56-WF63 Phase 1-3 expansions — varying source counts
- All WF23-WF50 original fleet — varying vulnerability

### Counter-evidence
- **WF63** V14 Phase 3: 5-of-5 yield GREEN (all sources returned valid HTML)
- Bug is **latent** — only manifests when any single source fails

---

## §6 · Doctrine Yield

**DOC-N8N-SPLIT-URLS-LOOP-EARLY-TERMINATE-OBSERVABILITY**
- Status: 1/5 → **2/5** (this diagnostic provides root-cause cite)
- Rule: n8n `splitInBatches` loop-back connections MUST receive at least 1 item per iteration. Extract+Format nodes MUST emit sentinel passthrough items on zero-yield to prevent premature loop termination.
- Ratification path: 3 more sustained applications (fleet-wide patch + 2 re-fire confirmations)

---

## Appendix A · Execution Metadata

```
WF66 ID: IJlima8jtPNRL4Ee
WF63 ID: 2PFlNsFr0VWQ9SIy (known-good comparison)
Exec 1694: manual · 2026-05-26T23:09:16Z → 23:09:20Z (4s)
Exec 1683 (WF63): manual · 2026-05-26T22:05:04Z → 22:05:19Z (15s · 5-of-5)
n8n instance: n8n.legacy-loop.com
splitInBatches: typeVersion 3 · batchSize 1 · options {}
executionOrder: v1 (both WFs)
```

## Appendix B · Banked Carry-Forwards

1. **CMD-WF66-SPLIT-URLS-PATCH V20 LOW** — apply sentinel passthrough fix to WF66 + RE-FIRE
2. **CMD-N8N-FLEET-AUDIT-SPLIT-URLS V20 LOW** — audit WF54 + WF65 + fleet for same-class vulnerability
3. **CMD-N8N-OBSERVABILITY-LAYER V20 MEDIUM** — Prometheus per-node executionTime histogram + alert on iter < expected count
