# W23-L1 · FB-Army Rotation Controller Scaffold

**CMD-W23-L1-FB-ARMY-ROTATION-CONTROLLER-SCAFFOLD V20 MED · Agent 1 MAIN worktree · 2026-05-29 PM**
**Anchor:** HEAD `4ee4921` (campaign-close tip) · post-W22-L1 honest 4/4 ship
**Class:** Pure-TS scaffold · NEW `lib/scrapers/rotation/` module · stubs only · zero external HTTP · $0

> Phase-1 brain of the FB-Army northstar. Orchestrates 3 prongs (Apify / droplet-army / Graph-API) with **two-world isolation absolute**.

---

## §1 · Files Created (5 NEW · 0 modified)

| File | LOC | Purpose |
|---|---|---|
| `lib/scrapers/rotation/types.ts` | 84 | Prong/World/FetchOutcome/BlockSignal/RotationDecision interfaces · two-world (`A` / `B` / `apify`) encoded |
| `lib/scrapers/rotation/health.ts` | 70 | block-signal classifier · cooldown ladder (1m→5m→15m→30m→60m cap) · `isAvailable()` |
| `lib/scrapers/rotation/cost.ts` | 39 | cost-per-record telemetry · `accumulate` · `cheaper` · `sumSpend` budget guard |
| `lib/scrapers/rotation/controller.ts` | 169 | `RotationController` class · world-isolated registry · `select` · `recordOutcome` · `failover` · `DEFAULT_CONFIG` $150 cap / $100 target |
| `lib/scrapers/rotation/index.ts` | 28 | barrel export |

**Total:** 390 LOC pure TypeScript · zero external HTTP · stub `Prong.fetch` (integration cyl wires live).

---

## §2 · Two-World Isolation Encoding (ABSOLUTE)

`type World = "A" | "B" | "apify"` — three structurally separate identity domains.

Controller filtration order (`controller.ts:select`):
1. **Budget guard** (HARD CAP $150) — refuses to route over cap
2. **World mismatch** STRUCTURAL FILTER — `prong.world !== intendedWorld` → skip with reason `world-mismatch:B!=A`
3. `enabled` check
4. `operations.includes(req.operation)`
5. Health: `isAvailable(health, now)` (healthy OR cooldown elapsed)
6. **Cheapest cost-per-record** wins (NaN cpr = unknown · defers to peer with data)

**Meta dev account (World A) NEVER routes through droplet IPs (World B).** Apify is a co-equal arm, NOT a fallback — separate world identity.

---

## §3 · §0.5 IT Deep-Dive Confirmation (BINDING #30)

| Check | Result |
|---|---|
| `lib/scrapers/proxy/base.ts` Adapter shape read (READ-ONLY) | `{provider, enabled, operations, call()}` + `envPresent` — confirmed |
| `lib/scrapers/proxy/registry.ts` 12-adapter registry read | shippo/easypost/fedex-direct/amazon-paapi/reddit-oauth/ups/usps/dhl/rainforest/meta/apify/shipstation |
| `lib/scrapers/rotation/` absent pre-cyl | confirmed (NEW dir) |
| tsc baseline pre-cyl | **0 errors** |
| tsc post-cyl | **0 errors** (no new errors introduced) |
| `npm run build` | PASS |
| Proxy registry edit (W23-L3 surface) | 0 hits ✅ |
| `lib/sylvia/*` mutation | 0 hits ✅ |
| `fb-army/*` mutation (W23-L2 surface) | 0 hits ✅ |
| `package.json` add | 0 |

---

## §4 · Inline Unit Scenarios (verified mentally · code comments in `controller.ts`)

1. **World isolation** — prongA (A) + prongB (B) registered · `select(req, "A")` returns prongA · prongB skipped reason `world-mismatch:B!=A`
2. **Cheapest-healthy wins** — apify cpr=$0.05 vs droplet cpr=$0.01 → droplet selected
3. **Auto-retire on block** — 429 → `applyOutcome` → unhealthy + 1-min cooldown → next `select()` skips with `cooldown:rate-limit`
4. **Budget cap** — `totalSpend()` ≥ $150 → `selected: null` · reason `budget-cap-reached:...`
5. **Cooldown ladder** — 5 consecutive blocks → 1m → 5m → 15m → 30m → 60m (cap) · single clean success resets streak

Live unit tests land with the integration cyl (no test-runner package added · BINDING #16 + §10 constraint).

---

## §5 · Doctrine Sustained (ZERO NEW · CEO Rule 1)

- BINDING #16 delegate-canonical (Prong interface mirrors proxy Adapter conventions · separate registry NOT shared)
- BINDING #17 audit-first wire (proxy/base.ts + registry.ts read READ-ONLY pre-write)
- BINDING #20 main worktree direct-push (15/5 LAW-READY)
- BINDING #28 drift catch (Adapter shape verified empirically · spec draft errors corrected per §0)
- BINDING #30 §0.5 17-check
- BINDING #38 empirical-cite (tsc=0 pre/post · file LOC counts)
- BINDING #39 spec-on-disk
- ★ LAW #38 HARD GUARD attested · zero `lib/sylvia/*` mutation
- CEO Rule 1 sustained · ZERO new doctrines authored

### Candidate progression
- DOC-3-PRONG-ROTATION-BRAIN: 1/5 anchored this cyl (controller scaffold)
- DOC-TWO-WORLD-ISOLATION-STRUCTURAL: 1/5 anchored (World union + structural filter in select())

---

## §6 · BINDING #34 Widened Cite

- **(a) Commit SHA:** *(filled post-commit)*
- **(b) Vercel dpl:** N/A (no infra spend · no Vercel deploy required for scaffold-only; build PASS gates the next deploy)
- **(c) Verify:** `npx tsc --noEmit` → 0 errors · `npm run build` → PASS · 5 NEW files cited verbatim · 0 lib/sylvia hits · 0 proxy/registry edit hits

---

## §7 · Flags · V15 6-bullet

- **Gaps:** No live unit tests (no test-runner added · BINDING #16 constraint · banked integration cyl)
- **Risks:** Cost telemetry initialized at NaN until first record · cheaper() treats NaN as "unknown" · could route blindly on first request (acceptable behavior; first request collects baseline)
- **Missed:** No persistence for ProngState — in-memory only · banked Redis/KV layer for multi-process consistency
- **Carry-forward:** W23-L2 droplet-army provisioning (World B) · W23-L3 Graph API adapter operations enrichment (World A) · W23 integration cyl wires live Prong implementations
- **Suggestions:** DOC-3-PRONG-ROTATION-BRAIN candidate codify post 5 live applications
- **Opportunity:** Controller is provider-agnostic — extends naturally to any future rotation arm (World C / World D / etc.)

### Flag routing · V20 8-cat

- **STANDALONE:** W23-L2 droplet-army provision · W23-L3 Graph adapter ops · W23 integration cyl
- **DOCTRINE:** DOC-3-PRONG-ROTATION-BRAIN 1/5 · DOC-TWO-WORLD-ISOLATION-STRUCTURAL 1/5
- **MC-TASK:** W23 scorecard · brain scaffolded · prongs banked
- **CYCLIC:** Cost-per-record telemetry roll-up (banked daily)
- **RYAN-SIDE:** Approve W23-L2/L3 fire when ready
- **POST-EPIC:** FB-Army northstar Phase 2 (live integration)
- **BANKED:** Live Prong implementations · Redis persistence · unit-test runner
- **OPERATIONAL:** Pure-TS scaffold compiled · zero external HTTP · zero infra spend
