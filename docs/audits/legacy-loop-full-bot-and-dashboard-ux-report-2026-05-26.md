# Legacy Loop Full Bot Audit + Item Dashboard UX Report

Date: 2026-05-26  
Prepared by: Codex, Senior Engineering Advisor  
Scope: Read-only advisory report based on repo inspection and prior bot-by-bot audit discussion.  
Excluded from this report: Messaging Center and Shipping Center deep audits, per request.

---

## 1. Executive Summary

Legacy Loop already has a strong product thesis and unusually broad AI coverage. The app is not merely a listing tool. It is moving toward an AI-powered resale operating system: identify the item, improve the photos, evaluate value, detect specialty risk, find buyer paths, create listing assets, store proof, and eventually automate the sale flow.

The current architecture has strong ingredients:

- AnalyzeBot for item intelligence.
- PhotoBot for image quality and enhancement.
- PriceBot for valuation strategy.
- BuyerBot for buyer targeting.
- ListBot for listing generation.
- ReconBot for market research.
- AntiqueBot for antique-specialty review.
- CollectiblesBot for collectible-specialty review.
- CarBot for vehicle-specific review.
- VideoBot for promotional video creation.
- MegaBot for premium multi-model reasoning.
- Vault / DocumentBot for proof, provenance, and document intelligence.
- Sylvia planned as the memory and orchestration layer.

The biggest gap is not lack of features. The biggest gap is organization, governance, and simplification.

The current system exposes too much of the machine to the user. It is powerful, but the item dashboard risks feeling like an AI operations cockpit rather than a simple selling assistant. The correct move is not to delete bot power. The correct move is to separate the app into two layers:

1. **Simple seller workflow** for normal users, seniors, estate users, and casual sellers.
2. **Advanced tools / bot consoles** for power users, internal team, diagnostics, premium users, and expert workflows.

The product should feel like:

> Upload item. Legacy Loop evaluates it. Legacy Loop tells you what it is worth. Legacy Loop improves the listing. Legacy Loop finds the best buyer path. User approves.

Not:

> User must understand and operate 11 different bots.

---

## 2. Highest-Severity Technical Flags

### 2.1 Missing Canonical BotRun State Machine

The current app relies heavily on `EventLog` blobs and per-route behavior. That works for a demo or early beta, but it is not enough for a high-scale, production-quality autonomous system.

The platform needs a canonical bot execution model:

- `queued`
- `running`
- `succeeded`
- `partial_success`
- `failed`
- `needs_user`
- `superseded`
- `refunded`
- `cancelled`

Every bot run should have:

- bot name
- item ID
- user ID
- status
- inputs used
- output artifact IDs
- provider usage
- credit cost
- provider cost
- confidence
- warnings
- errors
- started/completed timestamps
- schema version

### 2.2 EventLog Is Doing Too Much

`EventLog` is valuable as an audit trail, but it should not be the primary data model for bot intelligence.

Recommended split:

- `EventLog`: historical audit trail.
- `BotRun`: execution lifecycle.
- `BotArtifact`: durable output from a bot.
- `BotNote`: cross-bot memory and plain-English summary.
- `BotDecision`: final recommendation.
- `BotIssue`: missing data, uncertainty, conflict, or user action needed.
- `BotCostLedger`: credits, refunds, provider costs.

### 2.3 Uneven Output Schema Discipline

Some bots have stronger JSON output validation than others. PriceBot, BuyerBot, ListBot, and ReconBot are stronger. AntiqueBot, CollectiblesBot, MegaBot, VideoBot, PhotoBot, and DocumentBot need stricter typed contracts.

The app should not trust prompt-shaped JSON alone. Each bot should have a strict schema, preferably versioned.

### 2.4 Fire-and-Forget Execution Is Too Fragile

Several important processes run in fire-and-forget style:

- sequencing
- demand scoring
- document analysis
- price snapshots
- video pipeline steps
- some post-bot enrichment

This creates risk:

- silent failures
- lost work
- unclear user state
- credit disputes
- no retries
- no durable audit of incomplete work

For beta, the platform needs durable run state and clear failure handling.

### 2.5 User Interface Is Too Bot-Centric

The item dashboard is powerful but too exposed. A normal user should not think in terms of bot panels. They should think in terms of:

- item
- photos
- price
- buyers
- listing
- proof
- ready to sell

The bots should become the engine under the hood.

---

## 3. Recommended Bot Operating System

Legacy Loop should build a shared bot foundation before scaling autonomy.

### 3.1 Required Bot OS Primitives

| Primitive | Purpose |
|---|---|
| `BotRun` | Durable execution state, retry, error, status, timing |
| `BotArtifact` | Durable outputs: price report, listing, photo, video, buyer lead, document summary |
| `BotNote` | Cross-bot memory, plain-English operational note |
| `BotDecision` | Final recommendation with confidence and reason |
| `BotIssue` | Missing data, uncertainty, contradiction, user action needed |
| `BotSchemaVersion` | Prevents old JSON from breaking new UI |
| `BotCostLedger` | Tracks credits, provider cost, refunds, premium usage |

### 3.2 Bot OS Strategic Value

The Bot OS gives you:

- better reliability
- better beta diagnostics
- cleaner UI state
- reusable bot console shell
- better credit/refund handling
- true autonomy readiness
- auditability for serious company operations
- easier handoff to Sylvia

---

## 4. Bot-by-Bot Audit

## 4.1 AnalyzeBot

### Current Role

AnalyzeBot is the first major intelligence layer. It identifies the item, creates baseline item intelligence, supports valuation, and can trigger downstream bots.

### Strengths

- Correct first bot in the system.
- Establishes item identity and category.
- Feeds valuation, specialty detection, and later bot context.
- Strong product value because every later bot depends on item identity.

### Gaps / Flags

- The route is doing both analysis and orchestration.
- If AnalyzeBot is wrong, downstream bots inherit bad context.
- Confidence needs to become a first-class routing signal.
- Missing information should be captured as structured issues.
- Analysis should produce a durable item dossier, not only scattered records.

### Recommendation

Create an `ItemDossier` artifact:

- item identity
- category
- likely brand/maker
- materials
- era/date estimate
- condition summary
- resale confidence
- specialty flags
- missing-photo flags
- suggested next bot sequence

AnalyzeBot should become the system’s intake intelligence layer.

---

## 4.2 PhotoBot

### Current Role

PhotoBot manages upload, assessment, background cleanup, enhancement, staging, hero image selection, and photo quality analysis.

### Strengths

- One of the highest commercial-impact bots.
- Strong concept: better photos improve buyer trust and sale likelihood.
- Supports multiple workflows: assess, edit, enhance, generate, variations.
- Credit handling appears stronger around expensive image operations because some deductions happen after successful processing.

### Gaps / Flags

- The UI/client is very large and complex.
- Too many visible choices for normal users.
- Photo editing requires very strong item-protection guarantees.
- If segmentation or vision confidence is weak, background editing can risk altering the item.
- Cloud-hosted image handling must be consistent across photo/video operations.

### Recommendation

PhotoBot should be simplified into a user-facing **Photo Quality Gate**:

User sees:

- Add photos
- Improve photos
- Choose hero photo
- Missing angles
- Photo quality

Advanced console keeps:

- background removal
- enhance/stage
- variations
- diagnostics
- before/after comparison
- raw analysis

Default user-facing action:

> Improve Photos

The app should decide what that means internally.

---

## 4.3 PriceBot

### Current Role

PriceBot recommends sale price, confidence, pricing strategy, and pricing snapshots.

### Strengths

- Strong commercial utility.
- Better structured output discipline than many bots.
- Fits naturally after AnalyzeBot and PhotoBot.
- Can feed BuyerBot, ListBot, and MegaBot.

### Gaps / Flags

- Price should be strategy-based, not just one value.
- Needs separate pricing for local, national, fast sale, stretch sale, auction/specialist.
- Needs clearer explanation of confidence.
- Needs simple user-facing price recommendation.

### Recommendation

PriceBot should output:

```ts
{
  fastSalePrice: number,
  targetPrice: number,
  stretchPrice: number,
  localPrice: number,
  nationalPrice: number,
  auctionCandidate: boolean,
  confidence: number,
  priceDrivers: string[],
  riskFactors: string[],
  recommendedStrategy: "local" | "national" | "auction" | "specialist"
}
```

User view:

> List at $185. Accept $145+. If shipping nationally, try $225.

---

## 4.4 BuyerBot

### Current Role

BuyerBot identifies likely buyers, buyer segments, demand, and buyer lead opportunities.

### Strengths

- Strategically one of the most important bots.
- Strong connection to the future autonomous product.
- Already points toward the Item Finder Bot concept.
- Can become a major business moat.

### Gaps / Flags

- Should not only describe buyer personas.
- Needs to become a real buyer matching and buyer-intent engine.
- Needs local/national distinction.
- Needs safety and fraud risk scoring.
- Needs buyer confidence.
- Needs to separate likely buyer from reachable buyer.

### Recommendation

Split the future system into:

1. **BuyerBot**: who is likely to buy this?
2. **Item Finder Bot**: who is actively looking for this, where, and at what price?

BuyerBot should output:

- top buyer segments
- local demand estimate
- national demand estimate
- best marketplace/channel
- safety risk
- negotiation script
- buyer outreach plan
- recommended listing title per buyer type

Priority: very high.

---

## 4.5 ListBot

### Current Role

ListBot generates listing titles, descriptions, platform copy, and sale-ready text.

### Strengths

- Directly tied to sale conversion.
- Natural partner to PhotoBot and PriceBot.
- Good candidate for platform-specific output.
- Strong practical value to users.

### Gaps / Flags

- Listing should be platform-specific.
- Needs stronger compliance and claim-safety rules.
- Needs condition disclosure discipline.
- Needs title variants.
- Needs marketplace readiness.

### Recommendation

ListBot should output:

- Facebook Marketplace listing
- eBay listing
- Craigslist/local listing
- estate sale tag
- collector listing
- title variants
- keyword set
- safe condition disclosure
- unsupported-claim warnings

User view:

> Your listing is ready.

With:

- Use Listing
- Edit
- Details
- Advanced ListBot Console

---

## 4.6 ReconBot

### Current Role

ReconBot performs market research and competitive intelligence.

### Strengths

- Important evidence layer.
- Useful for pricing confidence.
- Can support specialty bots.
- Helps prevent shallow AI valuation.

### Gaps / Flags

- Needs clearer separation from PriceBot and BuyerBot.
- Should resolve uncertainty, not simply collect information.
- Needs contradiction detection.
- Needs source confidence ranking.

### Recommendation

ReconBot should become the **Evidence Bot**:

- comparable sales
- active listings
- sell-through estimate
- market saturation
- keyword validation
- counterfeit/similar-item warning
- confidence delta versus AnalyzeBot

It should feed PriceBot, AntiqueBot, CollectiblesBot, BuyerBot, and MegaBot.

---

## 4.7 AntiqueBot

### Current Role

AntiqueBot reviews possible antique value, period, style, maker clues, and provenance indicators.

### Strengths

- Very high product differentiation.
- Excellent fit with Vault / DocumentBot.
- Strong premium feature candidate.
- Important for avoiding underpricing.

### Gaps / Flags

- Needs stricter schema validation.
- Needs strong authenticity boundary language.
- Should avoid definitive claims without evidence.
- Needs provenance chain handling.
- Needs expert appraisal recommendation logic.

### Recommendation

AntiqueBot should output:

- likely era
- style/movement
- maker/manufacturer candidates
- material/construction clues
- provenance evidence
- condition impact
- authenticity confidence
- appraisal recommendation
- auction/specialist recommendation
- insurance-value warning if relevant

User view:

> This may be a 1930s walnut side table. Value depends heavily on maker marks. Add underside and joinery photos before listing.

---

## 4.8 CollectiblesBot

### Current Role

CollectiblesBot evaluates collectible items, variants, rarity, category-specific value, and collector context.

### Strengths

- Strong market opportunity.
- Pairs naturally with BuyerBot and Item Finder Bot.
- Good premium-tier feature.
- Important for categories where exact variant changes value dramatically.

### Gaps / Flags

- Needs stricter output contract.
- Collectibles are too category-specific for shallow generic handling.
- Needs grading and condition frameworks by category.
- Needs edition, variant, serial, signature, packaging, and authenticity handling.

### Recommendation

Keep one user-facing CollectiblesBot, but internally route by domain:

- cards
- comics
- toys
- coins
- stamps
- sports memorabilia
- records/media
- vintage electronics
- designer/pop-culture collectibles

Output should include:

- category
- exact variant candidates
- rarity
- grading sensitivity
- sold-comp confidence
- fake/reproduction risk
- best selling venue
- collector keywords
- whether professional grading is worth it

---

## 4.9 CarBot

### Current Role

CarBot evaluates vehicle-related items and vehicle listings.

### Strengths

- Useful specialist.
- Correctly separate from generic pricing.
- Important for high-value/high-risk sales.

### Gaps / Flags

- Photos alone are not enough for accurate vehicle pricing.
- Needs VIN, mileage, title, trim, drivetrain, maintenance, accident history.
- Needs local market and private-party/dealer/trade-in ranges.
- Needs safety/compliance disclaimers.

### Recommendation

CarBot should request:

- VIN
- mileage
- title status
- trim
- drivetrain
- known issues
- maintenance records
- location

Output should include:

- private-party range
- trade-in range
- dealer retail range
- local demand score
- buyer risk
- recommended sales path

---

## 4.10 VideoBot

### Current Role

VideoBot creates promotional scripts, social video assets, narration, and video output.

### Strengths

- Impressive premium feature.
- Good tiered strategy.
- Useful for high-value, visual, social, and estate-sale items.
- Strong differentiator if stabilized.

### Gaps / Flags

- Script-only output should not count as successful video generation.
- Local video output is not durable enough for production/serverless.
- Cloud-hosted photo handling needs hardening.
- AI video fallback should produce clearer partial-success states.
- Trend/ad intelligence should be cost-gated and relevance-gated.

### Recommendation

VideoBot should produce separate artifacts:

- `VideoScript`
- `Storyboard`
- `Voiceover`
- `RenderedVideo`
- `SocialCaption`
- `AdVariant`

Status should distinguish:

- script created
- storyboard created
- narration created
- video rendered
- partial success
- failed

User view:

> Create Sale Video

Advanced view:

- TikTok
- Instagram Reels
- Facebook Marketplace
- YouTube Shorts
- estate sale promo
- luxury/collector showcase

---

## 4.11 MegaBot

### Current Role

MegaBot is the high-power multi-model reasoning layer across specialty bot contexts.

### Strengths

- Strong advanced architecture idea.
- Uses multi-model consensus.
- Pulls broad context.
- Can reconcile conflicting evidence.
- Ideal as premium final review.

### Gaps / Flags

- Route and runner are large.
- Too much repair/normalization/debug logic in one area.
- Needs stricter per-bot schemas.
- Needs confidence arbitration, not just aggregation.
- Needs provider quality/cost scoring.

### Recommendation

MegaBot should become the **Executive Review Board**:

- runs for high-value items
- runs when confidence is low
- runs when bots disagree
- runs for premium users
- runs before final sale/listing approval

MegaBot should output:

- final recommendation
- contradictions found
- missing information
- confidence
- reason
- next best action

It should not be a regular user-facing bot button for most users. User-facing label should be:

> Final AI Review

---

## 4.12 Vault / DocumentBot

### Current Role

Vault stores receipts, certificates, appraisals, manuals, provenance docs, vehicle/title docs, and other proof. DocumentBot analyzes those documents.

### Strengths

- Major moat.
- Excellent fit for antiques, collectibles, vehicles, estate sales, and high-value goods.
- Makes Legacy Loop more trustworthy.
- Strong connection to pricing and specialty review.

### Gaps / Flags

- Fire-and-forget analysis can fail silently.
- Credit deduction can happen before analysis outcome.
- HEIC upload support and analyzer support appear misaligned.
- PDF extraction needs production-grade handling.
- DOC/DOCX/XLS/XLSX acceptance needs meaningful extraction.
- No obvious virus scanning, DLP, or PII redaction layer.
- Document type should be enum/classified, not loose freeform.

### Recommendation

Vault should become the **Proof Center**.

DocumentBot should output:

- proof strength
- value impact
- authenticity impact
- ownership/provenance chain
- missing evidence
- private information warning
- which bots should use the document

Vault should feed:

- PriceBot
- AntiqueBot
- CollectiblesBot
- CarBot
- BuyerBot
- ListBot
- MegaBot
- Sylvia

---

## 5. Recommended Item Dashboard Strategy

## 5.1 Core UX Principle

The user should sell through outcomes, not operate through bots.

The bots are the engine. The dashboard is the steering wheel.

The default dashboard should not be a wall of bot panels. It should be an item command center.

## 5.2 Recommended Top-Level Navigation

Use:

```text
Overview | Photos | Price | Buyers | Listing | Vault | Advanced
```

Do not use 10+ bot tabs as top-level navigation.

## 5.3 Recommended Default Flow

```text
Upload
→ Identify
→ Improve Photos
→ Price
→ Create Listing
→ Match Buyer
→ Sell
```

Expanded:

```text
Upload item photos
→ Legacy Loop identifies item
→ Legacy Loop checks photo quality
→ Legacy Loop checks specialty value if needed
→ Legacy Loop recommends price
→ Legacy Loop creates listing
→ Legacy Loop recommends buyer path
→ User approves
```

---

## 6. Item Command Center

The item dashboard should become:

```text
Item Command Center
```

Its job:

- summarize item state
- show one next best action
- show readiness
- show sale path
- let users act in one click
- hide unnecessary complexity

### 6.1 Four Main Zones

```text
1. Item Snapshot
2. Next Best Action
3. Sale Readiness
4. Workflow Cards
```

### 6.2 Item Snapshot

Show:

- primary photo
- item name
- category
- estimated value range
- recommended sale path
- item status

Example:

```text
Vintage Oak Rocking Chair
Furniture / Possible Antique

Estimated value: $120-$180
Recommended price: $150
Best path: Local pickup
Status: Needs one more photo
```

### 6.3 Next Best Action

This should be the most important card on the dashboard.

Example:

```text
Next Best Action

Add one clear photo of the maker mark.
This may improve antique confidence and pricing.

[Add Photo]
```

Only one action should dominate visually.

### 6.4 Sale Readiness

Example:

```text
Sale Readiness: 78%

Photos: Good
Price: Ready
Listing: Draft Ready
Buyer Path: Needs Review
Vault: No Proof Added
```

Clicking a weak area should route the user to the correct tab/action.

---

## 7. Recommended Dashboard Tabs

## 7.1 Overview

Purpose:

- command center
- next action
- readiness
- AI notes
- status summary

Default actions:

- continue next step
- open details
- open advanced tools

Most users should spend most of their time here.

## 7.2 Photos

Purpose:

- upload photos
- assess quality
- improve photos
- choose hero image

Sections:

- photo gallery
- hero photo
- photo quality
- missing angles
- improvements

Primary actions:

- Add Photos
- Improve Photos
- Choose Hero

Advanced:

- PhotoBot Console

## 7.3 Price

Purpose:

- show price recommendation
- explain sale-speed tradeoff
- allow accept/adjust

Simple display:

```text
Recommended list price: $150

Sell fast: $120
Best balance: $150
Try for more: $180
```

Primary:

- Use Recommended Price

Secondary:

- Adjust
- See Evidence
- Open Price Tools

## 7.4 Buyers

Purpose:

- best buyer type
- local vs national recommendation
- buyer demand
- future Item Finder Bot

Simple display:

```text
Best buyer:
Local vintage furniture buyer

Why:
Large item, moderate value, local pickup recommended.

[Find Buyers] [Create Local Listing]
```

## 7.5 Listing

Purpose:

- generate listing
- review title/description
- platform versions
- promotional video

Primary:

- Create Listing
- Approve Listing

Secondary:

- Edit
- Create Video
- Open ListBot Console

VideoBot should live here or under a promotion subsection.

## 7.6 Vault

Purpose:

- proof
- trust
- provenance
- documents

Sections:

- proof strength
- receipts
- certificates
- manuals
- appraisals
- provenance
- vehicle docs
- AI proof summary

Primary:

- Add Proof

User language:

> Proof can increase buyer trust and improve price confidence.

## 7.7 Advanced

Purpose:

- all bot consoles
- reruns
- diagnostics
- raw outputs
- power tools

Recommended grouping:

```text
Identification
AnalyzeBot
AntiqueBot
CollectiblesBot
CarBot

Value + Market
PriceBot
ReconBot
MegaBot

Selling
BuyerBot
ListBot
VideoBot

Media
PhotoBot

Proof
Vault / DocumentBot
```

---

## 8. Bot Console Strategy

Keep all bot consoles. Do not delete them.

Move them into Advanced Tools.

Every bot console should follow the same shell:

```text
Bot Name
Purpose
Current Status
Latest Recommendation
Confidence
Inputs Used
Artifacts Created
Warnings
Run History
Actions
Raw Details
```

Actions:

- Run Again
- Compare
- Send to Final Review
- View History
- Open Raw JSON

Advanced does not mean cluttered. It should still feel polished and consistent.

---

## 9. Recommended Summary Card Pattern

Every simple card should follow the same pattern:

```text
Title
Status
One-sentence summary
Primary action
Details link
```

Example:

```text
Price
Ready

Recommended price is $150 with good confidence.

[Use Price] [Details]
```

Example:

```text
Vault
Needs Proof

No receipt, certificate, or provenance has been uploaded.

[Add Proof] [Details]
```

---

## 10. User-Facing Bot Name Translation

Internally, keep bot names. Externally, use outcome names.

| Internal Name | User-Facing Name |
|---|---|
| AnalyzeBot | Identify Item |
| PhotoBot | Improve Photos |
| PriceBot | Set Price |
| BuyerBot | Find Buyers |
| ListBot | Create Listing |
| ReconBot | Market Check |
| AntiqueBot | Antique Review |
| CollectiblesBot | Collector Review |
| CarBot | Vehicle Review |
| VideoBot | Create Video |
| MegaBot | Final AI Review |
| DocumentBot | Vault |

---

## 11. Click-Minimal UX Standard

Target click counts:

| Action | Target Click Count |
|---|---:|
| Upload item | 1 |
| Add photos | 1 |
| See item identity | automatic |
| See recommended price | automatic |
| Accept recommended price | 1 |
| Improve photos | 1 |
| Create listing | 1 |
| Find buyers | automatic or 1 |
| Upload proof document | 1 |
| Open Advanced Tools | 1 |
| Open any bot console | 2 total |
| Create video | 1-2 |
| Final review | 1 |

If a core selling task takes more than two clicks, it should be redesigned.

---

## 12. Progressive Disclosure Pattern

Use:

```text
Summary first
Details second
Advanced tools third
```

Example:

```text
Recommended Price

$150 target price
Fast sale: $120
Stretch price: $180
Confidence: Good

[Use This Price] [Details] [Advanced]
```

Most users click the primary action. Power users open details. Internal users open advanced.

---

## 13. Sale Readiness Score

Every item should have a readiness score.

Basic weighting:

```text
Photos: 25%
Item Identity: 20%
Pricing: 20%
Listing: 15%
Buyer Path: 10%
Proof: 10%
```

For antiques/high-value items:

```text
Photos: 20%
Identity: 20%
Specialty Review: 20%
Proof: 20%
Pricing: 10%
Listing: 10%
```

The score should drive the next best action.

---

## 14. Next Best Action Logic

Priority order:

1. Missing photos
2. Missing item identity
3. Low-confidence category
4. Specialty risk
5. Missing proof for high-value item
6. Missing price
7. Missing listing
8. Missing buyer path
9. Optional promo video
10. Final review
11. Ready to sell

Examples:

- If no photos: Add Photos
- If possible antique and no specialty review: Run Antique Review
- If price confidence low: Add detail photo or run Market Check
- If listing missing: Create Listing
- If everything ready: Approve Sale Plan

---

## 15. AI Notes Layer

Add simple AI notes to the dashboard.

Examples:

- Add a maker mark photo to improve antique confidence.
- Local sale is recommended because shipping cost may reduce profit.
- Price range improved after market comparison.
- Listing is missing dimensions.
- Proof document may increase buyer trust.

These should be plain-English operational notes, not raw model output.

Sylvia should eventually own this layer.

---

## 16. Sylvia Integration Recommendation

Sylvia should not be just another chatbot. Sylvia should be the memory, orchestration, and translation layer.

Sylvia should:

- summarize bot outputs
- decide next best action
- track item readiness
- detect missing information
- detect contradictions
- explain recommendations in plain English
- decide when to surface advanced tools
- maintain item memory
- write cross-bot notes

Recommended bot note structure:

```ts
{
  itemId: string,
  bot: "PriceBot",
  confidence: number,
  finding: string,
  recommendation: string,
  blockers: string[],
  nextBestAction: string
}
```

User sees:

> Sylvia recommends adding one clearer photo before listing.

Internal system sees:

> PhotoBot confidence 0.62. AnalyzeBot condition uncertainty moderate. PriceBot blocked by missing maker mark.

---

## 17. Feature Visibility Rules

Features should appear based on item state.

| Condition | Show |
|---|---|
| No photos | Add Photos |
| Poor photos | Improve Photos |
| No analysis | Identify Item |
| Possible antique | Check Antique Value |
| Possible collectible | Check Collector Value |
| Vehicle detected | Complete Vehicle Details |
| No price | Set Price |
| Price ready | Approve Price |
| No listing | Create Listing |
| Listing ready | Review Listing |
| High value | Final AI Review |
| Missing proof | Add Proof |
| Large/heavy item | Local buyer path |
| Small/shippable item | National buyer path |

This makes the app feel intelligent and reduces clutter.

---

## 18. Specialty Trigger Rules

### AntiqueBot Trigger

- item appears 50+ years old
- wood joinery/maker mark detected
- estate context
- terms like vintage, antique, heirloom
- high uncertainty in standard valuation

### CollectiblesBot Trigger

- brand/edition/serial/model detected
- sealed packaging
- cards/comics/toys/media/memorabilia
- high sold-comp spread
- collector keyword match

### CarBot Trigger

- vehicle detected
- VIN/title/mileage fields missing
- automotive category
- high-value vehicle-related item

### VideoBot Trigger

- listing ready
- high visual appeal
- high-value item
- estate sale promotion
- social-sale path

### MegaBot Trigger

- high value
- low confidence
- bot disagreement
- antique/collectible risk
- premium user
- final pre-listing review

---

## 19. Sale Path As First-Class Concept

Every item should have a recommended sale path.

Sale paths:

- local pickup
- national shipping
- auction/specialist
- estate bundle
- donation/liquidation
- hold for review

Example:

```text
Best path: Local pickup
Reason: Large item, moderate value, strong local demand.
```

This is one of the most important simplifications.

---

## 20. Bundle Logic

For garage sales and estate sales, not every item should be sold individually.

The app should recommend:

- sell individually
- bundle with similar items
- group into estate lot
- donate
- recycle/dispose
- hold for appraisal

This is important for downsizing and estate workflows.

---

## 21. Missing Info Section

Every item should clearly show missing information.

Example:

```text
Missing Info
- Dimensions
- Maker mark photo
- Condition details
- Receipt/proof
```

Each missing item should have a direct action:

```text
[Add Dimensions]
[Add Photo]
[Upload Proof]
```

---

## 22. One-Tap Fixes

When the system detects a problem, provide a direct fix.

Examples:

```text
Photo too dark
[Improve Photo]

Listing missing dimensions
[Add Dimensions]

Price confidence medium
[Run Market Check]

Proof missing
[Add Proof]
```

This keeps the app click-friendly.

---

## 23. Approval Gates

The system can recommend automatically and prepare automatically, but should require user approval before external action.

Require approval before:

- publishing listing
- contacting buyer
- accepting offer
- scheduling pickup
- creating shipping label
- charging premium action
- marking item sold

This protects user trust and legal safety.

---

## 24. Automation Levels

Future setting:

```text
Manual
Ask me before every major action.

Assisted
Prepare everything, ask before publishing/contacting.

Autopilot
Run recommended steps automatically, ask before external actions.
```

This creates a bridge from current manual mode to full autonomy.

---

## 25. Trust Builders

Every recommendation should answer:

- why this price?
- why this sale path?
- what information is missing?
- how confident are we?
- what would change the recommendation?
- what happens next?

Example:

```text
Why $150?
Similar local chairs sell between $120 and $180. This one has good condition but needs a clearer maker mark photo.
```

Trust is a product feature.

---

## 26. Confidence Language

Translate internal confidence into plain English.

| Internal Confidence | User Language |
|---|---|
| 90-100% | High confidence |
| 70-89% | Good confidence |
| 50-69% | Medium confidence |
| Below 50% | Needs more information |

Example:

```text
Price confidence: Good
```

Then tell the user what improves it.

---

## 27. Error UX

Default users should not see raw technical errors.

Bad:

```text
Failed to parse bot result JSON.
```

Good:

```text
We could not finish the price review. Try again or add another photo.
```

Advanced Tools can show technical details.

Every error should explain:

- what happened
- what to do next
- whether credits were used or refunded

---

## 28. Credit UX

Credits should be visible but not stressful.

Before:

```text
This action uses 2 credits.
```

After success:

```text
Photo improvement complete. 2 credits used.
```

After failure:

```text
Photo improvement failed. No credits were used.
```

Advanced tools can show exact provider cost, refund state, and run history.

---

## 29. Mobile UX

Mobile matters because users upload photos from phones.

Mobile bottom navigation:

```text
Overview | Photos | Price | Sell | More
```

Where More contains:

- Buyers
- Listing
- Vault
- Advanced Tools

Mobile first screen:

- item photo
- item name
- estimated value
- next action
- primary button

Do not make mobile users scroll through every bot panel.

---

## 30. Desktop UX

Desktop can support more structure.

Recommended layout:

```text
Left:
Item summary, photo, readiness, next action

Right:
Current workflow tab

Top:
Overview | Photos | Price | Buyers | Listing | Vault | Advanced
```

Keep important context visible while users work.

---

## 31. Senior-Friendly Standards

Because seniors are a target market:

- larger buttons
- plain language
- no tiny icon-only controls for primary actions
- no jargon
- no dense default tables
- clear confirmation after every action
- obvious back path
- large upload zones
- forgiving flows
- save and continue later
- no hidden critical actions
- avoid model/provider terminology outside Advanced

Use:

- Add Photos
- Set Price
- Create Listing
- Find Buyers

Avoid:

- Invoke BuyerBot
- Execute market recon
- Run multimodal valuation pipeline

---

## 32. Empty States

Empty states should guide action.

No photos:

```text
Add photos to get a value estimate.

[Add Photos]
```

No price:

```text
Legacy Loop needs item details before recommending a price.

[Identify Item]
```

No listing:

```text
Create a listing after price and photos are ready.

[Create Listing]
```

No vault documents:

```text
Proof can increase buyer trust.

[Add Proof]
```

---

## 33. Recommended Status Language

Use:

- Needs Photos
- Analyzing
- Ready For Price
- Price Ready
- Listing Ready
- Ready To Sell
- Sold

Avoid exposing:

- `pending_provider_consensus`
- `artifact_partial_success`
- `eventlog_missing_result`

Those belong in Advanced Tools.

---

## 34. Component Strategy

Split every bot panel into two pieces:

```text
Summary Component
Small, user-friendly, lives in main workflow.

Console Component
Full advanced bot panel, lives in Advanced Tools.
```

Examples:

- `PriceSummaryCard`
- `PriceBotConsole`
- `PhotoSummaryCard`
- `PhotoBotConsole`
- `BuyerSummaryCard`
- `BuyerBotConsole`

This preserves current investment while simplifying the main dashboard.

---

## 35. Recommended UI Architecture

```text
ItemDashboard
├── ItemCommandCenter
├── ItemWorkflowTabs
│   ├── OverviewTab
│   ├── PhotosTab
│   ├── PriceTab
│   ├── BuyersTab
│   ├── ListingTab
│   ├── VaultTab
│   └── AdvancedToolsTab
├── NextBestActionCard
├── SaleReadinessCard
└── AiNotesPanel
```

Inside Advanced:

```text
AdvancedToolsTab
├── IdentificationTools
├── ValueMarketTools
├── SellingTools
├── MediaTools
└── ProofTools
```

---

## 36. Recommended Dashboard View Model

The UI should not directly depend on raw bot result shapes.

Create a normalized dashboard view model:

```ts
type ItemDashboardViewModel = {
  item: ItemSummary;
  readiness: SaleReadiness;
  nextBestAction: NextBestAction;
  photos: PhotoStatus;
  price: PriceStatus;
  buyers: BuyerStatus;
  listing: ListingStatus;
  vault: VaultStatus;
  specialty: SpecialtyStatus;
  aiNotes: AiNote[];
  advancedTools: BotToolStatus[];
};
```

This decouples UX from bot internals.

---

## 37. Recommended Workflow Status Model

Use shared workflow states:

```ts
type WorkflowStatus =
  | "not_started"
  | "needs_info"
  | "running"
  | "ready"
  | "needs_review"
  | "complete"
  | "failed";
```

Photos, price, buyers, listing, vault, specialty review, and video should all use this language.

---

## 38. Role-Based Display

Support three experience levels:

```text
Simple
Advanced
Internal
```

Simple:

- default for normal users
- no raw bot terms
- one next action
- clean summaries

Advanced:

- full bot consoles
- reruns
- compare results
- run history

Internal:

- provider diagnostics
- raw logs
- cost ledger
- prompt versions
- failure traces

---

## 39. User Flow Examples

### 39.1 Casual Seller

```text
1. Upload item photos
2. App identifies item
3. App recommends price
4. App says photos need one improvement
5. User adds photo
6. App creates listing
7. App recommends local pickup
8. User approves listing
```

### 39.2 Estate Sale

```text
1. Upload multiple items
2. App groups items by category/value
3. App flags high-value/specialty items
4. App recommends local bundle vs individual sale
5. Vault stores documents/provenance
6. BuyerBot identifies best buyer channels
7. ListBot prepares listings or estate catalog
```

### 39.3 High-Value Antique

```text
1. Upload item
2. AnalyzeBot detects possible antique
3. App requests maker mark/detail photos
4. AntiqueBot reviews style/provenance
5. Vault asks for receipt/appraisal/proof
6. ReconBot checks comparable market
7. PriceBot recommends price strategy
8. MegaBot performs final review
9. User receives sale path: auction/specialist/national/local
```

### 39.4 Collectible

```text
1. Upload item
2. CollectiblesBot detects variant/risk
3. App asks for serial, edition, condition detail
4. ReconBot checks sold comps
5. BuyerBot finds collector audience
6. ListBot creates collector-specific listing
7. PriceBot recommends floor/target/stretch
```

### 39.5 Vehicle

```text
1. Upload vehicle photos
2. CarBot asks for VIN, mileage, title status
3. Vault stores title/maintenance docs
4. CarBot creates private-party/dealer/trade-in ranges
5. BuyerBot recommends local buyer path
6. ListBot creates vehicle listing
```

### 39.6 Power User

```text
1. Open Advanced
2. Run ReconBot manually
3. Compare PriceBot and MegaBot
4. Open raw market evidence
5. Rerun listing copy
6. Generate video variants
```

---

## 40. Ready-To-Sell Screen

Once enough steps are complete, show a finish line:

```text
Ready To Sell

Recommended price: $150
Best path: Local pickup
Listing: Ready
Photos: Ready
Buyer path: Ready

[Approve Sale Plan]
```

This gives the user closure.

---

## 41. Save For Later

Many users, especially estate and senior users, will not finish in one sitting.

Every workflow should support:

```text
Save and continue later
```

When returning:

```text
Welcome back. Next step: Add proof document.
```

---

## 42. Buyer Safety Preview

Even before the Messaging Center audit, the dashboard should preview safety.

Examples:

```text
Recommended sale path: Local pickup
Safety: Meet in public place or use verified pickup guidance.
```

High-value local sale:

```text
High-value local sale.
Use verified buyer and safe pickup guidance.
```

---

## 43. Marketplace Readiness

Listing tab should show:

```text
Facebook Marketplace: Ready
eBay: Needs shipping details
Local pickup: Ready
Auction: Needs specialty review
```

This helps users choose where to sell.

---

## 44. Internal Beta Watchlist

During beta, internally flag items where:

- bot failed
- user abandoned flow
- price confidence low
- high-value item skipped proof
- user reran same bot multiple times
- listing generated but not approved
- buyer path unclear
- proof missing on specialty item
- video failed after script generation

This helps the team learn quickly during soft beta.

---

## 45. Premium Tier Strategy

The simplified dashboard should be for everyone.

Premium features should appear naturally as deeper confidence and better outcomes.

Basic:

- identify item
- basic price
- basic listing

Premium:

- photo enhancement
- buyer matching
- advanced market recon
- antique/collectible review
- vault proof analysis
- video generation
- MegaBot final review

Do not make premium feel like a locked-down maze. Make it feel like better intelligence.

---

## 46. Autopilot Future

Future mode:

```text
Sell This For Me
```

System does:

- identify item
- assess photos
- request missing info
- price item
- check specialty value
- create listing
- find buyer path
- prepare sale plan
- ask user for approval

Autopilot should wait until Bot OS exists.

It needs:

- durable run states
- failure handling
- user approvals
- audit trail
- cost control
- safety rules

---

## 47. Product North Star

Legacy Loop should not feel like:

```text
A dashboard full of AI bots.
```

It should feel like:

```text
An AI-powered resale command center that makes selling feel simple.
```

The ideal user experience:

```text
Upload item.
Legacy Loop evaluates it.
Legacy Loop tells you what it is worth.
Legacy Loop improves the listing.
Legacy Loop finds the best buyer path.
User approves.
Legacy Loop helps complete the sale.
```

---

## 48. Recommended Build Sequence

### Phase 1: Dashboard Reframe

- Add Overview, Photos, Price, Buyers, Listing, Vault, Advanced.
- Keep current bot panels.
- Move full consoles into Advanced.
- Add simple summary cards.
- Add one next-best-action card.

### Phase 2: Workflow Intelligence

- Add sale readiness score.
- Add missing-info detection.
- Add specialty trigger logic.
- Add simple confidence language.
- Add AI notes panel.

### Phase 3: Sylvia Connection

- Sylvia summarizes each bot output.
- Sylvia creates item memory.
- Sylvia chooses next best action.
- Sylvia explains recommendations.
- Sylvia detects contradictions.

### Phase 4: Bot OS

- Add durable `BotRun`.
- Add `BotArtifact`.
- Add `BotNote`.
- Add schema versions.
- Add run history.
- Add failure/retry/refund logic.

### Phase 5: Autopilot

- Add Sell This For Me.
- System runs needed bots.
- System asks only for missing info and approvals.
- User confirms price, listing, buyer path, sale action.

---

## 49. What To Tell The Tech Team

Do not start by deleting current panels.

Start by creating a wrapper:

- `ItemCommandCenter`
- `WorkflowTabs`
- `AdvancedToolsTab`
- `SummaryCards`
- `NextBestActionCard`
- `SaleReadinessCard`
- `AiNotesPanel`

Then gradually move existing bot panels into the Advanced layer.

This is lower risk and gives immediate UX improvement.

The technical direction:

1. Create normalized dashboard view model.
2. Create command center.
3. Add workflow tabs.
4. Move bot panels to Advanced.
5. Add summary cards.
6. Add next-best-action logic.
7. Add sale readiness score.
8. Add AI notes.
9. Add durable BotRun/BotArtifact foundation.
10. Connect Sylvia as coordinator.

---

## 50. Final Recommendation

Keep all features.

Keep all bot consoles.

But make the main dashboard outcome-driven:

```text
Overview
Photos
Price
Buyers
Listing
Vault
Advanced
```

The normal user should see:

```text
What is this?
What is it worth?
What should I do next?
How do I sell it?
```

The advanced user should still access:

```text
Every bot.
Every rerun.
Every diagnostic.
Every raw result.
Every model comparison.
```

The correct balance is:

```text
Simple Dashboard
Outcome-based, one next step, easy for everyone.

Advanced Tools
Full bot consoles, power controls, reruns, diagnostics.

Sylvia Layer
Memory, orchestration, notes, state, recommendations.

Bot OS
Durable runs, artifacts, schemas, confidence, cost, audit trail.
```

This is the path from advanced demo to serious beta to fully autonomous resale intelligence.

---

## 51. §12 V19 Report

```text
+-----------------------------------------------------+
| §12 V19 REPORT                                      |
+-----------------------------------------------------+
| SCOPE                                               |
| Consolidated full bot audit and dashboard UX report |
| into a single Markdown artifact.                    |
+-----------------------------------------------------+
| FILES MODIFIED                                      |
| docs/audits/legacy-loop-full-bot-and-dashboard-ux-  |
| report-2026-05-26.md                                |
+-----------------------------------------------------+
| READ-ONLY AUDIT SOURCE                              |
| Report based on prior read-only repo inspection and |
| advisory analysis. No app code changed.             |
+-----------------------------------------------------+
| EXCLUDED                                            |
| Messaging Center and Shipping Center deep audits.   |
+-----------------------------------------------------+
| NEXT RECOMMENDED STEP                               |
| Use this report as the transition document before   |
| messaging center and shipping center audits.        |
+-----------------------------------------------------+
```

