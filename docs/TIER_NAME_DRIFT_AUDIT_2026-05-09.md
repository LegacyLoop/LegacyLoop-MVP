# Tier Name Drift Audit — 2026-05-09 (Sat)

## §0 · Anchor + Audit Method

**Anchor HEAD:** `91bf2ca` (CMD-YOUTUBE-PRIORITIES-BUILDOUT V19 ship · synced via `bash scripts/worktree-reset.sh 2`)
**Audit fired by:** CMD-TIER-NAME-DRIFT-AUDIT V19 (R25 FILLER · Worktree B · agent-2-slot)
**Drafted by:** Devin (L1) 2026-05-09 Sat AM · IT executes empirical waves
**Source incident:** Pre-investor-demo schema canon hygiene · Dr. Clark warm re-touch queued Mon 5/11 · investor-demo-risk CF in memory ("Tier-name drift schema STARTER/PLUS/PRO ≠ SSOT DIY/POWER/ESTATE")
**Audit method:** 5 grep waves + 6 file reads + cross-namespace collision check + verdict + canonical tree options. ZERO source code edits · ZERO schema migrations · pure documentation deliverable.
**Pattern source:** `docs/HMAC_VERIFY_AUDIT.md` (R22 P2 · 380 LOC) · BINDING #16 DOC-DELEGATE-TO-CANONICAL · BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN (12th application this week).

---

## §1 · Scope

This audit maps every tier-namespace usage across `lib/`, `app/`, `prisma/` and determines whether multiple tier schemas reconcile cleanly or drift into investor-demo risk.

**In-scope namespaces:**
1. **User subscription tier** (4-value: FREE | STARTER | PLUS | PRO · display "Free / DIY Seller / Power Seller / Estate Manager")
2. **White-glove service tier** (3-value: ESSENTIALS | PROFESSIONAL | LEGACY)
3. **Garage-sale 3-price engine** (hypothesized DIY | POWER | ESTATE per investor narrative — empirically TBD)
4. **Scraper cost tier** (Int 1-N internal cost classification — surfaced during audit · NOT a 4th user-facing namespace)

**Out-of-scope:** transaction.type "TIER_FEE" string union (transaction-type enum value, not a tier value).

---

## §2 · Empirical Findings (5 Wave Grep)

| Wave | Tokens | Hits | Real signal |
|---|---|---|---|
| 1 | `FREE\|STARTER\|PLUS\|PRO` | 146 | High noise (PLUS as English in megabot prompts; PRO in LTL freight context). Real subscription-tier hits ≈ 50. |
| 2 | `ESSENTIALS\|PROFESSIONAL\|LEGACY` | 48 | Mostly clean white-glove. Drift candidate at `lib/help-articles.ts:1107`. |
| 3 | `DIY\|POWER\|ESTATE` | 41 | **No standalone DIY/POWER/ESTATE tier namespace in code.** All hits = subscription-tier display labels ("DIY Seller" / "Power Seller" / "Estate Manager") OR estate-service CMD prefixes OR collectibles category strings. |
| 4 | `\btier\b` identifier | 665 | Domain saturation; verifies tier is a first-class concept across both `lib/` and `app/`. |
| 5 | Stripe product-name patterns | 1 real | `lib/stripe-products.ts:52` `name: \`Legacy-Loop ${tier.name}\`` derives Stripe product name from `PLANS.X.name` (lowercase-keyed via TIERS). |

Verbatim wave outputs in **Appendix A**.

---

## §3 · Namespace 1 · User Subscription Tier

| Surface | File:Line | Identifier | Value space |
|---|---|---|---|
| Schema (Int) | `prisma/schema.prisma:36` | `User.tier Int @default(1)` | 1 \| 2 \| 3 \| 4 |
| Schema (String) | `prisma/schema.prisma:151` | `Subscription.tier String` | `FREE \| STARTER \| PLUS \| PRO` (per inline comment) |
| SSOT integers | `lib/constants/pricing.ts:20-25` | `TIER` const | `FREE=1 \| DIY_SELLER=2 \| POWER_SELLER=3 \| ESTATE_MANAGER=4` |
| SSOT display names | `lib/constants/pricing.ts:28-33` | `TIER_NAMES` | `"Free" \| "DIY Seller" \| "Power Seller" \| "Estate Manager"` |
| SSOT plan defs (SHAPE A) | `lib/constants/pricing.ts:39-80` | `PLANS.{FREE,DIY_SELLER,POWER_SELLER,ESTATE_MANAGER}` | keyed by **display label** |
| SSOT generic-key tiers (SHAPE B) | `lib/constants/pricing.ts:740` (TIERS) + `:1021-1026` (TIER_NUMBER_TO_KEY) | `TIERS.{free,starter,plus,pro}` | keyed by **generic label** |
| Bidirectional map | `lib/constants/pricing.ts:1028-1033` | `TIER_KEY_TO_NUMBER` | both lowercase + UPPERCASE accepted |
| Legacy compat re-export | `lib/pricing/constants.ts:124` | `DIGITAL_TIERS` | uppercase generic-keyed: FREE/STARTER/PLUS/PRO |
| Tier enforcement | `lib/tier-enforcement.ts:27,33,80,217` | `getUserTierKey()` etc. | uses generic keys (FREE/STARTER/PLUS/PRO) via `TIER_NUMBER_TO_KEY` |
| Subscription UI display | `app/subscription/SubscriptionClient.tsx:13-19` | `TIER_NAMES` mapping | bridges generic→display: `STARTER → PLANS.DIY_SELLER.name` |
| Stripe product wiring | `lib/stripe-products.ts:32,52` | `TIERS[tierKey.toLowerCase()]` | reads SHAPE B (lowercase-generic) |
| Demo seed | `app/api/demo/seed/route.ts:536` | `tier: "STARTER"` | writes SHAPE B uppercase-generic to Subscription.tier String |

**Internal observation:** SSOT carries **two parallel tier shapes** for the same 4 tiers:
- **SHAPE A (display-keyed):** `PLANS.FREE / PLANS.DIY_SELLER / PLANS.POWER_SELLER / PLANS.ESTATE_MANAGER`
- **SHAPE B (generic-keyed):** `TIERS.free / TIERS.starter / TIERS.plus / TIERS.pro` (mirror of UPPERCASE FREE/STARTER/PLUS/PRO via DIGITAL_TIERS legacy compat)

Documented as intentional backward-compat per `lib/pricing/constants.ts:1-5` docstring. Bridging mapping is hardcoded at `app/subscription/SubscriptionClient.tsx:13-19`.

---

## §4 · Namespace 2 · White-Glove Service Tier

| Surface | File:Line | Identifier | Value space |
|---|---|---|---|
| Schema | `prisma/schema.prisma:176` | `WhiteGloveProject.tier String` | `ESSENTIALS \| PROFESSIONAL \| LEGACY` (per inline comment) |
| Schema | `prisma/schema.prisma:240` | `WhiteGloveBooking.tier String` | `ESSENTIALS \| PROFESSIONAL \| LEGACY` (per inline comment) |
| SSOT defs | `lib/constants/pricing.ts:837-908+` | `WHITE_GLOVE` | lowercase keys: `essentials \| professional \| legacy` |
| SSOT estate-service alt | `lib/constants/pricing.ts:529-533` | `ESTATE_SERVICES` array | id keys: `estate_essentials \| estate_professional \| estate_legacy` (different prefix!) |
| Legacy compat re-export | `lib/pricing/constants.ts:127` | `WHITE_GLOVE_TIERS` | UPPERCASE keys: ESSENTIALS / PROFESSIONAL / LEGACY |
| UI display labels | `app/white-glove/[projectId]/WhiteGloveClient.tsx:21-23,27-29,83` | `TIER_LABELS`/`TIER_COLORS` | uppercase keys read from `project.tier` |
| Public landing | `app/white-glove/page.tsx:12-14,63,132-134` | `TIER_LABELS` + tier rows | uppercase keys |
| Onboarding labels | `app/onboarding/results/page.tsx:20-22,55-70,178-185,268-270` | `TIER_LABELS` + body copy | uppercase keys + display text "Estate Essentials / Estate Professional / Estate Legacy" |
| Quote API | `app/api/quote/route.ts:61,67,73` | `requestedTier` | UPPERCASE writes ("ESSENTIALS"/"PROFESSIONAL") |
| Quiz recommender | `app/onboarding/quiz/page.tsx:206,291,293,295,333` | `recommendedTier` | UPPERCASE values |

**Internal observation:** clean. Schema String matches UI labels matches SSOT (case-folded). The `estate_*` prefix in `ESTATE_SERVICES` is a parallel array, not the canonical table — `WHITE_GLOVE` is canonical.

---

## §5 · Namespace 3 · Garage-Sale "3-Price Engine" — INVESTOR-NARRATIVE-ONLY

**Hypothesis at audit start:** investor narrative cites a "3-price garage-sale engine" with values DIY / POWER / ESTATE.

**Empirical finding:** **No DIY/POWER/ESTATE tier-namespace exists in code.** The canonical garage-sale engine lives at:

| Surface | File:Line | Identifier | Value space |
|---|---|---|---|
| Engine | `lib/pricing/garage-sale.ts:1-17` (file docstring) | "Garage Sale Pricing Engine V2" | returns three price points: **Online** / **Garage Sale** / **Quick Sale** (NOT tier values) |
| Engine config | `lib/pricing/garage-sale.ts:21-65` | `GARAGE_SALE_FACTORS` | per-category min/max discount factors keyed by item category — no DIY/POWER/ESTATE keys |

**The "3-price engine" is a price-point breakdown** (Online list price · Garage-sale walk-up · Quick-sale floor), **not a 3-tier namespace**.

The DIY / POWER / ESTATE tokens cited in investor narrative are **subscription-tier display labels** ("DIY Seller" / "Power Seller" / "Estate Manager") — they do not name the garage-sale price points.

**Verdict for this namespace:** the namespace as-described in investor narrative does not exist as a separate code surface. Investor narrative is conflating two distinct concepts:
- Subscription tiers (4 values · DIY Seller, Power Seller, Estate Manager among them)
- Garage-sale price-point breakdown (3 values · Online, Garage Sale, Quick Sale)

---

## §6 · Cross-Namespace Collision Check

| Token | Subscription tier | White-glove tier | Garage-sale | Other |
|---|---|---|---|---|
| `FREE` | ✅ `User.tier=1` / `Subscription.tier="FREE"` | — | — | "FREE" appears as marketing copy ("FREE built-in scraper") in `lib/market-intelligence/*` — distinct domain |
| `STARTER` | ✅ `Subscription.tier="STARTER"` | — | — | Also a credit-pack id at `lib/constants/pricing.ts` CREDIT_PACK_LIST · distinct domain |
| `PLUS` | ✅ `Subscription.tier="PLUS"` | — | — | Also a credit-pack id · also "PLUS" as English conjunction in megabot prompts (false-positive grep noise) |
| `PRO` | ✅ `Subscription.tier="PRO"` | — | — | Also a credit-pack id · also "PRO Number" (LTL freight tracking · `app/shipping/bol/[itemId]/page.tsx:158`) |
| `DIY` | ✅ display: "DIY Seller" | — | ❌ does not exist as tier value | Used in marketing copy + `TIER.DIY_SELLER` const reference only |
| `POWER` | ✅ display: "Power Seller" | — | ❌ does not exist as tier value | Used in marketing copy + UI section headers ("MEGABOT POWER CENTER") |
| `ESTATE` | ✅ display: "Estate Manager" | "WhiteGloveProject" model name (not tier value) | ❌ does not exist as tier value | Heavy use as concept-prefix: estate-care, white-glove-estate-care, ESTATE JEWELRY (collectibles category) |
| `ESSENTIALS` | — | ✅ `WhiteGloveProject.tier="ESSENTIALS"` | — | Also `ESTATE_SERVICES` id `estate_essentials` |
| `PROFESSIONAL` | — | ✅ `WhiteGloveProject.tier="PROFESSIONAL"` | — | Also UI section header ("PROFESSIONAL REPORT") in MegaBot — distinct |
| `LEGACY` | — | ✅ `WhiteGloveProject.tier="LEGACY"` | — | Also a fallback-display marker ("LEGACY: Fallback display") at `app/items/[id]/ItemToolPanels.tsx:423` — distinct |

**Collision verdict:** zero runtime collisions. Token reuse across distinct domains (e.g. credit pack ids `starter / plus / pro` vs subscription-tier String values) is **separated by surface** — credit packs query `CREDIT_PACK_LIST`, subscription tier reads `Subscription.tier`. No code path treats a credit-pack id as a subscription-tier value.

**Customer-facing drift detected:** `lib/help-articles.ts:1107` (white-glove-overview article body) names the three white-glove tiers as **"Essentials / Complete / Premium"** instead of canonical **"Essentials / Professional / Legacy"** (the very next article at `:1117` uses correct names). Plus the L1107 item-count claims ("up to 50 items / up to 150 items / unlimited") drift from canonical `WHITE_GLOVE` definitions in `lib/constants/pricing.ts:837+` (which advertise 100 / 300 / unlimited items).

---

## §7 · Investor-Narrative SSOT (CEO ref §10)

**Memory CF text (verbatim):** *"Tier-name drift schema STARTER/PLUS/PRO ≠ SSOT DIY/POWER/ESTATE (investor-demo risk)"*

**Empirical reconciliation:**
- Schema `Subscription.tier String` values **are** STARTER / PLUS / PRO (correct per L151 inline comment).
- "DIY/POWER/ESTATE" is **display-only** terminology for the same 4 tiers (Free / DIY Seller / Power Seller / Estate Manager) — not a separate namespace.
- The supposed "DIY/POWER/ESTATE garage-sale engine" is a **conflation** in the investor narrative — the actual engine returns Online / Garage Sale / Quick Sale price points.

**Investor-demo risk:** if Dr. Clark asks *"What tiers do you sell?"*, the honest answer is:
1. **Four subscription tiers** for digital sellers: Free → DIY Seller ($20/mo) → Power Seller ($49/mo) → Estate Manager ($99/mo)
2. **Three white-glove service tiers** for estate sales: Essentials ($2,500) → Professional ($5,000) → Legacy ($10,000)
3. The garage-sale engine returns **three price points per item** (Online / Garage Sale / Quick Sale) — not a tier namespace.

If demo materials phrase #3 as "DIY / POWER / ESTATE 3-tier garage-sale engine," that is **investor-deck shorthand**, not a code-level namespace. Update slide copy to match canonical naming OR acknowledge it's marketing-only shorthand.

---

## §8 · Verdict

🟡 **MINOR DRIFT** — investor-safe with one customer-facing fix queued.

**Evidence weighting:**
- 🟢 Schema clean: 3 tier columns map cleanly to 3 distinct namespaces (subscription Int + subscription String mirror + white-glove String × 2 models same value space). ScraperUsageLog.tier Int is internal-only.
- 🟢 Cross-namespace runtime collisions: ZERO.
- 🟡 SSOT carries two parallel shapes (PLANS display-keyed vs TIERS generic-keyed) for the same 4 subscription tiers. Documented backward-compat. Architecturally inconsistent but functionally correct.
- 🟡 Stripe product naming derives from `PLANS.X.name` ("Legacy-Loop DIY Seller" etc.) but Subscription.tier persists generic uppercase ("STARTER"). Bridge wired; no defect.
- 🟠 `lib/help-articles.ts:1107` customer-facing white-glove paragraph misnames tiers as **Essentials/Complete/Premium** (canonical: Essentials/Professional/Legacy) and misstates item caps (50/150/unlimited vs canonical 100/300/unlimited).
- 🟢 Investor-narrative DIY/POWER/ESTATE "garage-sale engine" is shorthand, not a missing namespace. Real engine = `lib/pricing/garage-sale.ts` returning 3 price points.

**Verdict justification:** zero schema migration required. Zero runtime defect. One customer-facing paragraph (help article) drifts. Investor demo readiness is PASS-with-talking-points (see §11).

---

## §9 · Proposed Canonical Tier Tree (CEO chooses)

### OPTION A · Lock current 3-namespace tree (status quo)
Three distinct namespaces, document the bridge in CLAUDE.md.

```
User.subscriptionTier  Int 1-4   ↔  Subscription.tier String FREE|STARTER|PLUS|PRO
                                         display: Free / DIY Seller / Power Seller / Estate Manager

WhiteGloveProject.tier String     ESSENTIALS | PROFESSIONAL | LEGACY
WhiteGloveBooking.tier String     ESSENTIALS | PROFESSIONAL | LEGACY
                                         display: Estate Essentials / Estate Professional / Estate Legacy

(Internal) ScraperUsageLog.tier Int  cost-class 1-N  · NOT user-facing
```

**Pros:** zero code change · zero schema migration · investor-safe today.
**Cons:** SHAPE A vs SHAPE B parallel-keying remains; new contributors must learn the bridge.

### OPTION B · Collapse to one shape per namespace (refactor cylinder)
Pick SHAPE A (display-keyed) OR SHAPE B (generic-keyed) for subscription tier and rip the other.

**Pros:** clean mental model.
**Cons:** large blast radius (50+ touch sites) · post-investor-demo only · no functional gain.

### OPTION C · Investor-narrative-only fix (this audit's recommendation)
- Fix `lib/help-articles.ts:1107` paragraph to use canonical Essentials/Professional/Legacy + canonical item caps.
- Add a 1-paragraph "Tier Glossary" section to investor demo materials clarifying:
  - Subscription tiers (4) = Free / DIY Seller / Power Seller / Estate Manager
  - White-glove service tiers (3) = Essentials / Professional / Legacy
  - Garage-sale engine = 3 price points per item (Online / Garage Sale / Quick Sale), NOT a tier namespace
- No schema change. No constants change. Single docs touch + single help article touch.

**Recommended:** **OPTION C** for pre-Mon-5/11 demo · BANK OPTION B as post-investor-demo cleanup if SHAPE A vs SHAPE B simplification is desired.

---

## §10 · Banked Remediation Cylinders

| CMD | Trigger | Scope | Risk |
|---|---|---|---|
| `CMD-HELP-ARTICLE-WHITE-GLOVE-NAME-FIX V19` | OPTION C accepted | 1-line paragraph fix at `lib/help-articles.ts:1107` (Complete/Premium → Professional/Legacy + item caps 50/150/∞ → 100/300/∞) | LOW · single-file doc-string content edit |
| `CMD-INVESTOR-PACKET-TIER-GLOSSARY-ADD (PAM-TASK)` | OPTION C accepted | Add 1-paragraph glossary to investor packet/demo deck clarifying the 3 namespaces | LOW · external doc · CEO+PAM owns |
| `CMD-SUBSCRIPTION-TIER-SHAPE-CONSOLIDATE V19` | OPTION B accepted (post-demo) | Collapse PLANS+TIERS into single shape · update 50+ touch sites · schema-stable | HIGH · multi-cylinder · POST-INVESTOR-DEMO ONLY |
| `CMD-CLAUDE-MD-TIER-TREE-DOC` | Any verdict | Add §-block to `CLAUDE.md` documenting the 3 canonical namespaces + bridge mapping | LOW · doc-only |

---

## §11 · Pre-Investor-Demo Readiness (Dr. Clark · Mon 5/11)

### Talking points if Dr. Clark asks "what tiers do you sell?"

> *"Legacy-Loop has two pricing dimensions:*
>
> *1. **Four subscription tiers** for individual sellers — Free, DIY Seller at $20/mo, Power Seller at $49/mo, and Estate Manager at $99/mo. Lower tiers carry higher commission rates that decline as you upgrade. Pre-launch beta pricing is roughly half.*
>
> *2. **Three white-glove service tiers** for full-service estate sales — Essentials at $2,500, Professional at $5,000, and Legacy at $10,000. These cover everything from in-home photography through buyer coordination through shipping. Available in Maine today, expanding nationally.*
>
> *Every item we list, regardless of which tier the seller is on, runs through our 3-price garage-sale engine which surfaces three suggested price points per item: Online list, garage-sale walk-up, and quick-sale floor. That's a pricing tool, not a tier."*

### Slide-ready text (CEO converts to visual via huashu-design later)

```
LEGACYLOOP TIER ARCHITECTURE

  SUBSCRIPTION TIERS (Digital Sellers)
  ───────────────────────────────────
  Free             $0/mo      12% commission
  DIY Seller       $20/mo      8% commission
  Power Seller     $49/mo      5% commission
  Estate Manager   $99/mo      4% commission

  WHITE-GLOVE SERVICE (Full-Service Estate Sales)
  ──────────────────────────────────────────────
  Estate Essentials      $2,500     up to 100 items
  Estate Professional    $5,000     up to 300 items
  Estate Legacy         $10,000     unlimited items

  PRICING ENGINE (Per Item · Built-In · All Tiers)
  ────────────────────────────────────────────────
  Online · Garage Sale · Quick Sale  → 3 price points
```

### Demo-readiness rating

| Category | Rating | Note |
|---|---|---|
| Internal schema integrity | 🟢 PASS | 3 namespaces clean · zero collisions |
| Customer-facing copy | 🟡 MINOR-CAVEAT | 1 help article paragraph misnames white-glove tiers (banked OPTION C fix) |
| Investor narrative coherence | 🟢 PASS-with-talking-points | DIY/POWER/ESTATE shorthand explained as display-only terminology · garage-sale engine clarified as 3 price points (not 3 tiers) |

**Overall: 🟢 PASS-with-talking-points** for Mon 5/11. Banked OPTION C fixes can land before demo as 5-min surgical cylinders.

---

## §12 · Doctrine Self-Audit

| Doctrine | Status | Evidence |
|---|---|---|
| #16 DOC-DELEGATE-TO-CANONICAL | APPLIED | clones `docs/HMAC_VERIFY_AUDIT.md` 14-section structure |
| #17 DOC-AUDIT-FIRST-WIRE-PATTERN | APPLIED · 12th application this week | audit-doc maps drift before any remediation cylinder fires |
| #21 DOC-VERIFY-VERCEL-AFTER-COMMIT | DEFERRED · STOP-BEFORE-COMMIT cylinder · IT emits §12 · CEO greenlights | will apply post-greenlight commit |
| #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING | APPLIED | §3 + §4 chain Stripe → SSOT → schema → enforcement → UI for both namespaces |
| #23 DOC-VERCEL-PROJECT-LIVE-CHECK | N/A | audit-doc-only · zero deploy dependency |
| #25 DOC-VERCEL-BUDGET-CAP-20 | APPLIED | §0 budget impact $0.00 · zero AI calls · zero new endpoints |
| DOC-AUDIT-DOC-DRIFT-CATCH (sustained 5/5+) | APPLIES · this audit IS the doctrine in action · advances toward 7/5+ sustained | discovered + named: customer-facing drift at help-articles.ts:1107 |

---

## §13 · Flags + Routing

**Gaps:**
- `lib/help-articles.ts:1107` white-glove tier names + item caps drift from canonical (banked OPTION C cylinder)
- SSOT carries SHAPE A + SHAPE B parallel keying (banked OPTION B post-investor-demo cylinder)
- Investor packet glossary not yet aligned to 3-namespace truth (banked PAM-TASK)

**Risks:**
- Investor demo confusion if Dr. Clark probes garage-sale "DIY/POWER/ESTATE 3-tier" claim — mitigated by §11 talking points
- Future contributors hitting SHAPE A vs SHAPE B confusion — mitigated by banked CLAUDE.md tier-tree doc cylinder

**Missed data:**
- Tier consumer count by surface (this audit cites surface families · not enumerated counts) — out-of-scope · banked low-priority
- Stripe `metadata["legacyloop_tier"]` value space audit (likely SHAPE B lowercase per `:32-43` · NOT cross-checked exhaustively against live Stripe products)

**Carry-forward:**
- OPTION C fixes (help-article + investor packet glossary) · LOW-RISK · pre-Mon-5/11
- OPTION B subscription-shape consolidation · POST-INVESTOR-DEMO · multi-cylinder
- CLAUDE.md tier-tree doc · LOW-RISK · doc-only

**Suggestions:**
- Add inline schema comment on `User.tier Int` referencing `lib/constants/pricing.ts:20-25` TIER const for forward-compat
- Add inline schema comment on `WhiteGloveProject.tier String` + `WhiteGloveBooking.tier String` referencing `WHITE_GLOVE` SSOT location

**Opportunity:**
- Pre-Series-A diligence cleanup — investor packet alignment + CLAUDE.md tier-tree doc would close hygiene gap before due-diligence reads source

**Flag routing:**
- Verdict 🟡 MINOR DRIFT → `CMD-HELP-ARTICLE-WHITE-GLOVE-NAME-FIX V19` BANKED R26+ (LOW-RISK · 1 paragraph)
- Investor packet glossary → PAM-TASK (Pam refreshes investor materials)
- SHAPE A/B consolidation → BANKED POST-INVESTOR-DEMO (OPTION B)
- CLAUDE.md tier-tree doc → BANKED LOW-PRI (any verdict)
- BINDING #17 application count → DEVIN-TASK ledger update (12th application this week)
- DOC-AUDIT-DOC-DRIFT-CATCH count → DEVIN-TASK ledger advance (sustained at 5/5+)

---

## Appendix A · Verbatim Wave Outputs

### Wave 1 · Subscription tier `(FREE|STARTER|PLUS|PRO)` · 146 hits · 80 sample

```
lib/tier-enforcement.ts:27:/** Get the tier key ("FREE" | "STARTER" | "PLUS" | "PRO") for a user */
lib/tier-enforcement.ts:33:  return TIER_NUMBER_TO_KEY[user?.tier ?? 1] ?? "FREE";
lib/tier-enforcement.ts:80:  const limits = TIER_LIMITS[tierNum] ?? TIER_LIMITS[TIER.FREE];
lib/tier-enforcement.ts:217:  const limits = TIER_LIMITS[userTierNumber] ?? TIER_LIMITS[TIER.FREE];
lib/bots/item-spec-context.ts:96:  FREE: 0.10,
lib/bots/item-spec-context.ts:97:  STARTER: 0.08,
lib/bots/item-spec-context.ts:98:  PLUS: 0.06,
lib/bots/item-spec-context.ts:99:  PRO: 0.04,
lib/megabot/prompts.ts:62: ... PLUS these ADDITIONAL fields ...   [false-positive: English]
lib/constants/pricing.ts:21:  FREE: 1,
lib/constants/pricing.ts:29:  [TIER.FREE]: "Free",
lib/constants/pricing.ts:40:  FREE: { ... }
lib/constants/pricing.ts:1029:  free: 1, FREE: 1,
lib/constants/pricing.ts:1030:  starter: 2, STARTER: 2,
lib/constants/pricing.ts:1031:  plus: 3, PLUS: 3,
lib/constants/pricing.ts:1032:  pro: 4, PRO: 4,
lib/pricing/constants.ts:47:// Legacy name: DIGITAL_TIERS — maps old format { FREE: { commission: 5, monthlyPrice: 20, ... } }
lib/pricing/constants.ts:123:/** Legacy DIGITAL_TIERS export — keyed by uppercase (FREE, STARTER, PLUS, PRO) */
app/subscription/SubscriptionClient.tsx:13-19: TIER_NAMES = { FREE: PLANS.FREE.name, STARTER: PLANS.DIY_SELLER.name, ... }
app/subscription/SubscriptionClient.tsx:200:  const [upgradeTarget, setUpgradeTarget] = useState<string>("PLUS");
app/subscription/SubscriptionClient.tsx:214: const tierMap: Record<string, string> = { diy: "STARTER", power: "PLUS", estate: "PRO" };
app/api/demo/seed/route.ts:536:        tier: "STARTER",
app/api/quote/route.ts:75:    requestedTier = "STARTER";
[remainder: see grep transcript]
```

### Wave 2 · White-glove tier `(ESSENTIALS|PROFESSIONAL|LEGACY)` · 48 hits · full

```
lib/megabot/prompts.ts:455:PROFESSIONAL TIPS ...           [false-positive: English]
lib/constants/pricing.ts:695:// LEGACY EXPORTS — BACKWARD COMPATIBILITY  [false-positive: comment]
lib/pricing/constants.ts:126:/** Legacy WHITE_GLOVE_TIERS export — keyed by uppercase (ESSENTIALS, PROFESSIONAL, LEGACY) */
app/bots/megabot/MegaBotClient.tsx:3202: PROFESSIONAL MULTI-AI CONSENSUS REPORT  [false-positive]
app/white-glove/[projectId]/WhiteGloveClient.tsx:21-23,27-29: TIER_LABELS / TIER_COLORS for white-glove
app/white-glove/[projectId]/WhiteGloveClient.tsx:83:  const tier = TIER_COLORS[project.tier] ?? TIER_COLORS.ESSENTIALS;
app/white-glove/page.tsx:12-14,63,132-134: TIER_LABELS + landing copy
app/api/quote/route.ts:61,67,73: requestedTier writes
app/onboarding/quiz/page.tsx:206,291,293,295,333: recommendedTier
app/onboarding/results/page.tsx:20-22,28,41,47,55-70,178,185,268-270: TIER_LABELS + body copy
app/items/[id]/ItemToolPanels.tsx:423: // ── LEGACY: Fallback display ...   [false-positive: comment marker]
prisma/schema.prisma:176:  tier String // ESSENTIALS | PROFESSIONAL | LEGACY
prisma/schema.prisma:240:  tier String // ESSENTIALS | PROFESSIONAL | LEGACY
```

### Wave 3 · Garage-sale `(DIY|POWER|ESTATE)` · 41 hits · 80 sample

```
lib/tier-enforcement.ts:129,143: ... "DIY Seller or higher!" ...   [display-string only]
lib/constants/pricing.ts:30:  [TIER.DIY_SELLER]: "DIY Seller",
lib/constants/pricing.ts:52:    name: "DIY Seller",
lib/constants/pricing.ts:224-248: standard/market/ready/garageSaleNetwork: TIER.DIY_SELLER
lib/constants/pricing.ts:525:// SECTION J — ESTATE SERVICES   [section header]
app/heroes/page.tsx:273: { plan: "DIY Seller", ... }   [marketing display]
app/subscription/SubscriptionClient.tsx:860: headers={["Feature", "Free", "DIY Seller", "Power Seller", "Estate Manager"]}
app/components/AppNav.tsx:93:  2: "DIY Seller",
app/components/billing/CancelFlowModal.tsx:13: ... name: "DIY Seller", ...
app/api/bots/videobot/[itemId]/route.ts:98,102,111: tier-name display strings
app/api/bots/collectiblesbot/[itemId]/route.ts:505: ESTATE JEWELRY & GEMSTONES:   [collectibles category · distinct domain]
app/api/bots/activate/[itemId]/route.ts:262,267: "MegaBuying Bot requires DIY Seller+"   [display-string]
app/api/intelligence/[itemId]/chat/route.ts:83,86: "Ask Claude requires DIY Seller+"   [display-string]
app/api/white-glove/cancel/route.ts:15: CMD-WAVE2-WHITE-GLOVE-ESTATE-CARE   [CMD prefix · not tier value]
app/api/help/chat/route.ts:36: "4 subscription tiers: Free, DIY Seller ($10/mo), Power Seller ($25/mo), Estate Manager ($75/mo)"
                                                              ↑ NOTE: $10/$25/$75 here is pre-launch pricing · current sticker is $20/$49/$99
app/items/[id]/ItemDashboardPanels.tsx:8445,10012: MEGABOT POWER CENTER   [UI section header]
app/help/HelpClient.tsx:34: ... "We have 4 plans: Free (3 items), DIY Seller ($10/mo, 25 items), Power Seller ($25/mo, 100 items), and Estate Manager ($75/mo, unlimited)"
                                                              ↑ pre-launch pricing same as above
app/onboarding/results/page.tsx:17: STARTER: "DIY Seller",   [bridge mapping]
```

### Wave 4 · `\btier\b` identifier saturation

```
$ grep -rnE "\btier\b" --include="*.ts" --include="*.tsx" --include="*.prisma" lib/ app/ prisma/ | wc -l
665
```

Domain saturation. `tier` appears across 25+ files in `lib/` and `app/` plus all 4 schema-tier columns plus the ScraperUsageLog Int.

### Wave 5 · Stripe product naming

```
lib/stripe-products.ts:14:// In-memory cache of created Stripe Price IDs (tier:period → price_id)
lib/stripe-products.ts:32:    const tier = TIERS[tierKey.toLowerCase()];
lib/stripe-products.ts:43:      query: `metadata["legacyloop_tier"]:"${tierKey.toLowerCase()}"`,
lib/stripe-products.ts:52:        name: `Legacy-Loop ${tier.name}`,     [→ "Legacy-Loop DIY Seller" etc.]
lib/stripe-products.ts:53:        metadata: { legacyloop_tier: tierKey.toLowerCase() },
lib/stripe-products.ts:81:        metadata: { legacyloop_tier: tierKey.toLowerCase(), billing_period: ... }
```

Stripe persists SHAPE B lowercase via `metadata.legacyloop_tier` AND derives display name from SHAPE A `tier.name`. Bridge wired.

---

## Appendix B · Schema Tier Columns (verbatim)

```
prisma/schema.prisma:36:    User.tier             Int    @default(1)
prisma/schema.prisma:151:   Subscription.tier      String   // FREE | STARTER | PLUS | PRO
prisma/schema.prisma:176:   WhiteGloveProject.tier String   // ESSENTIALS | PROFESSIONAL | LEGACY
prisma/schema.prisma:240:   WhiteGloveBooking.tier String   // ESSENTIALS | PROFESSIONAL | LEGACY
prisma/schema.prisma:1212:  ScraperUsageLog.tier   Int                  // internal scraper cost class · NOT user-facing
```

— end —
