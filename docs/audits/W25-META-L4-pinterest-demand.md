# W25-META-L4 · Pinterest Demand-Intel Arm

**CMD:** CMD-W25-META-L4-PINTEREST-DEMAND · V20 LOW · Track A · Phase A2
**Date:** 2026-05-30 · **Agent:** C (agent-3) · **Anchor:** origin/main `6b91733` · **Budget:** $0

---

## §0.5 IT Deep-Dive (BINDING #30) — empirical

| # | Check | Result |
|---|---|---|
| 1 | Existing pinterest code | **None** — `lib/pinterest` + `app/api/pinterest` net-new (refs in bot skill-packs are prose, not API code) |
| 2 | Pinterest API token in env | **ABSENT** — only `APIFY_TASK_PINTEREST` (Apify task ref, not Pinterest OAuth). No `PINTEREST_ACCESS_TOKEN`. |
| 3 | Demand consumption pattern | `app/api/recon/*` route shape (auth via `authAdapter.getSession()`, `NextResponse`); `lib/market-intelligence` LOCKED — built standalone, no import |
| 4 | LOCKED diff | market-intelligence / connected-accounts / schema untouched |

Token absent → built structure + graceful degrade + **FLAG CEO for token paste**. No half-wired live call (§9). Zero Apify (cap-saturated per W23).

---

## Build (FIX 1–3)

| File | Role |
|---|---|
| `lib/pinterest/types.ts` (NEW) | Typed shapes — region, trend, `PinterestDemandSignal`, `PinterestDemandResult` |
| `lib/pinterest/client.ts` (NEW) | `getDemandSignal(category, region)` — Pinterest Trends fetch, rate-limit aware (250ms guard + 429 handling), transient in-memory cache (6h, ephemeral — ToS no-storage), graceful no-token degrade, never throws |
| `app/api/pinterest/demand/route.ts` (NEW) | `GET ?category=&region=` → demand signal JSON; auth-gated; 400 missing category, 429 rate-limited, 200 signal/degrade |
| `app/api/pinterest/connect/route.ts` (NEW) | Status stub — reports `configured`; POST 501 pending CEO app creds. No live OAuth wired. Disjoint from L3 `connected-accounts`. |

- **ToS 2026 compliance:** Pinterest data never persisted — derived signal only, transient in-memory cache, `fetch` `cache: "no-store"`.
- **Endpoint:** `GET https://api.pinterest.com/v5/trends/keywords/{region}/top` (Bearer token).

---

## Verify

- **tsc:** 0 errors (full project, after `prisma generate` to refresh stale W24-L2 client).
- **`npm run build` (worktree):** BLOCKED — see P0 flag below. Not caused by pinterest (baseline build without pinterest files fails identically).
- **Vercel:** real build gate (committed tree has no symlink) — verified post-push.

---

## FLAGS (V15 6-bullet)

1. **P0 FLEET BLOCKER — worktree build broken post-W24-L2.** `lib/sylvia/memory.ts` adds a `DirAssetReference` into `sylvia-data/`. In agent worktrees `sylvia-data` is a symlink → main worktree; turbopack rejects it ("Symlink … points out of the filesystem root"). Breaks `npm run build` in ALL agent-{1,2,3} worktrees. NOT git-tracked (Vercel unaffected). Recommend: targeted fix cyl — guard the sylvia-data dir reference or de-symlink per-worktree. Owner: W24-L2 / sylvia substrate (LAW #38, not this lane).
2. **Pinterest token absent.** `PINTEREST_ACCESS_TOKEN` not in env. Arm degrades cleanly (returns `unavailable`, `tokenMissing:true`). CEO paste activates live intel.
3. **Connect flow stub only.** OAuth not provisioned (no app creds) — POST returns 501. Structure ready, awaiting CEO Pinterest business app.
4. **Standalone (no LOCKED import).** Did not couple to `lib/market-intelligence` (LOCKED). Future: wire signal into aggregator via its public interface in a separate cyl.
5. **Zero schema · zero Apify · $0.** Fully disjoint from L1/L2/L3.
6. **ToS no-storage honored.** Transient cache only; no DB/disk persistence of Pinterest data.

## FLAG ROUTING (8-cat)

- Worktree build blocker → **P0 / STANDALONE** targeted fix cyl (sylvia substrate owner)
- Pinterest token paste → **RYAN-SIDE**
- Connect OAuth app creds → **RYAN-SIDE**
- Pinterest→aggregator wiring → **MC W25 scorecard** (future cyl)

**Connecting Generations · Built in Maine · World-class everywhere.**
