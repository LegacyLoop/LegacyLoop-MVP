# Wave 3 Changes (2026-03-03)

## Migration
- 20260303162325_wave3_testimonials_heroes — adds Testimonial, HeroVerification models; User gets heroVerified + heroCategory fields

## Help Center (Phase 1)
- lib/help-articles.ts: 9 articles across 8 categories, 5 with full 200-400 word content. Exports helpArticles, helpCategories, getArticleBySlug, getArticlesByCategory, searchArticles
- app/help/HelpClient.tsx: search bar + 8 category cards + article list with filtering
- app/help/[slug]/page.tsx: article page with breadcrumbs, HelpfulButtons, HelpContact
- app/help/HelpContact.tsx: real phone (512) 758-0518, email legacyloopmaine@gmail.com
- app/help/[slug]/HelpfulButtons.tsx: "Was this helpful?" Yes/No buttons
- HelpWidget.tsx: updated with real contact info

## Testimonials (Phase 2)
- app/components/TestimonialGrid.tsx: "use client" fetches from /api/testimonials, hardcoded fallback of 6 demo reviews
- app/testimonials/page.tsx: standalone testimonials page
- app/api/testimonials/route.ts: GET (approved, no auth) + POST (create, auth required)
- app/items/[id]/ReviewPrompt.tsx: star rating + textarea when item.status === COMPLETED
- PricingClient.tsx: added TestimonialGrid section
- Demo seed: 6 testimonials (Margaret T., Jason & Sarah K., Robert D., Linda M., David W., Carol & Jim P.)

## Hero Verification (Phase 3)
- app/heroes/apply/HeroApplyClient.tsx: 3-step wizard (Eligibility → Upload Proof → Confirmation)
- app/api/heroes/apply/route.ts: POST with FormData, saves proof to /public/uploads/hero-proofs/
- app/api/heroes/review/[id]/route.ts: PATCH admin approve/reject, sets User.heroVerified
- heroes/page.tsx: ~20 hardcoded colors → CSS vars, apply form replaced with Link to /heroes/apply
- admin/page.tsx: Heroes Verification module + pending applications list
- constants.ts: DISCOUNTS.heroes expanded with freeStorytelling, prioritySupport, heroBadge
- AppNav.tsx: hero shield badge next to username when heroVerified
- auth.ts: getSession now selects heroVerified
- layout.tsx: passes heroVerified to AppNav

## Large Item Shipping (Phase 4)
- lib/shipping/freight-estimates.ts: LTL freight calc — XPO, Old Dominion, R+L Carriers
- app/items/[id]/LocalPickupPanel.tsx: radius selector, date/time picker, instructions, shareable card
- lib/shipping/package-suggestions.ts: added suggestShippingMethod(), vehicle/boat/appliance categories
- ShippingPanel.tsx: freight section, local pickup section, shipping method recommendation banner
- Item page: calls suggestShippingMethod(), passes to ShippingPanel

## Vehicle Module (Phase 5)
- app/items/[id]/VehicleSpecsCard.tsx: Year/Make/Model, mileage, condition grid, LOCAL PICKUP ONLY banner
- lib/adapters/ai.ts: added vehicle_year/make/model/mileage/vin_visible to ANALYSIS_SCHEMA, "Vehicles" category
- lib/types.ts: vehicle fields added to AiAnalysis interface
- Item page: isVehicle detection, VehicleSpecsCard rendering
- app/api/bots/activate/[itemId]: vehicle-aware (100mi radius, vehicle platforms, 8 Maine vehicle leads)
- package-suggestions.ts: vehicle category mapping (3500 lbs, local_only)
- Demo seed: 11th item "2008 Ford F-150 XLT SuperCab 4x4" ($8,500-$12,500)

## Demo Data Quality (Phase 6)
- Item createdAt dates staggered over 2-3 weeks (daysAgo per item)
- EventLog timestamps relative to item creation (not "now")
- Conversation messages spread 1-4 hours apart (not 12 minutes)
- Added buyer messages: "Is this still available?" on HP laptop (Chris L.), guitar (Alex P.), painting (Nancy B.)
- Each conversation has daysAgo field for natural temporal spread

## Style Pass (Phase 7)
- admin/page.tsx: ~20 hardcoded colors → CSS vars (--text-primary, --text-secondary, --text-muted, --bg-secondary, --border-default)
- Heroes page: verified CSS vars, stats row has flex-wrap for mobile

## Build
- tsc --noEmit = 0 errors
- npm run build = 99 routes, 0 errors
- New routes: /help, /help/[slug], /testimonials, /heroes/apply
