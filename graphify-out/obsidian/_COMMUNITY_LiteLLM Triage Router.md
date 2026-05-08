---
type: community
cohesion: 0.15
members: 23
---

# LiteLLM Triage Router

**Cohesion:** 0.15 - loosely connected
**Members:** 23 nodes

## Members
- [[ALIAS_COST_PER_1M_TOKENS_USD]] - code - lib/sylvia/triage-router.ts
- [[COMPLEXITY_CASCADE]] - code - lib/sylvia/triage-router.ts
- [[GatewayResponse]] - code - lib/sylvia/triage-router.ts
- [[ModelAlias]] - code - lib/sylvia/types.ts
- [[TaskComplexity]] - code - lib/sylvia/types.ts
- [[TriageDecision]] - code - lib/sylvia/types.ts
- [[TriageResult]] - code - lib/sylvia/types.ts
- [[TriageTask]] - code - lib/sylvia/types.ts
- [[TriageTelemetry]] - code - lib/sylvia/types.ts
- [[_getSessionCostUsd()]] - code - lib/sylvia/triage-router.ts
- [[_resetSessionCostMap()]] - code - lib/sylvia/triage-router.ts
- [[callGateway()]] - code - lib/sylvia/triage-router.ts
- [[callProvider()]] - code - app/api/sylvia/consensus/route.ts
- [[checkCeilings()]] - code - lib/sylvia/triage-router.ts
- [[classifyComplexity()]] - code - lib/sylvia/triage-router.ts
- [[decide()]] - code - lib/sylvia/triage-router.ts
- [[estimateCostUsd()]] - code - lib/sylvia/triage-router.ts
- [[estimateTokens()]] - code - lib/sylvia/triage-router.ts
- [[hashPrompt()]] - code - lib/sylvia/triage-router.ts
- [[sessionCostMap]] - code - lib/sylvia/triage-router.ts
- [[triage-router.ts]] - code - lib/sylvia/triage-router.ts
- [[triageAndRoute()]] - code - lib/sylvia/triage-router.ts
- [[types.ts]] - code - lib/sylvia/types.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/LiteLLM_Triage_Router
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_Memory + Audit Store]]
- 2 edges to [[_COMMUNITY_Consensus API Route]]
- 1 edge to [[_COMMUNITY_Stakes Classifier]]

## Top bridge nodes
- [[triageAndRoute()]] - degree 10, connects to 2 communities
- [[triage-router.ts]] - degree 24, connects to 1 community
- [[types.ts]] - degree 8, connects to 1 community
- [[callProvider()]] - degree 3, connects to 1 community
- [[TriageTelemetry]] - degree 3, connects to 1 community