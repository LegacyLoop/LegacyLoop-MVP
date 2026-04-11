/**
 * DEPRECATED — Square removed. Re-exports from lib/stripe.ts for backward compatibility.
 * All payment processing now uses Stripe.
 * TODO: Remove this file once all callers are updated to import from lib/stripe.ts directly.
 */
export { isConfigured } from "./stripe";
