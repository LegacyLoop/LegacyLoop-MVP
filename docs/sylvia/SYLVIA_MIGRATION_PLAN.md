# Sylvia AI · Migration Plan (LegacyLoop machine → Dedicated AI box)

**Date:** 2026-05-08 · R22.6 · activates post-seed when CEO purchases dedicated hardware
**Status:** Playbook · NOT a fire spec · post-Phase-2 (R24) prerequisite chain documented

---

## §1 · Current state (Phase 1 + Phase 2)

**Phase 1 (today · LIVE at HEAD `2d9ff63`):**
- Sylvia substrate: `lib/sylvia/*` 793 LOC · imported in-process by LegacyLoop
- Memory: `sylvia-data/memory/` (gitignored)
- Corpus: `sylvia-data/corpus/` (gitignored · scrape ingest)
- Vector store: `sylvia-data/vector-store/` (gitignored · embedding cache)
- Audit log: `sylvia-data/audit/` (gitignored · per-call trace)
- Auth keys: `.env.sylvia` (chmod 600 · 2093 bytes · 5 providers)

**Phase 2 (GATED on R24 brain wire):**
- HTTP boundary: `app/api/sylvia/{ask,consensus,corpus,health}/route.ts`
- LegacyLoop calls Sylvia via `fetch("/api/sylvia/...")` instead of in-process import
- Same machine · same Vercel function pool · same disk

**Cross-cutting concerns at end of Phase 2:**
- Shared CPU with LegacyLoop UI/API workload
- Shared memory (Node heap pressure during consensus dispatches)
- Shared disk (sylvia-data + dev.db on same volume)
- Shared LegacyLoop Vercel cap (`$20/month` per BINDING #25)
- Spike load on Sylvia consensus = function-execution-time pressure on LegacyLoop

---

## §2 · Target state (Phase 3 · post-seed)

**Sylvia runs on dedicated machine** (Mac Studio · Threadripper workstation · Hetzner dedicated · etc.)

**Independent everything:**
- Independent CPU (consensus burst doesn't slow LegacyLoop checkout flow)
- Independent disk (sylvia-data on dedicated volume · scaling decoupled)
- Independent budget (Sylvia daily cap separate from LegacyLoop Vercel cap)
- Independent uptime (Sylvia outage = graceful degradation in LegacyLoop · in-process fallback if seam preserved)

**LegacyLoop → Sylvia via HTTPS** at `SYLVIA_BASE_URL` env var:
```bash
SYLVIA_BASE_URL=https://sylvia.legacy-loop.com
```

**Zero risk to LegacyLoop production from Sylvia spike load.** Investor moat #5b (hive-mind · Queen→Worker dispatch) and Moat 11 (domain corpus retrieval) become independently scalable.

---

## §3 · Pre-migration checklist (8-point validation · all must pass before cut)

```
□ R24 brain wire complete · all 4 endpoints (ask/consensus/corpus/health) serving on localhost
□ Sylvia health endpoint returns 200 with all 5 providers OK
□ sylvia-data/* persisted state size measured (for scp/rsync transfer budget)
□ .env.sylvia copied to dedicated box · chmod 600 · presence verified · content NOT logged
□ Dedicated box has static IP OR Tailscale tunnel (private network) established
□ TLS cert obtained (Let's Encrypt OR Tailscale MagicDNS HTTPS · HSTS-ready)
□ DNS A record (sylvia.legacy-loop.com) updated · TTL 60s pre-cut for fast rollback
□ LegacyLoop SYLVIA_BASE_URL env var staged in Vercel preview deploy (NOT production yet)
```

If any box unchecked → DO NOT CUT · resolve gap first.

---

## §4 · Migration playbook (step-by-step)

### Step 1 · Provision dedicated box
- Install Node 20.18.0 · npm 10.8.2 (match LegacyLoop versions exactly to avoid heap behavior drift)
- Install build tooling (gcc · make for native deps · sharp · etc.)
- Verify `which node && node --version` matches LegacyLoop Vercel runtime

### Step 2 · Clone LegacyLoop repo (read-only consumer)
```bash
git clone https://github.com/LegacyLoop/LegacyLoop-MVP.git ~/legacy-loop-mvp
cd ~/legacy-loop-mvp
npm install
```

### Step 3 · Copy Sylvia secrets
```bash
scp ~/.env.sylvia user@dedicated-box:~/legacy-loop-mvp/.env.sylvia
ssh user@dedicated-box "chmod 600 ~/legacy-loop-mvp/.env.sylvia && ls -la ~/legacy-loop-mvp/.env.sylvia"
# Expected: -rw------- · 2093 bytes (or current size)
```

### Step 4 · Stand up Sylvia HTTP server on dedicated box
```bash
# Option A: full Next.js with only app/api/sylvia/* exposed (rest 404'd via middleware)
PORT=3001 npm run start

# Option B: Sylvia-only minimal Express server consuming lib/sylvia/* (banked LOW · adds maintenance surface)
```

Recommend Option A (zero new code · same harness as Vercel build).

### Step 5 · Smoke harness (all 4 endpoints)
```bash
SECRET=$(grep "^SYLVIA_API_INTERNAL_SECRET=" ~/legacy-loop-mvp/.env.sylvia | cut -d= -f2- | tr -d '"' | tr -d "'")

# Health
curl -sL -H "Authorization: Bearer $SECRET" http://localhost:3001/api/sylvia/health
# Expected: 200 + JSON with providersOk all true

# Ask (low-stakes)
curl -sL -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -X POST http://localhost:3001/api/sylvia/ask \
  -d '{"question":"What is the average value of a 1990 Honda Accord?","stakes":"low"}'
# Expected: 200 + JSON with answer + confidenceBand + provenance

# Consensus (high-stakes)
curl -sL -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -X POST http://localhost:3001/api/sylvia/consensus \
  -d '{"question":"Estimate fair market value of a 1942 Wurlitzer 78 RPM jukebox.","maxBudgetUsd":0.50}'
# Expected: 200 + JSON with answer + agreementScore + perProvider[5]

# Corpus
curl -sL -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -X POST http://localhost:3001/api/sylvia/corpus \
  -d '{"query":"vintage jukebox restoration cost","topK":3}'
# Expected: 200 + JSON with hits[] + totalCorpusSize
```

### Step 6 · DNS / Tailscale cut
- DNS A record `sylvia.legacy-loop.com` → dedicated box IP
- TTL set to 60s (24h before cut · already pre-staged per checklist Step 7)
- OR: Tailscale MagicDNS · `sylvia.tailnet.ts.net` resolves automatically

### Step 7 · LegacyLoop Vercel env var
- Set `SYLVIA_BASE_URL=https://sylvia.legacy-loop.com` in Vercel project settings
- Set `SYLVIA_API_INTERNAL_SECRET=<value>` (same value as dedicated box `.env.sylvia`)
- Trigger preview deploy (NOT production yet)

### Step 8 · Vercel preview deploy verification
```bash
# In Vercel preview URL
curl -sL https://<preview-url>/api/items/<test-item-id>
# Verify Sylvia call hits dedicated box via Vercel runtime logs
# (look for "sylvia.legacy-loop.com" in fetch trace · NOT "localhost")
```

### Step 9 · Promote to production
- Merge preview → production via Vercel dashboard
- Monitor 24h via:
  - `app/api/internal/scraper-comp-count/route.ts` health (R22 P0 endpoint)
  - Vercel runtime logs (no Sylvia errors)
  - Dedicated box `sylvia-data/audit/` log tail
- DOC-VERCEL-WEBHOOK-WAKE applies (BINDING #23 sentinel)
- DOC-VERIFY-VERCEL-AFTER-COMMIT mandatory (BINDING #21)

---

## §5 · Post-migration smoke harness (production verification)

```bash
# Sylvia health (external HTTPS)
curl -sL https://sylvia.legacy-loop.com/api/sylvia/health \
  -H "Authorization: Bearer $SECRET"
# Expected: 200 + providersOk all true

# LegacyLoop dashboard renders item dossier (Phase 7 dovetail · NB Seed 1)
curl -sL https://app.legacy-loop.com/items/<test-item-id>/dossier
# Expected: 200 · dossier renders with Sylvia-provided context

# Truth Gate dispatch
curl -sL -X POST https://sylvia.legacy-loop.com/api/sylvia/consensus \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"question":"high-stakes test","stakes":"high"}'
# Expected: 200 + agreementScore + perProvider with 4+ provider entries
```

---

## §6 · Rollback path

If migration fails post-cut:

```bash
# In Vercel project settings
SYLVIA_BASE_URL=  # empty string OR remove entirely
```

LegacyLoop falls back to in-process `lib/sylvia/*` import (graceful degradation preserved by design · the seam is migration-safe in **both directions**).

**DNS rollback** (if TTL respected):
- Revert A record OR
- Remove DNS entry · LegacyLoop never resolves `sylvia.legacy-loop.com` · falls through to in-process

**Audit log preserved** on dedicated box even after rollback. CEO can investigate failure cause without rush.

---

## §7 · Cost discipline

| Metric | Pre-migration (Phase 2) | Post-migration (Phase 3) |
|---|---|---|
| Sylvia consensus burst | Drains LegacyLoop Vercel function-execution-time budget | Dedicated box CPU only · zero LegacyLoop impact |
| `sylvia-data/*` growth | Drains LegacyLoop Vercel build size | Dedicated box disk only · independent scaling |
| Provider API calls | Counted toward LegacyLoop $20/mo cap | Sylvia separate $20/mo cap · isolated |
| Cold start latency | Vercel cold start adds 200-800ms | Dedicated box always-warm · sub-50ms typical |
| Outage blast radius | Sylvia outage = LegacyLoop function timeout cascade | Sylvia outage = graceful degradation · in-process fallback if env var unset |

CEO directive · clean isolation · no cross-bleed.

---

## §8 · Reference: V2 12-moat doc

Maps to `Claude_Setup_Patterns_for_Sylvia_2026-05-08.md` V2:
- **M5b** (Hive-mind dispatch) · independently scalable post-Phase-3 · burst load doesn't degrade LegacyLoop UI
- **M10** (Truth Gate) · 5-provider consensus on dedicated CPU · faster + cheaper at scale
- **M11** (Domain Corpus) · `sylvia-data/corpus/` grows on dedicated disk · scaling decoupled
- **M12** (Outreach · Phase 8 Manus autonomous) · gates on Phase 3 isolation · runs without polling LegacyLoop

---

## §9 · Lineage chain (when this plan activates)

```
R22.6 (this fire · architecture canon)
  ↓
R24 (brain wire · app/api/sylvia/* · Phase 2 entry)
  ↓
Phase 2 SOAK (24h-7d localhost validation)
  ↓
CEO seed close · hardware purchase
  ↓
This playbook activates (Phase 3 cut)
  ↓
Phase 3 LIVE · dedicated Sylvia box
  ↓
Phase 8 (Manus autonomous outreach · post-Phase-3 stable)
```

---

End of `SYLVIA_MIGRATION_PLAN.md` · R22.6 · audit-doc-only · CEO-gated execution · zero source · zero auth secrets in doc.
