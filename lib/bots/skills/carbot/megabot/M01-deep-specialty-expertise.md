---
name: carbot-megabot-deep-specialty-expertise
description: >
  Defines how CarBot's MegaBot lane leverages four parallel AI agents to build
  authoritative vehicle consensus. Covers classification frameworks for classic,
  exotic, daily-driver, and EV segments, plus the reconciliation protocol when
  agents diverge sharply on value.
when_to_use: "MegaBot scans only. CarBot MegaBot lane."
version: 1.0.0
---

# CarBot MegaBot — Deep Specialty Expertise

## Purpose

When a single AI agent estimates a 1969 Chevrolet Camaro Z/28 at $40,000 and
another prices the same car at $80,000, the seller receives no useful signal.
The MegaBot lane exists to resolve exactly this kind of divergence through
structured consensus across four independent AI agents, each contributing a
distinct analytical perspective. This document defines how each agent's
strengths map to vehicle categories and how the system synthesizes a defensible
final estimate.

---

## Vehicle Classification Frameworks

Not all vehicles are priced the same way. The MegaBot lane must first classify
the vehicle before it applies any valuation framework. Classification determines
which data sources carry the most weight and which agent outputs anchor the
consensus.

### Classic and Collector Vehicles

A classic vehicle is generally one manufactured 25 or more years ago that has
appreciating or stable collector value independent of transportation utility.
Pricing for classics is driven by:

- Matching numbers (original engine block, transmission, and axle codes)
- Documented ownership history and provenance
- Originality versus restoration quality
- Auction realized prices, particularly from Bring a Trailer and Barrett-Jackson
- Rarity within the production run (factory options, limited trim levels)

For a classic, the retail-to-auction spread can exceed 40 percent. A car worth
$60,000 in private-party sale with full documentation may hammer at $42,000 on
a weak auction day and reach $78,000 on a strong bidding day with phone bidders.
The MegaBot must communicate this range, not a false point estimate.

### Exotic and Supercar Vehicles

Exotic vehicles — defined here as purpose-built performance cars from low-volume
manufacturers or limited production programs — require a different framework:

- Current dealer asking prices from certified pre-owned programs carry more
  weight than private listings
- Factory options on exotics can add or subtract tens of thousands of dollars
- Service history at authorized dealers is essentially required for full value
- Mileage thresholds matter differently: a Ferrari with 15,000 miles may be
  worth more than one with 3,000 miles if the low-mileage car was stored
  improperly or never properly serviced

### Daily-Driver and Late-Model Vehicles

For vehicles less than ten years old with no collector premium, KBB and NADA
anchor the consensus. These vehicles trade in a much tighter band. The
private-party value, dealer trade-in, and dealer retail form a predictable
spread of roughly 15 to 25 percent from bottom to top. The MegaBot adds value
here by identifying trim-level confusion, unreported accident history signals,
and regional demand premiums that mass-market tools miss.

### Electric Vehicles

EVs require a separate sub-framework because battery state-of-health is the
single largest value driver after age and mileage. A Tesla Model 3 with 95
percent battery health at 60,000 miles is worth materially more than the same
car at 80 percent health at 40,000 miles. The MegaBot must request or estimate:

- Battery health percentage (from OBD adapter, manufacturer app, or service record)
- Remaining range at full charge versus EPA-rated range
- Charging history (frequent DC fast charging accelerates degradation)
- Software version and eligible over-the-air updates

---

## The Four-Agent Contribution Model

### Gemini: Real-Time Market Grounding

Gemini's grounding capability allows it to retrieve live data. In the MegaBot
vehicle lane, Gemini focuses on:

- Current Bring a Trailer auction results from the past 90 days for the exact
  year, make, and model
- Active Cars.com and AutoTrader dealer listings within 500 miles
- NHTSA recall database for open recalls affecting value negotiations
- Manufacturer incentive programs that affect certified pre-owned pricing

Gemini's output should always include a data freshness timestamp. A Gemini
estimate anchored in 90-day BaT data is categorically more reliable than one
anchored in 24-month data for a rapidly moving market.

### Claude: Condition Narrative and Matching-Numbers Analysis

Claude's contribution is qualitative depth. Given a seller's description,
photos, and any documentation, Claude constructs:

- A condition narrative that a buyer or inspector could act on
- A matching-numbers assessment when VIN, engine stamp, and trim codes are
  provided
- A provenance confidence rating (documented, partially documented, claimed,
  unknown)
- A risk narrative covering the factors most likely to cause buyer negotiation
  downward from asking price

Claude should not anchor on a price point. Claude's output feeds the narrative
sections of the final report, not the numerical consensus.

### OpenAI: Structured Output and KBB/NADA Anchoring

OpenAI's role in the MegaBot lane is structured data extraction and alignment
with mass-market valuation tools. OpenAI produces:

- A JSON-structured vehicle identification block (year, make, model, trim, VIN
  decode, drivetrain, engine displacement)
- KBB private-party fair market range
- NADA clean trade-in and clean retail
- A condition-adjusted delta from KBB/NADA baseline (positive for rare options,
  negative for known issues)

OpenAI's structured output serves as the schema backbone that all four agent
outputs are merged into before consensus scoring.

### Grok: Cultural Trends and Enthusiast Forum Sentiment

Grok contributes signals that no database captures cleanly:

- Enthusiast community sentiment toward a specific model or generation
- Whether a model is experiencing a collector surge (early 2000s Japanese sports
  cars, for example, have moved sharply upward in collector interest)
- Known community-documented issues that suppress value (oil consumption
  lawsuits, notorious rust patterns, recalled components never remedied)
- Cultural moment premiums (a car featured in a recently released film or driven
  by a celebrity with current cultural relevance)

Grok's weight in final consensus is highest for collector and enthusiast
vehicles and lowest for commodity daily drivers.

---

## Reconciliation Protocol: When Agents Diverge

A divergence is defined as any case where the highest agent estimate exceeds the
lowest agent estimate by more than 30 percent of the lowest value.

### Step 1: Identify the Outlier Direction

Determine whether the outlier is high or low. A single high outlier often
indicates that one agent found an exceptional recent comparable (a matching-
numbers, fully documented example that sold in a strong market). A single low
outlier often indicates that one agent flagged a condition issue or recalled a
negative data point the others did not weight.

### Step 2: Weight by Data Recency and Source Quality

Gemini's real-time data receives the highest recency weight. Agent estimates
anchored in data older than 180 days are discounted 15 percent in the consensus
calculation for actively traded vehicles and 5 percent for thinly traded
collector vehicles where fewer comps exist.

### Step 3: Apply the Honest Range

Do not force convergence to a point estimate. Present the seller with:

- Conservative value: the floor a well-prepared buyer would justify
- Consensus midpoint: the weighted average across all four agents
- Optimistic value: the ceiling achievable in the best-case market conditions

A $40,000 to $80,000 divergence, after analysis, might resolve to a $52,000
conservative, $63,000 consensus, and $71,000 optimistic — each with a one-line
rationale the seller can relay to buyers.

### Step 4: Flag for Inspection When Divergence Persists

If reconciliation still leaves a spread exceeding 25 percent after weighting,
the MegaBot must recommend a professional pre-purchase inspection before listing.
This is the honest outcome when data uncertainty is too high for responsible
pricing.

---

## Key Principle

Vehicle valuation is not a single number. The MegaBot lane's authority comes
from naming the uncertainty precisely, explaining its sources, and giving the
seller a strategy for each scenario — not from forcing a false consensus that
collapses under the first informed buyer's question.
