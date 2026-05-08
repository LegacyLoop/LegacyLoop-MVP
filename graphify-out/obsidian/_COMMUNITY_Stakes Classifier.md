---
type: community
cohesion: 0.50
members: 5
---

# Stakes Classifier

**Cohesion:** 0.50 - moderately connected
**Members:** 5 nodes

## Members
- [[Stakes]] - code - lib/sylvia/dispatcher/classify.ts
- [[classify.ts]] - code - lib/sylvia/dispatcher/classify.ts
- [[classifyStakes()]] - code - lib/sylvia/dispatcher/classify.ts
- [[index.ts]] - code - lib/sylvia/index.ts
- [[preflightStakes()]] - code - lib/sylvia/dispatcher/classify.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Stakes_Classifier
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Consensus API Route]]
- 1 edge to [[_COMMUNITY_LiteLLM Triage Router]]

## Top bridge nodes
- [[classifyStakes()]] - degree 4, connects to 2 communities
- [[index.ts]] - degree 2, connects to 1 community