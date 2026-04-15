/**
 * Stripe Client-Side — loadStripe singleton
 * Used by React components that need Stripe Elements.
 * Guarded: only loads client-side when env var is present.
 */
import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn("[stripe-client] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }

  return stripePromise;
}
