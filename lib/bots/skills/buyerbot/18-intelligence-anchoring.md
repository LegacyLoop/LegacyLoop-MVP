# BuyerBot Skill 18 — Intelligence Anchoring

**Added:** CMD-BUYERBOT-INTEL-ANCHOR (April 18, 2026)
**Supersedes nothing.** Packs 01-17 remain the buyer-discovery and outreach baseline. This pack governs buyer-side offer recommendations only.

---

## The rule

Before finalizing offer-range recommendations, read the latest `INTELLIGENCE_RESULT` EventLog. When `pricingIntel.confidence === "high"`, anchor the canonical offer-recommendation to Claude's reasoned numbers:

- **Max offer** = `pricingIntel.sweetSpot` (what the seller will accept; a buyer paying this closes the deal fast).
- **Mid offer** = midpoint between `sweetSpot` and `quickSalePrice` (the realistic negotiation target).
- **Min offer** = `pricingIntel.quickSalePrice` (the seller's walk-away floor; offers below this get rejected).

| Intelligence confidence | BuyerBot action |
|---|---|
| `high` | Override: `offer_recommendation = { max: sweetSpot, mid: midpoint, min: quickSalePrice }`. |
| `medium` | Blend: 60% Intelligence anchor, 40% formula output per field. |
| `low` | Ignore. Use formula mid-price ± heuristics (pack 15). |
| absent or stale (>7d via freshness decay) | Formula mid-price. |

Tag `BUYERBOT_RUN` / `BUYERBOT_RESULT` payloads with `pricingSource: "intelligence_anchored" | "hybrid" | "v8_formula"` so V1e accuracy dashboard can split offer-to-close rates by path.

---

## What BuyerBot should NOT do

- **Do not suggest buyer offers ABOVE Intelligence's `premiumPrice`.** That's the seller's ask; buyers negotiate DOWN from it. Premium is never the buyer's opening.
- **Do not modify per-buyer-profile `estimated_offer_range` strings when anchored.** Those are persona-narrative copy (e.g., "collectors pay $X–Y"; "dealers pay $A–B"). Leave them intact so BuyerBot's persona analysis stays readable. The canonical `offer_recommendation` object is the machine-readable SSOT for downstream consumers (OfferManager, BuyerLead thresholds, future BuyerBot accuracy tracking).
- **Do not expose `quickSalePrice` / `sweetSpot` in outreach-message templates.** These are internal negotiation targets. Public outreach copy addresses price conversationally ("Would you consider $X?") without leaking the seller's internal floor.

---

## Why this matters for specialty items

A playable 1990s Dean electric guitar with high-confidence Intelligence:

- Seller's asking price (ListBot anchor): **$210**
- Seller's sweet-spot accept (Intelligence): **$185**
- Seller's walk-away floor (Intelligence): **$165**

Pre-anchor, BuyerBot might recommend offers of $105–$150 (formula midPrice ± negotiation heuristics). Those offers get rejected. The buyer walks away. The deal doesn't close.

Anchored, BuyerBot recommends offers of **$165–$185**. Every offer in range has a realistic chance of closing. The seller sees "buyers are offering in my acceptable range" instead of "buyers keep lowballing me." Both sides win.

Same logic applies to every specialty class: vintage tools, jewelry/watches, graded collectibles, power equipment. The formula-pure buyer-side estimate is calibrated for commodity; anchored to Intelligence, it's calibrated for enthusiast markets where buyers genuinely pay 55–70% of national.

---

## When to defer to formula (Intelligence-ignore list)

- Category is `clothing_soft` or `books` — deep comps exist; Intelligence adds less.
- Intelligence `sources` array is empty or only `["AI_estimate"]` (no market-comp citation).
- Intelligence is stale (>7d) AND AnalyzeBot ran post-Intelligence (item spec shifted; Intelligence no longer matches).
- High-urgency seller context (dropshipping, estate-clearout deadline): buyer offers may need to be aggressive below Intelligence floor. Formula + LLM urgency heuristics take over.

---

## Canonical output shape

The anchored values get written to a new top-level field on the BuyerBot result:

```json
{
  "offer_recommendation": {
    "max": 185,
    "mid": 175,
    "min": 165,
    "source": "intelligence_anchored"
  }
}
```

Per-buyer-profile `estimated_offer_range` strings stay untouched — they describe HOW each buyer persona offers, not WHAT the seller will accept. The canonical recommendation is the SSOT for what actually closes.

---

## Telemetry

- `BUYERBOT_RUN.pricingSource` — new field. Values: `intelligence_anchored`, `hybrid`, `v8_formula`.
- `BUYERBOT_RUN.intelligenceAgeMs` — new field. Non-null when anchor fired.
- `BUYERBOT_RUN.formulaOfferMax` / `formulaOfferMin` — audit trail of the pre-anchor formula values. Enables V1e to compare anchored vs formula buyer-close rates against SOLD ground truth.

---

## One-line summary

**When Claude has reasoned, BuyerBot anchors offers to what actually closes. When Claude has not, BuyerBot computes.**
