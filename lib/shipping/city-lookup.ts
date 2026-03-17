/**
 * City-to-ZIP lookup for shipping destination search.
 * In production, this would use a geocoding API.
 */

export interface CityEntry {
  city: string;
  state: string;
  zip: string;
  label: string;
}

const CITIES: CityEntry[] = [
  { city: "New York", state: "NY", zip: "10001", label: "New York, NY" },
  { city: "Boston", state: "MA", zip: "02101", label: "Boston, MA" },
  { city: "Los Angeles", state: "CA", zip: "90001", label: "Los Angeles, CA" },
  { city: "Chicago", state: "IL", zip: "60601", label: "Chicago, IL" },
  { city: "Seattle", state: "WA", zip: "98101", label: "Seattle, WA" },
  { city: "Miami", state: "FL", zip: "33101", label: "Miami, FL" },
  { city: "Denver", state: "CO", zip: "80201", label: "Denver, CO" },
  { city: "San Francisco", state: "CA", zip: "94101", label: "San Francisco, CA" },
  { city: "Portland", state: "ME", zip: "04101", label: "Portland, ME" },
  { city: "Bangor", state: "ME", zip: "04401", label: "Bangor, ME" },
  { city: "Augusta", state: "ME", zip: "04330", label: "Augusta, ME" },
  { city: "Waterville", state: "ME", zip: "04901", label: "Waterville, ME" },
  { city: "Washington", state: "DC", zip: "20001", label: "Washington, DC" },
  { city: "Dallas", state: "TX", zip: "75201", label: "Dallas, TX" },
  { city: "Atlanta", state: "GA", zip: "30301", label: "Atlanta, GA" },
  { city: "Nashville", state: "TN", zip: "37201", label: "Nashville, TN" },
  { city: "Austin", state: "TX", zip: "78701", label: "Austin, TX" },
  { city: "Phoenix", state: "AZ", zip: "85001", label: "Phoenix, AZ" },
  { city: "Minneapolis", state: "MN", zip: "55401", label: "Minneapolis, MN" },
  { city: "Charlotte", state: "NC", zip: "28201", label: "Charlotte, NC" },
  { city: "Houston", state: "TX", zip: "77001", label: "Houston, TX" },
  { city: "Philadelphia", state: "PA", zip: "19101", label: "Philadelphia, PA" },
  { city: "San Diego", state: "CA", zip: "92101", label: "San Diego, CA" },
  { city: "Detroit", state: "MI", zip: "48201", label: "Detroit, MI" },
  { city: "Portland", state: "OR", zip: "97201", label: "Portland, OR" },
];

/** Search cities by name or state. Returns matching entries (case-insensitive). */
export function searchCities(query: string): CityEntry[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase() === q ||
      c.label.toLowerCase().includes(q) ||
      c.zip.startsWith(q)
  ).slice(0, 8);
}

/** Get ZIP for a city label (e.g., "Boston, MA" → "02101"). */
export function getZipForCity(label: string): string | null {
  const entry = CITIES.find((c) => c.label === label);
  return entry?.zip ?? null;
}

/** Get all cities for display. */
export function getAllCities(): CityEntry[] {
  return CITIES;
}
