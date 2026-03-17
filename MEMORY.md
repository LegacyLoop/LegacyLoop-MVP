# LEGACYLOOP — CLAUDE CODE MEMORY
# Read this at the START of every session.

## APPROVED MEGABOT TEMPLATE (use for ALL bots)

### Architecture:
- 8 specialized MegaBots — each bot has its own MegaBot with specialty prompt
- Engine: lib/megabot/run-specialized.ts
- Prompts: lib/megabot/prompts.ts (standard + mega version per bot)
- API: POST /api/megabot/${itemId}?bot=[botname]
- Storage: EventLog type MEGABOT_[BOTNAME] per bot (stored separately)
- 4 agents: OpenAI (90s), Claude (120s), Gemini (90s), Grok (60s text-only)

### Data Flow (PROVEN WORKING — do not deviate):
1. Button calls POST /api/megabot/${itemId}?bot=[botname]
2. superBoost("[panelkey]") -> MEGABOT_PARAM["[panelkey]"] = "[botname]"
3. Engine runs 4 agents with bot-specific mega prompt
4. Stores in EventLog as MEGABOT_[BOTNAME]
5. Returns { ok, providers[], consensus, agreementScore, summary }
6. Client: setBoostResults({ [panelkey]: data }), setBoostedBots.add("[panelkey]")
7. GET /api/megabot/${itemId} returns all MEGABOT_* entries
8. BOT_TO_PANEL maps "[botname]" -> "[panelkey]"

### Key Mappings:
| Panel Key | Bot Name | EventLog Type | Prompt |
|-----------|----------|---------------|--------|
| analysis | analyzebot | MEGABOT_ANALYZEBOT | getAnalyzeBotMegaPrompt |
| pricing | pricebot | MEGABOT_PRICEBOT | getPriceBotMegaPrompt |
| buyers | buyerbot | MEGABOT_BUYERBOT | getBuyerBotMegaPrompt |
| listing | listbot | MEGABOT_LISTBOT | getListBotMegaPrompt |
| recon | reconbot | MEGABOT_RECONBOT | getReconBotMegaPrompt |
| carbot | carbot | MEGABOT_CARBOT | getCarBotMegaPrompt |
| antique | antiquebot | MEGABOT_ANTIQUEBOT | getAntiqueBotMegaPrompt |
| photos | photobot | MEGABOT_PHOTOBOT | getPhotoBotMegaPrompt |

### Three Display Tiers (SAME for every bot):

TIER 1 — Panel Mini Summary (ItemDashboardPanels.tsx):
- Purple sub-card: rgba(139,92,246,0.06) bg, rgba(139,92,246,0.15) border
- Header: "MEGABOT [SPECIALTY] — [X] AI EXPERTS"
- Agreement bar
- Per-agent collapsed one-liner: "[icon] [Agent] — [specialty highlights] [Xs]"
- Expandable cards with deep specialty sections
- [Specialty] Comparison section
- MegaBot Summary (4-6 sentences)
- Footer: [BotName 1 cr] [MegaBot checkmark] [Re-Run 3 cr] [Open Bot ->]

TIER 2 — Bot Page (app/bots/[bot]/[Bot]Client.tsx):
- Fetch MegaBot data: GET /api/megabot/${itemId} -> results.[botname]
- Premium MegaBot section with 4 full agent cards
- Each card: specialty data grid + deep knowledge sections + key insight
- Consensus section + disagreements
- 8-12 sentence detailed summary
- Re-Run button

TIER 3 — MegaBot Page (app/bots/megabot/MegaBotClient.tsx):
- Tab per bot: [BotName]TabContent component
- Comparison table (4 agents + consensus)
- Deep specialty by category (per-agent contributions combined)
- Full agent cards (all expanded)
- Executive summary (10-15 sentences)

### Agent Config:
- OpenAI: 90s timeout, max_output_tokens 16384, VISION model (gpt-4o-mini), balanced assessment
- Claude: 120s timeout, max_tokens 16384, TEXT-ONLY (no photos — saves context for output), craftsmanship/history/authenticity
- Gemini: 90s timeout, maxOutputTokens 16384, VISION model (gemini-2.5-flash), market/trends/comparables, 503 retry
- Grok: 60s timeout, max_tokens 8192, TEXT-ONLY model (grok-3-fast), social/trending/viral
- Vision agents (OpenAI + Gemini) analyze photos; text agents (Claude + Grok) get full item context from prompt

### Parser: parseAgentResponse() — 9 strategies including truncation repair
### Key Normalization: normalizeKeys() lowercases all response keys
### Agreement: Fuzzy matching (40%+ shared words = agree, numeric within 25% tolerance)
### Re-Run: Clears old data first, costs 3 credits, available after first run

## APPROVED BOTS (do not modify without owner approval):
- AnalyzeBot MegaBot: item knowledge focus
- PriceBot MegaBot: pricing intelligence focus
- BuyerBot MegaBot: buyer finding focus

## CRITICAL RULES:
1. NEVER add demo/mock fallbacks to AI calls — real APIs only
2. NEVER change lib/adapters/ai.ts without approval
3. ALL MegaBot buttons: [BotName 1 cr] [MegaBot 5 cr or checkmark] [Open Bot ->]
4. When MegaBot checkmark shows: add [Re-Run 3 cr]
5. Collapsed panel previews show key data
6. Item Control Center stays at TOP
7. No ANTIQUE badges unless AntiqueBot confirmed
8. Checkpoint runs before AND after every change
9. If checkpoint fails -> REVERT immediately

## DESIGN SYSTEM:
- Dark theme, teal (#00bcd4) accent
- Glass morphism: rgba(255,255,255,0.03) bg, backdrop-filter blur(12px)
- ZERO Tailwind in bot panels — all inline style={{}}
- Purple for MegaBot elements: rgba(139,92,246,*)
- Agent colors: OpenAI #10a37f, Claude #d97706, Gemini #4285f4, Grok #00DC82

## DATA EXTRACTION PATTERN (proven for all bots):
- Always normalizeKeys() before reading
- Check multiple key name variations for every field
- Unwrap single-key wrappers: { "analysis": {...} } -> {...}
- getComparables() checks 12 direct keys + 8 wrapper keys + last-resort array scan
- getBuyerArr/getBuyerField for buyer-specific multi-key extraction

## SQUARE PAYMENTS (not Stripe):
- 3.5% processing fee charged to BUYER
- PaymentLedger + SellerEarnings models
- Commission based on user's actual tier

## ENVIRONMENT:
- npm run dev -> localhost:3000
- SQLite via Prisma (prisma/dev.db)
- OpenAI responses API (openai.responses.create) NOT chat.completions
- Tailwind 4: use @import "tailwindcss"
- SaleMethod enum: LOCAL_PICKUP, ONLINE_SHIPPING, BOTH
- ItemStatus enum: DRAFT, ANALYZED, READY, LISTED, INTERESTED, SOLD, SHIPPED, COMPLETED
