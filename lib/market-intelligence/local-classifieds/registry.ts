/**
 * Source Registry — metadata catalog for every known local classifieds
 * source. Links slug → display name + covered states + coverage tier +
 * age (trust signal) + legal status + active flag.
 *
 * CMD-LOCAL-CLASSIFIEDS-FRAMEWORK (Phase 1).
 * All entries ship `active: false` — no outbound traffic possible until
 * CMD-UNCLE-HENRYS-ADAPTER ratifies with written ToU permission and flips
 * a registry entry to `active: true`.
 */

import type { LocalSourceSlug, USState } from "./types";

export interface SourceRegistryEntry {
  slug: LocalSourceSlug;
  displayName: string;
  coversStates: USState[];
  coverageTier: "regional" | "multi_state" | "national" | "neighborhood";
  ageYears: number;
  legalStatus:
    | "pending_written_permission"
    | "tos_permissive"
    | "requires_api_key"
    | "deferred";
  active: boolean;
  notes?: string;
}

export const SOURCE_REGISTRY: Record<LocalSourceSlug, SourceRegistryEntry> = {
  uncle_henrys: {
    slug: "uncle_henrys",
    displayName: "Uncle Henry's",
    coversStates: ["ME", "NH", "VT", "MA"],
    coverageTier: "regional",
    ageYears: 56,
    legalStatus: "pending_written_permission",
    active: false,
    notes: "Primary endpoint candidate: /ad_stream/feed (JSON). Fallback: HTML at /classified/:id. Awaiting written permission from privacy@unclehenrys.com (email sent Apr 18).",
  },
  thrifty_nickel: {
    slug: "thrifty_nickel",
    displayName: "Thrifty Nickel",
    coversStates: ["TX", "CO", "IL", "IN", "KY"],
    coverageTier: "multi_state",
    ageYears: 44,
    legalStatus: "deferred",
    active: false,
    notes: "Phase 3 — pending outreach.",
  },
  penny_saver: {
    slug: "penny_saver",
    displayName: "Penny Saver",
    coversStates: ["NJ", "NY", "PA"],
    coverageTier: "multi_state",
    ageYears: 60,
    legalStatus: "deferred",
    active: false,
    notes: "Phase 3 — multiple regional variants; needs per-variant legal review.",
  },
  bargain_finder: {
    slug: "bargain_finder",
    displayName: "Bargain Finder",
    coversStates: ["IN", "IL"],
    coverageTier: "multi_state",
    ageYears: 40,
    legalStatus: "deferred",
    active: false,
  },
  nickels_worth: {
    slug: "nickels_worth",
    displayName: "Nickel's Worth",
    coversStates: ["MT", "ID", "WA"],
    coverageTier: "multi_state",
    ageYears: 50,
    legalStatus: "deferred",
    active: false,
  },
  giant_nickel: {
    slug: "giant_nickel",
    displayName: "Giant Nickel",
    coversStates: ["WA", "OR", "ID"],
    coverageTier: "multi_state",
    ageYears: 45,
    legalStatus: "deferred",
    active: false,
  },
  the_exchange: {
    slug: "the_exchange",
    displayName: "The Exchange",
    coversStates: ["WA", "ID"],
    coverageTier: "regional",
    ageYears: 42,
    legalStatus: "deferred",
    active: false,
  },
  recycler: {
    slug: "recycler",
    displayName: "Recycler",
    coversStates: [
      "CA", "NV", "AZ", "OR", "WA", "TX", "FL", "NY", "IL", "PA",
      "OH", "MI", "GA", "NC", "VA", "MA",
    ],
    coverageTier: "national",
    ageYears: 50,
    legalStatus: "deferred",
    active: false,
    notes: "National network of 70+ regional publications.",
  },
  craigslist: {
    slug: "craigslist",
    displayName: "Craigslist",
    coversStates: [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
      "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
      "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
      "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    ],
    coverageTier: "national",
    ageYears: 30,
    legalStatus: "deferred",
    active: false,
    notes: "Legacy adapter at lib/market-intelligence/adapters/craigslist.ts serves existing aggregator path — framework adapter deferred.",
  },
  facebook_marketplace: {
    slug: "facebook_marketplace",
    displayName: "Facebook Marketplace",
    coversStates: [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
      "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
      "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
      "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    ],
    coverageTier: "national",
    ageYears: 8,
    legalStatus: "deferred",
    active: false,
    notes: "Requires authenticated session — adapter deferred indefinitely.",
  },
  offerup: {
    slug: "offerup",
    displayName: "OfferUp",
    coversStates: [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
      "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
      "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
      "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    ],
    coverageTier: "national",
    ageYears: 14,
    legalStatus: "requires_api_key",
    active: false,
    notes: "Public API available; adapter deferred pending partnership or API-key acquisition.",
  },
  nextdoor: {
    slug: "nextdoor",
    displayName: "Nextdoor",
    coversStates: [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
      "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
      "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
      "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    ],
    coverageTier: "neighborhood",
    ageYears: 15,
    legalStatus: "deferred",
    active: false,
    notes: "Requires authenticated session + neighborhood membership.",
  },
};

export function getRegistryEntry(slug: LocalSourceSlug): SourceRegistryEntry {
  return SOURCE_REGISTRY[slug];
}

export function getActiveSources(): LocalSourceSlug[] {
  return (Object.keys(SOURCE_REGISTRY) as LocalSourceSlug[])
    .filter((slug) => SOURCE_REGISTRY[slug].active);
}
