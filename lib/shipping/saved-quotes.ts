/**
 * Saved Quotes — Clean localStorage-based quote storage
 *
 * Unified storage for both parcel and LTL quotes.
 * Senior-friendly: click to save, one place to view, one tap to use or delete.
 */

export interface SavedQuote {
  quoteKey: string;
  type: "parcel" | "ltl";
  carrier: string;
  service: string;
  amount: number;
  transit: string;
  source: string;
  isLive: boolean;
  savedAt: string;
  itemId: string;
  itemTitle?: string;
}

const STORAGE_KEY = "ll_saved_quotes";
const MAX_QUOTES_PER_ITEM = 10;

function readStore(): Record<string, SavedQuote[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, SavedQuote[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

/**
 * Save a quote for an item. Auto-dedupes by quoteKey.
 * Returns true if saved, false if already existed.
 */
export function saveQuote(itemId: string, quote: Omit<SavedQuote, "quoteKey" | "savedAt" | "itemId">): boolean {
  const store = readStore();
  const quotes = store[itemId] || [];
  const quoteKey = `${quote.carrier}-${quote.service}-${quote.type}`.toLowerCase().replace(/[^a-z0-9-]/g, "");

  const existingIdx = quotes.findIndex(q => q.quoteKey === quoteKey);
  if (existingIdx >= 0) {
    quotes[existingIdx] = {
      ...quotes[existingIdx],
      ...quote,
      quoteKey,
      savedAt: new Date().toISOString(),
      itemId,
    };
  } else {
    quotes.unshift({
      ...quote,
      quoteKey,
      savedAt: new Date().toISOString(),
      itemId,
    });
    if (quotes.length > MAX_QUOTES_PER_ITEM) {
      quotes.splice(MAX_QUOTES_PER_ITEM);
    }
  }

  store[itemId] = quotes;
  writeStore(store);
  console.log(`[quotes] Saved ${quote.type} quote:`, quote.carrier, "$" + quote.amount, "for item", itemId);
  return existingIdx < 0;
}

/**
 * Get all saved quotes for an item.
 */
export function getQuotes(itemId: string): SavedQuote[] {
  const store = readStore();
  return store[itemId] || [];
}

/**
 * Delete a specific saved quote.
 */
export function deleteQuote(itemId: string, quoteKey: string): void {
  const store = readStore();
  const quotes = store[itemId] || [];
  store[itemId] = quotes.filter(q => q.quoteKey !== quoteKey);
  if (store[itemId].length === 0) delete store[itemId];
  writeStore(store);
  console.log(`[quotes] Deleted quote:`, quoteKey, "for item", itemId);
}

/**
 * Check if a specific quote is saved.
 */
export function isQuoteSaved(itemId: string, carrier: string, service: string, type: "parcel" | "ltl"): boolean {
  const quoteKey = `${carrier}-${service}-${type}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const quotes = getQuotes(itemId);
  return quotes.some(q => q.quoteKey === quoteKey);
}

/**
 * Get all saved quotes across all items (for Shipping Center view).
 */
export function getAllSavedQuotes(): { itemId: string; quotes: SavedQuote[] }[] {
  const store = readStore();
  return Object.entries(store)
    .filter(([, quotes]) => quotes.length > 0)
    .map(([itemId, quotes]) => ({ itemId, quotes }));
}

/**
 * Get count of saved quotes for an item.
 */
export function getQuoteCount(itemId: string): number {
  return getQuotes(itemId).length;
}
