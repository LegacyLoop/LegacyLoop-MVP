---
name: buyerbot-megabot-deep-specialty-expertise
description: >
  Multi-channel buyer consensus methodology for 4-AI parallel buyer discovery.
  Covers how each AI model contributes a distinct buyer intelligence layer,
  how browsing and buying intent signals differ, and how social signals are
  weighted against marketplace transaction signals to produce a reliable
  buyer demand picture.
when_to_use: "MegaBot scans only. BuyerBot MegaBot lane."
version: 1.0.0
---

# BuyerBot MegaBot Skill: Deep Specialty Expertise

## Purpose

When BuyerBot operates inside the MegaBot lane, four AI models run buyer
discovery in parallel. Each model brings a distinct intelligence layer. This
skill defines what each model contributes, how their outputs are combined into
a consensus buyer demand picture, and how to separate signals that indicate
genuine purchase readiness from signals that indicate casual browsing or
algorithmic noise.

## The Four-AI Architecture

MegaBot does not run a single AI pass and call it complete. Four models scan
independently, then their outputs are synthesized. The synthesis step is where
the real expertise lives. Consensus across all four is a strong buy signal.
Disagreement across models is a data point that warrants investigation, not
suppression.

### Grok: Cultural Trend and Social Buyer Psychology

Grok reads platform-native cultural signals. Its primary contribution is
identifying when an item category is gaining momentum inside social media
conversations, viral moments, or subcultural identities. Grok sees the
collector who posts about a category before they search for a specific item.
It detects rising interest in mid-century appliances because of a Netflix
documentary, rising interest in vinyl hardware because of a musician interview,
or rising interest in vintage athletic wear because of a team anniversary.

Grok's buyer psychology read focuses on identity purchasing — buyers who
acquire items to signal membership in a community or to participate in a
cultural moment. These buyers pay premium prices and move quickly. They are
motivated by scarcity and cultural relevance, not primarily by investment logic.

Grok signals to weight heavily: sustained category conversation growth over
fourteen or more days, hashtag adoption by accounts with verified collector
credentials, WTB posts that reference specific sub-categories rather than broad
categories.

Grok signals to discount: one-time viral moments tied to a single post or
account, interest from accounts with no purchase history signals, engagement
that is concentrated in comments rather than saves or shares.

### Claude: Collector Tone and Estate Communication

Claude's contribution is qualitative buyer profiling. It reads collector forum
threads, estate sale community posts, and specialist group conversations to
identify the language patterns and decision criteria of serious buyers in a
given category. Collector communities have specific vocabularies. A watch buyer
who says "double-signed" understands the market. A furniture buyer who asks
about "provenance documentation" is a serious prospect, not a casual browser.

Claude also handles the communication layer. When BuyerBot generates outreach
templates, Claude's buyer profile is the source for tone calibration. An estate
executor responding to a collector is a different communication context than a
casual seller responding to a bargain hunter. Claude distinguishes these
audiences and prevents the system from sending generic messages that serious
buyers immediately recognize as automated and ignore.

Estate-specific communication intelligence: Claude understands that estate
buyers often have emotional context to navigate. They are purchasing from
families in transition. The language that works in that context is specific,
respectful, and knowledgeable. "I specialize in pieces from this period and
would treat this item with the care its history deserves" outperforms "I'm
interested, what's your best price" by a measurable margin in response rates
from estate contexts.

### Gemini: Real-Time Buyer Search Data

Gemini contributes current search demand intelligence. Its primary value is
recency. While Grok reads social signals and Claude reads community signals,
Gemini reads what buyers are actively searching for right now. Search intent
is the most reliable buying intent signal available — a person who types a
specific item into a search engine is further along the purchase decision than
a person who saves an Instagram post.

Gemini's output for BuyerBot includes: active search volume trend for this
item category, related search terms that indicate buyer specificity (a generic
search indicates browsing intent; a search that includes maker, era, and
condition indicates purchase intent), and geographic concentration of searches
(where are these buyers located, and does that affect shipping strategy or
local pickup opportunity).

Gemini also surfaces what buyers are comparing this item against. If searches
for a specific pottery maker frequently co-occur with searches for comparable
makers, Gemini identifies those comparables, which informs both pricing and the
competitive framing in buyer outreach.

### OpenAI: Structured Buyer Profiles

OpenAI's contribution is synthesis and structure. After Grok, Claude, and
Gemini have each returned their domain-specific intelligence, OpenAI assembles
the outputs into structured buyer profiles. These profiles include demographic
range, platform preference, estimated willingness-to-pay band, typical purchase
timeline from first inquiry to transaction close, and preferred transaction
format (auction, fixed price, negotiated private sale).

OpenAI also produces the confidence score for each buyer segment. A segment
with strong signals from all three upstream models receives a high confidence
rating. A segment with signals from only one model receives a low confidence
rating and is flagged for human review before outreach.

## Browsing Intent vs. Buying Intent

This distinction is the single most important judgment BuyerBot makes. Treating
browsing signals as buying signals wastes outreach budget and seller time.

Browsing intent indicators: saves and favorites without follow-up messages,
category searches without maker or model specificity, engagement on
informational content rather than listing content, WTL (watch list) additions
on auction platforms without bid activity.

Buying intent indicators: direct messages asking about condition, provenance,
or shipping timeline, WTB posts with specific item descriptions and stated
price budgets, saved searches with alert notifications enabled, multiple visits
to the same listing within a short window, bid history that reaches but does
not win reserve prices (this buyer wants the item but is price-sensitive,
making them a targetable lead).

The clearest buying intent signal is contact initiation. A buyer who sends a
message — even a brief one — has crossed the intent threshold. Every other
signal is probabilistic. Contact is deterministic.

## Weighting Social Signals vs. Marketplace Signals

Social signals and marketplace signals measure different things and must not
be averaged together without accounting for that difference.

Social signals measure desire and aspiration. They tell you that a buyer wants
to own or be associated with a category. They are leading indicators — they
precede marketplace activity, sometimes by months.

Marketplace signals measure transaction history. They tell you what buyers
have already committed money to. They are lagging indicators — they confirm
demand that has already materialized.

The correct weighting formula for BuyerBot is: marketplace signals anchor
the price estimate, social signals modify the demand urgency score. A item
with strong marketplace transaction history but weak social signals is priced
with confidence but marketed without urgency. An item with strong social
signals but thin marketplace transaction history is priced conservatively but
marketed with urgency, using scarcity language to convert aspirational buyers
before the market catches up.

When both signal types align — high transaction volume and rising social
interest — BuyerBot recommends a slightly elevated listing price and aggressive
multi-platform outreach with a defined short listing window to create purchase
pressure.

## Consensus Mechanics

Four models, four independent scans, one synthesized output. The synthesis
logic works as follows.

If all four models identify the same buyer segment, that segment is classified
as primary. Outreach prioritizes primary segments.

If three of four models identify a segment, it is classified as secondary.
It receives outreach after primary segments are addressed.

If only two models agree on a segment, it is classified as exploratory. It is
flagged for seller review before outreach, because two-model agreement at this
level of specificity still carries meaningful signal but warrants a judgment
call on whether the segment matches the seller's available time and resources.

If only one model identifies a segment, it is logged but no outreach is
generated. Single-model signals are research artifacts, not action triggers.

This consensus architecture is what separates MegaBot from a single-AI buyer
finder. Any one model can hallucinate demand, misread cultural context, or miss
geographic nuance. Four independent models converging on the same buyer segment
is a qualitatively different — and far more reliable — output.
