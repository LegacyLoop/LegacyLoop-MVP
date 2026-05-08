---
type: community
cohesion: 0.25
members: 11
---

# Budget Tracker

**Cohesion:** 0.25 - loosely connected
**Members:** 11 nodes

## Members
- [[.constructor()]] - code - lib/sylvia/dispatcher/budget.ts
- [[.getDailySpent()]] - code - lib/sylvia/dispatcher/budget.ts
- [[.getQuestionSpent()]] - code - lib/sylvia/dispatcher/budget.ts
- [[.record()]] - code - lib/sylvia/dispatcher/budget.ts
- [[.reserve()]] - code - lib/sylvia/dispatcher/budget.ts
- [[BudgetExceeded]] - code - lib/sylvia/dispatcher/budget.ts
- [[BudgetTracker]] - code - lib/sylvia/dispatcher/budget.ts
- [[DEFAULT_DAILY_USD]] - code - lib/sylvia/dispatcher/budget.ts
- [[budget.ts]] - code - lib/sylvia/dispatcher/budget.ts
- [[dailyWindowStart]] - code - lib/sylvia/dispatcher/budget.ts
- [[rolloverIfNeeded()]] - code - lib/sylvia/dispatcher/budget.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Budget_Tracker
SORT file.name ASC
```
