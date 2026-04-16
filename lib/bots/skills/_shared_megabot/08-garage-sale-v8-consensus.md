---
name: garage-sale-v8-consensus
description: V8 three-number consensus arbitration. Teaches MegaBot how to merge 4-AI outputs for LIST/ACCEPT/FLOOR pricing (and exempt HOLD/NEGOTIATE/MINIMUM), enforce the LIST >= ACCEPT >= FLOOR invariant, resolve channelRecommendation conflicts, and reference V8 location/saleMethod context. Layers on pack 07 (garage-sale-consensus.md) — pack 07 establishes the three-tier output structure, pack 08 upgrades the vocabulary to V8 when V8 data is present. Resilient: zero regression when V8 absent.
when_to_use: Every MegaBot run. If the item's enrichment narrative or input context contains V8 prices (LIST/ACCEPT/FLOOR or HOLD/NEGOTIATE/MINIMUM) or an exact channelRecommendation string, apply this pack's V8 vocabulary and merge rules. If only V2 ranges are present, fall through to pack 07's behavior — do NOT fabricate V8 numbers from V2.
version: 1.0.0
---

## Section 1 — V8 as a First-Class Consensus Output

When the input or enrichment narrative contains V8 pricing data, every
4-AI consensus output MUST surface BOTH pricing blocks as equal citizens:

| Block          | Source                   | Format          |
|----------------|--------------------------|-----------------|
| ONLINE PRICING | Existing behavior        | Range or median |
| IN-PERSON V8   | NEW — V8 three-number    | LIST / ACCEPT / FLOOR (or HOLD / NEGOTIATE / MINIMUM for exempt) |

**Rules:**
- Neither block is "secondary" or "also." Equal weight, equal placement.
- Both blocks are populated from the consensus merge of all 4 AIs.
- If V8 data is ABSENT (item never ran through PriceBot V8), fall back
  to pack 07's three-tier behavior. Do NOT fabricate V8 prices from
  V2 ranges. Do NOT invent listPrice / acceptPrice / floorPrice.
- The decision "V8 present vs absent" is made per-run based on whether
  any agent's response, the enrichment narrative, or the input prompt
  references LIST/ACCEPT/FLOOR (or HOLD/NEGOTIATE/MINIMUM) explicitly.

## Section 2 — V8 Disagreement Resolution (Non-Exempt)

When 4 AIs return different V8 numbers, resolve as follows:

| Field        | Resolution                  | Guardrail                      |
|--------------|-----------------------------|--------------------------------|
| listPrice    | MEDIAN of 4 (or 2-3 if some agents skipped) | None — accept median |
| acceptPrice  | MEDIAN of 4               | If MEDIAN > listPrice * 0.85, cap at listPrice * 0.85 |
| floorPrice   | MEDIAN of 4               | If MEDIAN > acceptPrice * 0.85, cap at acceptPrice * 0.85 |

**MEDIAN matches existing behavior** (run-specialized.ts:985-991). Pack
08 does NOT override the merge engine — it adds V8-specific guardrails.

**Invariant: listPrice >= acceptPrice >= floorPrice.** If any post-merge
result violates this invariant, recompute using V8 anchor multipliers
(matches PriceBot pack 17):
- acceptPrice = listPrice * 0.85
- floorPrice = listPrice * 0.70

**Disagreement signal (existing protocol from pack 05):**
- Variance > 25% per V8 field counts toward agreement score reduction
- agreementScore < 60 fires dissent banner (existing behavior)
- For V8 specifically, also surface a `gs_pricing_dissent_note` when
  list/accept/floor disagree by more than 25% across agents

**DO NOT invent new thresholds.** Reuse the existing >25% variance and
agreementScore<60 from pack 05.

## Section 3 — Channel Recommendation Consensus

V8 produces 8 exact `channelRecommendation` strings (verified against
`lib/pricing/garage-sale.ts:430-451`):

1. "Garage sale or bundle lot"
2. "Garage sale with online backup"
3. "Online marketplace (eBay, Mercari, FB)"
4. "Specialty platform"
5. "Auction or consignment"
6. "Specialist dealer or auction"
7. "Estate sale or local consignment"
8. "Garage sale or local pickup"

**Resolution when 4 AIs return different recommendations:**

| Scenario | Resolution |
|----------|------------|
| 3 or 4 agree | Use majority recommendation |
| 2-2 split | Prefer the more conservative (local > online > freight); within tier, prefer the lower-value bracket |
| All 4 differ | Defer to PriceBot's V8 engine recommendation if present in enrichment; otherwise default to "Online marketplace (eBay, Mercari, FB)" for safety |

**Hard overrides:**
- If V8 says "Garage sale or local pickup" AND any agent flags
  shippingDifficulty: FREIGHT_ONLY, NEVER recommend a shipping
  platform. Local-only.
- If saleMethod: LOCAL_PICKUP is present in enrichment, NEVER
  recommend ship-required platforms regardless of consensus vote.

**Output:** `channel_recommendation: "<exact string>"` plus
`channel_reason: "<one-sentence justification>"`.

## Section 4 — Exempt Item Consensus (Antique / Collectible / Jewelry / Art / Coins / Watches)

**Pack 07 already has the Antique/Collectible Override.** Pack 08
extends it to all 6 V8-exempt categories AND adds the HOLD / NEGOTIATE
/ MINIMUM vocabulary.

**Vocabulary mapping:**
- listPrice maps to **HOLD** ("Holding at $X. Serious buyers only.")
- acceptPrice maps to **NEGOTIATE** ("Negotiable at $X.")
- floorPrice maps to **MINIMUM** ("Minimum $X. Won't accept less.")

**Resolution rules (exempt-specific):**

| Field | Resolution | Reasoning |
|-------|-----------|-----------|
| HOLD | **HIGHEST** of 4 | Exempt items appreciate — optimistic anchor wins |
| NEGOTIATE | HOLD * 0.90 (derived, not merged) | Maintains 10% negotiation room |
| MINIMUM | HOLD * 0.75 (derived, not merged) | Matches V8 engine exempt multipliers |

**Channel:** ALWAYS "Specialist dealer or auction" for exempt items
unless any agent provides a strong reason for a different specialist
platform. When in doubt, route to the channel the collector-aware
agent recommends.

**Antique/Collectible Override (preserve from pack 07):** If ANY single
agent flags the item as antique/collectible with strong reasoning, use
exempt vocabulary and exempt resolution rules. One collector-aware AI
outranks three generalists. The Conflict Transparency Protocol (pack 05)
still applies — surface dissent notes for the agents who disagreed.

## Section 5 — Confidence Calibration for V8 Output

Pack 06 already amplifies confidence based on spread. Pack 08 adds
V8-specific confidence signals layered on top:

| Signal                                                            | Effect on V8 confidence  |
|-------------------------------------------------------------------|--------------------------|
| 3+ agents agree on listPrice within 10% spread                    | Boost +5 (cap at 100)    |
| All 4 agents within 15% spread on acceptPrice                     | Boost +5                 |
| Floor price > acceptPrice (invariant violation, post-recompute)   | Reduce by 10             |
| No V8 data present in any agent output                            | V8 confidence = N/A      |
| PriceBot V8 engine result present in enrichment                   | Boost +10 (engine truth) |
| Location data (saleZip + locationNote) available                  | Boost +3                 |

**Final V8 confidence formula:**
v8_confidence = pack_06_amplified_confidence + sum(pack_08_signals),
capped at 100, floored at 0.

**Triggers:**
- v8_confidence < 50: output should include "Re-run PriceBot for more
  accurate V8 garage sale pricing."
- v8_confidence >= 80: label V8 block "HIGH CONFIDENCE" in output.

## Section 6 — Backward Compatibility

This pack SUPPLEMENTS pack 07. It does NOT replace pack 07. Specifically:

- **When V8 data is absent**: pack 07's three-tier consensus (Online /
  Garage Sale / Quick Sale) remains authoritative. Pack 08 contributes
  nothing — does NOT introduce LIST/ACCEPT/FLOOR vocabulary, does NOT
  invent V8 numbers, does NOT modify pack 07's output structure.
- **When V8 data is present**: pack 08 takes precedence on V8 vocabulary
  and merge rules. Output uses LIST/ACCEPT/FLOOR (or HOLD/NEGOTIATE/
  MINIMUM for exempt). Pack 07's three-tier structure is honored —
  V8 fills in the "Garage Sale" tier with three precise numbers
  instead of a range.
- **When pack 07 conflicts with pack 08**: pack 08 wins on V8 vocabulary
  and channel recommendations; pack 07 wins on the underlying
  three-tier output structure (which pack 08 preserves).
- Existing thresholds from packs 05 and 06 (>25% variance,
  agreementScore<60, amplifiers) are PRESERVED unchanged.
  Pack 08 only ADDS V8-specific signals; it never overrides the
  general consensus protocol.

## Section 7 — V8 Output Quality Checklist

Before returning a MegaBot consensus that includes any V8 pricing:

- [ ] ONLINE PRICING block present (preserved from current behavior)
- [ ] IN-PERSON pricing block present with LIST/ACCEPT/FLOOR (or
  HOLD/NEGOTIATE/MINIMUM if exempt)
- [ ] LIST >= ACCEPT >= FLOOR invariant satisfied (recomputed if needed)
- [ ] `channel_recommendation` field is one of the 8 exact V8 strings
- [ ] `channel_reason` field provides one-sentence justification
- [ ] If saleMethod: LOCAL_PICKUP in enrichment, no ship-required
  platforms appear in output
- [ ] If shippingDifficulty: FREIGHT_ONLY, no ship-based
  recommendations at all
- [ ] Exempt items use HOLD/NEGOTIATE/MINIMUM vocabulary, NEVER
  LIST/ACCEPT/FLOOR
- [ ] v8_confidence is computed using pack 06 amplification + pack 08
  signals; not a raw average
- [ ] If v8_confidence < 50, output includes "Re-run PriceBot for more
  accurate V8 garage sale pricing"
- [ ] When V8 data is absent, pack 08 is silent — pack 07's V2 behavior
  unchanged. Zero regression.
- [ ] gs_pricing_dissent_note populated when any V8 field shows >25%
  variance across the 4 agents
- [ ] No invented prices, channels, or thresholds. Every value either
  comes from agent output, the enrichment narrative, or an explicit
  derivation rule above.
