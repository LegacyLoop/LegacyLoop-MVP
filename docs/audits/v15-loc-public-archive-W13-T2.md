# V15 Library of Congress Public Archive · W13-T2 Audit

> CMD-V15-SMITHSONIAN-OPEN-ACCESS V20 LOW · **PB1 INLINE Smithsonian → LOC pivot** · Agent A · agent-1 worktree
> Anchor HEAD: `72e4cf8` (origin/main at fire time)
> Date: 2026-05-28

## §0 · PB1 INLINE — Smithsonian → LOC pivot (BINDING #31)

**§0.5 16-check status**: 16/17 PASS · G1 sub-gate FAIL.

**Empirical evidence (G1 sub-gate FAIL)**:
- `api.si.edu/openaccess/api/v1.0/search?q=furniture&rows=1` → **403 `API_KEY_MISSING`**
- n8n credential probe: 9 creds present · ZERO Smithsonian-related (no `Smithsonian-API-Key` · no `si.edu`)
- STOP RULE 2 triggers: G1 sub-gate not cleared → HALT FIX 2

**CEO push-back-with-replacement (BINDING #31 · 38× cumulative sustained)**:
Pivot Smithsonian → Library of Congress. Same V15 mission anchor · Phase C Compendium §V15 verbatim · ZERO auth · ZERO legal friction · public archive.

Smithsonian banked → W14 (post-CEO key registration). LOC fires now · Met sibling W13-T3 still parallel · V15 ×2 velocity preserved.

## §1 · Build Summary

| Field | Value |
|-------|-------|
| WF ID | `YQiNSG3MY8E0ZigZ` |
| Name | WF78 V15 Library of Congress (6 resale queries · ZERO auth · public archive) |
| Clone source | WF63 (16th LAW canonical) |
| API host | `www.loc.gov/search/` (public · 200 OK · zero auth) |
| Queries | furniture · silver · pottery · porcelain · coin · antique |
| Schema | `response.results[]` · fields: title · id · url · date · subject · contributor · description · image_url |
| Vertical | V15 · domain: provenance-loc |
| Corpus | wf-v15-loc-2026-05-28 |
| Cron | `30 7 * * *` |
| Active | true |

## §2 · LOC API Probe (empirical FIX 1)

```
GET https://www.loc.gov/search/?q=furniture&fo=json&c=1
HTTP/2 200
response.results[0]:
  title: "Photographs of furniture, furniture groupings, and furniture components"
  id: "http://www.loc.gov/item/98510308/"
  url: "https://www.loc.gov/item/98510308/"
  fields: 15+ keys (date, subject, image_url, digitized, contributor, etc.)
```

## §3 · Patches Applied

| Patch | Status | Detail |
|-------|--------|--------|
| Source URLs | ✓ | 6 LOC search URLs (furniture/silver/pottery/porcelain/coin/antique · `fo=json&c=100`) |
| HTTP Request auth | ✓ default `none` (LOC zero auth) |
| Extract | ✓ NEW | LOC `response.results[]` JSON parse · sentinel passthrough on empty |
| BP V15 metadata | ✓ | V14→V15 · documents→provenance-loc · corpusId patched · 6 sources cited |
| BP sentinel filter | ✓ INHERITED | `_loopPassthrough` filter inherited from WF63 |
| Cron stagger | ✓ | 0 7→30 7 * * * |

## §4 · Yield Projection

LOC public archive ~17M items · 6 queries × 100 rows = ~600 items/cron expected.
LOC schema yields title + id + url + date + subject + image_url (rich metadata for V15 provenance).

## §5 · CEO Manual Execute exec=1828 (2026-05-28)

CEO Manual Execute fired · status=success · finished=true · mode=manual.
Timeline: startedAt=2026-05-28T13:39:50Z · stoppedAt=2026-05-28T13:40:41Z (51 sec runtime).

**Node yield breakdown:**
- Split URLs: 6 items emitted (1 per LOC query)
- Fetch HTML: 6 runs · response body ~730KB each (real LOC JSON · ZERO WAF block confirmed)
- Extract: 6 runs · all returned sentinel `_loopPassthrough=true` reason=`no-results-in-response`
- Aggregate/BP/Webhook: 6 runs each · sentinel chain propagated downstream

**Root cause (post-exec diagnostic)**: Fetch node inherited WF63 `responseFormat: "text"` (HTML scraping legacy). LOC JSON response body landed as STRING at `inputJson.data`. Original Extract read `inputJson.results` at root → always empty → sentinel chain.

**Fix applied (post-exec patch · deactivate→PUT→activate)**: Extract rewritten:
- `JSON.parse(inputJson.data)` to unwrap text response body
- `$('Split URLs').item.json.sourceName/query/url` to recover lost context lost across Fetch
- Sentinel passthrough preserved (reason cite improved: `json-parse-fail` vs `no-results`)

**Yield delta**: 0 LOC items pre-patch · ~600 items/cron projected post-patch · awaiting next exec.

## §5b · POST-PATCH EXEC=1830 (2026-05-28 13:47 UTC · CEO Manual Execute)

**STATUS: 🟢 GREEN · 600 real items extracted · ZERO sentinels.**

| Query | Yield | Sample title |
|-------|-------|--------------|
| furniture | 100 | Photographs of furniture, furniture groupings... |
| silver | 100 | Silver Spring & Silver Spring Run, Fla. |
| pottery | 100 | The pottery & glass salesman |
| porcelain | 100 | Chinese export porcelain in private Brazilian coll... |
| coin | 100 | Coining press |
| antique | 100 | Questers antique shop. Antique secretary |

- Runtime: 28.9 sec (vs 51 sec pre-patch · faster JSON parse)
- Webhook callbacks: 6 (1 per query)
- Real items: 600 (matches projection exactly)
- Sentinels: 0
- Status: success · finished=true

V15 "Connecting Generations" anchor LIVE. Phase C Legal Compendium §V15 verbatim sustained.

## §5c · Doctrine note

DOC-N8N-HTTP-RESPONSE-FORMAT-TEXT-WRAPPER caught empirically · WF63 canonical clone source pattern uses `responseFormat=text` for HTML extraction · JSON API sources cloned from WF63 MUST `JSON.parse(inputJson.data)` in Extract. Banked candidate for ratify cycle (cite cumulative 1/5 NEW · do not codify here per CEO ZERO new doctrines rule).

## §6 · Banked

- **CMD-W14-V15-SMITHSONIAN-OPEN-ACCESS V20 LOW** — re-fire post CEO Smithsonian API key registration at `api.si.edu` · paste to n8n Header Auth cred `Smithsonian-API-Key` (X-Api-Key)
- Met Museum sibling (W13-T3) parallel V15 anchor

## §7 · Doctrine Sustained

- **BINDING #31** push-back-with-replacement (38× cumulative · Smithsonian→LOC pivot inline)
- BINDING #16 clone-to-canonical (WF63 16th LAW)
- BINDING #17 audit-first-wire (LOC API probed pre-clone)
- BINDING #20 PB3 pull mandatory
- BINDING #28 drift catch (G1 sub-gate caught pre-FIX-2)
- BINDING #38 empirical-cite (403 Smithsonian · 200 LOC both empirically probed)
- BINDING #50 sentinel sustained (Extract custom + BP filter inherited)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V15 metadata)
- DOC-N8N-POST-MINIMAL-FIELDS
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE
- Phase C Legal Compendium §V15 verbatim (LOC = T1/T3 zero friction)
- "Connecting Generations" mission anchor advance
- ZERO new doctrines (CEO rule)
