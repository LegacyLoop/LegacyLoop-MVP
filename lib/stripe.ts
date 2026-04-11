/**
 * Stripe Server Client — SINGLETON
 * Every server-side file that needs Stripe imports from here.
 */
import Stripe from "stripe";

const isConfigured = !!(process.env.STRIPE_SECRET_KEY);

if (!isConfigured) {
  console.warn("Stripe not configured — running in demo payment mode");
}

const stripe = isConfigured
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" })
  : null;

export { stripe, isConfigured };

/**
 * Get or create a Stripe Customer for a LegacyLoop user.
 * Returns the Stripe customer ID. Persists to User.stripeCustomerId.
 * Requires Stripe to be configured — caller must guard with isConfigured.
 */
export async function getOrCreateStripeCustomer(
  user: { id: string; email: string; displayName?: string | null; stripeCustomerId?: string | null },
): Promise<string | null> {
  if (!stripe) return null;

  // Already has a Stripe customer — return it
  if (user.stripeCustomerId) return user.stripeCustomerId;

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.displayName ?? undefined,
    metadata: { userId: user.id },
  });

  // Save to User record (dynamic import to avoid circular deps)
  const { prisma } = await import("@/lib/db");
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  }).catch(() => {});

  return customer.id;
}
