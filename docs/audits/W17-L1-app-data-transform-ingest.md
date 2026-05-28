# W17-L1 · App-Data Transform-Ingest · ★ HEADLINE (+44% Sylvia density)

**CMD-W17-L1-APP-DATA-TRANSFORM-INGEST V20 MEDIUM · Agent 1 MAIN worktree**
**Anchor:** T1 W16-R1 audit (2e07637) · CEO+MC PHASE 1 re-sequence · 4-lane parallel · 2026-05-28

---

## §1 · Empirical Run

| Metric | Value |
|---|---|
| run_tag | `W17-L1-transform-ingest-2026-05-28` |
| Tables read | 7 Prisma scraper-data tables (10 mapped · 3 SKIP-class) |
| Rows read | 2,444 |
| Inserted | **2,185** |
| Skipped (class) | 259 (EventLog STATUS_CHANGE / ITEM_UPDATED / BOT_SEQUENCE / LISTBOT_RUN / unrouted eventTypes) |
| Skipped (dedup) | 0 (first run · no overlap) |
| Errors | **0** |

### Per-table breakdown

| Table | Inserted | verticalId |
|---|---|---|
| EventLog | 2,013 | V8 (SHIPPING_QUOTED/DEMAND_SCORE) + V9 (PRICING_*/PRICEBOT/BUYERBOT/MEGABOT/AGENT_AI/ANALYZED) |
| MarketComp | 72 | V9 |
| Item | 28 | V8/V11/V1/V9 by condition/category |
| AiResult | 27 | V9 |
| Valuation | 27 | V9 |
| BuyerLead | 10 | V9 (PII-redacted · only matchScore/aiConfidence/responseTextHash/platform/urgency) |
| ScraperUsageLog | 8 | V9 |

### Per-vertical breakdown

| verticalId | Inserted |
|---|---|
| V9 | **1,799** |
| V8 | **386** |

---

## §2 · Substrate Delta

| Metric | Pre | Post | Delta |
|---|---|---|---|
| sylvia_corpus_queue total | 4,963 | **7,148** | **+2,185 (+44.0%)** |
| COMPLETED | 4,963 | 4,963 | 0 (PENDING surge drains async) |
| PENDING (W17-L1) | 0 | 2,175 | +2,175 (10 went FAILED · pre-existing not from this run) |

**Projected post-drain end-state:** ~7,138 COMPLETED (assuming 10 PENDING fail · matches FAILED bump) within sylvia-queue-drain LaunchAgent cadence.

★ **Biggest single campaign yield** · exceeds projected +35% by 9 points.

---

## §3 · Dedup Outcomes

- Deterministic id scheme: `w17-l1-{table}-{app_id}` · idempotent re-runs safe
- V9 eBay sourceUrl overlap gate: 0 hits (no MarketComp eBay URLs matched existing V9 corpus on first run)
- All 2,185 inserted on first execute · no collision

---

## §4 · LAW #38 HARD GUARD Attestation

- ZERO app row writes (READ-ONLY on Item/AiResult/Valuation/EventLog/MarketComp/BuyerLead/ScraperUsageLog)
- ZERO prisma schema migrations
- ZERO `lib/sylvia/*` mutations
- WRITE-ONLY on `sylvia_corpus_queue` (INSERT · status=PENDING)
- ZERO `lib/adapters/*` · `lib/market-intelligence/*` · `lib/enrichment/*` touched
- `scripts/sylvia/transform-ingest-app-data.mjs` is NEW canonical executable · LAW #38 sustained

---

## §5 · Doctrine Sustained (ZERO NEW · CEO Rule 1)

- BINDING #5 env handling (`/tmp/.env.vercel-prod` shred + rm post-use)
- BINDING #6 OP-B Turso prod write via `@libsql/client` + `node --env-file=`
- BINDING #15 provenance metadata per row (app_table + app_id + ingested_via)
- BINDING #17 audit-first wire (Turso schema empirically verified pre-script-author · spec script SQL fields corrected vs actual schema)
- BINDING #20 main worktree direct-push
- BINDING #28 drift catch (spec script used `name/lowEstimate/bot` · actual columns are `title/low+mid+high/botName` · corrected pre-execute)
- BINDING #38 empirical-cite (counters JSON cited verbatim · per-vertical + per-domain breakdown)
- BINDING #39 spec-on-disk (SHA 57cad3faf9555d58afb4dd9b2a7cf9cd897eeb3e27cddc117e65afd635a1deda)
- ★ LAW #38 HARD GUARD attested · read-only app · write-only Sylvia
- CEO Rule 1 sustained · ZERO new doctrines authored
- CEO Rule 4 STOP-BEFORE-COMMIT honored (greenlight received pre-FIX-4 prod write)

---

## §6 · Carry-forward (W17 sister lanes)

- W17-L2 DEDUP_VERIFY: polls when stable · verifies hash-gate · cross-correlation V8/V9 overlap analysis
- W17-L3 BIDIRECTIONAL_SYNC: post-baseline · cron polling pattern · keeps Sylvia current
- Drain monitor: sylvia-queue-drain LaunchAgent processes PENDING → COMPLETED
