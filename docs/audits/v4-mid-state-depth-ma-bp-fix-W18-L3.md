# V4 Mid-State Tier-2 Depth + MA BP Fix · W18-L3

**CMD-W18-L3-V4-MID-STATE-DEPTH-+-MA-BP-FIX V20 LOW · Agent B agent-2 worktree**
**Date:** 2026-05-28 → 2026-05-29 · **Wave 18 Lane 3**
**Anchor HEAD:** `d017665` (post-W17-L3 hotfix)

---

## §1 · Part A · WF87-MA BP error REPAIRED

### Root cause (BINDING #38 empirical · node --check verbatim)

```
SyntaxError: Unexpected token '{'
  return [{{ json: {{ skip: true, reason: 'all-entries-sentinel' }}}}];
           ^
```

**Python f-string escape leak**: R3-L2 author wrote BP JS via Python f-string `f"return [{{ json: {{...}}}}]"` where `{{` is Python escape for literal `{`. But the JS string got stored with `{{` and `}}` LITERAL (not escaped back to `{` and `}`). JS sees `{{` as illegal double-brace.

### Repair

Replace all `{{` → `{` and `}}` → `}` in BP jsCode. Verified:
- Pre-repair: 780 chars · node --check exit=1 (SyntaxError)
- Post-repair: 768 chars · node --check exit=0 ✓
- Cycle: deactivate → PUT → activate · all OK · active=True

WF87-MA `i9IOLD8zsAXUdwxC` BP node SYNTAX VALID.

---

## §2 · Part B · 4 regional WFs appended

### DOC-N8N-CODE-NODE-APPEND-PARSE-PRE-EDIT v2.5 applied (W17-L3 lesson)

Per-WF: GET → deactivate → parse `const urls = [...]` array (regex + brace-depth scan) → strip broken `{json:...}` entries (if any leftover) → dedupe by URL → append NEW URLs in ORIGINAL shape `{"region":"X","state":"Y","url":"Z"}` → serialize clean → node --check VALID → PUT → activate.

### Per-WF results

| WF | n8n ID | Pre | Append (expected) | Actual | Post | Notes |
|---|---|---|---|---|---|---|
| NE | FnZAE5EfeGPgnolQ | 36 | +2 (NJ) | +0 dedupe | 36 | jerseyshore + southjersey already in NE base · sustained · re-activated |
| MA | i9IOLD8zsAXUdwxC | 23 | +6 (NC+VA) | +6 | 29 | BP also FIXED in same cycle |
| SE | hrK2miE2rZuZ2wUK | 31 | +3 (GA) | +3 | 34 | clean |
| MW | mfLE8L4p5gfOpbRg | 29 | +6 (OH+MI) | +6 | 35 | post-dedup w/ existing |
| **NET** | — | **119** | **+17** | **+15** | **134** | 2 NJ dedupes caught at parse |

### Honest cite (no compromise framing)

- Spec expected 17 NEW URLs across 4 WFs
- Empirical actual 15 NEW URLs (2 NJ dedupes vs existing NE base)
- 1 cull honestly cited: easternnc.craigslist.org (000 · NC)
- Hit rate methodology: 17/18 GREEN (94%) per Devin §0.1 sustained

### V4 total

| Wave | URLs | Delta |
|---|---|---|
| Pre-R3 | ~150 | — |
| R3-L2 | 162 | +12 |
| W17-L3 | 197 | +35 (big-state long tail) |
| W18-L3 | **212** | +15 net (mid-state Tier-2) |

---

## §3 · Empirical (BINDING #38)

| Region | NEW URLs | Hit rate |
|---|---|---|
| NE | 2 attempted · 0 new (dedupe) | parse-first caught |
| MA | 6 attempted · 6 new | 100% |
| SE | 3 attempted · 3 new | 100% |
| MW | 6 attempted · 6 new | 100% |
| **Total append rate** | **17 attempted · 15 new + 2 dedupe** | **88% append efficiency** |

All 4 PUTs syntax VALID via `node --check`. NO broken JS shipped this cycle (W17-L3 lesson sustained).

---

## §4 · CEO Manual Execute G2 × 4 (pending)

| WF | n8n ID | exec_id |
|---|---|---|
| NE | FnZAE5EfeGPgnolQ | PENDING |
| MA | i9IOLD8zsAXUdwxC | PENDING (BP fix + append) |
| SE | hrK2miE2rZuZ2wUK | PENDING |
| MW | mfLE8L4p5gfOpbRg | PENDING |

Expected per-WF: ~10-30 listings × URL count · sentinel catches dead at runtime.

---

## §5 · Flag doc

`~/Downloads/skills/Flags/V4_MID_STATE_TIER_2_APPEND.md`

---

## §6 · Doctrine sustained (ZERO NEW per CEO rule)

- BINDING #5 cred-safe (n8n API key Keychain · never echoed)
- BINDING #16 clone-to-canonical (existing WFs · append + repair only)
- BINDING #17 audit-first (BP code extracted + diagnosed pre-repair · 4 WF arrays parsed pre-append)
- BINDING #20 PB3 worktree FF-push (agent-2 isolated)
- BINDING #28 HEAD parity (d017665 sustained · no drift this cyl)
- BINDING #30 §0.5 17-check confirmed
- BINDING #31 PB-with-replacement (NJ dedupe → sustained · cited honestly)
- BINDING #38 empirical (node --check exit codes cited verbatim · per-WF status PUT/activate cited)
- BINDING #39 spec read 449 LOC end-to-end
- BINDING #50 LAW sentinel preserved (BP filter logic intact post-repair · zero architectural change)
- **DOC-N8N-CODE-NODE-APPEND-PARSE-PRE-EDIT v2.5 applied** (W17-L3 candidate sustained · parse-first append · NO blind string-inject)
- DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE × 4 (deactivate→PUT→activate)
- DOC-N8N-POST-MINIMAL-FIELDS (whitelist body · binaryMode/availableInMCP stripped)
- LAW #38 sustained · zero `lib/sylvia/*` · zero `app/*` · zero `lib/*` · zero `prisma/*`
- CEO Rule 1 ZERO new doctrines

---

## §7 · Banked W19+

- V4 listing-detail fetch (per-URL deep dive · Apify-class · banked)
- Mid-state Tier-3 expansion (CO/SC/OR/AL · ~2-3 per state probe)
- WF87 per-source cap consideration (30 → 50 if first exec yield comfortable)
- Smaller-state Tier-3 expansion (RI/DE/MT/WY/SD/ND/AK/HI per-state probe)
- BP node f-string-leak scan across other WFs (if R3-L2 templating leaked elsewhere)
