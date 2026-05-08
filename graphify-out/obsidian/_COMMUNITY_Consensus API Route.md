---
type: community
cohesion: 0.16
members: 18
---

# Consensus API Route

**Cohesion:** 0.16 - loosely connected
**Members:** 18 nodes

## Members
- [[ConsensusRequest]] - code - app/api/sylvia/consensus/route.ts
- [[POST()]] - code - app/api/sylvia/consensus/route.ts
- [[ProvenanceEntry]] - code - app/api/sylvia/consensus/route.ts
- [[ProviderAlias]] - code - app/api/sylvia/consensus/route.ts
- [[QUARTET]] - code - app/api/sylvia/consensus/route.ts
- [[SylviaAuthResult]] - code - lib/sylvia/dispatcher/auth.ts
- [[aggregateAnswer()]] - code - app/api/sylvia/consensus/route.ts
- [[appendAuditEntry()]] - code - lib/sylvia/memory.ts
- [[auth.ts]] - code - lib/sylvia/dispatcher/auth.ts
- [[constantTimeEquals()]] - code - lib/sylvia/dispatcher/auth.ts
- [[defaultProvenance()]] - code - app/api/sylvia/consensus/route.ts
- [[errorEnvelope()]] - code - app/api/sylvia/consensus/route.ts
- [[hashQuestion()]] - code - lib/sylvia/memory.ts
- [[index.ts_1]] - code - lib/sylvia/dispatcher/index.ts
- [[resolveProvidedSecret()]] - code - lib/sylvia/dispatcher/auth.ts
- [[route.ts]] - code - app/api/sylvia/consensus/route.ts
- [[safeAppendAudit()]] - code - app/api/sylvia/consensus/route.ts
- [[verifySylviaInternalSecret()]] - code - lib/sylvia/dispatcher/auth.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Consensus_API_Route
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Memory + Audit Store]]
- 2 edges to [[_COMMUNITY_KB + Memory Types]]
- 2 edges to [[_COMMUNITY_Stakes Classifier]]
- 2 edges to [[_COMMUNITY_LiteLLM Triage Router]]
- 1 edge to [[_COMMUNITY_Agreement Scoring]]

## Top bridge nodes
- [[route.ts]] - degree 17, connects to 4 communities
- [[POST()]] - degree 10, connects to 3 communities
- [[appendAuditEntry()]] - degree 3, connects to 1 community
- [[hashQuestion()]] - degree 3, connects to 1 community