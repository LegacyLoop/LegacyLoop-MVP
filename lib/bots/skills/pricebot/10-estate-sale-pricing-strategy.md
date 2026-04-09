---
name: estate-sale-pricing-strategy
description: Estate context changes the pricing equation. Covers urgency vs. maximum-value pricing, executor and beneficiary dynamics, the pick-a-lane framework, and senior-friendly communication standards.
when_to_use: Every PriceBot scan.
version: 1.0.0
---

# Estate Sale Pricing Strategy

## Why Estate Context Changes Everything

When a seller is liquidating an estate — whether as an executor, an heir, or someone clearing a family home after a death — the pricing decision is embedded in a set of pressures that ordinary resale does not carry. Probate courts impose deadlines. Real estate sales require the house to be cleared. Family members may disagree on values. The seller is often grieving and fatigued.

PriceBot must recognize estate context when it appears. The specContext field in the PRICEBOT_RUN telemetry payload carries the user's free-text description of their situation. When that field contains terms such as estate, inheritance, executor, probate, deceased, passed away, clearing out, or my parent's house, the system must flag estate mode internally and adjust its output posture accordingly.

Estate pricing is not worse pricing. It is different pricing, calibrated to different goals.

## The Two Lanes

Every estate pricing recommendation must start by helping the executor or heir choose one of two lanes. These lanes are not compatible. Trying to split the difference between them usually produces the worst outcome of both.

### Lane One: Fast Sale

Goal: liquidate everything within two to four weeks.

Pricing discipline: set all items at 60 to 70 percent of fair market value. This is not undervaluing — it is buying speed, and speed has real value when the alternative is extended carrying costs, storage fees, or probate delays.

The fast-sale lane requires accepting that some items will sell for less than they are worth on a patient timeline. This is a deliberate, rational choice, not a failure. Items priced aggressively move quickly, and the cumulative proceeds from clearing an entire estate efficiently often exceed the proceeds from a slow, item-by-item approach at higher prices.

When to recommend this lane: executor has a hard deadline (house closing, probate court order, estate tax filing), family members live out of state and cannot manage a prolonged process, the estate contains many mid-value items (under $200 each) where the administrative overhead of individual high-price negotiations is not worthwhile.

### Lane Two: Maximum Value

Goal: achieve 90 to 100 percent of fair market value per item.

Pricing discipline: list at market rate, expect items to take weeks to months to sell, and be willing to negotiate from a position of patience.

The maximum-value lane requires time, attention, and the willingness to field inquiries, negotiate, and manage listings actively over an extended period. Items that would sell in a week at 65% of FMV may take six to eight weeks at full market price.

When to recommend this lane: the estate contains several high-value items (antiques, jewelry, art, collectibles) where the difference between 65% and 100% of FMV is measured in hundreds or thousands of dollars per item, there is no hard deadline, and a family member or professional estate manager is available to manage the process.

## The Hybrid Approach

When the estate contains a mix of high-value and low-value items, a hybrid approach is often optimal.

High-value items (typically the top 10-20% by estimated value, often representing 60-80% of total estate value): list in the maximum-value lane. These items justify the time investment.

Mid-value and low-value items (everything else): list in the fast-sale lane. Price for quick turnover, run an estate sale weekend or partner with a local estate sale company, and move the bulk of items efficiently.

The hybrid approach requires discipline. The temptation is to price everything at maximum value and then discount later. This rarely works — stale listings lose buyer interest, and aggressive late-stage discounting signals desperation.

## Balancing Executor and Beneficiary Interests

The executor is legally required to maximize estate value for the beneficiaries. This creates a technical conflict with fast-sale pricing. PriceBot must not provide legal advice, but it can surface this dynamic clearly.

When executor context is detected, the output should note: "If you are acting as executor, consider documenting your pricing rationale. Estate sales below fair market value are defensible when the alternative is extended carrying costs, when the estate contains many items that would cost more to store and manage than they would gain in value, or when expert opinion (such as this AI assessment) supports the pricing."

Do not take a position on the executor's legal obligations. Surface the tension, recommend consultation with the estate attorney if uncertainty exists, and provide the best pricing data available.

## Senior-Friendly Communication Standards

Many people selling estate items are elderly. They may be the surviving spouse of the deceased. They may be unfamiliar with online marketplaces, uncomfortable with technology, and emotionally attached to the items they are pricing.

PriceBot output in estate mode must meet the following communication standards:

Use plain language throughout. No marketplace jargon, no acronyms without explanation, no references to platform-specific mechanics that the seller may not know.

Acknowledge the emotional context without being patronizing. A single sentence of acknowledgment ("Selling items from a loved one's estate is a meaningful task — we want to make it as straightforward as possible") is appropriate. Do not repeat emotional language throughout the output.

Be concrete about next steps. Vague advice ("consider your options") is not useful to a 75-year-old clearing a house who has never sold anything online. Specific, numbered steps are required.

Avoid urgency language that creates anxiety. Phrases like "act quickly before prices drop" or "this window won't last" are inappropriate for estate sellers who are already under emotional pressure.

Offer to simplify. In estate mode, the output should include an offer to produce a simplified one-page summary — just the recommended price, the platform, and three steps — in addition to the full analysis.

## The specContext Estate Flag

When the PRICEBOT_RUN telemetry record is written, the estate context flag must be set to true whenever the system detects estate-related language in the input. This flag affects:

- Output tone (plain, warm, no jargon)
- Value type presentation (always include all three: IRV, FMV, liquidation)
- Platform recommendation (eBay and Facebook Marketplace for most items; local estate sale partner referral for bulk lots)
- Follow-up recommendation (white glove service prompt if estate contains more than 20 items)

## Platform Routing in Estate Context

Estate sellers benefit from a mix of channels. PriceBot should recommend:

Local estate sale companies for bulk lots and low-value items. These companies take a commission (typically 30-40%) but handle everything. For an executor clearing a full house, the 30% commission is often worth the administrative relief.

Online platforms (eBay, Facebook Marketplace, Etsy for vintage) for high-value individual items. These require more seller effort but reach broader buyers and achieve closer to FMV.

Specialty auction houses (regional or national, depending on item type) for items over $1,000 that have collectible or antique status. Auction houses charge 15-25% seller commission but provide authentication, provenance documentation, and access to serious collectors.

In-person consignment shops for mid-value items in strong local markets. Typical consignment terms: 40-50% to the shop, 50-60% to the seller, 90-day term.

The estate context output should map each item category to the recommended channel, not provide a single platform recommendation for everything.
