# Perplexity Sonar Slotting Audit · 2026-05-03

**Author:** Pam (Cowork · Layer 1 · AI track) · executed by IT (Claude Code)
**Anchor HEAD:** `fa80793bba7b0e32ec219eb810c28f113c4e1bda` (CMD-DOCS-README-STACK-REFRESH V18 · Sat 2026-05-02 EOD)
**Scope:** 4 surface buckets — 13 bots · Item Dashboard panels · admin panels · Sylvia tools
**Output target:** `docs/PERPLEXITY_SLOTTING_AUDIT_2026-05-03.md` (NEW · this file)
**CMD spec:** `CMD-PERPLEXITY-SLOTTING-AUDIT V18` · Sunday Spec 1 of 3

---

## Coverage Scoreboard (at HEAD `fa80793b`)

| Surface bucket | Wired today | Total slots | Coverage |
|---|---|---|---|
| Bots | 2 | 13 | 15% |
| Item Dashboard panels | 0 | 4 (Sonar-eligible · 30+ siblings classified Display-only or N/A) | 0% |
| Admin panels | 0 | 4 | 0% |
| Sylvia tools | 0 | 4 | 0% (BANKED · Cyl 7 dependent) |
| **Total Sonar slots banked** | **8 wire cylinders + 4 banked Sylvia + 1 doctrine call** | — | — |
| **Estimated total effort** | ~12-15 hours IT (excluding Sylvia tools · post-Cyl-7) | — | — |

**Grounding (verified `fa80793b`):**
- `lib/adapters/bot-ai-router/config.ts` L47-125 → 11 bot entries · 2 with `liveWebProvider: "perplexity"` (pricebot L62 · reconbot L84)
- `lib/adapters/bot-ai-router/types.ts` L34 → `ProviderName` includes `"perplexity"` · L70 `liveWebProvider?` field · L101 `requiresLiveWeb?` caller signal
- `app/api/bots/` directory → 11 router-controlled bot routes + `shipbot/` (carrier-API-bound) = 12; 13th = `DocumentBot` (skill-pack only · no bot-ai-router entry)
- `app/items/[id]/` → 38 .tsx files (panels + components + utility hooks)
- `app/admin/` → 4 surfaces (`page.tsx` · `heroes/` · `pricing-accuracy/` · `quotes/`)
- 4 LiteLLM Sonar aliases LOCKED: `sonar` · `sonar-pro` · `sonar-reasoning-pro` · `sonar-deep-research`

**Hybrid-runner pattern (canonical · Cyl S35 ratified):** every wire cylinder follows the PriceBot/ReconBot template — caller-side `requiresLiveWeb` predicate computed at route handler · router branches to `liveWebProvider` only when both the predicate fires AND `triggers` includes `"live_web_needed"`.

---

## §1 · 13 BOTS

11 bots in `bot-ai-router/config.ts` + ShipBot (carrier-API specialist · no router entry) + DocumentBot (skill-pack only · no router entry) = 13.

### 1. AnalyzeBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L48-53 · no `liveWebProvider`) |
| Recommended Sonar alias | `sonar-pro` |
| Why it fits | Live-web verification of item identification — especially for novel/recent items (post-2024 releases · trending products) that Gemini's training set hasn't seen. AnalyzeBot is upstream of every other bot · adding live-web grounding here lifts downstream signal quality across the fleet. |
| Effort | M (~1 hr) |
| Priority | P1 |
| Banked cylinder name | CMD-ANALYZEBOT-SONAR-WIRE |
| Pre-req | NONE |
| Notes | Hybrid-runner pattern from PriceBot/ReconBot. Caller computes `requiresLiveWeb` from item-age signal (e.g., released < 2 yrs ago) or category flag. |

### 2. PriceBot

| Field | Value |
|---|---|
| Current Sonar wiring | **ALREADY WIRED** (config.ts L62 · `liveWebProvider: "perplexity"` · uses `sonar` alias via hybrid runner at `app/api/bots/pricebot/[itemId]/route.ts` L500-530) |
| Recommended Sonar alias | `sonar` (current) |
| Why it fits | Live comp pricing on volatile categories (Antiques · Collectibles · Vehicles · Watches) — Cyl S35 ratified via advisor I3. |
| Effort | DONE |
| Priority | DONE |
| Banked cylinder name | NONE (already shipped) |
| Pre-req | NONE |
| Notes | Coverage row only · canonical reference implementation for new wire cylinders. |

### 3. PhotoBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | N/A |
| Why it fits | Photo quality analysis is vision-bound · no live-web fit. |
| Effort | — |
| Priority | WONTFIX-NO-FIT |
| Banked cylinder name | NONE |
| Pre-req | — |
| Notes | CEO-confirm before next sprint per §5 doctrine flag. |

### 4. BuyerBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L70-74) |
| Recommended Sonar alias | `sonar` |
| Why it fits | Live-web buyer-intent signals · marketplace activity scrape · subreddit/forum chatter for niche-item demand. |
| Effort | L (~3 hr) |
| Priority | P2 |
| Banked cylinder name | CMD-BUYERBOT-SONAR-WIRE |
| Pre-req | Cyl 7 closed (buyer-data baseline must land first to ground the live-web signals) |
| Notes | Effort is L because BuyerBot's prompt surface is bigger than other bots — multiple hook variants per item. |

### 5. ReconBot

| Field | Value |
|---|---|
| Current Sonar wiring | **ALREADY WIRED** (config.ts L84 · `liveWebProvider: "perplexity"` · uses `sonar-deep-research` alias via hybrid runner at `app/api/bots/reconbot/[itemId]/route.ts` L460-520) |
| Recommended Sonar alias | `sonar-deep-research` (current) |
| Why it fits | Deep market intelligence scans · multi-source citation chains · Cyl S35 ratified via advisor I3. |
| Effort | DONE |
| Priority | DONE |
| Banked cylinder name | NONE (already shipped) |
| Pre-req | NONE |
| Notes | Coverage row only. |

### 6. ListBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L86-91 · hybrid Claude+Grok always) |
| Recommended Sonar alias | `sonar-pro` |
| Why it fits | Live-web SEO keyword freshness + listing-template patterns from current-month marketplace winners. ListBot output ships directly to listing publishers — staleness is immediately visible to buyers. |
| Effort | M (~1 hr) |
| Priority | P1 |
| Banked cylinder name | CMD-LISTBOT-SONAR-WIRE |
| Pre-req | NONE |
| Notes | ListBot is currently `triggers: ["always"]` premium-tier · adding Sonar must respect cost ceiling. Use `requiresLiveWeb` predicate to gate (e.g., only on $200+ items). |

### 7. AntiqueBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L92-97) |
| Recommended Sonar alias | `sonar-deep-research` |
| Why it fits | Rare-item provenance lookups need authoritative current sources (auction house archives · provenance databases). Rare items are the high-value tail — every accuracy point here lifts realized sale price meaningfully. |
| Effort | M (~1 hr) |
| Priority | **P0** (highest non-already-wired priority) |
| Banked cylinder name | CMD-ANTIQUEBOT-SONAR-WIRE |
| Pre-req | NONE |
| Notes | Pairs naturally with AntiqueAlert panel (which inherits this wiring downstream). |

### 8. CollectiblesBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L98-103) |
| Recommended Sonar alias | `sonar-pro` |
| Why it fits | Grading authority sites (PSA · Beckett · CGC · BGS) update prices and grading rubrics weekly. Live-web essential to keep grading guidance current. |
| Effort | M (~1 hr) |
| Priority | P1 |
| Banked cylinder name | CMD-COLLECTIBLESBOT-SONAR-WIRE |
| Pre-req | NONE |
| Notes | Recent V18 fire (CMD-CONFIDENCE-COLLECTIBLES-NORMALIZE `4eaf752`) hardened the consumer-side confidence scale — Sonar wire fits cleanly on top. |

### 9. CarBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L104-109) |
| Recommended Sonar alias | `sonar` |
| Why it fits | Live KBB / NADA / Bring-A-Trailer / Cars.com pulls — vehicle pricing volatility is high (model-year + mileage + region all matter, all change weekly). |
| Effort | M (~1 hr) |
| Priority | P1 |
| Banked cylinder name | CMD-CARBOT-SONAR-WIRE |
| Pre-req | NONE |
| Notes | Triggers should fire on `flags.vehicle === true` AND `carYear` present (covers existing `rare_vehicle` trigger surface). |

### 10. VideoBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L113-118) |
| Recommended Sonar alias | `sonar` |
| Why it fits | Live-web verification of video-described items (e.g., trending TikTok/Insta product references). |
| Effort | M (~1 hr) |
| Priority | P2 |
| Banked cylinder name | CMD-VIDEOBOT-SONAR-WIRE |
| Pre-req | NONE |
| Notes | **Doctrine candidate** · VideoBot's primary cost is video processing not search · Sonar adds proportionally less value than for text-bots. CEO recheck cost/benefit before fire. |

### 11. ShipBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (no router entry · `app/api/bots/shipbot/[itemId]/route.ts`) |
| Recommended Sonar alias | N/A |
| Why it fits | Carrier APIs (Shippo · ShipEngine · EasyPost · FedEx · ARTA) are authoritative live data sources. Sonar adds zero value over direct API calls. |
| Effort | — |
| Priority | WONTFIX-NO-FIT |
| Banked cylinder name | NONE |
| Pre-req | — |
| Notes | CEO-confirm before next sprint per §5 doctrine flag. |

### 12. DocumentBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (skill-pack only · no router entry) |
| Recommended Sonar alias | N/A |
| Why it fits | Pure document generation · uses item context as input · no live-web requirement. FREE-tier platform system. |
| Effort | — |
| Priority | WONTFIX-NO-FIT |
| Banked cylinder name | NONE |
| Pre-req | — |
| Notes | CEO-confirm. Could revisit IF document templates ever need fresh regulatory/compliance text — not the case today. |

### 13. MegaBot

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (config.ts L119-124 · placeholder · router defers to `runMegabot()` directly) |
| Recommended Sonar alias | **DOCTRINE-CANDIDATE** — `sonar-reasoning-pro` if 5th provider · `sonar-pro` if Gemini-replace for live-web tasks |
| Why it fits | MegaBot runs 4-AI consensus (OpenAI · Claude · Gemini · Grok). Adding Sonar as 5th provider broadens consensus AND grounds it in live web. ALTERNATIVE: keep 4 providers but swap Gemini → Sonar for live-web-flagged calls. |
| Effort | L (~3 hr) |
| Priority | P2 |
| Banked cylinder name | CMD-MEGABOT-SONAR-DOCTRINE |
| Pre-req | CEO doctrine call (5th provider vs Gemini-replace) — `DOC-MEGABOT-PROVIDER-COMPOSITION` candidate ratifies on CEO decision |
| Notes | **DO NOT auto-fire.** This is a strategic composition change — must go through CEO doctrine review before any wire cylinder drafts. |

---

## §2 · ITEM DASHBOARD PANELS

Scanned `app/items/[id]/` — 38 .tsx files. Classification:

- **Sonar-eligible (4 panels):** DetectionHUD · AmazonPriceBadge · ItemIntelligenceSummary · MegaBuyingBotPanel
- **Inherits-from-bot (banked with parent bot):** AntiqueAlert (←AntiqueBot) · ReconBotPanel (←ReconBot · already wired) · MegaBotPanel (←MegaBot doctrine call)
- **Display-only / N/A (rest):** ConfidencePill · ActivityLog · DocumentVault · ItemControlCenter · ItemCostBreakdown · ItemPhotoStrip · ItemToolPanels · JuryVerdictSheet · LocalPickupPanel · MessageCenter · PhotoGallery · ReviewPrompt · SaleAssignment · SaleCongratsBar · ShareDropdown · ShippingPanel · SoldPriceWidget · StoryCapture · TrackingTimeline · TradeProposalsPanel · TradeToggle · V8PillsStrip · VehicleSpecsCard · AnalyzeActions · AnalyzeButton · ItemDashboardPanels (orchestrator) · loading.tsx · `edit/` subdir · 2 hooks (useAutoBotRefresh · useAutoReconcile)

### 2.1 DetectionHUD (`app/items/[id]/DetectionHUD.tsx`)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar` |
| Why it fits | Live-web confidence boost on item-detection HUD overlay. Renders trust signals to user — fresher data = stronger trust. |
| Effort | S (~30 min) |
| Priority | P2 |
| Banked cylinder name | CMD-DETECTIONHUD-SONAR-SLOT |
| Pre-req | CMD-ANALYZEBOT-SONAR-WIRE (DetectionHUD consumes AnalyzeBot output) |
| Notes | Inherits Sonar wiring transitively if AnalyzeBot wires first · may not need standalone cylinder. |

### 2.2 AmazonPriceBadge (`app/items/[id]/AmazonPriceBadge.tsx`)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar` |
| Why it fits | Live Amazon comp pull · current-day Amazon price beats stale Rainforest cache for high-velocity SKUs. |
| Effort | S (~30 min) |
| Priority | P1 |
| Banked cylinder name | CMD-AMAZONPRICEBADGE-SONAR-SLOT |
| Pre-req | NONE |
| Notes | Highest-priority panel-level wire · visible above-fold on item detail · investor-demo surface. |

### 2.3 ItemIntelligenceSummary (`app/items/[id]/ItemIntelligenceSummary.tsx`)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar-pro` |
| Why it fits | Aggregates intel from multiple bots — live-web overlay validates the aggregate against current market state. |
| Effort | M (~1 hr) |
| Priority | P2 |
| Banked cylinder name | CMD-ITEMINTELLIGENCESUMMARY-SONAR-SLOT |
| Pre-req | At least 2 of (AnalyzeBot · PriceBot · ReconBot) Sonar-wired (PriceBot already done · ReconBot already done · so technically pre-req met today) |
| Notes | Wait until AnalyzeBot also wires before firing — gives 3-bot Sonar foundation for the summary panel. |

### 2.4 MegaBuyingBotPanel (`app/items/[id]/MegaBuyingBotPanel.tsx`)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | TBD (depends on MegaBot doctrine call) |
| Why it fits | Buying-side MegaBot variant. Inherits whatever the MegaBot Sonar doctrine ratifies. |
| Effort | TBD |
| Priority | P2 |
| Banked cylinder name | CMD-MEGABUYINGBOTPANEL-SONAR-SLOT |
| Pre-req | CMD-MEGABOT-SONAR-DOCTRINE (CEO call) |
| Notes | Inherits parent doctrine. |

---

## §3 · ADMIN PANELS

4 surfaces in `app/admin/`.

### 3.1 admin/page.tsx (top-level admin dashboard)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar` |
| Why it fits | Live ops scorecard — current-day market activity context for admin user. |
| Effort | S (~30 min) |
| Priority | P2 |
| Banked cylinder name | CMD-ADMIN-DASHBOARD-SONAR-SLOT |
| Pre-req | NONE |
| Notes | Optional — admin dashboard may already aggregate sufficient internal signals without needing live web. Reassess after admin-pricing-accuracy lands. |

### 3.2 admin/heroes/page.tsx (hero verification)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | N/A |
| Why it fits | Hero verification is custom social-signal work · Sonar not a fit. |
| Effort | — |
| Priority | WONTFIX-NO-FIT |
| Banked cylinder name | NONE |
| Pre-req | — |
| Notes | CEO-confirm. |

### 3.3 admin/pricing-accuracy/page.tsx (**HIGHEST-VALUE admin slot**)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar-deep-research` |
| Why it fits | Bot output verified against live web for accuracy QA. Pricing-accuracy panel is the closed-loop feedback surface — Sonar provides the ground-truth signal. **Highest-leverage Sonar wire in the entire audit** because it tunes every other bot via QA feedback. |
| Effort | M (~1 hr) |
| Priority | **P0** |
| Banked cylinder name | CMD-ADMIN-PRICING-ACCURACY-SONAR-WIRE |
| Pre-req | NONE |
| Notes | **FIRST cylinder to fire from this audit** per §6 sequence. |

### 3.4 admin/quotes/page.tsx (service quotes)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar` |
| Why it fits | Live freight rate spot-check vs ARTA / freight-broker quotes — admin sanity gate before quote sends to customer. |
| Effort | S (~30 min) |
| Priority | P2 |
| Banked cylinder name | CMD-ADMIN-QUOTES-SONAR-SLOT |
| Pre-req | NONE |
| Notes | Carrier APIs are still authoritative — Sonar is sanity overlay only, not replacement. |

---

## §4 · SYLVIA TOOLS (BANKED · CYL 7 DEPENDENT)

Per advisor S2 ruling Apr 30: Tier 1 Sylvia tools BANKED until Cyl 7 ships proprietary data. Per advisor S3: 3 core tools approved (LiteLLM Gateway · read-only FS · Slack read). Sonar tools below are slot-recommendations for the moment Cyl 7 closes.

### 4.1 Sylvia Live-Web Search Tool

| Field | Value |
|---|---|
| Current Sonar wiring | NONE (`lib/sylvia/` does not exist at HEAD `fa80793b` · Spec 2 creates it) |
| Recommended Sonar alias | `sonar-reasoning-pro` |
| Why it fits | Chain-of-thought research grounded in live web — Sylvia's primary research surface. |
| Effort | M (~1 hr · post-Cyl-7) |
| Priority | P1 |
| Banked cylinder name | CMD-SYLVIA-SEARCH-SONAR-WIRE |
| Pre-req | **BANKED-CYL-7-DEPENDENT** · advisor S2 ruling |
| Notes | Fires Mon/Tue post-Cyl-7 closure. |

### 4.2 Sylvia Comp Verification Tool

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar` |
| Why it fits | Spot-check Sylvia's comp claims against live web before surfacing to user — prevents hallucinated comps. |
| Effort | M (~1 hr · post-Cyl-7) |
| Priority | P1 |
| Banked cylinder name | CMD-SYLVIA-COMP-VERIFY-SONAR-WIRE |
| Pre-req | **BANKED-CYL-7-DEPENDENT** · pairs with Honesty Guardrail in Sylvia V4 dual-core architecture |
| Notes | Critical for Honesty Guardrail enforcement. |

### 4.3 Sylvia Deep-Research Tool

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar-deep-research` |
| Why it fits | Investor-facing research questions ("how does LegacyLoop compare to Mercari?") — multi-source synthesis with citations. |
| Effort | M (~1 hr · post-Cyl-7) |
| Priority | P2 |
| Banked cylinder name | CMD-SYLVIA-DEEP-RESEARCH-SONAR-WIRE |
| Pre-req | **BANKED-CYL-7-DEPENDENT** |
| Notes | Lower priority — fires after the comp verify + search tools land. |

### 4.4 Sylvia Pricing Tool (`@Sylvia-Pricing` sub-skill per advisor S4)

| Field | Value |
|---|---|
| Current Sonar wiring | NONE |
| Recommended Sonar alias | `sonar` (fallback) |
| Why it fits | Sylvia pricing uses ScraperComp data first (proprietary moat) · Sonar fallback only when local cache misses. |
| Effort | M (~1 hr · post-Cyl-7) |
| Priority | P1 |
| Banked cylinder name | CMD-SYLVIA-PRICING-SONAR-FALLBACK-WIRE |
| Pre-req | **BANKED-CYL-7-DEPENDENT** · ScraperComp must be populated first |
| Notes | Must respect Honesty Guardrail · Sonar fallback labeled as "live-web supplement" in Sylvia output. |

---

## §5 · CROSS-CUTTING DOCTRINE FLAGS

1. **MegaBot Sonar composition** — CEO doctrine call needed. 5th provider model (consensus over 5) vs Gemini-replace model (Sonar takes Gemini's slot for live-web-flagged calls). Banks `DOC-MEGABOT-PROVIDER-COMPOSITION` candidate · ratifies on CEO decision. **Do NOT pre-judge** — wire cylinder cannot draft until doctrine ratifies.
2. **VideoBot Sonar cost-benefit** — VideoBot's primary cost is video processing not search · Sonar adds proportionally less value than for text-bots. Doctrine candidate · CEO recheck before fire. Banks observation: "Sonar fit is inversely proportional to per-call non-search cost."
3. **WONTFIX-NO-FIT confirmations** — PhotoBot · ShipBot · DocumentBot all marked N/A. Confirm with CEO before next sprint to prevent re-litigation.
4. **Hybrid-runner pattern is canonical** — Cyl S35 ratified. Every wire cylinder inherits the PriceBot/ReconBot template:
   - Caller-side `requiresLiveWeb` predicate at route handler
   - `triggers` includes `"live_web_needed"` in config.ts entry
   - `liveWebProvider: "perplexity"` set in config.ts entry
   - Router branches at `lib/adapters/bot-ai-router/router.ts` (existing logic · zero edits per cylinder)
5. **Inherits-transitively rule** — Item Dashboard panels that consume bot output (DetectionHUD ← AnalyzeBot, AntiqueAlert ← AntiqueBot, ReconBotPanel ← ReconBot, MegaBuyingBotPanel ← MegaBot) inherit Sonar wiring through their parent bot's wire cylinder. Standalone panel cylinders only needed for direct-consume surfaces (AmazonPriceBadge · admin/pricing-accuracy).
6. **Sylvia tools BANKED is hard gate** — advisor S2 ruling. NO Sylvia Sonar wire fires before Cyl 7 closes. Spec 2 (TRIAGE-ROUTER) and Spec 3 (COLLECTIVE-MEMORY) are independent prereqs · this audit just maps the future-state slots.
7. **Cost ceiling per bot** — once 5+ bots use Sonar, build cross-bot quota dashboard (banked carry-forward §14 item 5). Today's spend model (PriceBot + ReconBot only) hasn't exposed the need yet.

---

## §6 · RECOMMENDED FIRE SEQUENCE

Order respects: P0 first · low-risk before high-risk · upstream bots before downstream consumers · doctrine calls before wire cylinders that gate on them.

1. **CMD-ADMIN-PRICING-ACCURACY-SONAR-WIRE** (P0 · low risk · highest-leverage signal · tunes every other bot via QA feedback loop)
2. **CMD-ANTIQUEBOT-SONAR-WIRE** (P0 · rare-item revenue lever · pairs naturally with AntiqueAlert downstream)
3. **CMD-ANALYZEBOT-SONAR-WIRE** (P1 · upstream of all bots · lifts downstream signal quality across the fleet · DetectionHUD inherits)
4. **CMD-LISTBOT-SONAR-WIRE** (P1 · listing quality lift · directly visible to buyers)
5. **CMD-CARBOT-SONAR-WIRE** (P1 · vehicle pricing volatility)
6. **CMD-COLLECTIBLESBOT-SONAR-WIRE** (P1 · grading authority freshness)
7. **CMD-AMAZONPRICEBADGE-SONAR-SLOT** (P1 · panel-level · investor-demo surface)
8. **CMD-MEGABOT-SONAR-DOCTRINE** (CEO call · gates on doctrine ratification before any wire cylinder drafts)
9. *(post-Cyl-7)* CMD-SYLVIA-SEARCH-SONAR-WIRE (P1)
10. *(post-Cyl-7)* CMD-SYLVIA-COMP-VERIFY-SONAR-WIRE (P1)
11. *(post-Cyl-7)* CMD-SYLVIA-PRICING-SONAR-FALLBACK-WIRE (P1)
12. *(deferred)* CMD-VIDEOBOT-SONAR-WIRE (P2 · doctrine recheck first)
13. *(deferred)* CMD-BUYERBOT-SONAR-WIRE (P2 · gates on Cyl 7 buyer-data baseline)
14. *(deferred)* CMD-DETECTIONHUD-SONAR-SLOT (likely inherits from #3 · may not need standalone)
15. *(deferred)* CMD-ITEMINTELLIGENCESUMMARY-SONAR-SLOT (P2 · waits for AnalyzeBot wire)
16. *(deferred)* CMD-MEGABUYINGBOTPANEL-SONAR-SLOT (gates on MegaBot doctrine)
17. *(deferred)* CMD-ADMIN-DASHBOARD-SONAR-SLOT (P2 · reassess after pricing-accuracy lands)
18. *(deferred)* CMD-ADMIN-QUOTES-SONAR-SLOT (P2 · sanity overlay only)
19. *(post-Sylvia-stable)* CMD-SYLVIA-DEEP-RESEARCH-SONAR-WIRE (P2)

**Estimated wall-clock for items 1-7 (the P0+P1 batch):** ~7-9 hours IT across Mon-Wed · 7 cylinders · each fires under its own §12 with its own smoke per CMD discipline.

---

## Audit closure

| Item | Count |
|---|---|
| Bots audited | 13 |
| Bots already wired | 2 (PriceBot · ReconBot) |
| Bots banked for wire cylinders | 8 (P0×2 + P1×4 + P2×2) |
| Bots WONTFIX-NO-FIT | 3 (PhotoBot · ShipBot · DocumentBot) |
| Bots awaiting CEO doctrine call | 1 (MegaBot — composition decision) |
| Item Dashboard panels Sonar-eligible | 4 |
| Admin panels Sonar-eligible | 3 (1 P0 + 2 P2 · 1 WONTFIX) |
| Sylvia tools banked Cyl-7-dependent | 4 |
| Doctrine candidates banked | `DOC-MEGABOT-PROVIDER-COMPOSITION` · `DOC-AUDIT-FIRST-WIRE-PATTERN` |

**Audit produced by CMD-PERPLEXITY-SLOTTING-AUDIT V18 · Sunday Spec 1 of 3 · 2026-05-03.**
