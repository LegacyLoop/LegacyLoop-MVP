/**
 * Geo Resolver — ZIP prefix → US state → applicable local sources.
 *
 * CMD-LOCAL-CLASSIFIEDS-FRAMEWORK (Phase 1).
 * ME/NH/VT/MA populated in full for Uncle Henry's coverage (command #2).
 * Other states covered at region-level; expand to ZIP3 precision as
 * additional adapters land.
 */

import type { LocalSourceSlug, USState } from "./types";
import { SOURCE_REGISTRY } from "./registry";

// ─── ZIP3 → state ───────────────────────────────────────────────────────
// First 3 digits of ZIP are sufficient for state-level source routing.
// Uncle Henry's coverage region (ME/NH/VT/MA) fully populated here.
// Remaining states populated at a representative level; missing ZIP3s
// fall through to sourcesForZip() returning national-only sources.

const ZIP_PREFIX_TO_STATE: Record<string, USState> = {
  // Maine 040-049
  "040": "ME", "041": "ME", "042": "ME", "043": "ME", "044": "ME",
  "045": "ME", "046": "ME", "047": "ME", "048": "ME", "049": "ME",
  // New Hampshire 030-038
  "030": "NH", "031": "NH", "032": "NH", "033": "NH", "034": "NH",
  "035": "NH", "036": "NH", "037": "NH", "038": "NH",
  // Vermont 050-059 (no 055)
  "050": "VT", "051": "VT", "052": "VT", "053": "VT", "054": "VT",
  "056": "VT", "057": "VT", "058": "VT", "059": "VT",
  // Massachusetts 010-027
  "010": "MA", "011": "MA", "012": "MA", "013": "MA", "014": "MA",
  "015": "MA", "016": "MA", "017": "MA", "018": "MA", "019": "MA",
  "020": "MA", "021": "MA", "022": "MA", "023": "MA", "024": "MA",
  "025": "MA", "026": "MA", "027": "MA",

  // Representative ZIP3 anchors for other states (expand as adapters land):
  // NY 100-149 (sample), NJ 070-089 (sample), PA 150-196 (sample),
  // CA 900-961 (sample), TX 750-799 (sample), IL 600-629 (sample),
  // CO 800-816, IN 460-479, KY 400-427, MT 590-599, ID 832-838,
  // WA 980-994, OR 970-979. Spot-filled for registry routing only —
  // full 50-state ZIP3 table is a Phase 2 expansion.
  "100": "NY", "101": "NY", "102": "NY", "103": "NY", "104": "NY",
  "105": "NY", "106": "NY", "107": "NY", "108": "NY", "109": "NY",
  "070": "NJ", "071": "NJ", "072": "NJ", "073": "NJ", "074": "NJ",
  "075": "NJ", "076": "NJ", "077": "NJ", "078": "NJ", "079": "NJ",
  "150": "PA", "151": "PA", "152": "PA", "153": "PA", "154": "PA",
  "750": "TX", "751": "TX", "752": "TX", "753": "TX", "754": "TX",
  "760": "TX", "761": "TX", "762": "TX", "770": "TX", "771": "TX",
  "600": "IL", "601": "IL", "602": "IL", "603": "IL", "604": "IL",
  "605": "IL", "606": "IL", "607": "IL",
  "800": "CO", "801": "CO", "802": "CO", "803": "CO", "804": "CO",
  "460": "IN", "461": "IN", "462": "IN", "463": "IN", "464": "IN",
  "400": "KY", "401": "KY", "402": "KY",
  "590": "MT", "591": "MT", "592": "MT", "593": "MT",
  "832": "ID", "833": "ID", "834": "ID", "835": "ID",
  "980": "WA", "981": "WA", "982": "WA", "983": "WA", "984": "WA",
  "985": "WA", "986": "WA", "988": "WA", "989": "WA",
  "970": "OR", "971": "OR", "972": "OR", "973": "OR", "974": "OR",
  "900": "CA", "901": "CA", "902": "CA", "903": "CA", "904": "CA",
  "905": "CA", "906": "CA", "907": "CA", "908": "CA",
};

// ─── Public API ─────────────────────────────────────────────────────────

export function zipToState(zip: string | null | undefined): USState | null {
  if (!zip || zip.length < 3) return null;
  const prefix = zip.slice(0, 3);
  return ZIP_PREFIX_TO_STATE[prefix] ?? null;
}

export function statesToSources(states: USState[]): LocalSourceSlug[] {
  if (states.length === 0) return [];
  const set = new Set<USState>(states);
  const slugs: LocalSourceSlug[] = [];
  for (const [slug, entry] of Object.entries(SOURCE_REGISTRY)) {
    if (entry.coversStates.some((s) => set.has(s))) {
      slugs.push(slug as LocalSourceSlug);
    }
  }
  return slugs;
}

export function sourcesForZip(zip: string | null | undefined): LocalSourceSlug[] {
  const state = zipToState(zip);
  const regional = state ? statesToSources([state]) : [];
  // National sources are added unconditionally; deduped.
  const national: LocalSourceSlug[] = [];
  for (const [slug, entry] of Object.entries(SOURCE_REGISTRY)) {
    if (entry.coverageTier === "national") {
      national.push(slug as LocalSourceSlug);
    }
  }
  const deduped = Array.from(new Set<LocalSourceSlug>([...regional, ...national]));
  return deduped;
}
