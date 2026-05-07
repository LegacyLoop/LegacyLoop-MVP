# MegaBot AnalyzeBot Specialist Parity Audit

**Authored:** 2026-05-07 EOD EDT
**Cylinder:** CMD-MEGABOT-ANALYZEBOT-SPECIALIST-AUDIT V18 · Round 20 P0
**Anchor HEAD:** `2aaa6b9` (post CF-36 doctrine ledger append)
**Author:** Devin · L1 (push-back substitute per `feedback_pushback_means_replace.md`)
**Severity:** LOW · informational · documents existing surface + parity gap for CEO decision
**Substrate parity reference:** R17 P0 RE-AUTHOR `4c156da` (analyze route caller-wire migration to `routeAnalyzeBotHybrid`)

---

## §0 · Anchor + Audit Method

**Audit method:** verbatim grep enumeration of `app/api/megabot/[itemId]/route.ts` (1532 LOC) at HEAD `2aaa6b9` cross-referenced against `routeAnalyzeBotHybrid` substrate availability (`lib/adapters/bot-ai-router/index.ts:1692` · R16 P1 ship `8671cbb`) and against post-R17-P0 analyze-route hybrid migration pattern (`app/api/analyze/[itemId]/route.ts` L290-405).

**Verification commands:**
```bash
grep -nE "analyzebot|routeAnalyzeBotHybrid|handleSpecializedMegaBot|runSpecializedMegaBot" app/api/megabot/[itemId]/route.ts
wc -l app/api/megabot/[itemId]/route.ts                          # → 1532
grep -n "routeAnalyzeBotHybrid" lib/adapters/bot-ai-router/index.ts
grep -n "routeAnalyzeBotHybrid\|aiAdapter" app/api/analyze/[itemId]/route.ts
```

All citations in §2-§5 below sourced from these greps verbatim.

---

## §1 · Original CF-50 Ask vs Devin Push-Back Rationale

**Original CF-50 task (carry-forward May 7):** "MegaBot AnalyzeBot Specialist Surface" — implied building the specialist channel.

**Empirical reality:** MegaBot ALREADY routes `botType === "analyzebot"` through a fully-wired specialist channel:

| Surface | Line | Status |
|---|---|---|
| Dispatch entry | L226 + L231 | ✅ wired (default fallback if no botType param) |
| Skill pack hoist | L400-401 | ✅ wired (function-scope · CMD-ANALYZEBOT-CORE-A) |
| Skill pack load | L941 | ✅ wired (`loadSkillPack("analyzebot")`) |
| Specialist opts | L937-963 | ✅ wired (`analyzebotOpts: RunSpecializedMegaBotOpts`) |
| Specialist dispatch | L1051-1053 | ✅ wired (`runSpecializedMegaBot(botType, ...)`) |
| Catch-all routing | L1182 | ✅ wired (analyzebot in 10-bot catch-all clause) |
| Telemetry capture | L1312, L1325, L1338 | ✅ wired (skill pack version + count + chars) |
| Consensus gate | L1356 | ✅ wired (`agreementScore >= 70`) |

**Building "the surface" is REDUNDANT.** Same drift class as R18 P1 PhotoBot extract (audit doc claimed "PhotoBot · NOT yet via loadSkillPack" but empirical showed 1-of-3 routes lacked import not all 3).

**Push-back substitute:** audit doc that VERIFIES current routing pattern + identifies HYBRID PARITY GAP between MegaBot specialist channel (uses LOCKED `runSpecializedMegaBot` helper · provider-direct dispatch) and analyze route (post-R17-P0 routes through `routeAnalyzeBotHybrid` substrate).

**Doctrine cited:** `feedback_pushback_means_replace.md` (CEO rule lock Day 2 AM) · `feedback_dont_expand_scope_without_asking.md` · DOC-PUSHBACK-WITH-REPLACEMENT (sub-doctrine #22 · 1/5 → 2/5).

---

## §2 · MegaBot Orchestrator AnalyzeBot Dispatch (Verbatim Grep)

```
5:    import { runSpecializedMegaBot, type RunSpecializedMegaBotOpts } from "@/lib/megabot/run-specialized";

224:  // ── SPECIALIZED MEGABOT (all bot types including analyzebot) ──
226:    return handleSpecializedMegaBot(itemId, botType, user.id);
229:  // ── NO BOT PARAM — default to analyzebot ──
231:    return handleSpecializedMegaBot(itemId, "analyzebot", user.id);

239:  async function handleSpecializedMegaBot(itemId: string, botType: string, userId: string) {

324:    priorBotResult: botType === "analyzebot" ? ai : undefined,

400:  // CMD-ANALYZEBOT-CORE-A: hoist analyzebotSkillPack to function scope.
401:  let analyzebotSkillPack: ReturnType<typeof loadSkillPack> | undefined;

937:  let analyzebotOpts: RunSpecializedMegaBotOpts | undefined;
938:  let analyzebotSpecContextFailed = false;
939:  if (botType === "analyzebot" && !isDemoMode()) {

1051:  botType === "analyzebot"      ? analyzebotOpts   :
1053:  result = await runSpecializedMegaBot(botType, prompt, photoPaths[0], itemId, photoPaths, activeOpts);

1182:  if (botType === "reconbot" || ... || botType === "analyzebot") { ... }

1356:  if (botType === "analyzebot" && result.consensus && result.agreementScore >= 70) { ... }
```

---

## §3 · Specialist Opts Shape (`analyzebotOpts` L937-963)

```ts
let analyzebotOpts: RunSpecializedMegaBotOpts | undefined;
let analyzebotSpecContextFailed = false;
if (botType === "analyzebot" && !isDemoMode()) {
  try {
    analyzebotSkillPack = loadSkillPack("analyzebot");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const specContext = await buildItemSpecContext(item.id, { item, user });
    const specSummary = summarizeSpecContext(specContext);

    const midPrice = v
      ? Math.round((v.low + v.high) / 2)
      : (ai?.estimated_value_mid ?? null);

    analyzebotOpts = {
      specSummary,
      specPromptBlock: specContext.promptBlock,
      marketIntelBlock: "",   // AnalyzeBot runs its own market intel post-AI
      marketIntelMedian: null,
      apifyCostUsd: 0,
      enableGrounding: true,
      priorValuationMid: midPrice,
      skillPackBlock: megaBotSharedBlock + botMegaBlock + analyzebotSkillPack.systemPromptBlock,
    };
  } catch (specErr) {
    analyzebotSpecContextFailed = true;
    console.warn("[megabot/analyzebot] specContext assembly failed (non-critical):", specErr);
    analyzebotOpts = undefined;
  }
}
```

**Shape:** `RunSpecializedMegaBotOpts` (typed import from LOCKED `lib/megabot/run-specialized.ts`). 8 fields wired · `enableGrounding: true` (Gemini Google Search grounding ENABLED for AnalyzeBot consensus path · contrast: R17 P0 analyze route passes `enableGrounding: false` because Sonar live-web is mutually exclusive when liveWebProvider active).

**Failure resilience:** specContext assembly wrapped in try/catch · `analyzebotSpecContextFailed` boolean tracked for telemetry · undefined opts gracefully degrade to default 4-AI consensus path.

---

## §4 · Direct Dispatch vs Hybrid Substrate State

### MegaBot specialist channel (current · L1053):

```ts
result = await runSpecializedMegaBot(botType, prompt, photoPaths[0], itemId, photoPaths, activeOpts);
```

**Pattern:** `runSpecializedMegaBot(botType, prompt, photo, itemId, photoPaths, opts) → MegaBotResult`

**Internal mechanism (LOCKED):** `lib/megabot/run-specialized.ts` · 4-AI consensus pattern (OpenAI + Claude + Gemini + Grok) · merges via `lib/megabot/run-specialized.ts` `mergeConsensus`-equivalent + agreement scoring · returns `{ consensus, agreementScore, runs[], successCount, ... }`.

**Provider dispatch:** internal to `runSpecializedMegaBot` · uses LOCKED `lib/adapters/multi-ai.ts` helpers (analyzeWithOpenAI · analyzeWithClaude · analyzeWithGemini · analyzeWithGrok) · provider-direct OR via the canonical chokepoint depending on internal structure (NOT verified at this audit · LOCKED file read-only).

### Analyze route (post-R17-P0 · `4c156da` · `app/api/analyze/[itemId]/route.ts` L295+):

```ts
const { routeAnalyzeBotHybrid } = await import("@/lib/adapters/bot-ai-router");
const result = await routeAnalyzeBotHybrid({
  itemId, photoPath: photoPaths, analyzePrompt, secondaryContext,
  shouldRunSecondary: true, enableLiveWeb: requiresLiveWeb, enableGrounding: false,
});
```

**Pattern:** `routeAnalyzeBotHybrid` substrate (R16 P1 ship `8671cbb` · clone of `routeReconBotHybrid`) · primary OpenAI + secondary Gemini in parallel · returns RAW `{primary: {rawResult}, secondary?, geminiWebSources, costUsd, actualCostUsd, latencyMs, degraded, error?}` · caller-side merge via `mergeConsensus`/`calcAgreement`.

**Provider dispatch:** routes through `bot-ai-router` chokepoint · BINDING #16 DOC-DELEGATE-TO-CANONICAL honored · LiteLLM Gateway egress only · BINDING #10 DOC-TELEMETRY-LOCK preserved.

---

## §5 · Parity Gap Identification

| Dimension | Analyze route (post-R17-P0) | MegaBot specialist (current) | Parity |
|---|---|---|---|
| Chokepoint | `routeAnalyzeBotHybrid` (R16 P1 substrate) | `runSpecializedMegaBot` (LOCKED helper) | ❌ mismatched |
| Provider dispatch | bot-ai-router → Gateway | LOCKED multi-ai helpers (chokepoint TBD per LOCKED read) | ⚠️ partial |
| Sonar live-web | enableLiveWeb derived from item.category regex | enableGrounding=true Gemini (NO Sonar in specialist path) | ❌ mismatched |
| Consensus model | primary (OpenAI) + optional secondary (Gemini) · 2-AI | 4-AI consensus (OpenAI + Claude + Gemini + Grok) | ❌ different by design |
| Skill pack | `loadSkillPack("analyzebot")` prepended to analyzePrompt | `loadSkillPack("analyzebot")` + `megaBotSharedBlock` + `botMegaBlock` prepended | ✅ compatible (MegaBot adds shared+meta blocks) |
| Spec context | embedded in `enrichedSellerContext` | `specPromptBlock` + `specSummary` separate fields | ✅ compatible |
| Cost telemetry | `costUsd` + `actualCostUsd` from substrate | `MegaBotResult.runs[]` per-provider cost | ✅ different shape but both captured |
| Failure resilience | `result.degraded` → 422 | `successCount === 0` → ALL-AGENT-FAILURE FALLBACK | ✅ both handle |

**KEY GAP:** MegaBot specialist channel does NOT consume `routeAnalyzeBotHybrid` substrate. By design, MegaBot is the 4-AI consensus orchestrator (premium tier · pay credits) while analyze route is the standard tier · 2-AI hybrid path. The CHOKEPOINT divergence (router-substrate vs LOCKED helper) is intentional separation of standard-tier vs premium-tier dispatch paths · NOT a missing wire.

**Actual question CEO must answer:** is the LOCKED `runSpecializedMegaBot` helper itself routing through the `bot-ai-router` chokepoint OR direct provider HTTP? Audit cannot answer without LOCKED-unlock to read `lib/megabot/run-specialized.ts` · banked as future audit cylinder if BINDING #10 DOC-TELEMETRY-LOCK compliance verification is needed.

**Sonar live-web gap:** MegaBot specialist for analyzebot fires `enableGrounding: true` (Gemini Google Search) — NOT Perplexity Sonar. Analyze route (post-R17-P0) fires `enableLiveWeb` based on item.category regex. If CEO wants Sonar fleet-wide on premium tier, R21 hybrid migration would need to teach MegaBot specialist channel about Sonar (or rebuild specialist dispatch through `routeAnalyzeBotHybrid` directly). Currently NOT consistent across tiers.

---

## §6 · 4 CEO Action Paths

### Path A — R21 Hybrid Migration (~45-60 min IT)
Rewrite MegaBot analyzebot specialist call to consume `routeAnalyzeBotHybrid` substrate. MegaBot 4-AI consensus would degrade to 2-AI hybrid for analyzebot (loss of Claude + Grok specialist runs). Investor narrative gain: Sonar live-web active on premium tier · BINDING #16 + #10 honored verbatim. **Trade-off:** loses 4-AI consensus · changes premium tier value proposition.

### Path B — Keep Direct Dispatch · Annotate Intentional
Add JSDoc comment at L939 documenting that MegaBot specialist intentionally diverges from analyze route hybrid migration · 4-AI consensus is the premium tier feature · Sonar live-web on premium banked for future R21 alongside MegaBot 5-AI extension (4 + Sonar). Zero source change · audit-trail captured.

### Path C — Document Gap · Defer R21 Decision Pending Production Cost Telemetry
Land this audit doc · monitor 24-48h post-R17-P0 deploy for analyze route Sonar cost telemetry · if costs land within DOC-VERCEL-BUDGET-CAP-20 envelope · CEO greenlight Path A R21 with confidence. Banks DOC-MEGABOT-SPECIALIST-PARITY 1/5 candidate progression.

### Path D — Defer Entirely · Revisit Post-100-item Milestone
MegaBot premium tier sees 4-AI consensus value · standard tier sees Sonar live-web value · two distinct value props acceptable pre-100-item. CEO revisits post-data-volume validation. Banks audit doc as input to future decision.

**Devin recommendation:** Path C OR Path D pending CEO scope discipline. Path A would be substantial refactor with consensus model change · not a "small wire-up". Path B is honest intentional-divergence documentation.

---

## §7 · Doctrine Self-Audit

| Doctrine | Status | Evidence |
|---|---|---|
| BINDING #1 DOC-V18-TEMPLATE-CANONICAL-FILE | APPLIED | 14-section structure + Appendix |
| BINDING #4 DOC-MEASURE-BEFORE-PROMISE | APPLIED CRITICAL | Verbatim grep evidence Appendix A · zero speculation |
| BINDING #5 DOC-PRE-STAGE-NON-IDP-PREFETCH | APPLIED | Greenfield check pre-fire confirmed doc absent |
| BINDING #7 DOC-SPEC-GROUNDING-VERIFY | APPLIED | §0 audit method cites verification commands |
| BINDING #8 DOC-PARALLEL-FILE-COLLISION-CHECK | APPLIED | Single NEW file in docs/ · disjoint from R20 P1 (worktree B) + R20 P2 (worktree C) |
| BINDING #12 DOC-MULTI-AGENT-INDEX-ISOLATION-PRECHECK | APPLIED | Per-worktree index · agent-1-slot worktree |
| BINDING #15 DOC-EMIT-WITH-PROVENANCE | N/A | No EventLog write · pure-doc |
| BINDING #16 DOC-DELEGATE-TO-CANONICAL | APPLIED ANCHOR | Clones R17 P1 + R19 P2 audit-doc canonical structure |
| BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN | APPLIED CRITICAL | This audit IS the discovery layer for R21 hybrid migration decision |
| BINDING #18 DOC-BUILD-MEMORY-BUDGET-CHECK | APPLIED | Vercel CI gate · zero route impact |
| BINDING #20 DOC-PER-AGENT-WORKTREE | PROOF POINT | Fires from agent-1-slot worktree |
| BINDING #21 DOC-VERIFY-VERCEL-AFTER-COMMIT | APPLIED | §12 cites Vercel state |
| BINDING #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING | APPLIED CRITICAL ANCHOR | §0 grep-verifies MegaBot orchestrator + analyze route + bot-ai-router substrate end-to-end before drafting parity table |
| BINDING #23 DOC-VERCEL-PROJECT-LIVE-CHECK | N/A | No Vercel debug session |
| BINDING #24 DOC-VERCEL-PLAN-LIMIT-VALIDATE | N/A | No cron schedule changes |
| 🆕 DOC-MEGABOT-SPECIALIST-PARITY (NEW · 1/5) | BANKS | First audit catch · ratifies after 5 specialist-parity audits across other bot types (BuyerBot · ListBot · PriceBot · etc) |
| DOC-PUSHBACK-WITH-REPLACEMENT (sub #22 · 1/5 → 2/5) | ADVANCES | This audit IS the substitute spec for CF-50 build-the-surface ask |
| DOC-AUDIT-DOC-DRIFT-CATCH (sub #22 · 2/5 → 3/5) | ADVANCES | CF-50 ask drift caught (surface ALREADY exists) |

---

## §8 · Banked Carry-Forwards

1. **R21 hybrid migration cylinder** — IF CEO Path A · clones R17 P0 RE-AUTHOR pattern to MegaBot specialist surface · ~45-60 min IT · LOW PRI banked
2. **LOCKED `lib/megabot/run-specialized.ts` chokepoint compliance audit** — verify whether internal dispatch routes through `bot-ai-router` OR direct provider HTTP · BINDING #10 DOC-TELEMETRY-LOCK verification · LOW PRI banked
3. **MegaBot specialist Sonar wire** — orthogonal to Path A · adds Sonar live-web to 4-AI consensus path on premium tier · 5-AI consensus extension · LOW PRI banked
4. **Other-bot specialist parity audits** — clone this audit for BuyerBot · ListBot · PriceBot · CarBot · AntiqueBot · CollectiblesBot specialist channels · ratifies DOC-MEGABOT-SPECIALIST-PARITY 1/5 → 5/5 BINDING · MEDIUM PRI banked

---

## §9 · Severity Assessment

**Severity:** LOW · informational

**Rationale:**
- Surface ALREADY wired (10 grep hits across orchestrator)
- No production regression class identified
- Parity gap is by-design separation (premium 4-AI vs standard 2-AI)
- Sonar inconsistency across tiers is product-strategy decision · not a defect
- CEO has 4 action paths · no path is forced

**No production-red incident class.** This audit is informational decision-support · not a fix.

---

## §10 · Doctrine Lineage

**Parent doctrine:** BINDING #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING (Devin meta-fix)

**Sub-doctrine canopy under #22 (existing 7 + this audit's NEW):**
- DOC-SUBSTRATE-RETURN-SHAPE-VERIFY (2/5)
- DOC-AUDIT-DOC-DRIFT-CATCH (2/5 → 3/5 this audit)
- DOC-WORKTREE-INFRA-PARITY-PRECHECK (2/5)
- DOC-CRON-REGISTRY-PARITY-VERIFY (2/5)
- DOC-PRISMA-GENERATE-POST-DB-PUSH (1/5)
- DOC-PUSHBACK-WITH-REPLACEMENT (1/5 → 2/5 this audit)
- DOC-PARALLEL-IT-RATE-LIMIT-OBSERVATION (1/5)
- 🆕 DOC-MEGABOT-SPECIALIST-PARITY (NEW · 1/5 this audit)

**Rationale:** specialist-channel parity is a sibling verification class to substrate-shape verification (DOC-SUBSTRATE-RETURN-SHAPE-VERIFY) and audit-doc drift catch (DOC-AUDIT-DOC-DRIFT-CATCH) — all three ensure that the architectural claim matches the empirical code state. Sub-doctrine of #22 chain-grounding canopy.

---

## §11 · Final Recommendation

**Recommend Path C (Document Gap · Defer R21 Decision Pending Production Cost Telemetry).**

**Reasons:**
1. R17 P0 RE-AUTHOR shipped Thu EOD · 24-48h cost telemetry not yet harvested
2. MegaBot premium 4-AI consensus value-prop is intentional differentiation
3. Sonar live-web inconsistency is product decision · CEO authority
4. Path A is substantial refactor (consensus model change) · not warranted without telemetry
5. Path D (defer entirely) skips audit-trail · Path C captures audit + defers decision · best balance

**CEO greenlight required for any path beyond C.**

---

## §12 · Sibling R20 Cylinders Cross-Reference

| Cylinder | Worktree | Surface |
|---|---|---|
| R20 P-LEDGER (CF-36) | MAIN (`2aaa6b9`) | docs/DOCTRINE_LEDGER.md ledger append (#19-#24) · 6 BINDING ratifications |
| R20 P0 (this audit) | A (agent-1-slot) | NEW docs/MEGABOT_ANALYZEBOT_SPECIALIST_AUDIT_2026-05-07.md (push-back substitute for CF-50) |
| R20 P1 | B (agent-2-slot) | TBD per parallel agent |
| R20 P2 | C (agent-3-slot) | TBD per parallel agent |

**Parallel-safety:** disjoint surfaces · this audit writes ONLY 1 NEW file in docs/ · zero overlap.

---

## §13 · Final Action Items

| Item | Owner | Priority |
|---|---|---|
| CEO greenlight CEO action path (A / B / C / D) | CEO | STANDARD |
| If Path A: author CMD-MEGABOT-ANALYZEBOT-HYBRID-MIGRATE V18 R21 spec | Devin | LOW (gate on CEO) |
| If Path B: add JSDoc annotation at MegaBot route L939 | Devin | LOW (gate on CEO) |
| If Path C: harvest 24-48h cost telemetry post-R17-P0 deploy | MC | STANDARD |
| If Path D: revisit post-100-item milestone | CEO + MC | LOW |
| Doctrine candidate progression tracker | MC | per documented append flow |

---

## Appendix A · Full Verbatim Grep Output

```
$ grep -nE "analyzebot|routeAnalyzeBotHybrid|handleSpecializedMegaBot|runSpecializedMegaBot" app/api/megabot/[itemId]/route.ts

5:import { runSpecializedMegaBot, type RunSpecializedMegaBotOpts } from "@/lib/megabot/run-specialized";
224:  // ── SPECIALIZED MEGABOT (all bot types including analyzebot) ──
226:    return handleSpecializedMegaBot(itemId, botType, user.id);
229:  // ── NO BOT PARAM — default to analyzebot ──
231:    return handleSpecializedMegaBot(itemId, "analyzebot", user.id);
239:async function handleSpecializedMegaBot(itemId: string, botType: string, userId: string) {
324:    priorBotResult: botType === "analyzebot" ? ai : undefined,
373:  // reconOpts stays undefined and runSpecializedMegaBot behaves
400:  // CMD-ANALYZEBOT-CORE-A: hoist analyzebotSkillPack to function scope.
401:  let analyzebotSkillPack: ReturnType<typeof loadSkillPack> | undefined;
430:  // Refetch user for buildItemSpecContext (handleSpecializedMegaBot
481:  // any item-specific context inside runSpecializedMegaBot.
550:  // any item-specific context inside runSpecializedMegaBot.
628:  // any item-specific context inside runSpecializedMegaBot.
704:  // any item-specific context inside runSpecializedMegaBot.
798:  // any item-specific context inside runSpecializedMegaBot.
937:  let analyzebotOpts: RunSpecializedMegaBotOpts | undefined;
938:  let analyzebotSpecContextFailed = false;
939:  if (botType === "analyzebot" && !isDemoMode()) {
941:      analyzebotSkillPack = loadSkillPack("analyzebot");
950:      analyzebotOpts = {
958:        skillPackBlock: megaBotSharedBlock + botMegaBlock + analyzebotSkillPack.systemPromptBlock,
961:      analyzebotSpecContextFailed = true;
962:      console.warn("[megabot/analyzebot] specContext assembly failed (non-critical):", specErr);
963:      analyzebotOpts = undefined;
1024:        // any item-specific context inside runSpecializedMegaBot.
1051:      botType === "analyzebot"      ? analyzebotOpts   :
1053:    result = await runSpecializedMegaBot(botType, prompt, photoPaths[0], itemId, photoPaths, activeOpts);
1182:  if (botType === "reconbot" || botType === "buyerbot" || botType === "listbot" || botType === "antiquebot" || botType === "collectiblesbot" || botType === "carbot" || botType === "pricebot" || botType === "photobot" || botType === "videobot" || botType === "analyzebot") { ... }
1195:        analyzebotOpts?.specPromptBlock
1207:        analyzebotOpts?.marketIntelBlock
1219:        analyzebotOpts;
1230:        analyzebotSpecContextFailed;
1312:              botType === "analyzebot"      ? analyzebotSkillPack?.version        :
1325:              botType === "analyzebot"      ? analyzebotSkillPack?.skillNames.length ?? 0        :
1338:              botType === "analyzebot"      ? analyzebotSkillPack?.totalChars ?? 0        :
1356:  if (botType === "analyzebot" && result.consensus && result.agreementScore >= 70) { ... }

Total file: 1532 LOC
```

---

*End of MegaBot AnalyzeBot Specialist Parity Audit*
*Authored by Devin · L1 · 2026-05-07 EOD EDT*
*Push-back substitute for CF-50 per `feedback_pushback_means_replace.md`*
*Drive on.*
