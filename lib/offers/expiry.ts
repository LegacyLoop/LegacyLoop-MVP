import crypto from "crypto";

/** Returns a Date N hours from now (default 48h, range 12-168h) */
export function getOfferExpiry(hoursOverride?: number): Date {
  const hours = hoursOverride != null && hoursOverride >= 12 && hoursOverride <= 168 ? hoursOverride : 48;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Returns true if the offer's expiresAt is in the past */
export function isOfferExpired(offer: { expiresAt: Date }): boolean {
  return new Date(offer.expiresAt) < new Date();
}

/** Generates a cryptographically secure random token for buyer magic links */
export function generateBuyerToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
