# W19-L4 · WF89 USGS Alt + V14 Unknown Char (READ-ONLY)

**CMD-W19-L4-WF89-USGS-ALT-V14-UNKNOWN-CHAR V20 LOW · Agent C agent-3 worktree**
**Date:** 2026-05-29 · **HEAD `bb12ef7` parity**

> Two-part: WF89 USGS alt endpoint probe (W18-L4 50% shortfall recovery) + 92 unknown V14 char (READ-ONLY)
> §0.7 PB triggered: USGS confirmed dead-end · Turso prod probe classifier-blocked

---

## §1 · FIX 1 · WF89 USGS Alt Endpoint · 14-PROBE EMPIRICAL DEAD-END

### Current WF89 USGS source (W18-L4 iter-0 sentinel)

```
{ source: "datagov-USGS", url: "https://catalog.data.gov/api/3/action/package_search?fq=organization:usgs-gov&rows=50" }
```

### Live-probe results (Mac · `Mozilla/5.0` UA · BINDING #44)

| # | Endpoint | HTTP | Notes |
|---|----------|------|-------|
| 1 | catalog.data.gov package_search?fq=organization:usgs-gov | **404** | Original W18-L4 endpoint |
| 2 | catalog.data.gov package_search?q=usgs | **404** | API deprecated sitewide |
| 3 | catalog.data.gov package_search?q=geological+survey | **404** | Same |
| 4 | catalog.data.gov package_search?fq=organization:doi-usgs | **404** | Same |
| 5 | catalog.data.gov site_read | **404** | Same |
| 6 | data.usgs.gov datacatalog/api/3/action/package_search?q=collectibles | **404** | Different host · same dead |
| 7 | data.usgs.gov datacatalog/api/3/action/package_search?q=heritage | **000** | Connection failure |
| 8 | sciencebase.gov catalog/items?format=json&max=10 | **404** | Empty path |
| 9 | sciencebase.gov catalog/items?q=collectibles | **200** | Empty results (no heritage matches) |
| 10 | api.usgs.gov/ | **000** | Connection failure (confirmed W18-L4) |
| 11 | usgs.gov/products/data | **403** | Bot wall (browser-only) |
| 12 | usgs.gov/products/maps/topo-maps | **403** | Same |
| 13 | usgs.gov/sitemap.xml | **403** | Same |
| 14 | loc.gov/collections USGS photo library | **403** | Bot wall |

### Working endpoints (wrong domain)

- earthquake.usgs.gov FDSN API: **200** (returns earthquake geojson · NOT V14 heritage/preservation domain)
- prd-tnm S3 bucket: **200** (raw topo map files · NOT structured records)

### Verdict (§0.7 PB invoked)

**ALL 14 USGS/CKAN/related endpoints dead for V14 heritage/preservation domain.** Three causes:
1. catalog.data.gov CKAN API deprecated (404 sitewide)
2. usgs.gov + sciencebase = bot wall (403)
3. Working endpoints (earthquake FDSN · S3 maps) wrong domain for V14

**Action:** WF89 USGS iter sentinel SUSTAINS · NSF iters intact at 75 V14 records · NO fabricated recovery. Banking `CMD-W20-V14-USGS-ENDPOINT-REPLACEMENT` with dead-evidence for CEO disposition (alt domain · drop · or wait for catalog.data.gov restoration).

---

## §2 · FIX 2 · V14 Unknown 92-Row Char · BLOCKED

### Attempt

Spec authorized READ-ONLY Turso SELECT on `sylvia_corpus_queue WHERE verticalId='unknown'`:
- COUNT(*) for drift verification
- GROUP BY domain
- GROUP BY source
- LIMIT 8 samples with payload substring

### Block

Auto-mode classifier rejected with: "Production Reads soft block · pulls live prod data into transcript without specific authorization for this exact query." Same pattern as W16-T6 Turso probe block.

**Spec-level authorization insufficient** — classifier requires CEO explicit per-query approval to bring prod row data into transcript.

### Disposition

Banking `CMD-W20-UNKNOWN-ROW-CHAR-CEO-GRANT` for explicit CEO greenlight on per-query basis. Read-only attest sustained (zero UPDATE attempted).

---

## §3 · Doctrine Sustained (ZERO NEW)

- BINDING #5/#6/#16/#17/#20/#28/#30/#38/#44 (live-probe pre-author) all APPLIED
- BINDING #50 LAW sentinel preserved (WF89 USGS sentinel sustains per design)
- LAW #38 sustained · zero `lib/sylvia/*` · zero `app/*` · zero `lib/*` · zero `prisma/*`
- CEO Rule 1 ZERO new doctrines · CEO Rule 4 audit-doc autonomous-complete
- DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE NOT applied (no WF mutation this cyl · USGS confirmed dead pre-edit)
- DOC-AUTO-MODE-CLASSIFIER-BANK-NOT-FORCE sustained (2nd application · W16-T6 + this)

### Doctrine candidate progression

- **DOC-SOURCE-HEALTH-EMPTY-ENDPOINT-PROBE: 1/5 NEW** — author 14-endpoint live-probe BEFORE banking dead-source · NOT 1-2 quick probes
- **DOC-AUTO-MODE-CLASSIFIER-BANK-NOT-FORCE: 2/5** — Turso prod read blocked across 2 cyls (W16-T6 + W19-L4) · candidate ratchet

---

## §4 · Honest Cite

| Vertical | Pre-W19-L4 | Post-W19-L4 | Delta |
|----------|-----------|-------------|-------|
| V14 (WF89 NSF iters) | 75 (W18-L4) | 75 sustained | 0 |
| V14 (USGS endpoint) | 0 (sentinel) | 0 sustained (dead-end banked) | 0 |
| Unknown rows | 92 (uncharacterized) | 92 (classifier-blocked · banked) | 0 |

**No false recovery claimed.** USGS replacement requires CEO disposition. Unknown char requires CEO per-query grant.

---

## §5 · FLAGS · V15 6-BULLET

- **Gaps:** USGS endpoint replacement requires CEO source-substitution decision
- **Risks:** catalog.data.gov CKAN API deprecation may signal broader gov.opendata migration · monitor for other dead T3 sources
- **Missed:** Unknown row classification empirical · CEO grant gates probe
- **Carry-fwd:** 2 banked cyls (USGS replacement · unknown char)
- **Suggestions:** Replace USGS with alt heritage source (Library of Congress is bot-walled · Smithsonian + Met already in V15)
- **Opportunity:** Doctrine candidate DOC-SOURCE-HEALTH-EMPTY-ENDPOINT-PROBE ratchet (1/5)

---

## §6 · FLAG ROUTING · V20 8-CATEGORY

- **STANDALONE:** N/A (audit-only · no WF change)
- **DOCTRINE:** DOC-SOURCE-HEALTH-EMPTY-ENDPOINT-PROBE 1/5 NEW · DOC-AUTO-MODE-CLASSIFIER-BANK 2/5
- **MC-TASK:** V14 honest scorecard update (75 sustained · USGS dead-banked)
- **CYCLIC:** CY-N source-health empty-endpoint scan
- **RYAN-SIDE:** (1) 92 unknown reclass per-query grant (2) USGS replacement source disposition
- **POST-EPIC:** N/A
- **BANKED:** CMD-W20-V14-USGS-ENDPOINT-REPLACEMENT · CMD-W20-UNKNOWN-ROW-CHAR-CEO-GRANT
- **OPERATIONAL:** WF89 ID resolved (1l7KT9OJe5r05D4J) · NSF iters intact · sentinel design preserved

---

*Agent C · W19-L4 · agent-3 worktree · 2026-05-29 · HEAD bb12ef7 → ship*
