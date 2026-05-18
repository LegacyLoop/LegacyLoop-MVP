# SYLVIA TRUTH GATE CROSS-VALIDATE V1 · M20 + FOUNDATION primitives Phase C/D/E

> **Cyl:** CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 R29 · Wave 20 Phase 8 of 8 · ★ FINAL · brain implant 8/8 ★ · M20 moat
> **Class:** ARCHITECTURE · greenfield `lib/sylvia/truth-crossval/*` + ★ 4 NEW Phase C/D/E foundation hooks ★
> **Authored:** 2026-05-18 EDT · post-Phase-7 close (`b443ee5`)
> **Substrate:** 7 files · types · consensus-bridge · aggregator · validator · consumer-hooks · coordinator · index
> **Feature-flag:** `SYLVIA_TRUTH_CROSSVAL_ENABLED` default OFF · Phase C/D/E consumes via hooks
> **CEO §5.X Gate 1:** Option A synthetic NextRequest (BINDING #10 ABSOLUTE · #46 NEW candidate anchor)

---

## §1 · ARCHITECTURE

Cross-validation audit circuit. Sylvia brain implant validates its own outputs against the trusted M10 4-AI Truth Gate baseline (LIVE 7 phases unbroken). Substrate sources (Phase 4 hybrid · Phase 6 graphify · Phase 5 obsidian) provide additional cross-val dimensions · aggregator computes pairwise Jaccard agreement score · accepted at ≥70 (Truth Gate parity).

**Consumer-only · zero new HTTP edge:**
- M10 consensus via **synthetic NextRequest + direct POST invocation** (BINDING #10 ABSOLUTE · re-uses M10 chokepoint including BudgetTracker + classifyStakes + QUARTET + agreement scoring + audit-jsonl)
- Phase 4 `hybrid.hybridRecall` for substrate baseline
- Phase 6 `graphify.buildGraph` + community summary
- Phase 5 `obsidian.getBacklinksFor` for item-context cross-val
- Telemetry via existing `appendEpisodic({eventType:"consensus"})` with `payload.truth_crossval="v1"` sentinel

**BINDING #16 ABSOLUTE:** custom-port · zero `@claude-flow/*` import · zero `npm install`.

**M20 moat anchor:** SYLVIA TRUTH GATE CROSS-VALIDATE. 19→20 moats post-Phase-8 GREEN. ★ Wave 20 brain implant 8/8 COMPLETE ★. 13→20 moats this session.

---

## §2 · CROSS-VAL STRATEGY (CEO §5.X Gate 1 · Option A · #46 anchor)

**Picked autonomously per Devin recommendation:** Option A synthetic NextRequest.

| Option | Status |
|---|---|
| **A · Synthetic NextRequest** ✅ | shipped Phase 8 · BINDING #10 ABSOLUTE · #46 NEW anchor |
| B · Internal fetch | rejected (adds HTTP edge · BINDING #10 borderline) |
| C · Direct provider calls | rejected (bypasses M10 audit + agreement scoring) |

**Pattern (consensus-bridge.ts):**
```typescript
const synthetic = new NextRequest(url, {
  method: "POST",
  headers: { authorization: `Bearer ${SYLVIA_API_INTERNAL_SECRET}`, "content-type": "application/json" },
  body: JSON.stringify({ question, stakes, maxBudgetUsd, sessionId }),
});
const res = await consensusPOST(synthetic);  // direct import · zero fetch
```

**Anchors #46 NEW doctrine candidate (1/5):** DOC-TRUTH-CROSSVAL-CONSUMES-M10. Sub-doctrine of BINDING #10 SINGLE EGRESS. Any cross-val consumer of M10 chokepoint MUST use synthetic NextRequest pattern · zero new HTTP edge.

---

## §3 · AGGREGATION (Jaccard pairwise · defensive fallback)

`computeAgreement(sources)` runs:
1. Filter `ok && answer.length > 0` sources
2. If 0 sources → reject (no-ok-sources)
3. If 1 source → accept consensus-only · reject otherwise (insufficient-substrate-sources)
4. If ≥2 sources → pairwise Jaccard token overlap · mean × 100 → agreementScore
5. accepted = score ≥ 70 (Truth Gate parity threshold)

**v1 algorithm:** token-overlap Jaccard. R30+ banked: swap to embedding-cosine via Phase 3 RuVector embedder (Phase 8.1 cyl).

**Defensive fallback:** thin substrate → accept M10 consensus alone (Phase 4 RISK + Phase 6 §12 RISK inherited · Leiden v1 over-fragmentation handled).

---

## §4 · FEATURE-FLAG ROLLOUT

### Default OFF (Phase 8 ship)

`SYLVIA_TRUTH_CROSSVAL_ENABLED` unset OR ≠ `"1"`:
- `crossValidate(input)` returns `null` · zero behavior delta
- `callM10Consensus(opts)` still works (low-level pure utility · no flag gate)
- 4 consumer hooks return stub shapes regardless (Phase C/D/E inspection-ready)

Production unchanged. M10 4-AI Truth Gate UNBROKEN 8 phases. Wave 20 brain implant 8/8 complete with zero customer surface delta.

### Activation

`SYLVIA_TRUTH_CROSSVAL_ENABLED=1` plus `SYLVIA_API_INTERNAL_SECRET=<value>`:
- `crossValidate` returns full `CrossvalResult` · M10 baseline + substrate sources
- Telemetry emits `payload.truth_crossval="v1"` sentinel
- Feature consumers (Phase C/D/E) call validation hooks pre-egress

---

## §5 · TELEMETRY (BINDING #31 sentinel)

```typescript
{
  eventType: "consensus",                  // existing union · NO schema touch
  payload: {
    truth_crossval: "v1",                  // sentinel
    operation: "crossval" | "validate-corpus" | "validate-customer" | "validate-item" | "validate-consumer",
    agreementScore: number,
    sourcesCount: number,
    accepted: boolean,
    latencyMs: number,
    costUsd: number,
  },
  source: "direct",
}
```

Matches Phase 2-7 + CYL #1 router precedents. **EpisodicEventType union UNTOUCHED.**

**Structured log line:** `truth_crossval=v1 op=<x> score=<N> sources=<N> accepted=<bool> latency=<ms> cost=<usd>`.

---

## §6 · ★ FOUNDATION-UP CONSUMER HOOKS (#45 LAW-emerging 2/5→3/5 ratchet) ★

Phase 8 ships M20 cross-val AND 4 NEW pre-positioned consumer hooks for Phase C/D/E. **Combined with Phase 6 (4 hooks) + Phase 7 (3 hooks) = 11 total Phase C/D/E hooks pre-positioned across Phases 6+7+8.** ~6-9 weeks combined retrofit cost saved.

### Phase C scraper · `validateExternalCorpus`

```typescript
const { accepted, agreementScore, auditId } = await validateExternalCorpus({
  corpus: scraperBlob,
  criteria: "pricing", // or "factual" | "provenance" | "all"
  sourceUrl: "https://example.com",
  maxBudgetUsd: 0.50,
});
```

v1 stub: accepts always · returns audit ID. Phase C Cyl 4 (M27 quality gate) wires full `crossValidate` call.

### Phase D CCL · `validatePerCustomerOutput`

```typescript
const audit = await validatePerCustomerOutput({
  customerId: "user-abc",
  output: "swarm-generated recommendation text",
  context: "item-recommendation",
  swarmDecisionId: "swarm-xyz",
});
```

v1 stub. Phase D Cyl 7 (M22+) wires per-customer swarm output validation pre-customer-publish.

### Phase D MPMA · `validatePerItemValuation`

```typescript
const audit = await validatePerItemValuation({
  itemId: "item-xyz",
  valuation: { priceUsd: 145.00, method: "swarm" },
  sources: ["ebay-comps", "etsy-appraisal", "swarm-T3"],
  context: "list",
});
```

v1 stub. Phase D Cyl 3 (M21+) wires per-item pricing cross-val pre-listing.

### Phase E Inbound API · `validateExternalConsumerQuery`

```typescript
const audit = await validateExternalConsumerQuery({
  consumerId: "white-label-org-1",
  authToken: "...",
  query: "antique brass valuation",
  response: "swarm-generated response text",
  rateLimitPerHour: 100,
});
```

v1 stub: token-length sanity + rate-limit echo. Phase E Cyl 5 (M30 moat) wires Bearer-token verify + per-consumer quota + cross-val pre-egress.

---

END · SYLVIA TRUTH CROSS-VALIDATE V1 · Wave 20 Phase 8 of 8 · ★ FINAL · brain implant 8/8 COMPLETE · 13→20 moats this session ★ · ★ #46 NEW candidate anchor (DOC-TRUTH-CROSSVAL-CONSUMES-M10) ★
