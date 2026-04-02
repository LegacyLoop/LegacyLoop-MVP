# LegacyLoop Final Production Hardening, QA & Go-Live Readiness Audit

**Date:** April 2, 2026
**Build Status:** tsc --noEmit = 0 errors | npm run build = 172 routes, 0 errors
**Auditors:** 6 parallel deep-dive agents covering auth/billing, AI bots, commerce/shipping, navigation/mobile/a11y, security/deployment, dashboards/panels

---

## A. EXECUTIVE SUMMARY

### Overall State
LegacyLoop is a **feature-rich, architecturally sound** platform with 172 routes, 30+ Prisma models, 11 AI bot systems, and a complete commerce stack. The codebase compiles cleanly and the core flows (auth, item creation, AI analysis, pricing, shipping, messaging) are functional. The UI is modern with full light/dark/auto theme support.

### Current Launch Readiness Level
**DEMO-READY with caveats.** The app can be shown to investors with guided navigation. It is NOT yet beta-ready for unsupervised public use.

### Biggest Strengths
1. **AI Bot Ecosystem** — 11 specialized bots with MegaBot 4-provider consensus (OpenAI + Claude + Gemini + Grok), production-quality analysis pipeline
2. **Tier Enforcement** — Rock-solid entitlement system with bot access matrix, credit gating, and demo-mode bypass
3. **Commerce Pipeline** — Complete item lifecycle (DRAFT→COMPLETED), offer/counter/accept flows, 3-carrier shipping
4. **Consent System** — GDPR-compliant opt-in with 4 independent toggles, revocable, transparent
5. **Theme System** — Full light/dark/auto with 40+ CSS variables, no flash on load
6. **Build Health** — Zero TypeScript errors, zero build errors across 172 routes

### Biggest Risks
1. **No rate limiting on billing endpoints** — upgrade/cancel/credit purchase routes lack rate protection
2. **SQLite in production** — Single-file database cannot handle concurrent writes, no backup/restore plan
3. **Hardcoded pricing in upgrade route** — STARTER tier shows $19 instead of canonical $20
4. **No downgrade endpoint** — Users who try to downgrade get 404
5. **Offer expiry not enforced** — Sellers can accept expired offers, no cron to mark expired
6. **Return/buyback system not implemented** — Schema TODO only, no models/routes/UI
7. **600+ hardcoded colors in AppNav** — Maintenance risk, dark mode fragility

### What Must Be Done Before Investor Demo
1. Fix hardcoded pricing in upgrade route (5 min)
2. Test all critical flows end-to-end with demo data (1 hour)
3. Ensure demo seed creates realistic data across all bots (verify)
4. Hide/disable features that 404 or show empty (e.g., downgrade, returns)

### What Must Be Done Before Beta
1. Replace SQLite with PostgreSQL (Supabase/Neon)
2. Add rate limiting to billing/payment endpoints
3. Implement offer expiry cron job
4. Create downgrade endpoint or disable downgrade UI
5. Add error boundaries per page
6. Fix all hardcoded colors in AppNav

### What Is Safe to Defer
- Return/buyback system (post-launch)
- Contractor geo-search (Phase 2)
- Employee ops console (Phase 2/3)
- POS sync API (post-launch)
- Full AI support workforce (post-launch)
- Sell All bulk flow (post-launch)
- Trade comparison UI (post-launch)

### What Is Blocked Externally
- Square production activation → LLC + EIN filing required
- eBay live comps → API keys not configured (AI fallback works)

---

## B. STATUS MODEL

### COMPLETE (Implemented & Validated)
- P0 Items 4.1-4.6 (bots, gating, billing, credits, legal, stats)
- P1 Items 4.7-4.20 (AI pipeline, commerce, shipping, cameras, nav, theme, vehicle privacy)
- P2 Item 4.24 (Budget guardrails)
- P2 Item 4.25 (Founder-member tracking integrity)
- P2 Item 4.26 (Consent-based data sharing + buyer intent scanner)
- Auth system (JWT, login, signup, password reset, remember me)
- Tier enforcement (4 tiers, bot access matrix, credit gating)
- Credit system (balance, transactions, purchase packs, bonus awards)
- Theme system (light/dark/auto, 40+ CSS vars, no flash)
- AI Analyze Bot (OpenAI Vision, 146-field schema, antique/collectible detection)
- Price Bot (eBay comps + AI blend + Amazon anchor + location pricing)
- MegaBot (4-provider consensus, 10-strategy JSON extraction)
- Recon Bot (mock with real Amazon data injection)
- Collectibles Bot (12 category patterns, 8-point threshold)
- Shipping system (Shippo + FedEx + EasyPost, LTL freight, tracking)
- Offer system (create, counter, accept, decline, magic links)
- Consent system (4 independent toggles, revocable, credit incentive)
- Privacy/Terms pages (updated with consent + buyer intent disclosures)
- Global navigation (AppNav with dropdowns, notifications, credits)
- Founding member tracking (real DB counts, urgency tiers)

### VERIFY (Built, Needs Regression Testing)
- Camera upload across all 5 entry points
- PhotoBot upgrade (minimal implementation)
- Help Center content completeness
- Minimized cockpit/tool display states
- Phase 3 data sync validation
- Demo seed data coverage for all bots

### ACTIVE THIS ROUND (Identified in This Audit)
- Hardcoded pricing fix in upgrade route
- Rate limiting on billing endpoints
- Downgrade endpoint creation or UI removal
- Offer expiry enforcement
- AppNav hardcoded color extraction
- Footer mobile breakpoint fix
- ARIA role improvements for dropdowns

### BLOCKED
- Square production activation (LLC/EIN not filed)
- eBay live comps (API keys = placeholder)

### DEFERRED (Intentionally Later Phase)
- Admin Dashboard MVP (Phase 2/3)
- Employee Backend Roadmap (Phase 2/3)
- Internal App Home (Phase 2/3)
- Contractor geo-search (Phase 2)
- Finder Item Bot (new roadmap)
- POS sync API (post-launch)
- Full AI support workforce (post-launch)
- Expanded employee apps (post-launch)

### POST-LAUNCH
- Return/buyback system
- Sell All bulk flow
- Trade comparison UI
- Sale dashboard analytics
- Monthly credit deposit cron
- Offer notification emails
- JSON-LD structured data
- Full WCAG AAA compliance

---

## C. FULL AUDIT BY SYSTEM

### 1. Amazon Enrichment
- **Desktop Topic:** Amazon Enrichment Fix
- **Current State:** COMPLETE — `lib/amazon-eligibility.ts` with Rainforest API integration, gate in analyze route
- **FLAG:** None
- **Upgrade Opportunity:** Cache Amazon results longer (currently per-analysis)
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 2. Camera / Upload System
- **Desktop Topic:** Camera Upload Fix
- **Current State:** VERIFY — 5 upload entry points (UploadModal, PhotoGallery, DocumentVault, ItemToolPanels, HeroApply), client-side compression, drag reorder
- **FLAG:** Needs regression verification across all 5 entry points on mobile devices
- **Upgrade Opportunity:** Add upload progress indicator per file
- **Severity:** Medium
- **Recommended Timing:** This Round (verification only)

### 3. Message Center Sync + Notifications
- **Desktop Topic:** Message Center Sync + Notifications
- **Current State:** COMPLETE — Conversation + Message models, real-time notification bell, mark-read API
- **FLAG:** Notification count limited to 50 entries, no pagination
- **Upgrade Opportunity:** WebSocket for real-time message updates
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 4. Message Center UI Upgrade
- **Desktop Topic:** Message Center UI Upgrade
- **Current State:** COMPLETE — 2-column inbox+thread, quick replies, bot scoring, platform extraction
- **FLAG:** None
- **Upgrade Opportunity:** Unread count badge on conversation list items
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 5. Onboarding Quiz Audit
- **Desktop Topic:** Onboarding Quiz Audit
- **Current State:** COMPLETE — 6-question interactive quiz, CSS transitions, personalized tier recommendation
- **FLAG:** Uses hardcoded #0f766e in results CTA (fixed to #00838f this session)
- **Upgrade Opportunity:** Add quiz analytics tracking
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 6. Collectibles Bot Restore
- **Desktop Topic:** Collectibles Bot Restore
- **Current State:** COMPLETE — 12 category patterns, authenticity scoring (Bronze/Silver/Gold), demand tiers
- **FLAG:** None
- **Upgrade Opportunity:** Add PSA/BGS/CGC grading service integration
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 7. Price Bot Fee Split Fix
- **Desktop Topic:** Price Bot Fee Split Fix
- **Current State:** COMPLETE — 3.5% processing fee to buyer, tier-based commission to seller
- **FLAG:** Pro-rate calculation hardcodes 30-day cycle instead of actual billing period
- **Upgrade Opportunity:** Dynamic fee calculation from billing period dates
- **Severity:** Medium
- **Files:** `lib/billing/pro-rate.ts` (line 16)
- **Recommended Timing:** This Round

### 8. Edit Item Flow Upgrade
- **Desktop Topic:** Edit Item Flow Upgrade
- **Current State:** COMPLETE — JSON body parsing, shipping fields, all item fields editable
- **FLAG:** None
- **Upgrade Opportunity:** Inline editing on item page (click-to-edit title/price)
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 9. Edit Sale Function
- **Desktop Topic:** Edit Sale Function
- **Current State:** PARTIAL — Projects can be edited but no dedicated sale-edit UI
- **FLAG:** No sale end-date enforcement (Project.endDate nullable, never checked)
- **Upgrade Opportunity:** Sale management dashboard with end-date countdown
- **Severity:** Medium
- **Recommended Timing:** Later Phase

### 10. Sell All Flow
- **Desktop Topic:** Sell All Flow
- **Current State:** NOT IMPLEMENTED — No bulk-list, bulk-price, or bulk-sale UI
- **FLAG:** Missing feature but not a demo blocker (individual item sales work)
- **Upgrade Opportunity:** Bulk operations modal for project items
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 11. Sales Dashboard Item Assignment
- **Desktop Topic:** Sales Dashboard Item Assignment
- **Current State:** PARTIAL — Items can be assigned to projects but no drag-drop or visual assignment
- **FLAG:** None
- **Upgrade Opportunity:** Drag-drop item assignment between projects
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 12. Item Control Center Upgrade
- **Desktop Topic:** Item Control Center Upgrade
- **Current State:** COMPLETE — 12 bot panels, engagement metrics, document vault, shipping readiness, cost breakdown, budget guard
- **FLAG:** 8 separate API calls on mount; if some fail silently, UI shows incomplete state
- **Upgrade Opportunity:** Batch API endpoint for all bot data in one call
- **Severity:** Medium
- **Recommended Timing:** Later Phase

### 13. Trade System Visibility
- **Desktop Topic:** Trade System Visibility
- **Current State:** PARTIAL — Trade proposal API exists, but no respond/accept/decline UI
- **FLAG:** No trade comparison calculator, no trade history dashboard
- **Upgrade Opportunity:** Full trade management UI
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 14. Offer + Haggling Flows
- **Desktop Topic:** Offer + Haggling Flows
- **Current State:** FUNCTIONAL with gaps
- **FLAG:** ⚠️ Offer expiry NOT enforced — sellers can accept expired offers, no cron job to mark expired
- **Upgrade Opportunity:** Cron job for expiry, buyer magic-link page, counter-offer UI
- **Severity:** High
- **Files:** `/api/offers/[offerId]/accept` needs expiresAt check, `lib/offers/cron.ts` needs implementation
- **Recommended Timing:** This Round
- **Demo Blocker:** No (offers work for demo)
- **Go-Live Blocker:** Yes

### 15. Return + Buyback Bridge
- **Desktop Topic:** Return + Buyback Bridge
- **Current State:** NOT IMPLEMENTED — Schema TODO comment only
- **FLAG:** No ReturnRequest model, no return statuses, no refund flow
- **Upgrade Opportunity:** Full returns system
- **Severity:** Medium (not needed for demo/beta, needed for production)
- **Recommended Timing:** Post-Launch

### 16. Price Bot Page Upgrade
- **Desktop Topic:** Price Bot Page Upgrade
- **Current State:** COMPLETE — PriceBotClient with accordion UI, CSS tokens
- **FLAG:** No @media queries detected — potential mobile gap
- **Upgrade Opportunity:** Mobile-specific layout for pricing panels
- **Severity:** Low
- **Recommended Timing:** Later Phase

### 17. Shipping Sync
- **Desktop Topic:** Shipping Sync
- **Current State:** COMPLETE — Shippo + FedEx + EasyPost + LTL, tracking normalization
- **FLAG:** Metro estimates function exists but never called from API (dead code in flow)
- **Upgrade Opportunity:** Surface metro estimates in shipping panel
- **Severity:** Low
- **Recommended Timing:** Later Phase

### 18. AI Analysis Bot Refinement
- **Desktop Topic:** AI Analysis Bot Refinement
- **Current State:** COMPLETE — 146-field schema, condition scoring, antique/collectible detection
- **FLAG:** None
- **Upgrade Opportunity:** Multi-photo cross-reference improvement (currently reads up to 6)
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 19. Bot Data Distribution Audit
- **Desktop Topic:** Bot Data Distribution Audit
- **Current State:** COMPLETE — Analyze→Price→Recon→Buyer fan-out verified, MegaBot consensus flows
- **FLAG:** None
- **Upgrade Opportunity:** Bot data dependency graph visualization in admin
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 20. Admin Dashboard MVP
- **Desktop Topic:** Admin Dashboard MVP
- **Current State:** DEFERRED — Basic admin page exists with real DB stats, ADMIN_EMAILS gating
- **FLAG:** Mock business metrics (MRR, ARR) are hardcoded, not computed
- **Upgrade Opportunity:** Real revenue analytics from PaymentLedger
- **Severity:** Low
- **Recommended Timing:** Phase 2/3

### 21. Item Intelligence Summary Box
- **Desktop Topic:** Item Intelligence Summary Box
- **Current State:** COMPLETE — CollapsedSummary HUD with compact tokens per bot panel
- **FLAG:** None
- **Upgrade Opportunity:** Unified "AI Confidence" score combining all bots
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 22. MegaBot Page Upgrade
- **Desktop Topic:** MegaBot Page Upgrade
- **Current State:** COMPLETE — 4-provider consensus, 10-strategy JSON extraction, per-provider results
- **FLAG:** If ALL 4 agents fail, no graceful degradation defined (just empty results)
- **Upgrade Opportunity:** Fallback to single-provider mode on total failure
- **Severity:** Medium
- **Recommended Timing:** This Round

### 23. MegaBot Power Center Fix
- **Desktop Topic:** MegaBot Power Center Fix
- **Current State:** COMPLETE — Boost per-panel, scanning animation, provider status tracking
- **FLAG:** None
- **Upgrade Opportunity:** Show cost before running (e.g., "This will use 5 credits")
- **Severity:** Low
- **Recommended Timing:** Later Phase

### 24. Minimize Tool Summary Mode
- **Desktop Topic:** Minimize Tool Summary Mode
- **Current State:** VERIFY — Panel collapse state persisted to localStorage
- **FLAG:** If localStorage quota exceeded, panel layout resets without warning
- **Upgrade Opportunity:** Server-side persistence of panel preferences
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 25. PhotoBot Upgrade
- **Desktop Topic:** PhotoBot Upgrade
- **Current State:** VERIFY — Blueprint exists, minimal implementation
- **FLAG:** No image processing pipeline, no quality scoring, no before/after UI
- **Upgrade Opportunity:** Wire to Sharp or cloud vision for enhancement
- **Severity:** Low (not a demo blocker)
- **Recommended Timing:** Later Phase

### 26. Employee Backend Roadmap
- **Desktop Topic:** Employee Backend Roadmap
- **Current State:** DEFERRED
- **Recommended Timing:** Phase 2/3

### 27. Business Email Placement
- **Desktop Topic:** Business Email Placement
- **Current State:** COMPLETE — partnerships@legacy-loop.com in footer, help page, roadmap
- **FLAG:** None
- **Severity:** Low

### 28. Square Setup
- **Desktop Topic:** Square Setup
- **Current State:** BLOCKED — LLC + EIN not filed
- **FLAG:** Square sandbox configured, webhook route exists, payment ledger ready
- **Dependency:** External (legal filing)

### 29. Help Center Upgrade
- **Desktop Topic:** Help Center Upgrade
- **Current State:** VERIFY — /help page exists with articles, /help/[slug] dynamic
- **FLAG:** Content completeness needs review
- **Recommended Timing:** This Round (verification only)

### 30. Internal App Home
- **Desktop Topic:** Internal App Home
- **Current State:** DEFERRED
- **Recommended Timing:** Phase 2/3

### 31. Donation Page
- **Desktop Topic:** Donation Page
- **Current State:** EXISTS — /donate page present
- **FLAG:** None
- **Severity:** Low

### 32. Auto Theme Mode
- **Desktop Topic:** Auto Theme Mode
- **Current State:** COMPLETE — ThemeProvider with light/dark/auto, inline script prevents flash
- **FLAG:** None
- **Severity:** Low

### 33. Item Analytics
- **Desktop Topic:** Item Analytics
- **Current State:** COMPLETE — /analytics with time-frame filtering, real DB queries, bot usage, revenue
- **FLAG:** SPECIALIST_BOT_TYPES hardcoded list — new bots require manual update
- **Upgrade Opportunity:** Pagination (currently limited to 50 event logs)
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 34. AI Video Feature Scope
- **Desktop Topic:** AI Video Feature Scope
- **Current State:** COMPLETE — VideoBot with ElevenLabs integration, 5 voices, photo-synced narration
- **FLAG:** None
- **Severity:** Low

### 35. Global Standards Refresh
- **Desktop Topic:** Global Standards Refresh
- **Current State:** COMPLETE — CSS tokens, theme system, consistent card styling
- **FLAG:** AppNav has 600+ lines with 100+ hardcoded color values
- **Upgrade Opportunity:** Extract all colors to CSS variables
- **Severity:** High (maintenance risk)
- **Recommended Timing:** This Round

### 36. Demo Mode Prep
- **Desktop Topic:** Demo Mode Prep
- **Current State:** PARTIAL — Demo seed creates items, projects, conversations, credits, bots
- **FLAG:** Verify demo seed covers ALL bot types for investor walkthrough
- **Recommended Timing:** This Round (final stage task)

### 37. Bot and Scrape Diagnostic Audit
- **Desktop Topic:** Bot and Scrape Diagnostic Audit
- **Current State:** COMPLETE (P0 item 4.1)
- **Severity:** Low

### 38. Subscription Gating Audit
- **Desktop Topic:** Subscription Gating Audit
- **Current State:** COMPLETE (P0 item 4.2)
- **FLAG:** ⚠️ No rate limiting on upgrade/cancel endpoints
- **Severity:** High (security)
- **Recommended Timing:** This Round

### 39. Annual Billing Audit
- **Desktop Topic:** Annual Billing Audit
- **Current State:** COMPLETE (P0 item 4.3) — Annual = 10x monthly
- **FLAG:** Pro-rate uses hardcoded 30-day cycle
- **Severity:** Medium

### 40. Credit Wallet Upgrade
- **Desktop Topic:** Credit Wallet Upgrade
- **Current State:** COMPLETE (P0 item 4.4) — Balance, transactions, purchase, bonus
- **FLAG:** ⚠️ No monthly credit deposit mechanism (no cron), credit purchase route doesn't call Square
- **Severity:** Medium
- **Recommended Timing:** This Round (for beta)

### 41. Contractor Search by ZIP / Radius
- **Desktop Topic:** Contractor Search Audit
- **Current State:** DEFERRED (Phase 2)

### 42. Light/Dark Theme Parity Audit
- **Desktop Topic:** Theme Parity Audit
- **Current State:** COMPLETE — 40+ CSS vars, dark mode overrides for Tailwind utilities
- **FLAG:** 100+ hardcoded rgba(255,255,255,*) in AppNav
- **Severity:** High
- **Recommended Timing:** This Round

### 43. Footer / Utility Link Audit
- **Desktop Topic:** Footer and Link Audit
- **Current State:** COMPLETE — 4 trust badges, 4 stat cards, 4-column links
- **FLAG:** ⚠️ Footer 4-column grid has NO mobile breakpoint (will overflow on tablet)
- **FLAG:** "Phone support coming soon" is dead link (href="#")
- **FLAG:** Footer stats are hardcoded ("15 Bots") — not from DB
- **Severity:** Medium
- **Recommended Timing:** This Round

### 44. Document Vault Integration Audit
- **Desktop Topic:** Document Vault Audit
- **Current State:** COMPLETE (P1 item 4.10) — OpenAI SDK, timeouts, re-analyze, credits, polling
- **FLAG:** None
- **Severity:** Low

### 45. Mobile Conversion Audit
- **Desktop Topic:** Mobile Conversion Audit
- **Current State:** PARTIAL — Viewport config, responsive stat grids, upload grid responsive
- **FLAG:** ⚠️ No specific handling for 320-480px small phones
- **FLAG:** ⚠️ Avatar in nav is 28px (below 44px touch target minimum)
- **FLAG:** ⚠️ maximumScale: 5 may be too restrictive for accessibility
- **Severity:** Medium
- **Recommended Timing:** This Round

### 46. Department Sale Grouping / Bundle Sales
- **Desktop Topic:** Department Sale Grouping
- **Current State:** COMPLETE (P1 item 4.12) — 7 files, department bundling, sale integration
- **FLAG:** None
- **Severity:** Low

### 47. Storefront Audit
- **Desktop Topic:** Storefront Audit
- **Current State:** COMPLETE (P1 item 4.13) — Theme overhaul, category grouping, sort/filter, responsive
- **FLAG:** None
- **Severity:** Low

### 48. Analyze Bot Multi-Pass AI Orchestration Review
- **Desktop Topic:** Multi-Pass AI Audit
- **Current State:** COMPLETE (P1 item 4.8)
- **FLAG:** None
- **Severity:** Low

### 49. Shippo / EasyPost / LTL / Pickup / GPS Audit
- **Desktop Topic:** Shipping API Audit
- **Current State:** COMPLETE (P1 item 4.15) — 12 lib modules, 14 API routes, 4 UI components
- **FLAG:** FedEx debug logs removed (completed this session)
- **Severity:** Low

### 50. Global Camera Source Audit
- **Desktop Topic:** Camera Source Audit
- **Current State:** COMPLETE (P1 item 4.16) — 5 upload entry points, 3 API routes, responsive grid
- **FLAG:** Needs regression verification on physical devices
- **Severity:** Medium
- **Recommended Timing:** This Round (verification)

### 51. Vehicle Classification + License Plate Blur Logic
- **Desktop Topic:** Vehicle Privacy Audit
- **Current State:** COMPLETE (P1 item 4.20) — GPT-4o-mini detection, Gaussian blur, auto-fires
- **FLAG:** None
- **Severity:** Low

### 52. POS / Store Sync API Roadmap
- **Desktop Topic:** POS Sync Roadmap
- **Current State:** DEFERRED — Catalog mapper, sync API planned, Coming Soon page updated
- **Recommended Timing:** Post-Launch

### 53. Finder Item Bot Roadmap
- **Desktop Topic:** Finder Item Bot
- **Current State:** DEFERRED
- **Recommended Timing:** Post-Launch

### 54. Meta Policy / Security / Legal Embedding Audit
- **Desktop Topic:** Legal / Policy Audit
- **Current State:** COMPLETE — Privacy policy with §3a (data sharing) + §3b (buyer intent), Terms updated
- **FLAG:** None
- **Severity:** Low

### 55. Bot Cost / Spend / Profit Tracking
- **Desktop Topic:** Cost Tracking Audit
- **Current State:** COMPLETE (P1 item 4.11) — 4 new + 2 modified files, spending page, ROI calculations
- **FLAG:** None
- **Severity:** Low

### 56. User Budget / Timebox / Spend-Guardrail System
- **Desktop Topic:** Budget Guardrail Audit
- **Current State:** COMPLETE (P2 item 4.24) — SVG gauge, progress bars, auto-stop, alerts, exit paths
- **FLAG:** Credit cost rate hardcoded as 0.71 in budget API (should reference constant)
- **Severity:** Low
- **Recommended Timing:** Later Phase

### 57. Consent-Based Data Sharing / Voice-Signal Framework
- **Desktop Topic:** Consent + Signal Compliance Review
- **Current State:** COMPLETE (P2 item 4.26) — Full compliance overhaul, 4 toggles, DB persistence, revocable
- **FLAG:** None
- **Severity:** Low

### 58. Founding Member Tracking Integrity
- **Desktop Topic:** Founder Tracking Audit
- **Current State:** COMPLETE (P2 item 4.25) — Real DB queries, urgency tiers, all 4 locations fixed
- **FLAG:** None
- **Severity:** Low

### 59. Demo Stats Reset / Live Data Reset Plan
- **Desktop Topic:** Live Data Reset Plan
- **Current State:** PARTIAL — Demo seed is idempotent, but no "reset to clean" function
- **FLAG:** No way to wipe demo data without manual DB reset
- **Upgrade Opportunity:** "Reset Demo Data" admin button
- **Severity:** Medium
- **Recommended Timing:** This Round (for beta transition)

### 60. Go-Live Deployment Readiness
- **Desktop Topic:** Go-Live Readiness
- **Current State:** PARTIAL — Build passes, env vars documented, but SQLite not production-safe
- **FLAG:** ⚠️ SQLite cannot handle concurrent writes in production
- **Severity:** Critical (for beta)
- **Recommended Timing:** Before Beta

### 61. Staging Deployment Readiness
- **Desktop Topic:** Staging Readiness
- **Current State:** NOT CONFIGURED — No Vercel staging environment, no preview deployments
- **FLAG:** Need staging environment before production
- **Severity:** High
- **Recommended Timing:** This Round

### 62. Post-Deploy Smoke Test Readiness
- **Desktop Topic:** Smoke Test Plan
- **Current State:** NOT DOCUMENTED — No formal smoke test checklist
- **Upgrade Opportunity:** Automated smoke test script
- **Severity:** Medium
- **Recommended Timing:** This Round

### 63. Production Hardening / Observability / Rollback
- **Desktop Topic:** Production Hardening Audit
- **Current State:** PARTIAL — Error boundaries exist but generic, no structured logging, no APM
- **FLAG:** No rollback plan documented, no database backup strategy
- **Severity:** High
- **Recommended Timing:** Before Beta

### 64. Coming Soon / Placeholder Surface Audit
- **Desktop Topic:** Coming Soon Audit
- **Current State:** COMPLETE — Full roadmap page with 18+ marketplace connectors, 3 phases
- **FLAG:** No "Notify me when this launches" email capture on individual features
- **Upgrade Opportunity:** Email capture form on Coming Soon items
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 65. Lead Capture Opportunity Audit
- **Desktop Topic:** Lead Capture Audit
- **Current State:** PARTIAL — CTA buttons exist, but no email capture forms on feature pages
- **Upgrade Opportunity:** "Get notified" modal on roadmap features, analytics on page views
- **Severity:** Low
- **Recommended Timing:** Post-Launch

### 66. Big-Tech Polish / Investor-Perception Audit
- **Desktop Topic:** Investor Polish Audit
- **Current State:** STRONG — Premium UI, glass morphism, animations, trust badges, comprehensive features
- **FLAG:** Footer stats hardcoded, AppNav colors hardcoded, some pages lack loading skeletons
- **Upgrade Opportunity:** Loading skeletons on all dynamic pages, animated transitions between routes
- **Severity:** Medium
- **Recommended Timing:** This Round

---

## D. FINAL TRIAGE TABLE

| Priority | Item | Status | Severity | Owner | Dependency | Demo Blocker | Go-Live Blocker | Defer |
|----------|------|--------|----------|-------|------------|--------------|-----------------|-------|
| P0 | Hardcoded $19 in upgrade route | FLAG | Critical | Backend | None | No | Yes | No |
| P0 | Rate limiting on billing endpoints | FLAG | Critical | Backend | None | No | Yes | No |
| P0 | SQLite → PostgreSQL migration | FLAG | Critical | DevOps | None | No | Yes (beta) | No |
| P0 | Downgrade endpoint (create or hide UI) | FLAG | High | Backend | None | No | Yes | No |
| P1 | Offer expiry enforcement (cron) | FLAG | High | Backend | None | No | Yes | No |
| P1 | AppNav hardcoded colors → CSS vars | FLAG | High | Frontend | None | No | No | No |
| P1 | Footer mobile breakpoint | FLAG | Medium | Frontend | None | No | No | No |
| P1 | Footer dead "phone support" link | FLAG | Medium | Frontend | None | No | No | No |
| P1 | Pro-rate 30-day hardcode fix | FLAG | Medium | Backend | None | No | Yes | No |
| P1 | ARIA roles for nav dropdowns | FLAG | Medium | Frontend | None | No | No | No |
| P1 | Avatar touch target (28px → 44px) | FLAG | Medium | Frontend | None | No | No | No |
| P1 | MegaBot total-failure fallback | FLAG | Medium | Backend | None | No | No | No |
| P2 | Demo seed verification (all bots) | VERIFY | Medium | QA | None | Yes | No | No |
| P2 | Camera upload regression test | VERIFY | Medium | QA | Device | No | No | No |
| P2 | Help Center content review | VERIFY | Low | Product | None | No | No | No |
| P2 | Loading skeletons on all pages | UPGRADE | Medium | Frontend | None | No | No | No |
| P2 | Credit purchase → Square integration | FLAG | Medium | Backend | Square | No | Yes (prod) | Partial |
| P2 | Monthly credit deposit cron | FLAG | Medium | Backend | None | No | Yes (prod) | Partial |
| P2 | Staging environment setup | FLAG | High | DevOps | Vercel | No | Yes | No |
| P2 | Smoke test checklist | UPGRADE | Medium | QA | None | No | Yes | No |
| P3 | Footer stats from DB | UPGRADE | Low | Frontend | None | No | No | Yes |
| P3 | Coming Soon email capture | SUGGESTION | Low | Product | None | No | No | Yes |
| P3 | Return/buyback system | DEFERRED | Medium | Full Stack | None | No | No | Yes |
| P3 | Sell All bulk flow | DEFERRED | Low | Full Stack | None | No | No | Yes |
| P3 | Trade UI completion | DEFERRED | Low | Frontend | None | No | No | Yes |
| P3 | JSON-LD structured data | SUGGESTION | Low | Frontend | None | No | No | Yes |
| BLOCKED | Square production | BLOCKED | Critical | External | LLC/EIN | No | Yes (prod) | N/A |

---

## E. FINAL GO-LIVE PLAN

### Pre-Staging Checklist
- [ ] Fix hardcoded $19 → $20 in `/api/subscription/upgrade/route.ts`
- [ ] Add rate limiting to `/api/billing/upgrade`, `/api/subscription/cancel`, `/api/credits/purchase`
- [ ] Create downgrade endpoint OR remove downgrade UI
- [ ] Add `expiresAt` check to offer accept route
- [ ] Fix pro-rate 30-day hardcode → actual billing period
- [ ] Extract AppNav hardcoded colors to CSS variables
- [ ] Fix footer 4-column grid mobile breakpoint
- [ ] Remove dead "phone support" link from footer
- [ ] Fix avatar touch target to 44px minimum
- [ ] Add ARIA `role="menu"` and keyboard navigation to nav dropdowns

### Staging Checklist
- [ ] Set up Vercel staging environment (preview branch)
- [ ] Configure staging environment variables
- [ ] Deploy to staging and verify all 172 routes load
- [ ] Test auth flow (signup → login → logout → password reset)
- [ ] Test item creation flow (upload photos → save → analyze)
- [ ] Test offer flow (submit → counter → accept)
- [ ] Test shipping flow (get rates → create label)
- [ ] Test mobile layout on iPhone and Android
- [ ] Test dark mode across all major pages
- [ ] Run demo seed and verify all bot data populates

### Production Hardening Checklist
- [ ] Migrate SQLite → PostgreSQL (Supabase or Neon)
- [ ] Configure database connection pooling
- [ ] Set up automated database backups (daily)
- [ ] Set JWT_SECRET to cryptographically random value
- [ ] Remove all console.log with sensitive data
- [ ] Configure CORS headers for production domain
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Configure rate limiting middleware (global + per-endpoint)
- [ ] Test graceful degradation when OpenAI API is down
- [ ] Document rollback procedure

### Mobile Readiness Checklist
- [ ] Test on iPhone SE (smallest common screen)
- [ ] Test on iPhone 15 Pro Max (largest common screen)
- [ ] Test on Android mid-range device
- [ ] Verify all touch targets ≥ 44px
- [ ] Verify camera upload works on iOS Safari
- [ ] Verify camera upload works on Android Chrome
- [ ] Verify horizontal scrolling doesn't occur on any page
- [ ] Verify forms are usable with mobile keyboard
- [ ] Verify dark mode renders correctly on OLED screens

### Billing / Payment Checklist
- [ ] Verify tier prices match between PLANS constant and upgrade route
- [ ] Verify annual pricing math (10x monthly, not 12x)
- [ ] Verify commission rates per tier (12%, 8%, 5%, 4%)
- [ ] Verify processing fee (3.5%) applied to buyer, not seller
- [ ] Verify credit purchase creates CreditTransaction record
- [ ] Verify hero discount applies correctly (25% off subscription)
- [ ] Verify founding member 50% discount applies
- [ ] Test upgrade from Free → each paid tier
- [ ] Verify cancellation refund calculation

### Legal / Policy Checklist
- [ ] Privacy Policy covers all data collection (verified this session)
- [ ] Terms of Service lists all features (verified this session)
- [ ] Consent system is opt-in, revocable, transparent (verified this session)
- [ ] No covert monitoring or surveillance claims
- [ ] Data deletion page exists and is linked
- [ ] Cookie policy is disclosed
- [ ] CCPA/GDPR consent flow is functional

### Security Checklist
- [ ] JWT_SECRET is NOT default "dev-secret-change-me" in production
- [ ] All API routes that modify data require authentication
- [ ] Admin routes check ADMIN_EMAILS list
- [ ] File uploads are size-limited (10MB per file)
- [ ] No API keys or secrets in client-side code
- [ ] .env is in .gitignore
- [ ] Webhook routes verify signatures
- [ ] Password hashing uses bcrypt with cost ≥ 12
- [ ] Rate limiting on auth endpoints (login, signup, forgot-password)

### Accessibility Checklist
- [ ] All interactive elements have focus-visible outline
- [ ] All buttons have aria-label or visible text
- [ ] All images have alt text
- [ ] All forms have labels
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Navigation is keyboard-accessible
- [ ] Error messages are announced to screen readers
- [ ] No content relies solely on color to convey meaning

### Investor Demo Checklist
- [ ] Demo seed creates realistic data across all features
- [ ] Dashboard shows meaningful stats (not all zeros)
- [ ] At least 1 item has full AI analysis + pricing + recon + buyers
- [ ] MegaBot consensus shows 4 providers agreeing
- [ ] Shipping panel shows carrier options
- [ ] Storefront has visually appealing items
- [ ] Founding member banner shows real spot count
- [ ] Budget guardrails show spending visualization
- [ ] Dark mode looks premium and polished
- [ ] Mobile view is clean and functional

### Beta Launch Checklist
- [ ] PostgreSQL database configured and migrated
- [ ] Production environment variables set
- [ ] Domain configured with SSL
- [ ] Database backup automation running
- [ ] Error monitoring active
- [ ] Rate limiting enabled
- [ ] Email service configured (Resend)
- [ ] Staging tested and approved
- [ ] Smoke tests pass
- [ ] Rollback procedure documented and tested

### Post-Deploy Smoke Test Checklist
- [ ] Homepage loads < 3 seconds
- [ ] Login with test account succeeds
- [ ] Dashboard loads with stats
- [ ] Create new item with photo upload
- [ ] Run AI analysis on new item
- [ ] View pricing estimates
- [ ] Send a message as buyer
- [ ] Check notifications bell updates
- [ ] Toggle dark mode
- [ ] View on mobile device
- [ ] Check SSL certificate is valid
- [ ] Verify no console errors in production

### Rollback / Recovery Checklist
- [ ] Database backup exists before deployment
- [ ] Previous working deployment tagged in git
- [ ] Vercel instant rollback configured
- [ ] Database migration rollback scripts prepared
- [ ] Communication plan for downtime notification
- [ ] Recovery time objective (RTO): < 15 minutes
- [ ] Recovery point objective (RPO): < 1 hour

---

## F. FINAL RECOMMENDATION

### Do Immediately (Before Next Demo)
1. Fix hardcoded $19 in upgrade route → $20 (5 min fix)
2. Add expiresAt check to offer accept endpoint (15 min)
3. Verify demo seed creates data for ALL bot panels (30 min test)
4. Run through full investor demo flow once end-to-end (1 hour)

### Do Next (Before Beta)
1. Migrate SQLite → PostgreSQL
2. Add rate limiting to all billing/payment endpoints
3. Create downgrade endpoint or remove UI
4. Set up Vercel staging environment
5. Extract AppNav hardcoded colors to CSS variables
6. Fix footer mobile breakpoint
7. Add ARIA roles to nav dropdowns
8. Create smoke test checklist and run it
9. Configure error monitoring (Sentry)
10. Set up automated database backups

### Defer (Post-Launch / Later Phase)
- Return/buyback system
- Sell All bulk operations
- Trade comparison UI
- Monthly credit deposit cron
- JSON-LD structured data
- Coming Soon email capture
- Sale dashboard analytics
- Full WCAG AAA compliance
- Admin Dashboard real revenue analytics
- PhotoBot enhancement pipeline

### Freeze Before Launch
- Do NOT add new features between now and demo
- Do NOT restructure navigation or page hierarchy
- Do NOT change pricing constants or tier definitions
- Do NOT modify the consent/privacy system
- Do NOT touch the AI analysis pipeline
- Focus exclusively on: bug fixes, polish, verification, deployment
