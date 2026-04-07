---
name: buyerlead-data-structure-and-quality-bar
description: The data shape every lead must conform to. Maps directly to the BuyerLead Prisma model.
when_to_use: Every BuyerBot scan when constructing the hot_leads[] array.
version: 1.0.0
---

# Every Lead Must Match the BuyerLead Schema

LegacyLoop has a BuyerLead Prisma model. The BuyerBot route does NOT currently persist leads (only writes EventLogs), but a future round will wire this up. When that happens, every lead BuyerBot has ever produced will be auto-imported — but only if it matches the schema.

Structure every lead to map cleanly to BuyerLead TODAY. Future migration = zero data loss.

## The BuyerLead Schema Fields

- id (cuid)
- botId (FK BuyerBot)
- itemId (FK Item)
- platform (string: "Reddit r/MCMFurniture", "Facebook Group: ...", etc.)
- sourceType (string: group_post|listing|profile|forum|wtb_post|comment|dealer)
- sourceUrl (string, optional)
- buyerName (string: real name OR username)
- buyerHandle (string, optional)
- buyerEmail (string, optional)
- searchingFor (string: their own words)
- maxBudget (float, optional)
- location (string, optional)
- urgency (string: low|medium|high)
- matchScore (int 0-100)
- matchReason (string)
- aiConfidence (float 0.0-1.0)
- botScore (int 0-100)
- outreachStatus (string: PENDING|CONTACTED|REPLIED|CONVERTED)
- buyerType (string: Collector|Decorator|Dealer from skill 09)

## The Field Mapping

| Output Field | Maps to BuyerLead | Required |
|---|---|---|
| platform | platform | YES |
| identifier | buyerHandle or buyerName | YES |
| contact_path | sourceUrl | YES |
| intent_signal | searchingFor | YES |
| match_score | matchScore | YES |
| match_reason | matchReason | YES |
| buyer_type | buyerType | YES |
| budget_mentioned | maxBudget | OPTIONAL |
| location_mentioned | location | OPTIONAL |
| urgency_signal | urgency | OPTIONAL |
| ai_confidence | aiConfidence | YES |
| source_type | sourceType | YES |

## The Quality Bar

- 12 fields populated = HIGH quality
- 7-9 fields = MEDIUM
- 5-6 fields = LOW (ship with reduced confidence)
- <5 fields = NOISE (don't ship)

Match quality to score:
- 90-100: All 12 fields, fresh signal (<7 days), explicit WTB
- 75-89: 9-11 fields, moderate freshness (<14 days), strong implicit
- 60-74: 7-8 fields, older signal (<30 days), warm lead
- 50-59: 5-6 fields, ambient demand, low confidence
- <50: Don't ship

## How Many Leads

5-12 leads per scan is the sweet spot.
- 0 leads: Acceptable if data shows no demand. Be honest.
- 1-4: Meaningful but limited. Ship as-is.
- 5-12: Diverse sources, varied strengths.
- 13+: Probably padding. Trim to top 12.

## The Honesty Rule

If you can't find real leads, write LESS not more. 4 real leads beats 12 mixed. The seller pays for actionable intelligence, not filler.

## Future-Proofing

When BuyerBot adds BuyerLead persistence, this schema means every historical lead back-fills cleanly with one migration script. Don't break the schema. Don't invent field names. Don't compress meanings.

The schema IS the contract.
