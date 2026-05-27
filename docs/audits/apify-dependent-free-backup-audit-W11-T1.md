# Apify-Dependent Free-Backup Audit · W11-T1

**CMD-APIFY-DEPENDENT-FREE-BACKUP-AUDIT V20 LOW · Agent 1 MAIN worktree**
**Date:** 2026-05-27 · **Wave 11 Lane T1**

> CEO directive (verbatim · NOT codified): "Every Apify scraper requires PARALLEL FREE BACKUP
> running continuously. Apify = opportunistic bonus · FREE = canonical always-on. Keep Apify
> cheap (low-cost actors · short runs)."

---

## §0 · Anchor

- HEAD: `e7175b2` (post-PB3 pull · ahead of spec anchor `69ceaf4`)
- Daemon QUARTET: 5 svc LIVE UNCHANGED
- Apify cap: $54.98/$50.00 SATURATED (cycle 2026-04-30 → 2026-05-29)
- Scope: audit-only · ZERO n8n touch · ZERO Apify calls

---

## §1 · 5-WF Apify Dependency Catalog

### LIVE Apify-dep WFs (2)

| WF | ID | Vertical | Apify Actor | Cron | Status |
|---|---|---|---|---|---|
| WF45 | `7q4t8JcY1kpFLtQ1` | V8 KBB | `fatihtahta~cars-com-scraper` | 0 8 * * * | active · 0 yield (cap-sat) |
| WF50 | `5gCA1kNkPV2bFseh` | V17 StockX | `piotrv1001~stockx-listings-scraper` | 0 8 * * * | inactive (banked since cap) |

**Apify node pattern:** 3-step (Kick Run → Poll Status → Fetch Dataset) via httpRequest nodes with predefined auth credential.

### BANKED Apify-dep (3 · NOT YET BUILT)

| Target | Vertical | 403-wall | Apify Strategy | Banked Since |
|---|---|---|---|---|
| PCGS coin grading | V11 | pcgs.com 6/6 paths 403 | Custom Playwright + residential proxy | W6-3 |
| NHTSA Complaints | V8 | api.nhtsa.gov 403 | Custom Playwright + residential proxy | W6-4 |
| LA pivot (Hagerty+Mecum+BAT) | V8 NON-NHTSA | Various | Per-source marketplace scrapers | W10-T1 |

---

## §2 · Free Alt Source Probes (empirical 2026-05-27)

### V8 KBB (WF45) — free backup for Cars.com Apify actor

| Source | URL | HTTP | Size | Text | Viable |
|---|---|---|---|---|---|
| **IIHS ratings** | iihs.org/ratings | **200** | 24KB | 2,484c | **✅ BEST** |
| AutoTrader | autotrader.com/cars-for-sale/ | 200 | 3.7KB | JS SPA shell | ⚠️ headless only |
| CarGurus | cargurus.com | 200 | 0b | empty | ❌ |
| Edmunds | edmunds.com/used-cars/ | 403 | blocked | — | ❌ |

### V17 StockX (WF50) — free backup for StockX Apify actor

| Source | URL | HTTP | Size | Text | Viable |
|---|---|---|---|---|---|
| **Grailed** | grailed.com/shop | **200** | 394KB | 2,135c | **✅ BEST** |
| **StadiumGoods** | stadiumgoods.com | **200** | 1.5MB | — | **✅ ALT** |
| GOAT | goat.com/sneakers | 403 | blocked | — | ❌ |
| TheRealReal | therealreal.com | 403 | blocked | — | ❌ |

### V11 PCGS — ALREADY COVERED (redirect)

V11 free backup already 3-deep: WF68 (NumisMaster) + WF61 (NGC+CGC Pivot) + WF53 (NGC+CGC).
PCGS Apify actor = additive bonus, NOT sole-source. No new WF needed.

### V8 NHTSA Complaints — free backup for Complaints API Apify actor

| Source | URL | HTTP | Size | Text | Viable |
|---|---|---|---|---|---|
| **CarComplaints** | carcomplaints.com | **200** | 29KB | 4,577c | **✅ BEST** |
| **CarProblemZoo** | carproblemzoo.com | **200** | 48KB | 5,054c | **✅ EXCELLENT** |
| ConsumerAffairs | consumeraffairs.com/automotive/ | 403 | blocked | — | ❌ |

### LA V8 NON-NHTSA — free backup for Hagerty+Mecum+BAT Apify actors

| Source | URL | HTTP | Size | Text | Viable |
|---|---|---|---|---|---|
| **BringATrailer** | bringatrailer.com/auctions/ | **200** | 1.7MB | 2,929c | **✅ BEST** |
| ClassicCars | classiccars.com | 403 | blocked | — | ❌ |
| Hagerty media | hagerty.com/media/ | 403 | blocked | — | ❌ |
| Hemmings | hemmings.com/stories/ | 403 | blocked | — | ❌ |

---

## §3 · 5 Spec Stub Roster

| # | Stub File | SHA | LOC | Status | Primary Free Source |
|---|---|---|---|---|---|
| 1 | CMD_WF45_V8_KBB_FREE_BACKUP_V20_LOW_STUB.md | c3217ea6b939 | 60 | 🟡 STUB | IIHS ratings |
| 2 | CMD_WF50_V17_STOCKX_FREE_BACKUP_V20_LOW_STUB.md | a1a20280bd52 | 60 | 🟡 STUB | Grailed + StadiumGoods |
| 3 | CMD_V11_PCGS_FREE_BACKUP_V20_LOW_STUB.md | a320ec35b570 | 46 | ✅ COMPLETE (redirect) | WF68+WF61+WF53 already cover |
| 4 | CMD_V8_NHTSA_COMPLAINTS_FREE_BACKUP_V20_LOW_STUB.md | 1b1f04dd8a01 | 56 | 🟡 STUB | CarComplaints + CarProblemZoo |
| 5 | CMD_LA_V8_NON_NHTSA_FREE_BACKUP_V20_LOW_STUB.md | f7eaa4bd3cf1 | 61 | 🟡 STUB | BringATrailer |

All stubs at `~/Downloads/skills/Commands/`. Total: 283 LOC across 5 files.

---

## §4 · W12 Fire-Ready Batch

**4 stubs ready for CEO ratify** (stub #3 is redirect-complete):

| Priority | Stub | Est Runtime | Free Sources |
|---|---|---|---|
| P0 | WF45 V8 KBB | ~20 min + 2 min CEO | IIHS (1 source) |
| P0 | V8 NHTSA Complaints | ~20 min + 2 min CEO | CarComplaints + CarProblemZoo (2 sources) |
| P1 | WF50 V17 StockX | ~25 min + 2 min CEO | Grailed + StadiumGoods (2 sources) |
| P2 | LA V8 NON-NHTSA | ~20 min + 2 min CEO | BringATrailer (1 source · 403-wall on others) |

CEO ratifies subset OR full batch → promote stubs to FIRE specs → execute W12.

---

## §5 · Apify Recovery Timeline

- Billing cycle ends: 2026-05-29
- Cap resets: new cycle starts ~May 30
- Apify actors THEN = bonus overlays running parallel to free backups
- Sequence: free backups FIRST (W12) → Apify actors SECOND (W13+ post-cap-reset)
- CEO directive enforced: free = canonical, Apify = bonus
