# Tier-Name Canonical Reference · Legacy-Loop

> **Status:** Reconciliation map · doc-only · zero schema edit
> **Source:** `docs/TIER_NAME_DRIFT_AUDIT_2026-05-09.md` (R25 audit · YELLOW MINOR DRIFT verdict)
> **Resolves:** Master Backlog §G P1-Y1 (carryover R25→R28→R29)
> **Anchor:** R29 P35 Wave 3 Slot 3 rider per DOC-FLAG-RIDER-PER-CYLINDER 5/5

## 3 distinct tier namespaces in Legacy-Loop

Legacy-Loop has THREE separate tier systems with NO semantic overlap. Drift class: investor narratives sometimes conflate the three. This doc is canonical cross-reference to prevent re-occurrence.

### 1. User subscription tier (Stripe-backed billing)

| Tier | Code value | Source |
|---|---|---|
| Free | `FREE` | `prisma/schema.prisma` L151 `User.tier` |
| Starter | `STARTER` | same |
| Plus | `PLUS` | same |
| Pro | `PRO` | same |

Consumer: `lib/tier-enforcement.ts` · Stripe products: `lib/stripe-products.ts` L52.

### 2. Estate sale service tier (sale-flow product offering)

| Tier | Code value | Source |
|---|---|---|
| Essentials | `ESSENTIALS` | `prisma/schema.prisma` L176 + L240 `EstateSale.tier` |
| Professional | `PROFESSIONAL` | same |
| Legacy | `LEGACY` | same |

Consumer: estate sale booking flow + invoice surfaces.

### 3. Investor "3-price garage-sale engine" (narrative-only · NOT in schema)

| Tier | Code value | Source |
|---|---|---|
| DIY | (not in code) | investor packet narrative · 5/01 era CEO ref |
| Power | (not in code) | same |
| Estate | (not in code) | same |

**Important:** DIY/POWER/ESTATE labels appear in investor packet narrative but DO NOT exist as values in any schema or codebase identifier. Garage-sale "3-price engine" terminology is investor-facing only · maps internally to `Item.saleMethod` (`LOCAL_PICKUP | ONLINE_SHIPPING | BOTH`) + pricing tier logic in PriceBot.

## Drift prevention rules

1. **Specs citing tier names** MUST cite which of the 3 namespaces · NEVER mix
2. **Investor packets** can use DIY/POWER/ESTATE but must footnote "internal: saleMethod + PriceBot tier logic"
3. **Schema migrations** touching `User.tier` OR `EstateSale.tier` MUST cite this doc + L151/L176/L240 verbatim
4. **Sales surface UI** copy must match exact schema enum values · no synonyms

## Cross-references

- Audit source: `docs/TIER_NAME_DRIFT_AUDIT_2026-05-09.md` (R25 FILLER · `91bf2ca` anchor)
- Schema: `prisma/schema.prisma` L151 (User.tier) · L176+L240 (EstateSale.tier)
- Bot logic: `lib/tier-enforcement.ts` + PriceBot skill packs `lib/bots/skills/pricebot/03-scope-aware-market-tiers.md`
- Investor narrative: `07_Investor/` vault dir (Pam-owned · brand)

## Last updated

2026-05-14 (Thu) · R29 P35 Wave 3 Slot 3 rider · CMD-AUDIT-DIR-CREATE-AND-COMMIT V19
