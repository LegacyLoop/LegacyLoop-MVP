---
type: community
cohesion: 0.25
members: 9
---

# Dossier Schema

**Cohesion:** 0.25 - loosely connected
**Members:** 9 nodes

## Members
- [[DossierItem]] - code - lib/dossier/types.ts
- [[DossierItemSummary]] - code - lib/dossier/types.ts
- [[DossierMetadata]] - code - lib/dossier/types.ts
- [[DossierSection]] - code - lib/dossier/types.ts
- [[DossierStatus]] - code - lib/dossier/types.ts
- [[DossierVersion]] - code - lib/dossier/types.ts
- [[render-stub.ts]] - code - lib/dossier/render-stub.ts
- [[renderDossierStub()]] - code - lib/dossier/render-stub.ts
- [[types.ts_2]] - code - lib/dossier/types.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Dossier_Schema
SORT file.name ASC
```
