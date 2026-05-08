---
type: community
cohesion: 0.27
members: 11
---

# Agreement Scoring

**Cohesion:** 0.27 - loosely connected
**Members:** 11 nodes

## Members
- [[AgreementResult]] - code - lib/sylvia/dispatcher/agreement.ts
- [[PairScore]] - code - lib/sylvia/dispatcher/agreement.ts
- [[ProviderResponse]] - code - lib/sylvia/dispatcher/agreement.ts
- [[STOPWORDS]] - code - lib/sylvia/dispatcher/agreement.ts
- [[agreement.ts]] - code - lib/sylvia/dispatcher/agreement.ts
- [[computeAgreement()]] - code - lib/sylvia/dispatcher/agreement.ts
- [[extractNumeric()]] - code - lib/sylvia/dispatcher/agreement.ts
- [[jaccardSimilarity()]] - code - lib/sylvia/dispatcher/agreement.ts
- [[numericSimilarity()]] - code - lib/sylvia/dispatcher/agreement.ts
- [[pairwiseScore()]] - code - lib/sylvia/dispatcher/agreement.ts
- [[tokenize()]] - code - lib/sylvia/dispatcher/agreement.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Agreement_Scoring
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Consensus API Route]]

## Top bridge nodes
- [[computeAgreement()]] - degree 3, connects to 1 community