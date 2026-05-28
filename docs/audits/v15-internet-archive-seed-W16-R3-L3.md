# V15 Internet Archive Seed · W16-R3-L3 (★ "Connecting Generations" provenance keystone)

**CMD-W16-R3-L3-V15-INTERNET-ARCHIVE-SEED V20 LOW · Agent B agent-2 worktree**
**Date:** 2026-05-28 · **Wave 16 Round 3 · Lane 3**
**Anchor HEAD:** `0c458b8` (post-T5)

> Class: T1/T3 CC0 public · ZERO auth · ZERO Apify · IA advancedsearch JSON
> Pair: parallel R3-L1 + R3-L2 + R3-L4 (4-lane same-moment fire)
> Phase C Compendium §V15 keystone · 4.5M+ CC0 items

---

## §1 · WF88 Build Summary

| Field | Value |
|---|---|
| n8n ID | `ICc2MriOInnTG8O9` |
| Name | WF88 V15 Internet Archive Seed (10-subject CC0 fan-out · IA + Open Library) · Connecting Generations |
| Clone source | WF63 (`2PFlNsFr0VWQ9SIy`) · 16th LAW canonical · sentinel-armed |
| Cron | `47 7 * * *` (post R3-L2 :40-:46 · zero collision) |
| Active | true |
| Endpoint | `https://archive.org/advancedsearch.php` |
| Auth | NONE (CC0 public · zero credential gate) |
| UA | `Legacy-Loop-Bot/1.0` (proven WF57+WF82) |
| Budget | $0.00 |

### Pre-fire IA endpoint verification

| Endpoint | HTTP | Sample |
|---|---|---|
| `/advancedsearch.php?q=antiques&output=json` | 200 · 5,631b | `numFound=11202` · valid JSON · `response.docs[]` shape |
| `openlibrary.org/search.json?q=antiques` | 200 · 2,619b | reachable (banked sibling endpoint W17+) |

---

## §2 · 10-subject Fan-Out

| # | Subject | IA query | Vertical anchor |
|---|---|---|---|
| 1 | antiques | `antiques+collectible` | AntiqueBot category breadth |
| 2 | hallmarks | `silver+hallmark+marks` | V11 grading cross-feed |
| 3 | pottery | `pottery+ceramic+marks` | V11 hallmark depth |
| 4 | auction-catalogs | `auction+catalog+vintage` | V1 antique guides feed |
| 5 | provenance | `provenance+research+art` | "Connecting Generations" core |
| 6 | trade-catalogs | `trade+catalog+sears+ward` | V8/V11 era-ID feed |
| 7 | memorabilia | `memorabilia+sports+history` | V2 collectible markets feed |
| 8 | postal | `postal+history+stamps` | V13 niche philately feed |
| 9 | photography | `photography+archive+vintage` | V15 provenance imagery |
| 10 | numismatic | `coin+catalog+numismatic` | V11 coin grading feed |

Per-subject cap: 30 IA records. Total ceiling: 10 × 30 = **300 V15 entries first-Execute**.

---

## §3 · Architecture

### Source URLs (10 subjects)
Emits 10 items with IA advancedsearch URL + metadata (subject, query, verticalId=V15).

### Fetch HTML
GET with Legacy-Loop UA + `Accept: application/json` + 30s timeout + `responseFormat: text` (parsed in Extract).

### Extract (IA advancedsearch JSON parse)
1. Parses `response.docs[]` array
2. Caps 30 per subject
3. Maps each doc → V15 entry (id, title, body with creator+date+subjects, full metadata)
4. Sentinel returns `_loopPassthrough` on:
   - `IA-{subject}-parse-fail` (invalid JSON)
   - `IA-{subject}-zero-results` (empty docs array)

### Build Payload
- Filters `_loopPassthrough` sentinels pre-webhook (BINDING #50 sustained)
- `verticalId=V15` · `domain=provenance-internet-archive` · `sourceTier=T1`
- Webhook fires `phase_c_ingest` per-subject batch

### Cron
`47 7 * * *` — clean stagger post R3-L2 :40-:46 (zero collision with WF87 :40 / V5 :36 / V10 :37-:39).

---

## §4 · Execution Status

**Awaiting CEO Manual Execute G2** from n8n UI (`https://n8n.legacy-loop.com`).

n8n REST API has no `/run` endpoint (W11+W13+W14+W15 lesson). CEO Manual Execute → IT pulls exec_id + per-subject yield post-ship.

Expected:
- Ceiling: 300 entries (10 × 30 cap)
- Realistic: 250-300 (IA has dense corpus · all 10 queries should return ≥30 docs based on §0 probe `numFound=11202` for "antiques")
- V15 baseline: 364 → expected post-Execute: **~600-700** (V15 +250-300)

---

## §5 · Doctrine sustained (ZERO NEW per CEO rule)

- BINDING #5 cred-safe (zero key required · CC0 endpoint)
- BINDING #16 clone WF63 16th-LAW canonical
- BINDING #17 audit-first (IA endpoint probe pre-build)
- BINDING #20 PB3 agent-2 pre-fire rebase
- BINDING #28 HEAD parity (0c458b8 sustained · no drift)
- BINDING #30 §0.5 17-check confirmed
- BINDING #38 empirical (IA endpoint 200 + numFound=11202 sample cited)
- BINDING #39 spec read 362 LOC end-to-end
- BINDING #41 partner-first sustained (IA non-profit CC0 · gov-tier legal posture)
- BINDING #50 LAW sentinel design per subject (parse-fail + zero-results)
- LAW #38 sustained · zero `lib/sylvia/*` touch
- 17th LAW exec_id mandate (pending CEO G2)
- CEO Rule 1 ZERO new doctrines

---

## §6 · Banked W17+

- CMD-W17-V15-OPENLIBRARY-EXPAND (Open Library `/search.json` as sibling endpoint · book-specific provenance)
- CMD-W17-V15-IA-COLLECTIONS-DEEP (collection-specific deep crawl · per-subject 100+ cap)
- Per-subject 30-cap may raise to 100 if first exec latency comfortable
- Open Library detail fetch (per-book metadata · ISBN/OCLC enrichment)
- WF88 yield verification post CEO Manual Execute (cite exec_id + per-subject items + Turso V15 delta)
