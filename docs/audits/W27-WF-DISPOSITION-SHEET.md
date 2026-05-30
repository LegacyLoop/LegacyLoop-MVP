# W27 · n8n Workflow Disposition Sheet

**CEO ratify-pending · n8n NOT mutated · CEO retains all destruction (SOP rule 3 · Rule #11)**

CMD-W27-G4-WF-DISPOSITION-TRIAGE · V20 LOW · Track A · Agent C (agent-3)
Date: 2026-05-30 · Anchor: origin/main `f63c1f4` · n8n: **READ-ONLY** · Budget: $0

Re-enumerated live: **86 WFs · 74 active · 12 inactive** (zero drift from §0 list).

---

## ⚠️ Headline finding — "inactive" ≠ "dormant"

**6 of the 12 inactive WFs executed within the last 2 days** (last-exec column below).
The n8n `active:false` flag only disables the WF's **own trigger** — the WF can still
run via manual Execute or as a **sub-workflow called by an active WF**. Implication:
**deleting a still-invoked WF can break a live caller.** Disposition below accounts for this.

**Apify alert:** WF91 / WF93 / WF94 (all Apify) ran **2026-05-30** despite being
inactive → live Apify-cost exposure + Rule #11 surface (WF93/94 = FB). Recommend
disposition + caller-trace **before** they burn again.

---

## §1 · Triage table (all 12 inactive)

| WF ID | Name | Last exec | Recommendation | Rationale |
|---|---|---|---|---|
| `IELRmDH7ee3ZHvww` | WF19 — Error Log Monitor | **never** | **DELETE-PENDING-CEO** (keep newest dup) | duplicate · no exec history |
| `UJoqfzxR2WHHzura` | WF19 — Error Log Monitor | **never** | **DELETE-PENDING-CEO** (one of the pair) | exact duplicate of above |
| `jh1OB1STJWs79CSC` | WF2 — Support Ticket System | **never** | KEEP-DORMANT | no exec · low risk · CEO may retire |
| `yXG9GsadUSfX6DlA` | WF20 — Social Post Generator | **never** | KEEP-DORMANT | no exec · CEO call |
| `z67pIt9E4Xaq2cXN` | WF40 — V8 ClassicCars CarBot | 2026-05-30 ✓ | **DELETE-PENDING-CEO** ⚠️ trace caller first | W27-B kill candidate, **but ran today** — confirm no active caller |
| `7q4t8JcY1kpFLtQ1` | WF45 — V8 KBB Vehicle Valuation | 2026-05-30 ✓ | **DELETE-PENDING-CEO** ⚠️ trace caller first | W27-B kill candidate, **but ran today** — confirm no active caller |
| `5gCA1kNkPV2bFseh` | WF50 — V17 StockX Apparel | 2026-05-28 (error) | KEEP-DORMANT | erroring · CEO call (fix-or-retire) |
| `ru39JCxRO2p1h9LM` | WF87 V4 Per-State Cluster (153 URLs) | 2026-05-29 ✓ | KEEP-DORMANT | superseded by 7 regionals · intentional standby |
| `Q2vBQDGdw6uv9Yo6` | WF91 V10 Reddit Bulk via **Apify** | 2026-05-30 ✓ | **REPLACE (free-API)** ⚠️ Apify-live | ran today · burn risk · swap to free Reddit API |
| `WmDdCswwOiavAX9B` | WF93 V11 FB Marketplace via **Apify** | 2026-05-30 ✓ | **ARCHIVE-TAG** ⚠️ Apify-live · Rule #11 | pre-Phase-1 · keep for Meta · stop the live runs |
| `9XOwy4VgmbK09kc7` | WF94 V11 FB Groups via **Apify** | 2026-05-30 ✓ | **ARCHIVE-TAG** ⚠️ Apify-live · Rule #11 | pre-Phase-1 · keep for Meta · stop the live runs |
| `IgpUQKexy7jIs0Nd` | [ARCHIVED-DUP 2026-05-29] WF92 V5 Multi-Carrier | 2026-05-29 (error) | **DELETE-PENDING-CEO** | already archive-tagged dup · W24-L4 CEO chose retain — re-confirm delete |

Legend: ✓ = success · ⚠️ = caution flag.

---

## §2 · Ready-to-paste CEO 1-line block

> Copy the line(s) you approve. Anything omitted stays as-is. Deletes run in a
> tiny CEO-gated follow-up cyl (§3) — **not** automatically.

```
delete WF19-dup OK · delete WF92-dup OK · archive WF93 OK · archive WF94 OK · replace WF91 OK · keep WF2/WF20/WF50/WF87-perstate dormant
```

Held for explicit confirmation (recent-exec — trace caller first):
```
delete WF40 OK (caller-traced) · delete WF45 OK (caller-traced) · delete WF92-dup-retain-overridden OK
```

> Note: W24-L4 you chose **WF92 retain**. The `delete WF92-dup` line above only
> applies if you now override that to delete. Otherwise omit it.

---

## §3 · Follow-up execution note

Once you issue 1-lines, a small CEO-gated cyl will, via n8n API:
1. **Archive-tag** (reversible): rename WF93/WF94 → `[ARCHIVED-PRE-PHASE1 <date>]`, confirm inactive.
2. **Caller-trace** WF40/WF45/WF91/93/94: find which active WF invokes them (sub-workflow node) **before** any delete, so we don't break a live pipe.
3. **Replace** WF91 with a free Reddit-API variant (zero Apify).
4. **Delete** (destruction · only the WFs you 1-line'd · deactivate→verify→delete).

This cyl executes **none** of the above.

---

## §4 · Safety note

- **n8n NOT mutated this cyl** — zero deactivate / PUT / rename / delete. Read-only triage.
- **CEO retains all destruction** (SOP rule 3 · Rule #11). Recommendations only.
- The "wind-down shipped to prod" failure (2026-05-30) came from treating a
  destruction as ratifiable — this sheet exists so destruction stays an explicit
  CEO 1-line, never an agent action.

**Connecting Generations · Built in Maine · World-class everywhere.**
