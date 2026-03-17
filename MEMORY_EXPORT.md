# LegacyLoop MVP Memory

## Project
AI estate resale platform. Next.js 16.1.6 / React 19 / Tailwind 4 / Prisma 6 SQLite / OpenAI Vision.
Investor demo for Dr. Steven Clark in 7-10 days. User is Ryan (dyslexic — keep explanations clear).

## Stack
- `npm run dev` starts the app at localhost:3000
- Database: `prisma/dev.db` (SQLite)
- AI: OpenAI responses API (`openai.responses.create`) — NOT `chat.completions`
- Tailwind 4: use `@import "tailwindcss"` NOT `@tailwind base/components/utilities`

## SaleMethod enum (CRITICAL)
Schema values: `LOCAL_PICKUP`, `ONLINE_SHIPPING`, `BOTH`
- Old bug (FIXED): forms used `LOCAL`, `ONLINE`, `LOCAL_ONLINE` — now all corrected

## Key bugs fixed (2026-03-01)
- SaleMethod values in new/edit forms and create route
- Update route switched from FormData to JSON parsing
- Antique Alert tier gate removed (was tier >= 3, now shows for all users)

## Latest migrations
- 20260301171852_megabot_and_conversations — adds megabotUsed to Item, drops old Message, adds Conversation + Message
- 20260301182037_add_new_statuses_and_listing_price — adds LISTED/INTERESTED/SOLD/SHIPPED to ItemStatus, adds listingPrice Float? to Item
- 20260301234000_add_photo_order_and_caption — adds order/isPrimary/caption to ItemPhoto
- 20260302155132_add_credits_integrations — adds UserCredits, CreditTransaction, ConnectedPlatform + User relations
- 20260302161650_add_buyer_bots_and_metrics — adds BuyerBot, BuyerLead, ItemEngagementMetrics, Referral models
- 20260302163130_add_auth_subscription_shipping — adds PasswordReset, SubscriptionChange, ShipmentLabel models
- 20260302165322_add_whiteglov_phases_contractors — adds WhiteGlovePhase, Contractor, ContractorJob; adds currentPhase/teamJson to WhiteGloveProject

## ItemStatus enum (full list)
DRAFT, ANALYZED, READY, LISTED, INTERESTED, SOLD, SHIPPED, COMPLETED

## What's built
- Auth (JWT cookie), item upload, AI analyze route, item page, edit page
- eBay live comps (lib/adapters/ebay.ts + pricing.ts) with graceful fallback
- Enhanced antique detection (keyword/brand/material scoring, 40+ signals)
- Animated AntiqueAlert component (orange/gold gradient, pulse, appraisal CTA)
- Dashboard with stats (total, analyzed, antique count, portfolio value), item cards with badges
- MegaBot multi-AI system: lib/adapters/multi-ai.ts (Claude haiku + Gemini 1.5-flash + OpenAI in parallel), /api/megabot/[itemId], MegaBotPanel component, EventLog stores breakdown
- Messaging: Conversation + Message models, sidebar+thread UI at /messages, bot scoring, platform extraction, reply templates, send replies
- Shippo shipping: lib/adapters/shippo.ts, /api/shipping/rates + /api/shipping/label, ShippingCalculator on item page, mock rates when no key
- eBay: fixed EBAY-US → EBAY_US normalization, added sandbox URL support
- lib/antique-detect.ts — shared antique detection, imported by both analyze and megabot routes
- Dashboard: ItemCard client component (action dropdowns by status, listing price inline edit, delete confirm, status badges)
- API: /api/items/status/[itemId] (PATCH — status + listingPrice), /api/items/delete/[itemId] (DELETE — cascade)
- Public storefront: /store/[userId] with search/filter/contact form, /store → redirects to own store
- Pricing page: /pricing with 4 tiers + 9 add-ons + FAQ + CTA
- Pricing FIXED: pricing.ts now calls OpenAI gpt-4o-mini for text-based price estimate (getAiPriceEstimate); normalize confidence >1 by /100; do NOT apply conditionMult to AI prices (already in prompt); rationale saved to Valuation.rationale field
- Item Message Center: MessageCenter.tsx (client, 2-col inbox+thread, quick replies, send, mark read), ActivityLog.tsx (server, timeline of EventLog entries)
- Demo seed: POST /api/demo/seed creates 10 items, 2 projects (Grandma Dorothy Estate Sale + Spring Cleanout), conversations, transactions, and stories. Idempotent by title/name. Dashboard has "⚡ Load Demo Data" button (DemoSeedButton.tsx).
- New pages (2026-03-02): /buyers (BuyerFinderClient.tsx — mock buyer scan with bot scores), /veterans (marketing page for 25% discount program), /archives (ArchivesClient.tsx — PDF/print/USB generator with real item data), /payments (transaction history + mock payout dashboard).
- Nav: NOW uses AppNav (app/components/AppNav.tsx) — dark glass, 4-item center nav, avatar dropdown. Replaces old 15-button layout.tsx nav.
- /credits page: 3 tabs (Buy Credits, Services marketplace, History). 4 packages, 12 services. Credits stored in UserCredits + CreditTransaction.
- /integrations page: 10 platforms (Facebook, Instagram, eBay, Craigslist, Uncle Henry's, OfferUp, Mercari, Poshmark, Etsy, Nextdoor). Connect/disconnect via API. Cross-platform publishing toggles.
- /voice page: consent modal → Smart Buyer Detection demo. Scan animation + 3 mock matches. Beta/demo labeled.
- /buyers enhanced: "Active Buyers" + "Platform Leads" tabs. 12 mock leads across 5 platforms, Maine-specific.
- Demo seed updated: creates UserCredits (balance=85, lifetime=150) + CreditTransactions + 3 ConnectedPlatforms (facebook, ebay, craigslist).
- MegaBuying Bot system: BuyerBot + BuyerLead DB models; POST /api/bots/activate/[itemId] (generates 8 mock leads, idempotent); GET /api/bots/[itemId]; PATCH /api/bots/lead/[leadId]
- MegaBuyingBotPanel.tsx: 3-state client component (setup/activating/active) on item page — showpiece animated UI with comparison table, 9-step animation, lead cards
- /bots page: BotDashboardClient.tsx — summary stats, filter tabs, bot cards with leads expand
- /referral page: ReferralClient.tsx — code display, copy/email share, referral history, FAQ
- Item page: view counter (ItemEngagementMetrics upsert on each load), engagement bar (views/inquiries/bot leads), MegaBuyingBotPanel added before ActivityLog
- Nav: added 🤖 Bots → /bots and 🎁 Refer → /referral (logged-in, lg breakpoint)
- Demo seed updated: seeds Referral code, BuyerBot + 8 BuyerLead for Tea Service, ItemEngagementMetrics for all 10 items (340 views for Rolex, 218 for Tea Service, etc.), Subscription (STARTER $19/mo, period 2026-02-15 to 2026-03-15)
- Build: tsc --noEmit = 0 errors. npm run build = 82 routes clean (2026-03-02 session 8).
- lib/pricing/constants.ts: SINGLE SOURCE OF TRUTH — DIGITAL_TIERS, WHITE_GLOVE_TIERS, NEIGHBORHOOD_BUNDLE, CREDITS, ADD_ONS, DISCOUNTS + helper fns (calculateTierPrice, calculateWhiteGlovePrice, canUserAccessFeature, annualSavings)
- Pre-launch pricing in constants: STARTER $10→$20, PLUS $25→$49, PRO $75→$99 (pre-launch → regular at launch)
- lib/tier-enforcement.ts: server-side async checkTierLimit (CREATE_ITEM/UPLOAD_PHOTO/USE_MEGABOT/CREATE_PROJECT/ACCESS_*) + sync checkTierLimitSync
- /onboarding/quiz: 6-question interactive quiz (CSS transitions, no framer-motion), useRouter from next/navigation
- /onboarding/results: Suspense-wrapped useSearchParams results page, personalized tier recommendation card
- /pricing updated: imports DISCOUNTS from constants, pre-launch prices with strikethrough regular prices, quiz CTA link in hero + founding member banner
- IMPORTANT: EventLog model has NO userId field — count via item.userId relation: `item: { userId }`
- /heroes page: military + law enforcement + fire/EMS hero discount program (replaces /veterans in logged-out nav)
- /services/neighborhood-bundle: client-side pricing calculator (2–8 families), beta pricing, testimonials
- /api-access: REST API licensing page, 4 endpoint docs, 3-tier pricing ($99/$299/$999/mo), PAYG option
- /admin: auth-gated (ADMIN_EMAILS list) employee portal — real DB stats, 8 ops modules, system health panel
- /pricing updated: "FOUNDING MEMBER OFFER" urgency banner above digital tiers (50% off pre-launch, 47/100 spots)
- Nav: logged-out now shows 🏅 Heroes (was 🇺🇸 Veterans)
- Multi-photo: ItemPhoto has order/isPrimary/caption; PhotoGallery.tsx on item page; /api/items/photos/[itemId] POST/DELETE/PATCH
- Public storefront: /store/[userId] (StoreFront.tsx) items link to /store/[userId]/item/[itemId]; public item page has SEO metadata + ContactForm
- CRITICAL BUG FIXED: POST /api/conversations no longer requires auth — buyers don't log in. Item must be in PUBLIC_STATUSES = [LISTED, ANALYZED, READY, INTERESTED]
- Seller item page: has "🔗 Public listing" link (opens new tab) when item is publicly visible
- IDE TypeScript false positive: item.megabotUsed — use (item as any).megabotUsed. tsc --noEmit returns 0.
- UI/UX Overhaul + Logo integration (sessions 9-10, 2026-03-02): globals.css has CSS tokens (--accent #00bcd4, teal), .card (white, for existing pages), .card-dark (dark glass, for auth), .btn-primary (teal gradient), .btn-ghost (dark glass), .input-dark (dark bg + teal focus), .label-light, .login-glow, .login-logo (fadeSlideUp anim), .particle-dot. AppNav uses next/image: logo-horizontal.png (height:32px) desktop, logo-icon.png (32×32) mobile — both at /images/logos/. Teal accent replaces violet on active states, badge, avatar. Login page: premium dark glass (card-dark), logo-stacked.png centered with fade-in, 8 floating particle dots, dark inputs, teal CTA, show/hide password. app/icon.tsx: teal crescent favicon. layout.tsx metadata: icons.icon + icons.apple pointing to /images/logos/logo-icon.png. Build: 0 errors, 60 routes clean.
- Recon Bot system (session 8, 2026-03-02): lib/services/recon-bot.ts (mock competitor generator, market analysis, alert generator, activateReconBot, runScan); /api/recon/activate/[itemId] POST; /api/recon/[itemId] GET; /api/recon/scan/[botId] POST; /api/recon/alert/[alertId] PATCH; /api/recon/dashboard-alerts GET; /api/consent POST (awards 100 credits); ReconBotPanel.tsx on item page (setup/active states, competitor listings, alerts, scan now/pause); AlertsWidget.tsx on dashboard; DataConsentModal.tsx in layout (shown once per user, awards 100 credits on accept); Demo seed creates ReconBot + 2 alerts for Tea Service item + pre-accepts consent. Models: ReconBot + ReconAlert + DataCollectionConsent in schema. Migration: 20260302183705_add_recon_bots_and_consent. IMPORTANT: ReconBot uses latestCompetitorsJson (JSON string) NOT String[] (SQLite).
- Investor polish (session 7, 2026-03-02): app/icon.tsx (favicon 32×32 green LL, edge runtime), app/opengraph-image.tsx (1200×630 OG), app/components/Footer.tsx (trust badges + stats + 4-col links + v1.0.0-beta), app/components/HelpWidget.tsx (sticky bottom-right popover), app/components/DemoBanner.tsx (amber dismissible banner), app/components/KeyboardShortcuts.tsx (Ctrl+K/N/D/? shortcuts). All wired into app/layout.tsx. Print styles + skeleton CSS in globals.css. Loading skeletons at app/dashboard/loading.tsx + app/items/[id]/loading.tsx. Investor metrics in /admin (MRR $12.4K, ARR, CAC, LTV, LTV:CAC, churn, NPS, 12-month projections table). metadataBase set via NEXT_PUBLIC_APP_URL.

- Theme system (2026-03-02): ThemeProvider.tsx (React context + localStorage, light/dark/auto), globals.css fully refactored with html.dark/html.light CSS custom properties, layout.tsx wraps with ThemeProvider + inline script to prevent flash. AppNav has sun/moon toggle button. Settings/ThemeSettings.tsx has 3-option picker (Light/Dark/Auto). Login page forces dark wrapper (.login-page-wrapper). Footer + HelpWidget use CSS variables. Dark mode: cards use glass bg (rgba(255,255,255,0.05)) with CSS overrides for Tailwind text utilities (text-stone-* → light text). Light mode: cards use white bg, body is #f8fafc. NavBar stays dark glass in both modes.
- Contrast fix (2026-03-02): .section-title base color changed to #64748b (visible on both dark body and white cards). .card .section-title overrides to #94a3b8. .card .btn-ghost gets dark-on-light styling. .card .muted, .card .h1/.h2 overrides. Dashboard "interested buyers" banner button changed from btn-ghost (invisible on yellow) to explicit dark brown styling.
- Enhanced photo upload (2026-03-02): UploadModal.tsx — camera (input capture="environment"), photo library, Google Drive (Coming Soon), iCloud/Dropbox (Coming Soon), client-side compression (canvas resize if >2MB), drag reorder, rotate, delete, primary set, tier limit display, mobile sticky upload button. /items/new/page.tsx refactored to use UploadModal. Max 10MB per file.
- Build: tsc --noEmit = 0 errors. npm run build = 84 routes clean (2026-03-02 session 12).

## Payment Provider (2026-03-03)
- Square (NOT Stripe). See wave-a-square.md for full details
- Pricing SSOT: `/lib/constants/pricing.ts` (bridge at `/lib/pricing/constants.ts`)
- 3.5% processing fee charged to BUYER, not seller
- PaymentLedger + SellerEarnings models in Prisma
- `/lib/services/payment-ledger.ts` + `/app/api/webhooks/square/route.ts`
- Item page commission now uses user's actual tier (was hardcoded 10%)
- Build: 100 routes, 0 errors

## Env vars
- NEXT_PUBLIC_APP_URL=http://localhost:3000 (NOT NEXT_PUBLIC_BASE_URL)
- OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY all set
- EBAY_CLIENT_ID/SECRET = "PASTE_YOUR_*" — eBay never works, AI pricing fallback always used
- SQUARE_APPLICATION_ID, SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT=sandbox

## File map
- `app/api/analyze/[itemId]/route.ts` — main analysis pipeline (AI + pricing + antique)
- `app/api/items/create/route.ts` — item creation (FormData)
- `app/api/items/update/[itemId]/route.ts` — item update (JSON body)
- `app/items/[id]/AntiqueAlert.tsx` — animated antique alert component
- `app/items/[id]/page.tsx` — item detail page (seller view)
- `app/dashboard/page.tsx` — full dashboard with stats + cards
- `app/dashboard/DemoSeedButton.tsx` — client "⚡ Load Demo Data" button
- `app/messages/page.tsx` + `MessagesClient.tsx` — messaging UI
- `app/analytics/page.tsx` — analytics dashboard (computed from existing DB data)
- `app/search/page.tsx` + `SearchClient.tsx` — global browse/search page
- `app/sitemap.ts` — Next.js sitemap generation
- `app/components/ShareButtons.tsx` — Facebook/Twitter/Email/QR/Copy share component
- `app/components/ThemeProvider.tsx` — React context for light/dark/auto theme
- `app/components/UploadModal.tsx` — enhanced multi-source photo upload component
- `app/settings/ThemeSettings.tsx` — 3-option theme picker for settings page
- `lib/adapters/ai.ts` — OpenAI Vision via responses API
- `lib/adapters/ebay.ts` — eBay Browse API with token cache
- `lib/adapters/pricing.ts` — pricing from eBay comps + AI + location multipliers
- `lib/pricing/market-data.ts` — zip-code-based market multipliers and location pricing
- `app/privacy/page.tsx` — Privacy Policy page
- `app/terms/page.tsx` — Terms of Service page
- `lib/bot-mode.ts` — BOT_MODE=demo|live env var config, isDemoMode()/isLiveMode() helpers
- `lib/utils/json.ts` — shared safeJson utility (replaced 12 duplicate definitions)
- `lib/shipping/package-suggestions.ts` — AI-based package size/weight/fragile suggestion engine
- `lib/shipping/metro-estimates.ts` — shipping cost estimates to 5 major metros
- `app/items/[id]/ShippingPanel.tsx` — unified shipping (pre-sale + post-sale wizard)
- `app/items/[id]/SaleCongratsBar.tsx` — green congrats banner for SOLD items
- `app/items/[id]/TrackingTimeline.tsx` — 5-step tracking timeline with pulse animation
- `app/api/shipping/tracking/[labelId]/route.ts` — GET/POST tracking status
- `app/api/notifications/route.ts` — GET/PATCH notifications

## Prisma models
User, Item, ItemPhoto, AiResult, Valuation, AntiqueCheck, EventLog, MarketComp, Message, Conversation, Transaction, Project, UserCredits, CreditTransaction, ConnectedPlatform, BuyerBot, BuyerLead, ItemEngagementMetrics, Referral, PasswordReset, SubscriptionChange, ShipmentLabel, WhiteGloveProject, WhiteGlovePhase, ServiceQuote, Contractor, ContractorJob, Notification

## Shipping system overhaul (2026-03-02 session 13)
- Migration: 20260302220837_add_shipping_notifications — Item gains shippingWeight/Length/Width/Height (Float?), isFragile (Boolean), shippingPreference (String); ShipmentLabel gains deliveryMethod/estimatedDays/statusHistory; new Notification model
- lib/shipping/package-suggestions.ts: suggestPackage(category, dims, material) → PackageSuggestion, parseDimensions(), isLikelyFragile(). ~25 category→box mappings
- lib/shipping/metro-estimates.ts: getMetroEstimates(fromZip, weight) → 5 metro cards (NYC, LA, Chicago, Houston, Phoenix)
- ShippingPanel.tsx: unified client component (replaces ShippingCalculator + ShippingLabelPanel). Pre-sale mode: package details (AI-suggested), carrier comparison table, metro estimates. Post-sale mode: 4-step wizard (confirm package → buyer address → choose carrier → label)
- SaleCongratsBar.tsx: green gradient banner when item.status === SOLD, with Ship Now or Mark Completed CTA
- TrackingTimeline.tsx: 5-step visual timeline (Label Created → Picked Up → In Transit → Out for Delivery → Delivered), pulse animation on current step, "Demo: Next Step" button
- /api/shipping/label: now persists ShipmentLabel to DB, auto-sets item to SHIPPED, creates EventLog + Notification
- /api/shipping/tracking/[labelId]: GET returns status, POST simulates status transition (validates order), auto-marks COMPLETED on delivery, creates Notification
- /api/notifications: GET (list 50 newest), PATCH (mark read by ids or "all")
- Item page: pricing breakdown (item price / est shipping / buyer total / your net after 10%), shipping cost from estimateShippingCost()
- Edit form: shipping fields section (weight/L/W/H/fragile/preference)
- Update API: accepts shippingWeight/Length/Width/Height/isFragile/shippingPreference
- AppNav: bell icon is now dropdown (fetches /api/notifications), shows 10 recent, mark all read button
- Layout: notification count included in alertCount (alongside reconAlerts)
- Demo seed: ShipmentLabel for Royal Typewriter (USPS Priority, IN_TRANSIT, 3 status history entries), 5 Notifications (2 read, 3 unread), typewriter auto-set to SHIPPED
- Deprecated: ShippingCalculator.tsx, ShippingLabelPanel.tsx (no longer imported)
- TODO comments added for returns flow in 5 files (item page, status API, schema, shippo adapter, ItemCard)
- Build: tsc --noEmit = 0 errors. npm run build = 86 routes clean.

## Bot system fixes (2026-03-02 session 11)
- ReconBot PATCH endpoint added: /api/recon/scan/[botId] now supports PATCH for pause/resume
- ReconBotPanel: pause button now calls PATCH correctly, also shows "Resume" when paused
- BuyerLead outreach status validated: PENDING/CONTACTED/REPLIED/INTERESTED/NOT_INTERESTED/CLOSED
- Recon-bot confidence score: replaced Math.random() with deterministic formula
- BOT_MODE env var: lib/bot-mode.ts — "demo" (default) or "live", imported by bots/activate and recon-bot service
- BotDashboardClient: theme-compatible CSS vars, added recent activity feed section
- All bot panels (ReconBotPanel, BotDashboardClient): hardcoded colors replaced with CSS variables
- Dashboard: loading skeleton now matches real layout (5 stats, alerts, messages, items, activity)
- Item page: loading skeleton now shows all sections (gallery, AI, antique, messages, bots, activity)
- ActivityLog: empty state message instead of returning null, theme-compatible colors
- PhotoGallery: caption display added, theme-compatible colors for empty state and buttons
- Shared safeJson utility: lib/utils/json.ts — replaced 12 duplicate definitions across 12 files
- Build: tsc --noEmit = 0 errors. npm run build = 82 routes clean.

## AI & Pricing Engine overhaul (2026-03-02 session 12)
- AiAnalysis interface expanded: maker, material, era, style, condition_score (1-10), condition_cosmetic, condition_functional, condition_details, markings, dimensions_estimate, completeness
- lib/adapters/ai.ts: comprehensive ANALYSIS_SCHEMA with per-field descriptions, detailed identification instruction (BAD vs GOOD examples), separate cosmetic/functional condition scoring, up to 6 photos cross-referenced
- lib/pricing/market-data.ts: NEW location-based pricing engine — zip prefix → market multiplier. HIGH_DEMAND_ZIPS (NYC 1.35, SF 1.35, Boston 1.30, etc.), LOW_DEMAND_ZIPS (rural ME/WV/MS/AR 0.70-0.90), SPECIALTY_ZIPS (college towns, retirement). getMarketInfo(), getLocationPrices(), estimateShippingCost(), getBestMarket()
- lib/adapters/pricing.ts: integrated market-data.ts — all 4 pricing cases now use getLocationPrices() instead of hardcoded 0.82/0.88 local multipliers. PricingEstimate has bestMarketLow/High/Label/Shipping/NetLow/NetHigh + marketInfo fields
- analyze route: stores bestMarket + marketInfo as JSON in Valuation.onlineRationale (no migration needed). Stores antique markers + score as JSON in AntiqueCheck.reason
- Item page: AI section shows material/era/style/markings chips, condition breakdown (overall/cosmetic/functional scores), theme-compatible CSS vars. Pricing section shows 3-column layout (Local + National + Best Market), market tier banner
- Upload form: added ageEstimate/functionality/packaging dropdowns — appended to description as context hints for AI analysis
- lib/antique-detect.ts: expanded to use new AI fields (maker, material, era, style, markings, condition_details), returns markers[] array and score, wider auction estimates (brand/material/age multipliers)
- AntiqueAlert component: displays markers as chips, parses JSON reason for structured display
- multi-ai.ts: updated parseLooseJson() and consensus builder to include all new AiAnalysis fields
- Security fixes: secure cookie flag (process.env.NODE_ENV === "production"), file upload validation (MIME type, size 15MB limit, extension whitelist), robots.txt created
- Legal pages: /privacy (Privacy Policy), /terms (Terms of Service), Footer links updated from # to real routes
- Build: tsc --noEmit = 0 errors. npm run build = 84 routes clean.

## Detailed session notes → separate files
- wave2-changes.md — Wave 1 fixes + Wave 2 feature gaps (2026-03-03)

## Wave 2 Summary (2026-03-03)
- Pricing page: WG pre-launch pricing ($1,750/$3,500/$7,000 with strikethrough), Neighborhood Bundle ($239 base), 30+ CSS var fixes
- /quote: 7-step estate intake quiz (QuoteClient.tsx → ServiceQuote model)
- /bots: redesigned with 4 large bot cards, toggle switches, learn more expandable
- Dashboard: DashboardClient.tsx — clickable stat filters + EventLog activity timeline
- Messages: search bar (debounced 300ms), filter pills (All/Unread/Bot Flagged/By Item), item thumbnails
- Item page: dual "Local Pickup Price" / "Ship Nationwide Price" blocks with commission breakdowns + best market
- Pre-launch banners on dashboard, signup, item page (FREE tier)
- /marketplace: add-on store with 12 services, credit balance, category filters, purchase flow
- AppNav: credit balance pill (💎 85), Add-On Store in dropdown
- Item page: contextual MegaBot suggestion link (5 credits) when not yet analyzed
- Build: tsc = 0 errors, npm run build = 93 routes, 0 errors

## Wave 3 Summary (2026-03-03)
- Migration: 20260303162325_wave3_testimonials_heroes (Testimonial, HeroVerification, User.heroVerified/heroCategory)
- Help Center: /help with 8 categories, 9 articles, search, /help/[slug] article pages, real contact info (512) 758-0518
- Testimonials: TestimonialGrid client component, /testimonials page, /api/testimonials GET/POST, ReviewPrompt on COMPLETED items, 6 demo testimonials in seed
- Hero Verification: /heroes/apply 3-step wizard, /api/heroes/apply + /api/heroes/review/[id], admin review panel, shield badge in nav
- Large Item Shipping: freight-estimates.ts (XPO/OD/R+L), LocalPickupPanel.tsx, suggestShippingMethod() in package-suggestions
- Vehicle Module: VehicleSpecsCard, vehicle fields in AI schema, vehicle-aware bots (100mi, auto platforms), F-150 demo item
- Demo data: items staggered over 2-3 weeks, messages hours apart, 3 new buyer conversations added
- Style: admin page ~20 colors → CSS vars, heroes page CSS vars verified
- Detailed notes → wave3-changes.md
- Build: tsc = 0 errors, npm run build = 99 routes, 0 errors

## Antique detection scoring
- ANTIQUE_KEYWORDS (vintage, sterling, mahogany, patina, etc.)
- COLLECTIBLE_BRANDS (Tiffany, Rolex, Wedgwood, etc.)
- HIGH_VALUE_MATERIALS (sterling silver, 18k gold, crystal, etc.)
- Decade regex (1800s-1950s) + bonus for markings (>5 chars)
- Score >= 3 triggers antique flag
- Returns markers[] (Brand, Material, Era, Style, Markings + keywords) and numeric score
