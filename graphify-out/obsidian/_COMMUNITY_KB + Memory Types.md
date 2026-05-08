---
type: community
cohesion: 0.18
members: 12
---

# KB + Memory Types

**Cohesion:** 0.18 - loosely connected
**Members:** 12 nodes

## Members
- [[AuditEntry]] - code - lib/sylvia/memory-types.ts
- [[KbCategory]] - code - lib/sylvia-kb/types.ts
- [[KbCorpusEntry]] - code - lib/sylvia-kb/types.ts
- [[KbDocument]] - code - lib/sylvia-kb/types.ts
- [[KbHit]] - code - lib/sylvia-kb/types.ts
- [[KbProvenance]] - code - lib/sylvia-kb/types.ts
- [[KbQueryRequest]] - code - lib/sylvia-kb/types.ts
- [[KbQueryResponse]] - code - lib/sylvia-kb/types.ts
- [[KbSource]] - code - lib/sylvia-kb/types.ts
- [[MemoryHit]] - code - lib/sylvia/memory-types.ts
- [[memory-types.ts]] - code - lib/sylvia/memory-types.ts
- [[types.ts_1]] - code - lib/sylvia-kb/types.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/KB__Memory_Types
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Memory + Audit Store]]
- 2 edges to [[_COMMUNITY_Consensus API Route]]

## Top bridge nodes
- [[memory-types.ts]] - degree 6, connects to 2 communities
- [[AuditEntry]] - degree 3, connects to 2 communities
- [[MemoryHit]] - degree 2, connects to 1 community