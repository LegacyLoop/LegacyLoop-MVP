# LEGACYLOOP — TRANSFER COMMAND v11
### Paste this into every new Claude Code session

You are resuming work on LegacyLoop, an AI-powered resale automation platform built by Ryan Hallee. Stack: Next.js 16.1.6, React 19.2.3, Prisma (SQLite dev / PostgreSQL prod), Vercel. 4 AI engines: OpenAI GPT-4o, Claude, Gemini, Grok working in MegaBot consensus. Design: Dark premium Tesla/SpaceX/Grok aesthetic, teal #00bcd4. All styles inline style={{}} — NO Tailwind, NO className.

## CRITICAL RULES — NON-NEGOTIABLE
1. ALL styles inline style={{}} only. NO Tailwind. NO className. EVER.
2. NEVER touch locked files without explicit surgical unlock.
3. ALWAYS read full files before building. Never assume. Never guess.
4. DEMO_MODE=true — no real charges. Square is sandbox.
5. NEVER run schema migration piecemeal. All pending fields at once.
6. Always-dark panels = hardcoded colors (#e2e8f0 text, rgba(255,255,255,0.05) bg). CSS variables invert in light mode.
7. Theme-aware surfaces = CSS variables. Never hardcode on theme surfaces.

## TEST ACCOUNTS
- annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
- ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager
- SYSTEM_USER_ID=cmmqpoljs0000pkwpl1uygvkz

## CURRENT STATE (March 20, 2026)
Phase 1 (Trust) and Phase 2 (Item/Sale/Trade/Offer): COMPLETE. Phase 3 (Data Sync): IN PROGRESS — Shipping Center TMS deep rebuild COMPLETE (4,855+ lines, 5 carrier APIs). Bot pages audited — all 12 have clean light mode and working data sync. Phase 4-6: NOT STARTED.

## WHAT IS BUILT AND LOCKED
- 12 AI Bots (AnalyzeBot, PriceBot, ListBot, AntiqueBot, BuyerBot, PhotoBot, CarBot, CollectiblesBot, ReconBot, ShipBot, StyleBot, MegaBot Hub)
- AI Messaging Agent (3-panel inbox, buyer intelligence, negotiation coaching, 5 smart reply modes, agent modes: Monitor/Co-Pilot/Auto-Pilot)
- Add-On Store (16 add-ons, 3 working with 4-AI parallel)
- Bundle Sale Engine (3 types, public pages)
- Publish Hub (13 platforms)
- Shipping Center TMS (4,855+ lines, 5 carrier APIs, full parcel/LTL/pickup flows)
- Financial Engine (pro-rate, cancel flow, commission, earnings dashboard)
- Offer + Negotiation Engine (3-round, magic link)
- Trade System (Trade Center, expandable proposals)
- Return + Buyback Bridge
- Onboarding Quiz (themed, auto-trigger)
- Item Control Center (status bar, net earnings, smart bot routing)
- Sales System (Edit Sale, Sell All, Create New Item)
- Credit Economy ($25-$200 packs)
- Subscription Tiers + White Glove Services

## 5 CARRIER API INTEGRATIONS
1. Shippo (parcel: USPS/UPS/FedEx) — test token
2. FedEx Parcel (real account, sandbox) — OAuth2
3. FedEx LTL (real account, sandbox) — OAuth2
4. ShipEngine/ShipStation (LTL sandbox)
5. Estimate engine (fallback)

## FEE MODEL
- 3.5% total = 1.75% buyer + 1.75% seller
- Platform purchases = 3.5% customer pays
- Subscriptions = no processing fee
- Split cost option = 50/50 buyer/seller shipping split

## MESSAGES PAGE LAYOUT NOTE
position:fixed, top:108px (64px nav + 44px demo banner). Do NOT change.

## CUSTOMEVENTS IN USE
- conversation-selected: Messages → InboxCmd
- conversation-counts-updated: Messages → InboxCmd
- agent-fill-message: InboxCmd → Messages
- agent-settings-toggle: InboxCmd → AgentSettings
- inbox-filter-change: InboxCmd → Messages
- inbox-filter-reset: Messages → InboxCmd

## PENDING SCHEMA MIGRATION (ALL AT ONCE)
User.role, soldPrice Int→Float, soldVia, estimatedValue, priceDelta, TradeProposal, AgentSettings, Bundle + BundleItem, quizCompletedAt, feeModel, RETURN statuses

## COMMANDS READY TO RUN
1. LISTBOT-CONTRAST-FIX.txt — Fix ListBot light mode contrast
2. LTL-FREIGHT-CLEANUP.txt — Merge 3 LTL buttons into 1 + FedEx debug
3. AUTH-VISUAL-UPGRADE.txt — Login page premium makeover

## CURRENT PRIORITIES
1. Run remaining commands (ListBot fix, LTL cleanup, Auth upgrade)
2. Bot page console upgrades (PriceBot, ReconBot first)
3. Phase 3 remaining (AI Analysis Refinement, Bot Data Audit)
4. Phase 4 Admin Dashboard
5. Phase 6 Demo Walkthrough prep

## NEXT SESSION TASK
[RYAN — FILL IN YOUR SPECIFIC TASK HERE]

Confirm you understand the design system, locked files, and current priorities. Run the Section 2 checkpoint. Then begin work.

---
*Transfer Command v11 | LegacyLoop | March 20, 2026*
