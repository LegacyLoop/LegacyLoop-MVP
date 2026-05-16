# Sylvia Pattern Engine · Architecture

> **Cylinder:** CMD-SYLVIA-PATTERN-ENGINE-CONSOLIDATE V20 v2.1 R29 P74 · Wave 15 Slot C
> **Track:** B · brain primitive · 7-memory framework §10
> **Authored:** 2026-05-16 · IT execute · Devin L2 spec
> **Class:** BUILD-UP · 1 NEW substrate + 1 SURGICAL extension + 1 NEW doc
> **§5.X Gate 1:** PATH A · classify.ts additive complexityHint extension SHIPPED

---

## §1 · Why

Pre-P74 signals:
- MegaBot 4-AI consensus (`lib/megabot/run-specialized.ts`) — runs per-task
- Truth Gate agreement scoring (`lib/sylvia/dispatcher/agreement.ts`) — per-task pairwise
- Triage classifier (`lib/sylvia/triage-router.ts` `classifyComplexity`) — per-task rule cascade

Each runs **per-task in isolation**. No memory · no learning loop · no cross-task pattern. Repeated questions get re-classified from scratch.

P74 introduces **`lib/sylvia/pattern.ts`** that **unifies prior signals into a recognizer**:
- Consumes P72 episodic recall (`recallByCause("triage", windowDays, limit)`)
- Consumes P73 semantic recall (`recallByEntity(topicHint)`)
- Aggregates historical Truth Gate agreement scores
- Emits `{ recognized, confidence, suggestedComplexity, rationale }` for classifier consumption

---

## §2 · API surface

`lib/sylvia/pattern.ts` exports:

```typescript
recognizePattern({ promptHash, prompt, sessionId, historyWindowDays? = 30 })
  → { recognized, patternId?, confidence: 0-100, suggestedComplexity?, rationale, historyCount, agreementMedian? }

recognizeBatch(inputs[]) → results[]  // Promise.all parallel

getRecognizerStats() → { totalPatterns, byComplexity, avgConfidence }
```

`lib/sylvia/dispatcher/classify.ts` extends additively (PATH A · §5.X Gate 1):

```typescript
preClassifyPatternHint({ promptHash, prompt, sessionId })
  → { hint?: TaskComplexity, confidence: 0-100 }
```

Feature-flag gated: returns `{ confidence: 0 }` when `SYLVIA_PATTERN_HINT_ENABLED !== "1"` (default OFF). Existing `classifyStakes` signature UNCHANGED. Existing consumers UNAFFECTED.

---

## §3 · Recognizer algorithm (rule-based v1)

1. **Recall historical triages** via `recallByCause("triage", windowDays=30, limit=50)`
2. **Filter** by `promptHash` exact match OR `sessionId` match in episodic payload
3. **Pull semantic context** via `recallByEntity(topicHint(prompt), limit=10, fuzzy=true)`
4. **Aggregate agreement** scores from prior consensus events (median)
5. **Derive suggestedComplexity** via rule cascade:
   - Strong agreement (≥85) + abundant history (≥8) → `simple`
   - Low agreement (<60) → `complex`
   - Rich semantic (≥5) + moderate history (≥3) → `medium`
   - Sparse history (≤2) + sparse semantic (≤2) → `specialized`
   - Default → `medium`
6. **Compute confidence**: weighted blend
   - 40% history score (cap 100 at 12.5 entries)
   - 30% semantic score (cap 100 at 8.3 entries)
   - 30% agreement score (passthrough)
7. **Emit rationale**: `history=N · semantic=N · agreement=N · conf=N · →complexity · [band]`

### Confidence bands

| Range | Label | Behavior |
|---|---|---|
| ≥75 | strong | recognized=true · patternId emitted |
| ≥50 | moderate | recognized=true · patternId emitted |
| ≥25 | weak | recognized=true · patternId emitted |
| <25 | insufficient | recognized=false · no patternId |

---

## §4 · Extension contract (classify.ts · PATH A)

```typescript
// classify.ts (post-P74 additive)
const PATTERN_HINT_ENABLED = process.env.SYLVIA_PATTERN_HINT_ENABLED === "1";

export async function preClassifyPatternHint(input) {
  if (!PATTERN_HINT_ENABLED) return { confidence: 0 };
  try {
    const result = await recognizePattern(input);
    return { hint: result.suggestedComplexity, confidence: result.confidence };
  } catch (err) {
    console.error("[sylvia-classify] preClassifyPatternHint failed:", err);
    return { confidence: 0 };
  }
}
```

**Doctrine:**
- Existing `classifyStakes` UNCHANGED (BINDING #16 honored)
- NEW fn only · zero existing-path mutation
- Feature flag default OFF · zero runtime behavior change v1
- NEVER throws · failure returns `{ confidence: 0 }`

---

## §5 · Activation path (CEO routes)

**v1 ship (this fire):** code present · flag OFF · zero runtime impact

**Phase 9.5 activation (CEO routes via Slack STATUS):**
1. `vercel env add SYLVIA_PATTERN_HINT_ENABLED 1 production`
2. Vercel redeploy · Lambda env refresh
3. Consumer (chat handler · triage caller) optionally fold `preClassifyPatternHint().hint` into `TriageTask.complexityHint`
4. Monitor episodic stream for pattern accuracy · banked telemetry cyl

**Phase 9.9 enablement:** LLM-based recognizer + self-introspection loop feedback into skill-pack update queue (banked vision · this cyl is foundation).

---

## §6 · Doctrine

- **BINDING #5** · payload field consumes episodic data only · no creds
- **BINDING #16** · clones `dispatcher/agreement.ts` numeric-scoring pattern verbatim · existing classifyStakes UNTOUCHED
- **BINDING #17** · §0.3 substrate read end-to-end · 7 canonical signatures cited
- **BINDING #25** · $0 AI spend v1 · LLM escalation banked Phase 9.9
- **BINDING #28** · drift catch: 6 substrate signatures verified pre-write
- **BINDING #34** · widened cite (commit SHA = deploy SHA · dpl Ready · curl variety + local smoke)
- **BINDING #35** · DOC-SPEC-AUTHORING-DEEP-DIVE-MANDATORY sustains

---

## §7 · Consumer integration (banked)

- **Chat handler** (`lib/sylvia/chat/handler.ts` · banked post-Wave-15): consult `preClassifyPatternHint` on first turn for context priming
- **Triage caller** consumers (optional): fold `hint` into `TriageTask.complexityHint` before `triageAndRoute()` call
- **Skill-pack update queue** (Phase 9.9): patterns with low confidence → skill-pack candidate authoring
- **Investor narrative**: "Sylvia learns from prior questions" — true differentiator vs stateless competitors

---

## §8 · Phase 9.9 self-introspection loop (banked vision)

This cyl is **foundation**, not closure. Phase 9.9 closes the loop:
1. LLM-based recognizer replaces rule cascade (when accuracy plateaus)
2. Feedback channel: pattern misses → skill-pack creation queue
3. Auto-reindex semantic graph on skill-pack updates (P73 watcher banked)
4. Continuous learning curve · investor-narrative deepening

---

## §9 · Cross-references

- Pattern source: `lib/sylvia/dispatcher/agreement.ts:86` (numeric-scoring clone)
- Type source: `lib/sylvia/types.ts:16` (TaskComplexity union)
- Episodic dep: `lib/sylvia/episodic.ts:161` (recallByCause)
- Semantic dep: `lib/sylvia/semantic.ts:221` (recallByEntity)
- Classifier extension: `lib/sylvia/dispatcher/classify.ts` (post-P74 additive)
- Cognitive architecture: `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` §10 (pattern engine)
- Sibling Wave 15 cyls: P72 episodic (live) · P73 semantic (live) · this fire closes brain-primitive trio

---

*Authored R29 P74 Wave 15 Slot C · 2026-05-16 · Track B · agent-3 worktree*
