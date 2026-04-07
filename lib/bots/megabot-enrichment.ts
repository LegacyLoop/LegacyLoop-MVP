/**
 * lib/bots/megabot-enrichment.ts
 * ─────────────────────────────────────────────────────────────────
 * MegaBot premium scraper enrichment.
 *
 * The 7cr MegaBot price covers the additional Apify cost of firing
 * the scrapers we cap out of the standard bot runs in Step 4.6.
 *
 * Per-bot enrichment maps:
 *   • BuyerBot MegaBot → adds Pinterest, YouTube, Twitter, FB Pages
 *     (the 4 social scrapers dropped from standard BuyerBot in 4.6)
 *   • CollectiblesBot MegaBot → adds Courtyard for trading cards
 *     (the fractional-investor scraper dropped from standard 4.6)
 *   • CarBot MegaBot → handled separately via the AutoTrader env
 *     override in app/api/megabot/[itemId]/route.ts
 *
 * Returns a context block that the megabot route prepends to the
 * AI prompt. Failures are non-critical (returns empty string).
 *
 * STEP 4.7 — RYAN-APPROVED: bring back the dropped scrapers in
 * the premium MegaBot tier where the higher cost covers them.
 * ─────────────────────────────────────────────────────────────────
 */

export interface MegaBotEnrichmentResult {
  contextBlock: string;
  scrapersFired: string[];
  estimatedApifyCostUsd: number;
}

const EMPTY: MegaBotEnrichmentResult = {
  contextBlock: "",
  scrapersFired: [],
  estimatedApifyCostUsd: 0,
};

/**
 * Fire premium scrapers for a MegaBot run. Routes by botType.
 *
 * @param botType    The bot the MegaBot is acting on (e.g. "buyerbot")
 * @param itemName   Item name for scraper queries
 * @param category   Item category for scraper routing
 * @returns          Context block to inject + audit metadata
 */
export async function runMegaBotEnrichment(
  botType: string,
  itemName: string,
  category: string,
): Promise<MegaBotEnrichmentResult> {
  if (!itemName) return EMPTY;

  switch (botType) {
    case "buyerbot":
      return enrichBuyerBot(itemName, category);
    case "collectiblesbot":
      return enrichCollectiblesBot(itemName, category);
    default:
      return EMPTY;
  }
}

// ─── BuyerBot enrichment: 4 social scrapers ───────────────────

async function enrichBuyerBot(
  itemName: string,
  category: string,
): Promise<MegaBotEnrichmentResult> {
  const { scrapePinterest } = await import("@/lib/market-intelligence/adapters/pinterest");
  const { scrapeYoutube } = await import("@/lib/market-intelligence/adapters/youtube");
  const { scrapeTwitter } = await import("@/lib/market-intelligence/adapters/twitter-x");
  const { scrapeFacebookPages } = await import("@/lib/market-intelligence/adapters/facebook-pages");

  const settled = await Promise.allSettled([
    scrapePinterest(itemName, category),
    scrapeYoutube(itemName, category),
    scrapeTwitter(itemName, category),
    scrapeFacebookPages(itemName, category),
  ]);

  const [pinResult, ytResult, twResult, fbpResult] = settled;
  const pin = pinResult.status === "fulfilled" ? pinResult.value : null;
  const yt = ytResult.status === "fulfilled" ? ytResult.value : null;
  const tw = twResult.status === "fulfilled" ? twResult.value : null;
  const fbp = fbpResult.status === "fulfilled" ? fbpResult.value : null;

  const fired: string[] = [];
  const lines: string[] = ["\n[MEGABOT BUYER ENRICHMENT — PREMIUM SOCIAL INTEL]"];

  if (pin?.success && (pin as any).demandSignal !== "none") {
    fired.push("pinterest");
    lines.push(
      `Pinterest demand: ${(pin as any).demandSignal} (${(pin as any).totalSaves?.toLocaleString?.() ?? "?"} saves)`,
    );
  }
  if (yt?.success && (yt as any).demandSignal !== "none") {
    fired.push("youtube");
    lines.push(
      `YouTube interest: ${(yt as any).demandSignal} (${(yt as any).totalViews?.toLocaleString?.() ?? "?"} views)`,
    );
  }
  if (tw?.success) {
    fired.push("twitter");
    const summary = (tw as any).summary || (tw as any).demandSignal || "active";
    lines.push(`X/Twitter signal: ${summary}`);
  }
  if (fbp?.success) {
    fired.push("facebook_pages");
    const summary = (fbp as any).summary || (fbp as any).demandSignal || "active";
    lines.push(`Facebook Pages signal: ${summary}`);
  }

  if (fired.length === 0) return EMPTY;

  lines.push("");
  lines.push(
    "INSTRUCTION: Use these premium social demand signals to identify viral",
    "buyer profiles, trending search terms, and platforms where the item is",
    "currently getting the most attention. Cross-reference with the standard",
    "BuyerBot signals (FB Groups, Reddit, Instagram) for a complete picture.",
  );

  return {
    contextBlock: lines.join("\n"),
    scrapersFired: fired,
    estimatedApifyCostUsd: fired.length * 0.35,
  };
}

// ─── CollectiblesBot enrichment: Courtyard ────────────────────

async function enrichCollectiblesBot(
  itemName: string,
  category: string,
): Promise<MegaBotEnrichmentResult> {
  const catLower = (category || "").toLowerCase();
  // Only fire Courtyard for trading cards (matches Step 4.6 routing)
  if (!catLower.match(/card|pokemon|magic|yugioh|tcg|trading|sports.?card/)) {
    return EMPTY;
  }

  const { scrapeCourtyard } = await import("@/lib/market-intelligence/adapters/courtyard");
  const courtyard = await scrapeCourtyard(itemName).catch(() => null);

  if (!courtyard?.success || !courtyard.comps || courtyard.comps.length === 0) {
    return EMPTY;
  }

  const lines: string[] = [
    "\n[MEGABOT COLLECTIBLES ENRICHMENT — COURTYARD FRACTIONAL MARKET]",
    `Courtyard.io tokenized assets (${courtyard.comps.length} listings):`,
    ...courtyard.comps.slice(0, 6).map(
      (c: any, i: number) =>
        `${i + 1}. "${c.item}" — $${c.price} (full asset value)${c.condition ? ` [${c.condition}]` : ""}`,
    ),
    "",
    "INSTRUCTION: Courtyard tokenizes physical cards for fractional investors.",
    "These prices reflect institutional/serious-collector interest and are a",
    "leading indicator of market floor for graded examples.",
  ];

  return {
    contextBlock: lines.join("\n"),
    scrapersFired: ["courtyard"],
    estimatedApifyCostUsd: 0.40,
  };
}
