# Wave A: Square Infrastructure (2026-03-03)

## Payment Provider
- Switched from Stripe → Square for all payment processing
- Square SDK: `square` npm package (v41+, uses `SquareClient` + `SquareEnvironment`)
- Singleton client: `/lib/square.ts` — exports `squareClient`, `isConfigured`, `SQUARE_LOCATION_ID`
- Env vars: SQUARE_APPLICATION_ID, SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT=sandbox, PAYMENT_PROVIDER=square
- Graceful fallback: when `isConfigured === false`, console warns "demo payment mode"

## Processing Fee (CRITICAL BUSINESS RULE)
- Square charges 3.5% per transaction
- Fee is passed through to BUYER/PURCHASER as visible line item
- Seller does NOT have processing fee deducted — only their tier commission
- Seller math: saleAmount - commission = netEarnings
- Buyer math: item + shipping + 3.5% processingFee = total

## Pricing Architecture
- SINGLE SOURCE OF TRUTH: `/lib/constants/pricing.ts`
  - Exports: TIERS, WHITE_GLOVE, NEIGHBORHOOD_BUNDLE, CREDIT_PACKS, ADD_ONS, DISCOUNTS, API_TIERS, ESTATE_CONTRACTS, PROCESSING_FEE
  - Helpers: toSquareCents, calculateProcessingFee, calculateTotalWithFee, calculateCommission, calculateTierPrice, calculateWhiteGlovePrice
- BACKWARD COMPAT LAYER: `/lib/pricing/constants.ts`
  - Re-exports everything from constants/pricing.ts
  - Provides legacy names: DIGITAL_TIERS (uppercase keys), WHITE_GLOVE_TIERS, CREDITS, ADD_ONS (full AddOn interface)
  - 12+ files still import from `@/lib/pricing/constants` — these all work via the bridge

## Database Models Added
- PaymentLedger: userId, type, squarePaymentId (unique), squareOrderId, subtotal, processingFee, totalCharged, status, description, metadata (JSON), isDemo
- SellerEarnings: userId, itemId?, saleAmount, commissionRate, commissionAmount, netEarnings, status (pending/available/paid_out/refunded), holdUntil (3-day hold)
- Both added to User relation

## Services Created
- `/lib/services/payment-ledger.ts`: recordPayment, recordEarning, getUserBalance, getUserTransactions, getUserEarnings
- `/app/api/webhooks/square/route.ts`: payment.completed, payment.failed, refund.completed (idempotent by squarePaymentId)

## Demo Financial Data (seeded via /api/demo/seed)
- 5 sales + 1 credit purchase
- Available: $230.00 (sales 1-3), Pending: $55.20 (sale 4), Refunded: sale 5
- Total earned: $285.20, Total commissions: $24.80
- All math verified correct with actual code execution

## Files Changed
- Stripe removed from: ConnectedAccountsClient.tsx (→ "Square"), payments/page.tsx (→ "Square Payments")
- CSS `--stripe-bg` variable kept (table row striping, NOT Stripe payments)
- Item page commission: now uses user's actual tier rate (was hardcoded 10%)
- white-glove/page.tsx: prices fixed to match constants ($1,750/$3,500/$7,000)
- api-access/page.tsx: now imports from API_TIERS constants

## Build
- tsc --noEmit = 0 errors
- npm run build = 100 routes, 0 errors
- Zero Stripe payment references in codebase
