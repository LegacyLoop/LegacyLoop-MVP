import crypto from "crypto";

/** Returns a Date 48 hours from now */
export function getOfferExpiry(): Date {
  return new Date(Date.now() + 48 * 60 * 60 * 1000);
}

/** Returns true if the offer's expiresAt is in the past */
export function isOfferExpired(offer: { expiresAt: Date }): boolean {
  return new Date(offer.expiresAt) < new Date();
}

/** Generates a cryptographically secure random token for buyer magic links */
export function generateBuyerToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
