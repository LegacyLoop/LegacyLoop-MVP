/**
 * Stripe Client-Side — loadStripe singleton
 * Used by React components that need Stripe Elements.
 */
import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
