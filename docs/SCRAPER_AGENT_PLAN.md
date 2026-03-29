# LegacyLoop — Scraper Agent Architecture Plan

## Why
Current pricing relies on AI hallucination when eBay API fails.
Need REAL sold prices from actual marketplaces.

## Phase 1: eBay API (Immediate)
- Configure EBAY_CLIENT_ID and EBAY_CLIENT_SECRET with valid production credentials
- eBay Browse API is already coded (`lib/adapters/ebay.ts`)
- Just needs valid credentials after eBay compliance approval
- Fallback: AI pricing still works but with lower confidence score

## Phase 2: Built-in Scraper Agents (Next Build)
Target platforms:
1. **eBay sold listings** — backup for when API fails or rate-limited
2. **Facebook Marketplace** — local pricing by ZIP
3. **Craigslist** — local pricing by ZIP/city
4. **Mercari sold listings** — general resale comps
5. **Poshmark** — clothing, accessories, fashion items
6. **Reverb** — musical instruments, audio equipment
7. **Etsy sold** — vintage, antiques, handmade

### Architecture
```
lib/scrapers/
  base.ts          — base scraper class with retry, rate-limit, error handling
  ebay.ts          — eBay sold listings scraper (HTML fallback)
  facebook.ts      — FB Marketplace scraper (local)
  craigslist.ts    — Craigslist by ZIP/city
  mercari.ts       — Mercari sold listings
  poshmark.ts      — Poshmark comps
  reverb.ts        — Reverb sold listings
  etsy.ts          — Etsy sold/vintage
  aggregator.ts    — runs all relevant scrapers, dedupes, ranks results
```

### Interface
Each scraper implements:
```typescript
interface ScraperResult {
  platform: string;
  title: string;
  price: number;
  soldDate: string | null;
  condition: string | null;
  url: string;
  location: string | null;
  isActive: boolean;  // true = listed, false = sold
}

interface Scraper {
  search(query: string, zip: string, radius: number): Promise<ScraperResult[]>;
  isAvailable(): boolean;
}
```

### Data Flow
1. PriceBot calls `aggregator.search(itemName, sellerZip, saleRadius)`
2. Aggregator runs relevant scrapers in parallel (timeout: 10s each)
3. Results deduplicated by title+price similarity
4. Stored in `MarketComp` table for caching (TTL: 24 hours)
5. Passed to PriceBot prompt as REAL anchoring data
6. AI estimates still generated but weighted lower when real data exists

## Phase 3: Real-Time Price Monitoring
- Cron job scrapes prices weekly for active listings
- Price trend detection from real data (not AI guesses)
- Alert when competitor prices change significantly
- Dashboard widget showing price movement over time

## Technical Considerations
- Rate limiting: max 1 request/second per platform
- Caching: MarketComp table stores results, 24h TTL
- Proxy rotation for reliability (Phase 3)
- Headless browser (Playwright) for JS-rendered pages
- Respect robots.txt and ToS — scraping for personal pricing only
- Graceful degradation: if scraper fails, AI fallback still works

## Priority Order
1. eBay API credentials (zero code needed)
2. eBay HTML scraper (highest volume of sold data)
3. Facebook Marketplace (best local pricing)
4. Mercari (good general comps)
5. Remaining platforms as needed
