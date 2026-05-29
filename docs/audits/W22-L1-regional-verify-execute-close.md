# W22-L1 · V4 Regional Verify-Execute Close · 🟡 RESIDUAL-GAP (§0.7 PB)

**CMD-W22-L1-V4-REGIONAL-VERIFY-EXECUTE-CLOSE V20 LOW · Agent 1 MAIN worktree · 2026-05-29 PM**
**Class:** EXECUTE-VERIFY · n8n Execute (CEO-gated) + Turso SELECT · zero code mutation · zero PUT
**Anchor:** HEAD `b20d14b` (post-W21-L2 RED-finding)

> **★ HONEST VERDICT: Devin re-scope correct on BP layer · NEW upstream failure exposed at Extract layer · CRITERION #2 NOT CLOSED · honest 3/4 sustained.**

---

## §1 · Empirical Run

### 1.1 · FIX 1 · BP CLEAN at fire-time (re-confirms Devin §0)

All 7 regional WF87-* nodes verified at fire-time HEAD `b20d14b`:

| Region | WF ID | BP `{{` count | active |
|---|---|---|---|
| NE | `FnZAE5EfeGPgnolQ` | **0** ✅ | True |
| SE | `hrK2miE2rZuZ2wUK` | **0** ✅ | True |
| MW | `mfLE8L4p5gfOpbRg` | **0** ✅ | True |
| SC | `m8mHgzs3gugQvpM6` | **0** ✅ | True |
| MTN | `PkLoCtz5Sn1zlMkz` | **0** ✅ | True |
| PAC | `14bmGvd4bAjlyycq` | **0** ✅ | True |
| MA | `i9IOLD8zsAXUdwxC` | **0** ✅ | True |

**Devin re-scope CONFIRMED · BP brace-leak fix is real · W21-L2 "7/7 RED" was on stale pre-15:58Z executions.**

### 1.2 · FIX 2 · Turso V4 region-row pre-baseline

`SELECT COUNT(*) FROM sylvia_corpus_queue WHERE verticalId='V4' AND payload LIKE '%wf-v4-regional-%'` → **0** (expected)
V4 total: **560** (all from old-path WF86 `garage-yard-sale-craigslist` domain)

### 1.3 · FIX 3 · 7 CEO Manual Executes · all clean status

| Region | exec_id | Status | Source URLs | Extract items | BP items | Webhook 200 |
|---|---|---|---|---|---|---|
| **NE** | **1951** | success | 36 | 36 | 36 | 36 |
| **SE** | **1953** | success | 34 | 34 | 34 | 34 |
| **MW** | **1954** | success | 34 | 34 | 34 | 34 |
| **SC** | **1955** | success | 25 | 25 | 25 | 25 |
| **MTN** | **1957** | success | 25 | 25 | 25 | 25 |
| **PAC** | **1958** | success | 26 | 26 | 26 | 26 |
| **MA** | **1952** | success | 29 | 29 | 29 | 29 |
| **Total** | — | 7/7 success | 209 | 209 | 209 | 209 |

Zero SyntaxError · zero error-node · 7/7 status=success.

### 1.4 · FIX 4 · Turso V4 region-row POST-delta

`SELECT COUNT(*) FROM sylvia_corpus_queue WHERE verticalId='V4' AND payload LIKE '%wf-v4-regional-%'` → **0 (unchanged)**
V4 total: **560 (unchanged)**

Per-region cohort (NE/SE/MW/SC/MTN/PAC/MA): **0 each**.

**209 Source URLs · 209 Extract items · 209 BP items · 209 Webhook 200 · 0 V4 rows landed.**

---

## §2 · NEW Failure Class Exposed (§0.7 PUSH-BACK applied)

Inspected exec 1951 (NE) raw payload data:

```
=== BP first payload (per-iteration) ===
{ "skip": true, "reason": "all-entries-sentinel" }

=== Webhook first response ===
{ "ok": true }

=== Extract per-iteration ===
run#0: SENTINEL (no reason populated)
run#1: SENTINEL (no reason populated)
```

**Root cause:** Extract node emits sentinel passthrough on every iteration · BP correctly filters all-sentinel and emits `{skip: true, reason: all-entries-sentinel}` · Webhook acknowledges `{ok: true}` · NO real entries written to `sylvia_corpus_queue`.

**Class:** Upstream Extract regex/parser failure (Craigslist HTML structure mismatch · OR sentinel-on-zero-yield pattern returning sentinel for valid content). BP brace fix is REAL but masks the Extract failure that the W21-L2 audit also caught (just at the wrong node).

W21-L2 "7/7 RED" was directionally correct (cron path also produces no rows) · root cause cite was wrong (BP brace leak vs Extract zero-yield) · BP fix was real but insufficient.

---

## §3 · Verdict · CRITERION #2 NOT CLOSED · Honest 3/4 Sustained

| Acceptance criterion | State |
|---|---|
| 7 BP CLEAN re-confirmed at fire-time | ✅ |
| 7 exec_ids cited (no SyntaxError) | ✅ |
| 7 region-row cohorts in Turso | ❌ **0 across all 7 regions** |
| Criterion #2 verdict | 🔴 **NOT CLOSED · residual-gap** |
| W21-L1 scorecard amendment | **HELD** (do not fake-close) |

Per §0.7: "Honest partial beats fake complete. If a fresh execution surfaces a NEW error (not the brace leak), do NOT declare #2 closed."

**W21-L1 close-verification audit scorecard 3/4 SUSTAINED · NOT amended to 4/4.**

---

## §4 · LAW #38 HARD GUARD Attestation

- ZERO `lib/sylvia/*` mutations
- ZERO `app/*` mutations
- ZERO `scripts/*` mutations
- ZERO `prisma/schema.prisma` migrations
- ZERO n8n PUT operations this cyl (read-only GET + CEO-gated Execute)
- ZERO Vercel deploys
- Repo edits: this audit doc only
- `git diff HEAD --name-only | grep -E "lib/|app/|scripts/"` → 0 hits

---

## §5 · Doctrine Sustained

- **BINDING #17** audit-first wire (BP `{{`-count verified · Turso baseline cited pre-execute)
- **BINDING #20** main worktree direct-push (13+/5 LAW-READY)
- **BINDING #28** drift catch (false-GREEN at BP layer · NEW failure at Extract layer)
- **BINDING #30** §0.5 17-check confirmed
- **BINDING #31** push-back-with-replacement (§0.7 applied · NOT fake-close)
- **BINDING #38** empirical-cite verbatim (7 exec_ids · per-node items · webhook response)
- ★ LAW #38 HARD GUARD attested · zero code mutation

### Doctrine candidate progression
- **DOC-PREMATURE-CLOSE-CLAIM**: progressing (W21-L2 wrong-layer cite + W22-L1 honest residual = 2/5)
- **DOC-AGGREGATE-CHILD-VERIFICATION** progressing (exec status=success ≠ end-to-end success · 1/5 anchored)

---

## §6 · BINDING #34 Widened Cite

- **(a) Commit SHA:** *(filled post-commit)*
- **(b) Vercel dpl:** N/A (audit-doc + n8n read · zero deploy)
- **(c) Empirical verify:** 7 exec_ids (1951/1953/1954/1955/1957/1958/1952) · per-region item counts · webhook responses cited verbatim · Turso V4 region-row delta = 0 confirmed

---

## §7 · Flags (V15 6-bullet)

- **Gaps:** Extract sentinel-on-zero-yield exposed · 7 regions Extract upstream broken (Craigslist HTML structure issue likely)
- **Risks:** W21-L2 RED finding partially correct (rows don't land) but root cause cite was wrong layer · future false-GREENs masked by `status=success`
- **Missed data:** Per-region URL sample (which Craigslist URLs · what HTML the Extract sees)
- **Carry-forward:** Targeted Extract debug for ONE region (NE smoke · cheapest) · diagnose Craigslist HTML parse · clone canonical Extract pattern (BINDING #16) from a working V4 WF if one exists
- **Suggestions:** Bank `DOC-EXEC-STATUS-SUCCESS-ENVELOPE` candidate (status=success ≠ rows-ingested · drain consumer is the ground truth not n8n exec status)
- **Opportunity:** Once Extract fixed · same 7 WFs · single re-execute closes #2 cleanly

### Flag routing (V20 8-cat)

- **STANDALONE:** Provenance bank · who applied 14:00-15:58Z BP fix (uncited)
- **DOCTRINE:** DOC-PREMATURE-CLOSE-CLAIM 2/5 · DOC-AGGREGATE-CHILD-VERIFICATION 1/5
- **MC-TASK:** Scorecard stays 3/4 · #2 residual cited · MC posts honest status
- **CYCLIC:** Regional cron health monitor (per-region yield baseline)
- **RYAN-SIDE:** Approve targeted Extract debug cyl (W22-L2 candidate)
- **POST-EPIC:** Phase C V4 regional yield pending Extract fix
- **BANKED:** W22-L2 Extract diagnostic + repair (NE region · canonical clone if available)
- **OPERATIONAL:** 7 WFs runnable / status=success / zero rows · honest cited
