# Wave 2: Core Feature Gaps & Improvements (2026-03-03)

## Wave 1 Fixes (Session 14, pre-Wave 2)
- AppNav: Logo switched from next/image <Image> to native <img> tags
- AppNav: Mobile menu bg changed to opaque #0a0a12, z-index 9999
- MegaBot API: generates per-provider price variations from consensus (providerVariance)
- AntiqueAlert: mailto replaced with in-app "Get Professional Appraisal — 15 credits" button
- ShippingPanel: fallback rate generator (4 carriers) when API returns empty
- SubscriptionClient: complete rewrite importing from constants.ts, CSS vars
- Item page: conditionLabel() mapping function (score → Like New/Excellent/Good/Fair/Poor)
- Profile page: complete rewrite with CSS variables for dark mode

## Wave 2 Changes (Session 14)

### Pricing Page (PricingClient.tsx)
- WG_TIERS now have preLaunchPrice (Essentials $1,750, Professional $3,500, Legacy $7,000)
- WG cards show pre-launch pricing with strikethrough regular prices + savings badge
- NEIGHBORHOOD_BUNDLE constant: $239 pre-launch ($399 regular), $89 additional family
- Neighborhood Bundle section added after WG tier cards
- ~30 hardcoded colors → CSS variables throughout (social proof, tabs, FAQ, comparison, calculator)

### /quote Estate Intake Quiz
- 7-step wizard (QuoteClient.tsx): property type, item count, categories (multi-select), high-value, timeline, location, contact
- Senior-friendly: large cards, progress bar, CSS transitions
- POST /api/quote stores in ServiceQuote model, auto-determines tier recommendation
- Confirmation screen with reference number + tier recommendation

### /bots Page Redesign
- BotDashboardClient.tsx rewritten: 4 large bot cards in 2-col grid
- Each card: 56x56 icon, name, subtitle, status indicator (green pulse), 3 stats, toggle switch
- "Learn More" expandable section with chevron rotation
- "View Results" button linking to relevant page
- All CSS variables, responsive (single col on mobile)

### Dashboard (page.tsx + DashboardClient.tsx)
- New DashboardClient.tsx: interactive stat card filters + activity feed
- 5 stat cards (All/Analyzed/Antiques/Listed/Sold) act as filter buttons
- Active card gets teal border glow, filters item grid below
- Activity feed: timeline with teal dots, event type badges, collapsible metadata
- Shows last 10 events with "Show more" button
- Server component fetches EventLog entries, passes to client

### Messages (MessagesClient.tsx)
- Search bar with debounced (300ms) filtering across buyer name/email, item title, messages
- Filter pills: All Messages, Unread (count badge), Bot Flagged (count badge), By Item (dropdown)
- 32x32 item photo thumbnails in conversation list
- Unread teal dot indicator, relative timestamps, bot score colored dots

### Local/National Pricing (Item Page)
- Replaced simple 3-col grid with two detailed price blocks
- "Local Pickup Price" (green header): price range, "Free — buyer picks up", commission breakdown, your net
- "Ship Nationwide Price" (teal header): price range, est shipping, commission, your net, best market suggestion
- Both cards have clear headers with icons and structured line-item breakdowns

### Pre-Launch Pricing Banners
- Dashboard: teal gradient banner with "FOUNDING MEMBER" badge, spots remaining, link to /pricing
- Signup page: subtle amber "FOUNDING MEMBER OFFER" strip
- Item page: compact upgrade nudge for FREE tier users

### Add-On Marketplace (/marketplace)
- MarketplaceClient.tsx: credit balance bar, 4 category filter pills, service cards grid
- 12 add-on services grouped: AI & Pricing, Marketing & Stories, Shipping, Support
- Each card: SVG icon, name, description, credit cost, purchase button
- Purchase deducts credits client-side, toast notifications
- Low balance CTA when credits < 10

### Credits in Nav (AppNav.tsx)
- Teal pill "💎 85" between New Item button and bell icon
- Links to /credits
- "Add-On Store" link added to Tools dropdown

### Contextual MegaBot Suggestion
- Item page AI section: "💎 Unlock MegaBot 3-AI Analysis — 5 credits" link
- Only shows when megabotUsed is false
- Scrolls to #megabot anchor

## Build: tsc = 0 errors, npm run build = 93 routes, 0 errors
