# Graph Report - lib/sylvia + lib/sylvia-kb + lib/dossier + app/api/sylvia  (2026-05-08)

## Corpus Check
- 14 files · ~6,778 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 103 nodes · 151 edges · 8 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_LiteLLM Triage Router|LiteLLM Triage Router]]
- [[_COMMUNITY_Consensus API Route|Consensus API Route]]
- [[_COMMUNITY_Memory + Audit Store|Memory + Audit Store]]
- [[_COMMUNITY_KB + Memory Types|KB + Memory Types]]
- [[_COMMUNITY_Agreement Scoring|Agreement Scoring]]
- [[_COMMUNITY_Budget Tracker|Budget Tracker]]
- [[_COMMUNITY_Dossier Schema|Dossier Schema]]
- [[_COMMUNITY_Stakes Classifier|Stakes Classifier]]

## God Nodes (most connected - your core abstractions)
1. `triageAndRoute()` - 10 edges
2. `POST()` - 10 edges
3. `pairwiseScore()` - 6 edges
4. `BudgetTracker` - 6 edges
5. `rolloverIfNeeded()` - 5 edges
6. `decide()` - 4 edges
7. `recordTriage()` - 4 edges
8. `classifyStakes()` - 4 edges
9. `verifySylviaInternalSecret()` - 4 edges
10. `classifyComplexity()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `classifyStakes()`  [INFERRED]
  app/api/sylvia/consensus/route.ts → lib/sylvia/dispatcher/classify.ts
- `POST()` --calls--> `computeAgreement()`  [INFERRED]
  app/api/sylvia/consensus/route.ts → lib/sylvia/dispatcher/agreement.ts
- `callProvider()` --calls--> `triageAndRoute()`  [INFERRED]
  app/api/sylvia/consensus/route.ts → lib/sylvia/triage-router.ts
- `POST()` --calls--> `verifySylviaInternalSecret()`  [INFERRED]
  app/api/sylvia/consensus/route.ts → lib/sylvia/dispatcher/auth.ts
- `classifyStakes()` --calls--> `triageAndRoute()`  [INFERRED]
  lib/sylvia/dispatcher/classify.ts → lib/sylvia/triage-router.ts

## Communities (8 total, 0 thin omitted)

### Community 0 - "LiteLLM Triage Router"
Cohesion: 0.15
Nodes (19): callProvider(), ALIAS_COST_PER_1M_TOKENS_USD, callGateway(), checkCeilings(), classifyComplexity(), COMPLEXITY_CASCADE, decide(), estimateCostUsd() (+11 more)

### Community 1 - "Consensus API Route"
Cohesion: 0.16
Nodes (15): aggregateAnswer(), ConsensusRequest, defaultProvenance(), errorEnvelope(), POST(), ProvenanceEntry, ProviderAlias, QUARTET (+7 more)

### Community 2 - "Memory + Audit Store"
Cohesion: 0.15
Nodes (9): AUDIT_DIR, CLASSIFICATION_MAP, MEMORY_DIR, RecallSimilarOpts, recordTriage(), RecordTriageInput, SylviaMemoryClassificationLiteral, toEnumClassification() (+1 more)

### Community 3 - "KB + Memory Types"
Cohesion: 0.18
Nodes (10): KbCategory, KbCorpusEntry, KbDocument, KbHit, KbProvenance, KbQueryRequest, KbQueryResponse, KbSource (+2 more)

### Community 4 - "Agreement Scoring"
Cohesion: 0.27
Nodes (10): AgreementResult, computeAgreement(), extractNumeric(), jaccardSimilarity(), numericSimilarity(), PairScore, pairwiseScore(), ProviderResponse (+2 more)

### Community 5 - "Budget Tracker"
Cohesion: 0.25
Nodes (5): BudgetExceeded, BudgetTracker, dailyWindowStart, DEFAULT_DAILY_USD, rolloverIfNeeded()

### Community 6 - "Dossier Schema"
Cohesion: 0.25
Nodes (6): DossierItem, DossierItemSummary, DossierMetadata, DossierSection, DossierStatus, DossierVersion

### Community 7 - "Stakes Classifier"
Cohesion: 0.5
Nodes (3): classifyStakes(), preflightStakes(), Stakes

## Knowledge Gaps
- **35 isolated node(s):** `ALIAS_COST_PER_1M_TOKENS_USD`, `COMPLEXITY_CASCADE`, `sessionCostMap`, `GatewayResponse`, `RecordTriageInput` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST()` connect `Consensus API Route` to `LiteLLM Triage Router`, `Agreement Scoring`, `Stakes Classifier`?**
  _High betweenness centrality (0.232) - this node is a cross-community bridge._
- **Why does `computeAgreement()` connect `Agreement Scoring` to `Consensus API Route`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `triageAndRoute()` connect `LiteLLM Triage Router` to `Memory + Audit Store`, `Stakes Classifier`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `triageAndRoute()` (e.g. with `classifyStakes()` and `callProvider()`) actually correct?**
  _`triageAndRoute()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `POST()` (e.g. with `verifySylviaInternalSecret()` and `classifyStakes()`) actually correct?**
  _`POST()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ALIAS_COST_PER_1M_TOKENS_USD`, `COMPLEXITY_CASCADE`, `sessionCostMap` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._