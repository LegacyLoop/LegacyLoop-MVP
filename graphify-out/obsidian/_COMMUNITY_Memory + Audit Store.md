---
type: community
cohesion: 0.15
members: 14
---

# Memory + Audit Store

**Cohesion:** 0.15 - loosely connected
**Members:** 14 nodes

## Members
- [[AUDIT_DIR]] - code - lib/sylvia/memory.ts
- [[CLASSIFICATION_MAP]] - code - lib/sylvia/memory.ts
- [[MEMORY_DIR]] - code - lib/sylvia/memory.ts
- [[RecallSimilarOpts]] - code - lib/sylvia/memory.ts
- [[RecordTriageInput]] - code - lib/sylvia/memory.ts
- [[SylviaMemoryClassificationLiteral]] - code - lib/sylvia/memory.ts
- [[emitTelemetry()]] - code - lib/sylvia/triage-router.ts
- [[getSessionStats()]] - code - lib/sylvia/memory.ts
- [[memory.ts]] - code - lib/sylvia/memory.ts
- [[pruneOld()]] - code - lib/sylvia/memory.ts
- [[queryMemoryByTopic()]] - code - lib/sylvia/memory.ts
- [[recallSimilar()]] - code - lib/sylvia/memory.ts
- [[recordTriage()]] - code - lib/sylvia/memory.ts
- [[toEnumClassification()]] - code - lib/sylvia/memory.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Memory__Audit_Store
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_LiteLLM Triage Router]]
- 3 edges to [[_COMMUNITY_KB + Memory Types]]
- 3 edges to [[_COMMUNITY_Consensus API Route]]

## Top bridge nodes
- [[memory.ts]] - degree 21, connects to 3 communities
- [[recordTriage()]] - degree 4, connects to 1 community
- [[emitTelemetry()]] - degree 3, connects to 1 community