# LEGACYLOOP — COMPLETE PASSOFF v11
### Master Reference Document
### Updated: March 20, 2026 | Ryan Hallee, Founder & CEO

---

## SECTION 1 — COMPANY IDENTITY

| Field | Value |
|-------|-------|
| Company | LegacyLoop LLC (forming) |
| Founder | Ryan Hallee |
| Location | Maine, USA |
| Mission | Connecting Generations |
| Tagline | Sell Smarter. Move Faster. |
| Domain | legacy-loop.com (renewed 3 years) |
| Website | legacy-loop.com |
| Stage | Pre-revenue, demo-ready |
| Demo Launch | ~30 days |
| Target Investor | Dr. Clark (first target) |

### Professional Email Addresses
| Email | Purpose |
|-------|---------|
| ryan@legacy-loop.com | CEO, founder, investors, all primary |
| support@legacy-loop.com | User help, bug reports |
| shipping@legacy-loop.com | LTL freight, carriers, shipping issues |
| estates@legacy-loop.com | Estate inquiries, white glove service |
| investors@legacy-loop.com | Dr. Clark, grants, accelerators |
| social@legacy-loop.com | Press, PR, podcasts, partnerships |

---

## SECTION 2 — TECH STACK (EXACT)

| Component | Version/Details |
|-----------|----------------|
| Framework | Next.js 16.1.6 |
| UI Library | React 19.2.3 |
| Database ORM | Prisma ^6.19.2 |
| Database | SQLite (dev) / PostgreSQL (production) |
| Language | TypeScript ^5 |
| Hosting | Vercel |
| Payments | Square (sandbox) |
| Email | SendGrid (ryan@legacy-loop.com) |
| Parcel Shipping | Shippo (test token) + FedEx Parcel (sandbox) |
| LTL Freight | ShipEngine/ShipStation (sandbox) + FedEx LTL (sandbox) |
| AI Engine 1 | OpenAI GPT-4o (vision + analysis) |
| AI Engine 2 | Anthropic Claude (narrative + accuracy) |
| AI Engine 3 | Google Gemini (SEO + search) |
| AI Engine 4 | xAI Grok (social + viral) |

### Design System Rules
- All styles: inline style={{}} — NO Tailwind, NO className for styling
- Theme: Dark premium Tesla/SpaceX/Grok aesthetic
- Accent: Teal #00bcd4
- Light mode: CSS variables on theme-aware surfaces
- Always-dark panels: Hardcoded colors (#e2e8f0 text, rgba(255,255,255,0.05) bg)
- Senior-friendly typography and spacing

### App Statistics
| Metric | Count |
|--------|-------|
| Total TypeScript/TSX files | 334 |
| API routes | 126 |
| Prisma models | 46 |
| Schema lines | 1,087 |
| Shipping Center lines | 4,855+ |
| Item Dashboard Panels lines | 8,028+ |
| Bot page client files | 12 (14,887 lines total) |
| Shipping library files | 6 |

---

## SECTION 3 — TEST ACCOUNTS

| Field | Account 1 | Account 2 |
|-------|-----------|-----------|
| Email | annalyse07@gmail.com | ryanroger11@gmail.com |
| Password | LegacyLoop123! | Freedom26$ |
| Tier | 4 — Estate Manager | 4 — Estate Manager |

**SYSTEM_USER_ID:** cmmqpoljs0000pkwpl1uygvkz
**DEMO_MODE:** true (bypasses all gates and credit deductions)

---

## SECTION 4 — ENVIRONMENT VARIABLES

| Variable | Status | Purpose |
|----------|--------|---------|
| OPENAI_API_KEY | SET | GPT-4o vision + analysis |
| OPENAI_MODEL | SET | Model selection |
| ANTHROPIC_API_KEY | SET | Claude narrative + accuracy |
| GEMINI_API_KEY | SET | Gemini SEO + search |
| XAI_API_KEY | SET | Grok social + viral |
| XAI_BASE_URL | SET | Grok endpoint |
| XAI_MODEL_TEXT | SET | Text model |
| XAI_MODEL_VISION | SET | Vision model |
| SQUARE_APPLICATION_ID | SET | Sandbox payments |
| SQUARE_ACCESS_TOKEN | SET | Sandbox payments |
| SQUARE_LOCATION_ID | SET | Sandbox payments |
| SQUARE_ENVIRONMENT | SET | sandbox |
| SENDGRID_API_KEY | SET | Email (new account) |
| SENDGRID_FROM_EMAIL | SET | ryan@legacy-loop.com |
| SENDGRID_FROM_NAME | SET | LegacyLoop |
| SHIPPO_API_KEY | SET | Parcel shipping (test) |
| SHIPENGINE_API_KEY | SET | LTL freight (sandbox) |
| SHIPENGINE_BASE_URL | SET | api.shipengine.com |
| SHIPENGINE_ENV | SET | sandbox |
| FEDEX_PARCEL_API_KEY | SET | FedEx parcel (sandbox) |
| FEDEX_PARCEL_SECRET_KEY | SET | FedEx parcel auth |
| FEDEX_PARCEL_URL | SET | apis-sandbox.fedex.com |
| FEDEX_LTL_API_KEY | SET | FedEx freight (sandbox) |
| FEDEX_LTL_SECRET_KEY | SET | FedEx freight auth |
| FEDEX_LTL_URL | SET | apis-sandbox.fedex.com |
| CRON_SECRET | SET | Vercel cron auth |
| SYSTEM_USER_ID | SET | cmmqpoljs0000pkwpl1uygvkz |
| DEMO_MODE | true | Bypasses all gates |
| DATABASE_URL | SET | PostgreSQL |

---

## SECTION 5 — COMPLETE LOCKED FEATURE LIST

### Pass 1-3 Locked
- All bot AI logic and prompt systems
- All bot output formats
- MegaBot 4-agent consensus (OpenAI, Claude, Gemini, Grok)
- Antique detection + Antique Alert (78 signals)
- Collectible detection + scoring
- Amazon/Rainforest enrichment adapter
- Shipping calculator + package suggestions
- Offer negotiation (3-round, magic link)
- Credit system (packs, custom, deductions, balance)
- Subscription tiers (Free/DIY/Power/Estate Manager)
- Pro-rate billing, Commission calculator
- ListBot Publish Hub (13 platforms)
- Marketplace, bundles, trade proposals
- Data pipelines and enrichment

### Pass 3 Final Locked (March 16-17)
- Custom credit purchase ($25-$10K, 5 tiers)
- Subscription page (5 fixes + RECOMMENDED badge)
- Email system (env var, per-email overrides, shared templates)
- Gemini MegaBot reliability (safety, fallback, retry)

### Pass 4 Locked (March 18)
- Amazon enrichment — first-pull-only
- Upload system — UploadModal 6 methods
- Edit Item Form — 14 new fields
- Item Control Center V1+V2
- Light Mode — 1,554 replacements/88 files
- Message Center — light mode, Weekly Report, AI inbox, star buyers

### Pass 5 Locked (March 19 — 24 commands, 65+ files)
- Quiz upgrade (4 parts: theme 60 colors, tone, results, auto-trigger)
- Bot Hub (11 live + 3 Coming Soon: StoryBot, InsuranceBot, DonationBot)
- Fee split (3.5% to 1.75% buyer/1.75% seller across 13 files)
- Edit Sale (8 fields) + Sell All (discount/fixed) + Item Assignment
- Create New Item from Sale + Item Page contrast fix
- Bot Loading light mode fix + Item Control Center polish
- Trade Center (expandable, example card, status dashboard, How it Works)
- Offer/Haggling upgrade (7 files, fee fix, light mode)
- Return + Buyback Bridge (relist, refund management)
- Action Panel (share, add item, net earnings, smart bot routing)
- Messages item filter via URL params
- PriceBot page (net earnings, freshness indicator)
- Shipping Center TMS base build
- SoldPriceWidget light mode fix + net earnings
- Shipping estimate API — uses real item dimensions (AI fallback)
- Shipping data flow — auto-fetch, shared estimates, carrier selection

### Pass 6 Locked (March 19-20 — Shipping Center Deep Rebuild)
- Shipping Center API enrichment (suggestPackage with fixed dimension string, EventLog quotes, shippingStage, urgencyLevel, metro estimates, selectedQuote, enrichment flags)
- Shipping estimate quote persistence (EventLog SHIPPING_QUOTED)
- Item Dashboard shipping bridge (Go to Shipping Center CTA)
- ShippingCenterClient 4,855+ lines with: BOX_PRESETS grid with fit indicators, editable dims, packaging type selector, Save Shipping Details, carrier BEST/FASTEST badges with Net Profit, ShipProfile with AI box + saved/AI indicator + last quote, intelligence strip with clickable pills, ShippingLabel with CSS barcode + carrier tracking numbers, FreightTab with real getFreightEstimates library + BOL questionnaire (7 sections) + BOL tracking (6 steps), LocalPickupTab with 5-step progress + handoff codes + safety tips + vehicle auto-routing, ShippingAIPanel (4-AI background intelligence), CitySearch autocomplete, real metro estimates from Shippo, clickable quote selection + save + fresh/expired lifecycle, profit analysis, enrichment badges (ANTIQUE/HIGH VALUE/PREMIUM/FRAGILE), auto-refresh polling (30s), delivery methods (QR/Print/Pickup), insurance persistence, quote expiration tracking (Fresh/Expiring/Expired with alert banner), shipping readiness stepper (3-step progress in PreSale), Mark as Sold in PreSale
- ShipEngine/ShipStation LTL integration (shipengine-ltl.ts library + API route)
- FedEx LTL integration (fedex-ltl.ts library with OAuth2 + API route)
- FedEx Parcel integration (fedex-parcel.ts library with OAuth2 + rates API)
- 5 carrier API integrations: Shippo, FedEx Parcel, FedEx LTL, ShipEngine, estimates
- ShipBot renamed to "ShipBot" (was "Shipping Center"), redirect banner added
- All links corrected: /bots/shipbot → /shipping for Shipping Center
- Dimension bug fix in center API (JSON.stringify → dimension string format)
- Category overrides for small items (cards, jewelry → Tiny/Card Mailer)
- Post-sale wizard Step 0 quote dashboard with saved quotes, Ship Now shortcut
- Editable package details in wizard Step 1 with box quick-select
- Wizard state persistence to localStorage
- Split shipping cost option (Buyer/Seller split 50/50)
- Dimensional weight in demo rates
- Quote continuity across item status changes (LISTED → SOLD)
- Auto-expand QuoteDetailPanel for items with saved quotes
- Freight flow: 3 buttons merged into 1 unified "Get Freight Quotes"
- Auth page visual upgrade (layout, login, signup, forgot/reset password)

---

## SECTION 6 — COMPLETE FILE LOCK LIST

### Core Adapters
- lib/adapters/ai.ts — LOCKED
- lib/adapters/rainforest.ts — LOCKED
- lib/adapters/auth.ts — EXTEND ONLY
- lib/adapters/storage.ts — LOCKED
- lib/adapters/multi-ai.ts — LOCKED

### AI Detection + Scoring
- lib/antique-detect.ts — LOCKED
- lib/collectible-detect.ts — LOCKED

### MegaBot Engine
- lib/megabot/run-specialized.ts — LOCKED
- lib/megabot/prompts.ts — ADD-ONLY

### Agents
- lib/agents/runner.ts — LOCKED (IMPORT ALLOWED)

### Shipping Libraries
- lib/shipping/package-suggestions.ts — LOCKED (IMPORT ALLOWED)
- lib/shipping/metro-estimates.ts — LOCKED (IMPORT ALLOWED)
- lib/shipping/freight-estimates.ts — LOCKED (IMPORT ALLOWED)
- lib/shipping/city-lookup.ts — LOCKED (IMPORT ALLOWED)
- lib/shipping/shippo.ts — LOCKED
- lib/shipping/shipengine-ltl.ts — LOCKED
- lib/shipping/fedex-ltl.ts — LOCKED
- lib/shipping/fedex-parcel.ts — LOCKED

### Data Pipelines
- lib/data/** — ALL LOCKED

### Enrichment
- lib/enrichment/** — LOCKED
- lib/addons/enrich-item-context.ts — LOCKED

### Credits + Billing
- lib/credits.ts — LOCKED
- lib/tier-enforcement.ts — READ ONLY
- lib/billing/** — LOCKED

### Offers + Email + Pricing
- lib/offers/** — LOCKED
- lib/email/** — LOCKED
- lib/constants/pricing.ts — LOCKED
- lib/pricing/** — LOCKED

### API Routes
- app/api/** — ALL LOCKED
- app/api/shipping/** — LOCKED (previously EXTEND ONLY, now complete)

### UI + Pages
- app/items/** — ALL LOCKED
- app/dashboard/** — LOCKED
- app/bots/** — ALL LOCKED
- app/shipping/** — LOCKED
- app/components/** — ALL LOCKED
- app/page.tsx — LOCKED
- globals.css — LOCKED
- app/subscription/** — LOCKED
- app/credits/** — LOCKED
- app/marketplace/** — LOCKED
- app/bundles/** — LOCKED
- app/pricing/** — LOCKED
- app/projects/** — LOCKED
- app/offers/** — ALL LOCKED
- app/messages/** — ALL LOCKED
- app/addons/** — ALL LOCKED
- app/onboarding/** — ALL LOCKED
- app/auth/** — LOCKED (just upgraded)

### Infrastructure
- vercel.json — LOCKED
- prisma/schema.prisma — READ ONLY

---

## SECTION 7 — EXACT PRICING

### Subscription Tiers
| Tier | Monthly | Pre-Launch | Annual | Commission |
|------|---------|------------|--------|------------|
| Free | $0 | $0 | $0 | 12% |
| DIY Seller | $20 | $10 | $200 | 8% |
| Power Seller | $49 | $25 | $490 | 5% |
| Estate Manager | $99 | $75 | $990 | 4% |

### Credit Packs
| Pack | Price | Credits |
|------|-------|---------|
| Starter | $25 | 30 |
| Builder | $50 | 65 |
| Pro | $100 | 140 |
| Business | $200 | 300 |

### Fee Model
- Total processing fee: 3.5%
- Buyer pays: 1.75% (added to price)
- Seller pays: 1.75% (deducted from earnings)
- Platform purchases (credits, add-ons, White Glove): customer pays 3.5%
- Monthly subscriptions: no processing fee
- Split cost option: buyer and seller each pay 50% of shipping

### White Glove Services
| Tier | Price | Items |
|------|-------|-------|
| Essentials | $1,495 | Up to 100 |
| Professional | $2,995 | 200+ |
| Legacy | $4,995+ | Unlimited |

---

## SECTION 8 — CURRENT BUILD STATE

### Phase 1 — Trust + Reliability: COMPLETE
### Phase 2 — Item/Sale/Trade/Offer: COMPLETE
### Phase 3 — Data Sync: IN PROGRESS
- PriceBot page upgrade + sync: LOCKED
- Shipping Center TMS: LOCKED (deep rebuild complete)
- AI Analysis Bot Refinement: NOT STARTED
- Bot Data Distribution Audit: NOT STARTED
- Document Vault to Bot Intelligence Feed: NOT STARTED

### Phase 4 — Admin/Intelligence: NOT STARTED
### Phase 5 — Business Infrastructure: NOT STARTED
### Phase 6 — Final Polish + Demo: NOT STARTED

---

## SECTION 9 — SHIPPING CENTER STATUS

The Shipping Center is the most developed feature in the platform at 4,855+ lines. It underwent a deep rebuild across 15+ Claude Code commands.

### 5 Carrier API Integrations
1. Shippo (parcel: USPS/UPS/FedEx) — test token
2. FedEx Parcel (real account, sandbox) — OAuth2 auth
3. FedEx LTL (real account, sandbox) — OAuth2 auth
4. ShipEngine/ShipStation (LTL sandbox) — API key auth
5. Our estimate engine (fallback only)

### Complete Flows
- **Parcel:** PreSale estimates → Quote save → Ready to Ship → 4-step wizard → Label → Tracking → Close Sale
- **LTL Freight:** Unified quote form → Carrier selection → Schedule Pickup / Upload Quote / BOL → BOL Tracking
- **Local Pickup:** 5-step flow (Invite → Confirm → En Route → Handoff → Complete) with vehicle auto-routing

### Remaining Items (for future sessions)
- FedEx API sandbox auth debugging (returning empty — needs credential verification)
- ListBot light mode contrast fix (hardcoded dark colors in listing panel)
- LTL freight tab unified quoting (3 buttons merged but may need polish)

---

## SECTION 10 — BOT PAGES STATUS

### Audit Summary (12 bots, 14,887 lines total)

| Bot | Lines | Depth | MegaBot | Light Mode | Elon Rating | Priority |
|-----|-------|-------|---------|------------|-------------|----------|
| MegaBot | 2,629 | FULL | CORE | CLEAN | 10/10 | LOW |
| ListBot | 1,302 | FULL | YES | CLEAN | 9/10 | LOW |
| AntiqueBot | 1,193 | FULL | YES | CLEAN | 9/10 | LOW |
| CollectiblesBot | 1,678 | FULL | YES | CLEAN | 9/10 | MEDIUM |
| AnalyzeBot | 889 | FULL | YES | CLEAN | 8/10 | MEDIUM |
| BuyerBot | 1,099 | MEDIUM | YES | CLEAN | 8/10 | MEDIUM |
| StyleBot | 916 | FULL | YES | CLEAN | 8/10 | MEDIUM |
| PriceBot | 1,020 | MEDIUM | ? | CLEAN | 7/10 | HIGH |
| CarBot | 1,877 | FULL | YES | CLEAN | 7/10 | MEDIUM |
| ShipBot | 949 | MEDIUM | YES | CLEAN | 7/10 | MEDIUM |
| ReconBot | 1,072 | MEDIUM | NO | CLEAN | 6/10 | HIGH |
| PhotoBot | 263 | THIN | NO | CLEAN | 5/10 | MEDIUM |

### Key Finding: Data sync is NOT broken
All 12 bots properly load cached data on mount via useEffect + API fetches. The v7 passoff incorrectly reported this as broken. CORRECTED in v11.

### Key Finding: Light mode is CLEAN
No hardcoded dark-mode colors in any bot client file. Exception: ListingCommandCenter in ItemDashboardPanels.tsx has contrast issues (separate from bot pages).

---

## SECTION 11 — PENDING SCHEMA MIGRATION

DO ALL AT ONCE — Never piecemeal:
- User.role — 'admin' | 'user'
- soldPrice Int → Float
- soldVia String? on Item
- estimatedValue Float? on Item
- priceDelta Float? on Item
- TradeProposal model
- AgentSettings model
- Bundle + BundleItem models
- quizCompletedAt DateTime? on User
- feeModel field on PaymentLedger
- RETURN_REQUESTED, RETURNED, REFUNDED statuses on Item

---

## SECTION 12 — BUSINESS STATUS

### Completed
- Domain renewed 3 years (Squarespace)
- Google Workspace active
- 6 professional emails live
- MX records + DKIM added
- SendGrid new account (ryan@legacy-loop.com)
- n8n account active
- LinkedIn company page building
- 52 scheduled Coworker tasks

### Urgent — Not Yet Done
- Maine LLC at maine.gov ($175)
- EIN at IRS.gov (free)
- Relay.fi business bank (free)
- Square production keys (requires LLC + bank)
- eBay developer application
- SendGrid domain authentication
- Deploy to production on Vercel
- Apply to MTI grant (up to $500K)
- Dr. Clark investor demo THIS WEEK

---

## SECTION 13 — NEXT SESSION INSTRUCTIONS

### Priority 1: ListBot Light Mode Fix
Fix hardcoded dark-mode colors in ListingCommandCenter (ItemDashboardPanels.tsx lines 4318-4470). Command ready: LISTBOT-CONTRAST-FIX.txt

### Priority 2: LTL Freight Tab Cleanup
Merge 3 LTL quote buttons into 1 unified flow. Debug FedEx LTL/Parcel API auth. Fix duplicate React key errors. Command ready: LTL-FREIGHT-CLEANUP.txt

### Priority 3: Auth Visual Upgrade
Premium visual treatment for login/signup/forgot/reset pages. Command ready: AUTH-VISUAL-UPGRADE.txt

### Priority 4: Bot Page Console Upgrades
Apply the same deep audit + rebuild approach used on the Shipping Center to each bot page. Start with PriceBot and ReconBot (highest priority from audit).

### Priority 5: Phase 3 Remaining
- AI Analysis Bot Refinement
- Bot Data Distribution Audit
- Document Vault to Bot Intelligence Feed

---

## SECTION 14 — CARRY-FORWARD ITEMS

1. ListBot light mode contrast (hardcoded dark colors in ItemDashboardPanels.tsx)
2. FedEx API auth debugging (both Parcel and LTL returning empty)
3. LTL FreightTab unified quoting (3 buttons → 1)
4. Duplicate React key errors on carrier rows
5. Pre-demo data seeding (pickup status data, item flow testing)
6. Dr. Clark demo preparation (deck, script, walkthrough)

---

## SECTION 15 — CUSTOMEVENTS IN USE

| Event | Direction | Purpose |
|-------|-----------|---------|
| conversation-selected | Messages → InboxCmd | Conversation clicked |
| conversation-counts-updated | Messages → InboxCmd | Update count badges |
| agent-fill-message | InboxCmd → Messages | AI fills reply box |
| agent-settings-toggle | InboxCmd → AgentSettings | Open settings panel |
| inbox-filter-change | InboxCmd → Messages | Sidebar category clicked |
| inbox-filter-reset | Messages → InboxCmd | Tab bar clicked — reset sidebar |

---

*Complete Passoff v11 | LegacyLoop | March 20, 2026 | Ryan Hallee, Founder*
