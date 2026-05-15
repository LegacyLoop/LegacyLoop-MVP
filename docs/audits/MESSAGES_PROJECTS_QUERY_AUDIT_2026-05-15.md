# Messages + Projects Query Profile Audit · 2026-05-15

> **Status:** Audit-doc · investigate-only · zero source edit
> **Anchor:** P50 §12 Opportunity flag · "similar audit needed for /messages + /projects"
> **Cylinder:** CMD-MESSAGES-PROJECTS-QUERY-AUDIT V20 v2.1 R29 P53 Wave 10 Slot B
> **Track:** A · Legacy-Loop Claude system
> **Aggregate verdict:** 🔴 1 MUST-ADD · 🟡 1 SHOULD-ADD · 🟢 1 CLEAN-WITH-CAVEAT

---

## §1 · Audit method

Per-route grep + full read · classify per P39 rubric (anchored at `docs/audits/ROUTES_DYNAMIC_DIRECTIVE_AUDIT_2026-05-14.md`):
- 🟢 **CLEAN**: pagination correct · stats query-layer-correct (count/aggregate/groupBy) OR scale-bounded by domain (per-user low cardinality)
- 🟡 **SHOULD-ADD**: lightweight pattern · downstream stats minimal · deep include risk · banked MED
- 🔴 **MUST-ADD**: unbounded findMany feeding `.filter().length` / `.reduce()` stats · P50-class pattern · banked HIGH stats-split spec

All 3 routes already have `export const dynamic = "force-dynamic"` (P42+P46 closure verified §0.5). This audit is the next-tier query-layer audit (post-rendering-class).

---

## §2 · /messages/page.tsx verdict · 🔴 MUST-ADD

- **LOC:** 104
- **force-dynamic:** L11 ✅
- **Queries:**
  - **L26** `prisma.item.findMany` userItems — **UNBOUNDED** (`where: { userId }` · no `take` · `orderBy: { createdAt: "desc" }` · include `aiResult.rawJson`)
  - **L35** `prisma.conversation.findMany` — **UNBOUNDED** (`where: { itemId: { in: itemIds } }` · no `take` · include `messages` (full · no take) + `item.photos take:1`)
- **Downstream stats (L57-64):**
  - `total = conversations.length`
  - `botCount = conversations.filter((c) => c.botScore < 50).length`
  - `humanCount = conversations.filter((c) => c.botScore >= 80).length`
  - `unreadCount = conversations.reduce((sum, c) => sum + c.messages.filter((m) => m.sender === "buyer" && !m.isRead).length, 0)` ← **O(N×M)** in-memory reduce over ALL messages across ALL conversations
- **P50-class signature confirmed:** full list pulled · stats computed via `.filter().length` / `.reduce()` · same anti-pattern dashboard had pre-P50
- **Display use:** `itemsForForm` is map+rename for client (display only · doesn't need full aiResult.rawJson server-side)
- **Classification:** 🔴 **MUST-ADD**
- **Recommended follow-on:** **CMD-MESSAGES-STATS-AGGREGATE-SPLIT V20 · HIGH** — split into:
  - aggregate query: `prisma.conversation.count`/`groupBy` for total/bot/human counts
  - aggregate query: `prisma.message.count({ where: { sender: "buyer", isRead: false, conversation: { item: { userId } } } })` for unreadCount
  - paginated list query: top N conversations for UI render (e.g. 20-50 recent)
  - DROP unbounded userItems findMany · use `prisma.item.findMany({ select: { id, title }, where: { userId } })` minimal-projection for itemsForForm

---

## §3 · /projects/page.tsx verdict · 🟢 CLEAN-WITH-CAVEAT

- **LOC:** 89
- **force-dynamic:** L8 ✅
- **Queries:**
  - **L22** `prisma.project.findMany` — **BOUNDED by user's project count** (typically 1-20 realistic · no `take` · include `items.select(id,status,listingPrice,valuation.high,photos.take:1)`)
  - **L39** `prisma.item.findMany` unassignedItems — **EXPLICIT take:50** · include `photos.take:1` · status filter excludes DRAFT
- **Downstream stats (L46-74):** per-project in-memory derivation from already-included items array
  - `itemCount = p.items.length` · `listedCount = filter.length` · `soldCount` · `revenue reduce` · `portfolio reduce`
- **Per-project items typical scale:** 5-100 items (estate-sale typical · user-bounded)
- **Total payload:** ~20 projects × ~50 items × select-minimal = manageable (~1000 rows worst-case · narrow projection)
- **Classification:** 🟢 **CLEAN-WITH-CAVEAT**
  - Pagination correct (take:50 on unassignedItems)
  - Projects findMany is bounded by domain (user's project count)
  - Per-project stats acceptable at typical user scale
  - **Caveat:** if power-user creates 100+ projects with 200+ items each, per-project stats reduce becomes expensive · banked LOW future-scale audit
- **Recommended follow-on:** **CMD-PROJECTS-FUTURE-SCALE-AUDIT V20 · LOW** (cyclic · re-audit when power-user p99 exceeds 50 projects)

---

## §4 · /projects/[id]/page.tsx verdict · 🟡 SHOULD-ADD

- **LOC:** 96
- **force-dynamic:** L8 ✅
- **Queries:**
  - **L17** `prisma.project.findUnique` — **DEEP NESTED INCLUDE** (items + photos.take:1 + valuation + antiqueCheck + aiResult + conversations.select(id)) · **UNBOUNDED** within single project scope · could fetch 200+ items with full aiResult/valuation/antiqueCheck rows
  - **L36** `prisma.item.findMany` availableItems — **EXPLICIT take:50**
- **Downstream stats (L43-46):** per-project from already-included items array (same pattern as /projects)
  - `itemsSold filter` · `revenue reduce` · `portfolio reduce`
- **Payload risk:** `aiResult` row can be large (rawJson can be multi-KB AI response) · `antiqueCheck` row similar · multiplied by 200 items = multi-MB single-page payload
- **Classification:** 🟡 **SHOULD-ADD**
  - Single-project scope mitigates worst-case
  - But deep includes = oversized payload at high-item-count projects
  - aiResult.rawJson particularly heavy (not needed for project-detail header stats)
- **Recommended follow-on:** **CMD-PROJECTS-DETAIL-INCLUDE-TRIM V20 · MED** — trim include to minimal projection:
  - Drop `aiResult` from project.items include (use separate query if title fallback needed)
  - Drop `antiqueCheck` from project.items include (use separate query if needed)
  - Keep photos.take:1 + valuation.high + status
  - For stats: use `prisma.item.groupBy({ by: ["status"], where: { projectId } })` aggregate

---

## §5 · Aggregate verdict + banked follow-ons

| Route | LOC | Class | Follow-on cyl banked |
|---|---|---|---|
| `/messages` | 104 | 🔴 **MUST-ADD** | **CMD-MESSAGES-STATS-AGGREGATE-SPLIT V20 · HIGH** |
| `/projects` | 89 | 🟢 CLEAN-WITH-CAVEAT | CMD-PROJECTS-FUTURE-SCALE-AUDIT V20 · LOW (cyclic) |
| `/projects/[id]` | 96 | 🟡 SHOULD-ADD | **CMD-PROJECTS-DETAIL-INCLUDE-TRIM V20 · MED** |

**P50-class pattern recurrence:** 1 of 3 audited routes (/messages) confirms the dashboard-class anti-pattern is NOT isolated. Suggests a broader pattern audit may be warranted across the 33 SHOULD-ADD P39 routes (banked Phase D+ vision).

**Shared lib helper opportunity:** all 3 routes hand-roll `filter+reduce` for status-based counts/revenue. Once /messages + /projects/[id] follow-ons ship, a `lib/stats/project-aggregates.ts` helper could template the pattern (banked LOW · CMD-LIB-STATS-HELPER-TEMPLATE V20).

---

## §6 · Cross-references

- **P39 audit:** `docs/audits/ROUTES_DYNAMIC_DIRECTIVE_AUDIT_2026-05-14.md` (classification rubric anchor)
- **P50 §12 carry-forward:** dashboard-stats-aggregate-split (Wave 9 Slot 2 · PARTIAL-SCOPE · class-establish anchor)
- **P51 audit:** `docs/audits/NEXT_CONFIG_OUTPUT_DYNAMIC_AUDIT_2026-05-15.md` (sibling audit · per-route directive canonical verdict)
- **Comparison reference:** P50 dashboard pattern (in main worktree commit `9c338c5`)

---

*Authored R29 P53 Wave 10 Slot B · 2026-05-15 · Track A · Legacy-Loop · agent-2 worktree · Devin L1 spec · IT execute*
