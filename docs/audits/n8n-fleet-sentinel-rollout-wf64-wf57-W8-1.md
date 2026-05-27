# n8n Fleet Sentinel Rollout · WF64 + WF57 · Wave 8 W8-1 · 2026-05-27

> **Status:** n8n PUT × 2 applied + CEO Manual Execute × 2 verified
> **Anchor:** HEAD `1b608a1` · W6-1 audit doc origin · agent-3 worktree
> **GATE A:** WF66 v3 RE-FIRE exec=1743 CLEAN (sentinel in Aggregate entries, filtered at BP, 0 leak to Webhook)
> **Doctrine:** DOC-N8N-SPLIT-URLS-LOOP-EARLY-TERMINATE-OBSERVABILITY 4/5 → 5/5 → **BINDING #50 RATIFIES**

---

## §0 · Gate A Verification (WF66 v3 RE-FIRE)

WF66 exec=1743 (manual, v3 patch):
- 6 Split iters (5 loop + 1 done) — all 5 URLs processed
- Aggregate: 4 real entries + 1 sentinel (State.gov `empty-html-from-fetch`)
- Build Payload: 0 sentinel in entries (filtered by `_rawEntries.filter(e => !e._loopPassthrough)`)
- Webhook: 5 calls, 0 sentinel leak

**GATE A: CLEAN.** v3 entries-level sentinel filter proven. Pattern safe for fleet rollout.

---

## §1 · Problem (W6-1 root cause recap)

Compound bug: HTTP downstream silent-fail + Extract `return []` on empty HTML kills `splitInBatches` loop. 42 of 53 workflows carry same latent bug. W7-1 patched WF66 + WF69. This cyl patches WF64 (V12) + WF57 (V3).

---

## §2 · Patches Applied

### WF64 V12 Cascade (id: `5YifCvYqE0gPbF3g`)

| Node | Pre bytes | Post bytes | Delta | Pattern |
|------|----------|-----------|-------|---------|
| Extract | 9,034 | 9,517 | +483 | `_splitMeta` sentinel on `!html` + `!title && !bodyText` |
| Build Payload | 637 | 871 | +234 | `_rawEntries.filter(e => !e._loopPassthrough)` |

PUT response: 200 OK. Topology: Aggregate → entries[] (same as WF66).

### WF57 V3 Craigslist 5-State (id: `J9IsaFabmZs9Ssp5`)

| Node | Pre bytes | Post bytes | Delta | Pattern |
|------|----------|-----------|-------|---------|
| Extract | 3,230 | 3,713 | +483 | Same sentinel pattern |
| Build Payload | 575 | 876 | +301 | `_allExtracted.filter(e => e && e.id && !e._loopPassthrough)` |

PUT response: 200 OK. Topology: **Direct Extract read** (no Aggregate entries passthrough). Existing `.filter(e => e && e.id)` already strips sentinel (no `id` field), but explicit `_loopPassthrough` filter added for observability.

**Drift catch:** WF57 BP uses `$('Extract...').all()` pattern (direct node reference) vs WF64/WF66 `$input.first().json.entries` (Aggregate passthrough). Sentinel filter adapted per-WF BP structure.

---

## §3 · CEO Manual Execute Results

### WF64 exec=1754 (manual, post-patch)
- Split: 6 iters (5 loop + 1 done) — all 5 sources processed
- Extract: 5 iters (4 real + 1 sentinel)
- Build Payload sentinel leak: **0** (filtered)
- Webhook: 5 calls

### WF57 exec=1753 (manual, post-patch)
- Split: 6 iters (5 loop + 1 done) — all 5 Craigslist metros processed
- Extract: 5 iters (5 real + 0 sentinel)
- Build Payload sentinel leak: **0**
- Webhook: 5 calls

---

## §4 · Fleet Sentinel Coverage Summary

| WF | Vertical | Sentinel | BP filter | Verified exec | Status |
|----|----------|----------|-----------|---------------|--------|
| WF66 | V14 Phase 4 | ✅ v3 | ✅ entries-level | 1743 CLEAN | W7-1 |
| WF69 | V8 NHTSA | ✅ v3 | ✅ entries-level | 1742 25-of-25 | W7-1 |
| WF64 | V12 Cascade | ✅ v3 | ✅ entries-level | 1754 CLEAN | **W8-1** |
| WF57 | V3 Craigslist | ✅ v3 | ✅ direct-filter | 1753 CLEAN | **W8-1** |

4 of 42 splitInBatches WFs patched. Remaining 38 banked (29 CLEAN + 2 LOW + 7 other).

---

## §5 · Doctrine Ratification

**DOC-N8N-SPLIT-URLS-LOOP-EARLY-TERMINATE-OBSERVABILITY**
- 1/5: W6-1 root cause cited (audit doc 1b608a1)
- 2/5: W6-1 diagnostic (compound bug class documented)
- 3/5: W7-1 WF66+WF69 sentinel applied (v1→v2→v3 iterative)
- 4/5: W8-1 WF64+WF57 sentinel applied (fleet rollout, 2 BP patterns adapted)
- **5/5: W8-1 close — pattern proven across 4 WFs, 2 BP topologies, 0 sentinel leak**
- **→ BINDING #50 RATIFIES**

Rule: n8n `splitInBatches` Extract nodes MUST return sentinel passthrough `[{json:{_loopPassthrough:true}}]` on zero-yield instead of `[]`. Build Payload nodes MUST filter sentinel entries from aggregated output before Webhook ingest. Pattern adapts per BP topology (Aggregate entries[] vs direct Extract read).

**DOC-N8N-AGGREGATE-NESTED-SENTINEL-ENTRIES-FILTER** 1/5 → 2/5
- W7-1 v2 discovery (sentinel nests in Aggregate entries[], not top-level json)
- W8-1 sustained (WF64 Aggregate entries filter, WF57 direct filter)

---

## §6 · Banked Carry-Forwards

1. **CMD-N8N-FLEET-SENTINEL-OBSERVABILITY-WAVE-9 V20 LOW** — 38 remaining WFs
2. **CMD-WF66-OPM-DROPLET-IP-INVESTIGATE V20 LOW** — OPM + State.gov WAF
3. **CMD-DOCTRINE-LEDGER-BINDING-50-APPEND V20 LOW** — Devin DOCTRINE_LEDGER.md append
4. **CMD-SYLVIA-M14-OBSERVABILITY V20 MEDIUM** — Slack webhook on N sentinel emits
