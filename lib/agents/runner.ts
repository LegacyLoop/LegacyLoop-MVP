/**
 * Multi-Agent Runner — Powers Standard + Mega Modes
 *
 * Standard Mode: Single OpenAI agent for any specialty bot
 * Mega Mode: OpenAI + Claude + Gemini + Grok agents in parallel + Azure placeholder
 */

export type BotType = "analyze" | "pricing" | "listing" | "buyer" | "shipping" | "style" | "antique" | "vehicle";

export interface AgentResult {
  agentName: string;
  agentIcon: string;
  status: "pending" | "running" | "complete" | "error" | "placeholder";
  startedAt: number;
  completedAt: number;
  durationMs: number;
  confidence: number;
  keyInsight: string;
  data: {
    identification: string;
    category: string;
    condition: string;
    conditionScore: number;
    priceLow: number;
    priceHigh: number;
    priceMid: number;
    rationale: string;
    valueDrivers: string[];
    listingTitle: string;
    listingDescription: string;
    keywords: string[];
    platforms: string[];
    antiqueMarkers: string[];
    isAntique: boolean;
    photoScore: number;
    photoTips: string[];
    // Specialty-specific
    shippingNotes?: string[];
    packagingTips?: string[];
    vehicleNotes?: string[];
    antiqueNotes?: string[];
    styleNotes?: string[];
    buyerNotes?: string[];
    buyerLeads?: { name: string; platform: string; interest: string; matchScore: number; distance: string; lastActive: string }[];
  } | null;
  error?: string;
}

export interface MasterSummary {
  consensusResult: {
    identification: string;
    category: string;
    condition: string;
    conditionScore: number;
    priceLow: number;
    priceMid: number;
    priceHigh: number;
    listingTitle: string;
    listingDescription: string;
    keywords: string[];
    platforms: string[];
    isAntique: boolean;
    antiqueMarkers: string[];
    photoScore: number;
    photoTips: string[];
  };
  averageConfidence: number;
  agreeLevel: "strong" | "mixed" | "divergent";
  mergedInsights: string[];
  recommendation: string;
  whatToDoNext: string[];
  valueDrivers: string[];
}

export interface MultiAgentRun {
  runId: string;
  itemId: string;
  botType: BotType;
  agents: AgentResult[];
  masterSummary: MasterSummary;
  startedAt: number;
  completedAt: number;
  status: "complete" | "partial" | "error";
}

// ─── Demo data generators ─────────────────────────────────────────────────

type AgentData = NonNullable<AgentResult["data"]>;

function generateOpenAIData(
  name: string, category: string, baseMid: number, botType: BotType,
): AgentData {
  const base: AgentData = {
    identification: `${name} — identified via visual pattern matching and brand database cross-reference`,
    category,
    condition: "Good",
    conditionScore: 7,
    priceLow: Math.round(baseMid * 0.7),
    priceHigh: Math.round(baseMid * 1.35),
    priceMid: Math.round(baseMid),
    rationale: `Based on recent US resale market data (2024-2025), comparable items in similar condition sell for $${Math.round(baseMid * 0.7)}–$${Math.round(baseMid * 1.35)} on major platforms.`,
    valueDrivers: ["Brand recognition", "Current market demand", "Condition consistent with age"],
    listingTitle: `${name} - Excellent Condition - Fast Shipping`,
    listingDescription: `Beautiful ${name.toLowerCase()} in good condition. Shows normal wear consistent with age. All original parts present. Ships carefully packaged within 2 business days.`,
    keywords: [category.toLowerCase(), "vintage", "estate sale", "collectible", name.split(" ")[0]?.toLowerCase() || "item"],
    platforms: ["eBay", "Facebook Marketplace", "Craigslist"],
    antiqueMarkers: [],
    isAntique: false,
    photoScore: 7,
    photoTips: ["Add a close-up of any maker's marks", "Include a photo showing scale/size reference"],
  };

  if (botType === "shipping") {
    base.shippingNotes = ["Standard parcel shipping recommended", "Insure for declared value", "Double-box fragile items"];
    base.packagingTips = ["Use bubble wrap for cushioning", "Fill void space with packing peanuts", "Tape all seams with quality packing tape"];
  } else if (botType === "style") {
    base.styleNotes = ["Good natural lighting", "Clean background", "Sharp focus on item details"];
  } else if (botType === "vehicle") {
    base.vehicleNotes = ["Run CARFAX or AutoCheck report", "Get pre-sale inspection", "Detail the vehicle before listing photos"];
  } else if (botType === "buyer") {
    base.buyerNotes = ["Found active buyers on 3 platforms", "Facebook Marketplace has highest buyer activity for this category", "Consider lowering price 5% for faster sale"];
    base.buyerLeads = [
      { name: "Sarah M.", platform: "Facebook Marketplace", interest: `Searched '${category.toLowerCase()}' 3 days ago`, matchScore: 92, distance: "45 miles", lastActive: "2 hours ago" },
      { name: "CollectorJim", platform: "eBay", interest: "Bought similar item last month", matchScore: 87, distance: "Boston, MA", lastActive: "5 hours ago" },
      { name: "VintageFinds22", platform: "Craigslist", interest: `Posted 'ISO ${category.toLowerCase()} Maine area'`, matchScore: 78, distance: "120 miles", lastActive: "1 day ago" },
    ];
  } else if (botType === "antique") {
    base.isAntique = true;
    base.antiqueMarkers = ["Period-appropriate construction", "Age-consistent patina", "Pre-industrial manufacturing signs"];
    base.antiqueNotes = ["Seek professional appraisal", "Document provenance thoroughly", "Consider auction house for best price"];
    base.priceLow = Math.round(base.priceLow * 1.3);
    base.priceMid = Math.round(base.priceMid * 1.3);
    base.priceHigh = Math.round(base.priceHigh * 1.5);
  }

  return base;
}

function generateClaudeData(
  name: string, category: string, baseMid: number, botType: BotType,
): AgentData {
  const variance = 1.12; // 8-12% higher
  const base: AgentData = {
    identification: `${name} — cross-referenced with historical auction records and manufacturer databases. Construction details suggest authentic period craftsmanship.`,
    category,
    condition: "Very Good",
    conditionScore: 7,
    priceLow: Math.round(baseMid * 0.75 * variance),
    priceHigh: Math.round(baseMid * 1.4 * variance),
    priceMid: Math.round(baseMid * variance),
    rationale: `Auction records and resale platforms show strong demand for this type of ${category.toLowerCase()} item. Historical significance and material quality elevate this above typical market pricing. Condition-adjusted estimate: $${Math.round(baseMid * 0.75 * variance)}–$${Math.round(baseMid * 1.4 * variance)}.`,
    valueDrivers: ["Historical significance", "Material quality", "Collector interest in this era", "Craftsmanship details"],
    listingTitle: `Authentic ${name} | Verified Quality | Estate Collection`,
    listingDescription: `Presenting a quality ${name.toLowerCase()} from an established estate collection. Careful examination reveals original construction with age-appropriate wear. A standout piece for collectors or decorators seeking authentic character.`,
    keywords: [category.toLowerCase(), "authentic", "estate collection", "quality", name.split(" ")[0]?.toLowerCase() || "item", "verified"],
    platforms: ["eBay", "Etsy", "Ruby Lane", "Chairish"],
    antiqueMarkers: [],
    isAntique: false,
    photoScore: 7,
    photoTips: ["Use natural diffused light for truest color representation", "Photograph from multiple angles including underside"],
  };

  if (botType === "shipping") {
    base.shippingNotes = ["Consider flat rate boxes for cost savings", "Insurance strongly recommended for this value", "Custom inner packaging for fragile edges"];
    base.packagingTips = ["Double-wall corrugated box", "Custom foam inserts for irregularly shaped items", "Wrap in acid-free tissue for antiques"];
  } else if (botType === "style") {
    base.styleNotes = ["Tell a story — show the item in a lifestyle context", "Capture the emotional appeal and character", "Highlight patina and age as features, not flaws"];
  } else if (botType === "vehicle") {
    base.vehicleNotes = ["Highlight low ownership count as selling point", "Service records add significant buyer confidence", "Professional detail before photography"];
  } else if (botType === "buyer") {
    base.buyerNotes = ["Deep social media analysis reveals collector communities actively seeking this type", "Forum mining found 4 wanted posts matching this item", "Behavioral patterns suggest high purchase intent from 2 leads"];
    base.buyerLeads = [
      { name: "AntiqueHunter22", platform: "Reddit", interest: `Posted 'ISO mid-century ${category.toLowerCase()} Maine area'`, matchScore: 85, distance: "Portland, ME", lastActive: "6 hours ago" },
      { name: "EstateFinds_NE", platform: "Instagram", interest: `Follows 12 ${category.toLowerCase()} accounts, liked 8 similar posts`, matchScore: 79, distance: "New Hampshire", lastActive: "3 hours ago" },
      { name: "RetroCollector", platform: "Etsy", interest: "Favorited 5 similar items, contacted 2 sellers this week", matchScore: 83, distance: "Vermont", lastActive: "12 hours ago" },
      { name: "MainePicker", platform: "Facebook Groups", interest: `Active in 'Maine Estate Sales' group, commented on similar items`, matchScore: 76, distance: "30 miles", lastActive: "1 day ago" },
    ];
  } else if (botType === "antique") {
    base.isAntique = true;
    base.antiqueMarkers = ["Period-correct joinery techniques", "Consistent wear patterns indicating age", "Material composition matches claimed era", "Maker's mark identified"];
    base.antiqueNotes = ["Authentication could increase value 2-3x", "Auction house may yield highest return", "Document any restoration work performed"];
    base.priceLow = Math.round(base.priceLow * 1.2);
    base.priceMid = Math.round(base.priceMid * 1.2);
    base.priceHigh = Math.round(base.priceHigh * 1.3);
  }

  return base;
}

function generateGeminiData(
  name: string, category: string, baseMid: number, botType: BotType,
): AgentData {
  const variance = 0.92; // 5-15% lower
  const base: AgentData = {
    identification: `${name} — analyzed using visual AI with comparison against 2M+ item database. Market trend data indicates growing interest in this category.`,
    category,
    condition: "Good",
    conditionScore: 6,
    priceLow: Math.round(baseMid * 0.65 * variance),
    priceHigh: Math.round(baseMid * 1.3 * variance),
    priceMid: Math.round(baseMid * variance),
    rationale: `Market analysis across multiple platforms shows this ${category.toLowerCase()} item selling in the $${Math.round(baseMid * 0.65 * variance)}–$${Math.round(baseMid * 1.3 * variance)} range. Local markets may see lower prices; shipping to metro areas could yield 15-20% more. Seasonal demand trending upward.`,
    valueDrivers: ["Functional utility", "Growing resale market interest", "Seasonal demand trending up", "Aesthetic appeal"],
    listingTitle: `${name} - Great Value - ${category} Collection`,
    listingDescription: `A well-maintained ${name.toLowerCase()} showing graceful character. Perfect for someone who appreciates quality ${category.toLowerCase()} pieces. Well-packaged shipping available nationwide. Trending category with increasing buyer interest.`,
    keywords: [category.toLowerCase(), "great value", "well-maintained", name.split(" ")[0]?.toLowerCase() || "item", "nationwide shipping", "trending"],
    platforms: ["Facebook Marketplace", "eBay", "OfferUp", "Mercari"],
    antiqueMarkers: [],
    isAntique: false,
    photoScore: 6,
    photoTips: ["Improve background — use a clean, uncluttered surface", "Add a photo showing the item in context/use"],
  };

  if (botType === "shipping") {
    base.shippingNotes = ["Priority shipping gives best speed/cost ratio", "Track all packages — reliability scores matter", "Peak season (Nov-Dec) adds 15-20% to shipping costs"];
    base.packagingTips = ["Standard corrugated box is sufficient", "Weight-based pricing favors lighter packaging", "Regional carriers may offer better rates"];
  } else if (botType === "style") {
    base.styleNotes = ["eBay listings perform best with white backgrounds", "Facebook Marketplace prefers lifestyle shots", "Resolution matters — minimum 1200px on longest side"];
  } else if (botType === "vehicle") {
    base.vehicleNotes = ["Market data shows peak selling season is March-June", "Online auctions trending for specialty vehicles", "Mileage documentation is the #1 buyer question"];
  } else if (botType === "buyer") {
    base.buyerNotes = ["Data-driven buyer matching across 5 platforms using engagement signals", "Category search volume up 22% this month — high buyer intent", "Geo-targeting suggests 3 buyers within shipping range with purchase history"];
    base.buyerLeads = [
      { name: "TreasureHunt_ME", platform: "eBay", interest: `Saved 6 similar ${category.toLowerCase()} searches, bid on 3 this month`, matchScore: 88, distance: "Bangor, ME", lastActive: "4 hours ago" },
      { name: "NewEnglandPicks", platform: "Mercari", interest: "Purchased 4 similar items in 60 days, avg spend $" + Math.round(baseMid * 1.1), matchScore: 81, distance: "Hartford, CT", lastActive: "8 hours ago" },
      { name: "FlipKing207", platform: "OfferUp", interest: `Messaged 2 sellers about ${category.toLowerCase()} this week`, matchScore: 74, distance: "65 miles", lastActive: "1 day ago" },
    ];
  } else if (botType === "antique") {
    base.isAntique = true;
    base.antiqueMarkers = ["Category trending upward in collector market", "Similar items seeing 20% appreciation annually", "Regional demand higher in Northeast US"];
    base.antiqueNotes = ["Online auction platforms expanding this category", "Social media marketing effective for unique pieces", "Price may increase 15-25% within 12 months"];
    base.priceLow = Math.round(base.priceLow * 1.1);
    base.priceMid = Math.round(base.priceMid * 1.15);
    base.priceHigh = Math.round(base.priceHigh * 1.25);
  }

  return base;
}

// ─── Utility functions ────────────────────────────────────────────────────

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function dedupeStrings(arrays: string[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const arr of arrays) {
    for (const s of arr) {
      const key = s.toLowerCase();
      if (!seen.has(key)) { seen.add(key); result.push(s); }
    }
  }
  return result;
}

function buildMasterSummary(agents: AgentResult[], botType: BotType): MasterSummary {
  const active = agents.filter((a) => a.status === "complete" && a.data);
  const results = active.map((a) => a.data!);

  if (results.length === 0) {
    return {
      consensusResult: {
        identification: "No agent data available",
        category: "Unknown", condition: "Unknown", conditionScore: 0,
        priceLow: 0, priceMid: 0, priceHigh: 0,
        listingTitle: "", listingDescription: "", keywords: [], platforms: [],
        isAntique: false, antiqueMarkers: [], photoScore: 0, photoTips: [],
      },
      averageConfidence: 0,
      agreeLevel: "divergent",
      mergedInsights: ["No agents returned results"],
      recommendation: "Try running the analysis again.",
      whatToDoNext: ["Re-run the analysis with fresh data"],
      valueDrivers: [],
    };
  }

  const priceLow = median(results.map((r) => r.priceLow));
  const priceMid = median(results.map((r) => r.priceMid));
  const priceHigh = median(results.map((r) => r.priceHigh));
  const averageConfidence = Math.round(active.reduce((s, a) => s + a.confidence, 0) / active.length * 100) / 100;

  // Agree level based on mid price spread
  const mids = results.map((r) => r.priceMid);
  const maxMid = Math.max(...mids);
  const minMid = Math.min(...mids);
  const spread = maxMid > 0 ? (maxMid - minMid) / maxMid : 0;
  const agreeLevel: "strong" | "mixed" | "divergent" = spread <= 0.15 ? "strong" : spread <= 0.30 ? "mixed" : "divergent";

  // Pick longest identification (most detailed)
  const identification = [...results].sort((a, b) => b.identification.length - a.identification.length)[0].identification;

  const valueDrivers = dedupeStrings(results.map((r) => r.valueDrivers));
  const keywords = dedupeStrings(results.map((r) => r.keywords));
  const platforms = dedupeStrings(results.map((r) => r.platforms));
  const antiqueMarkers = dedupeStrings(results.map((r) => r.antiqueMarkers));
  const photoTips = dedupeStrings(results.map((r) => r.photoTips));

  const conditionScore = Math.round(results.reduce((s, r) => s + r.conditionScore, 0) / results.length);
  const condition = conditionScore >= 8 ? "Excellent" : conditionScore >= 6 ? "Good" : conditionScore >= 4 ? "Fair" : "Poor";

  // Merge unique insights from all agents (key insights + rationale highlights)
  const mergedInsights = dedupeStrings([
    active.map((a) => a.keyInsight),
    results.map((r) => r.valueDrivers[0] || "").filter(Boolean),
  ]);

  // Build recommendation based on bot type
  let recommendation: string;
  let whatToDoNext: string[];

  if (botType === "pricing") {
    recommendation = priceMid >= 100
      ? `Strong resale value confirmed by ${active.length} agents. List on eBay and Facebook Marketplace with detailed photos for best results.`
      : priceMid >= 25
      ? `Moderate resale value. ${active.length} agents suggest local sale for best return. Consider Facebook Marketplace or bundling.`
      : `Low value item. ${active.length} agents agree this may not justify shipping costs. Consider donating or including in a bundle.`;
    whatToDoNext = [
      "Take 4+ high-quality photos from multiple angles",
      priceMid >= 50 ? "List on eBay with a 7-day auction starting at the low estimate" : "List on Facebook Marketplace for local pickup",
      "Set a price at the mid-point of the consensus range",
      "Respond to inquiries within 2 hours for best conversion",
      priceMid >= 100 ? "Consider Etsy or specialty platforms for maximum value" : "Bundle with similar items to increase total sale value",
    ];
  } else if (botType === "listing") {
    recommendation = `${active.length} agents drafted independent listings. The Master Summary combines the best title, most engaging description, and most relevant keywords from all agents.`;
    whatToDoNext = [
      "Review and customize the merged listing title",
      "Copy the description and adjust any details specific to your item",
      "Use all combined keywords when listing on each platform",
      "List on the top 2-3 recommended platforms for maximum exposure",
      "Add all your best photos — listings with 4+ images sell 2x faster",
    ];
  } else if (botType === "shipping") {
    recommendation = `${active.length} agents analyzed shipping options. Each identified different optimization strategies — from cost savings to speed to item protection.`;
    whatToDoNext = [
      "Choose the shipping option that best fits your priority (cost vs speed)",
      "Follow the merged packaging tips to prevent damage",
      "Insure the package for the item's estimated value",
      "Print the shipping label before packaging to ensure correct dimensions",
      "Track the shipment and notify the buyer with tracking info",
    ];
  } else if (botType === "antique") {
    recommendation = `${active.length} agents confirm antique indicators. Professional authentication could significantly increase the value. Consider a specialty auction house for the best return.`;
    whatToDoNext = [
      "Seek professional appraisal from a certified appraiser",
      "Document all provenance information you have",
      "Contact auction houses specializing in this category",
      "Do NOT clean or restore without expert guidance — it can reduce value",
      "Consider insurance for the appraised value",
    ];
  } else if (botType === "vehicle") {
    recommendation = `Vehicle analysis from ${active.length} agents. Pricing reflects current market conditions, mileage, and condition. A pre-sale inspection and detail will maximize your return.`;
    whatToDoNext = [
      "Run a CARFAX or AutoCheck report",
      "Get a pre-sale mechanical inspection",
      "Professional detail — interior and exterior",
      "Photograph in clean, well-lit environment with 20+ images",
      "List on Facebook Marketplace, AutoTrader, and Cars.com simultaneously",
    ];
  } else if (botType === "buyer") {
    const allLeads = results.flatMap((r) => r.buyerLeads ?? []);
    const uniqueLeads = allLeads.filter((l, i, arr) => arr.findIndex((x) => x.name === l.name) === i);
    const topLeadCount = uniqueLeads.filter((l) => l.matchScore >= 75).length;
    recommendation = `${active.length} agents scanned buyer networks and found ${uniqueLeads.length} potential buyers (${topLeadCount} high-match). Cross-platform analysis reveals active demand for this item category.`;
    whatToDoNext = [
      `Reach out to the top ${Math.min(topLeadCount, 3)} high-match buyers first`,
      "Send personalized messages mentioning their specific interest signals",
      "Respond to inquiries within 1 hour for 3x higher conversion",
      "Offer a small discount (5-10%) for buyers who commit within 48 hours",
      "Cross-list on all platforms where matched buyers are active",
    ];
  } else {
    // analyze (default)
    recommendation = `${active.length} agents independently analyzed this item. The consensus provides a trustworthy identification and valuation you can act on.`;
    whatToDoNext = [
      "Review the consensus identification to confirm accuracy",
      `List at the mid-point: $${priceMid}`,
      "Use the merged listing title and description for your posting",
      "Follow the photo tips to improve your listing appeal",
      priceMid >= 100 ? "Consider a specialty platform for maximum value" : "Post on Facebook Marketplace for quick local sale",
    ];
  }

  // Pick best listing from highest-confidence agent
  const bestAgent = [...results].sort((a, b) => {
    const confA = active.find((ag) => ag.data === a)?.confidence ?? 0;
    const confB = active.find((ag) => ag.data === b)?.confidence ?? 0;
    return confB - confA;
  })[0];

  return {
    consensusResult: {
      identification,
      category: bestAgent.category,
      condition,
      conditionScore,
      priceLow, priceMid, priceHigh,
      listingTitle: bestAgent.listingTitle,
      listingDescription: bestAgent.listingDescription,
      keywords, platforms,
      isAntique: results.some((r) => r.isAntique),
      antiqueMarkers,
      photoScore: Math.round(results.reduce((s, r) => s + r.photoScore, 0) / results.length),
      photoTips,
    },
    averageConfidence,
    agreeLevel,
    mergedInsights,
    recommendation,
    whatToDoNext,
    valueDrivers,
  };
}

// ─── Standard Mode: Single OpenAI agent ─────────────────────────────────

export function runStandardAnalysis(
  itemId: string,
  botType: BotType,
  itemData: { name: string; category: string; priceMid: number },
): AgentResult {
  const startedAt = Date.now();
  const { name, category, priceMid } = itemData;
  const baseMid = priceMid > 0 ? priceMid : 55;
  const data = generateOpenAIData(name, category, baseMid, botType);

  return {
    agentName: "OpenAI Agent",
    agentIcon: "🟢",
    status: "complete",
    startedAt,
    completedAt: startedAt + 1200,
    durationMs: 1200,
    confidence: 0.78,
    keyInsight: data!.valueDrivers[0] || "Analysis complete",
    data,
  };
}

// ─── Mega Mode: 3 active agents + Azure placeholder ─────────────────────

export function runMegaAnalysis(
  itemId: string,
  botType: BotType,
  itemData: { name: string; category: string; priceMid: number },
): MultiAgentRun {
  const startedAt = Date.now();
  const runId = `mega_${itemId.slice(0, 8)}_${startedAt}`;
  const { name, category, priceMid } = itemData;
  const baseMid = priceMid > 0 ? priceMid : 55;

  const openaiData = generateOpenAIData(name, category, baseMid, botType);
  const claudeData = generateClaudeData(name, category, baseMid, botType);
  const geminiData = generateGeminiData(name, category, baseMid, botType);

  const agents: AgentResult[] = [
    {
      agentName: "OpenAI Agent",
      agentIcon: "🟢",
      status: "complete",
      startedAt,
      completedAt: startedAt + 1200,
      durationMs: 1200,
      confidence: 0.78,
      keyInsight: openaiData!.rationale.split(".")[0] + ".",
      data: openaiData,
    },
    {
      agentName: "Claude Agent",
      agentIcon: "🟣",
      status: "complete",
      startedAt,
      completedAt: startedAt + 1500,
      durationMs: 1500,
      confidence: 0.82,
      keyInsight: claudeData!.rationale.split(".")[0] + ".",
      data: claudeData,
    },
    {
      agentName: "Gemini Agent",
      agentIcon: "🔵",
      status: "complete",
      startedAt,
      completedAt: startedAt + 2500,
      durationMs: 2500,
      confidence: 0.74,
      keyInsight: geminiData!.rationale.split(".")[0] + ".",
      data: geminiData,
    },
    {
      agentName: "Azure Agent",
      agentIcon: "⚪",
      status: "placeholder",
      startedAt: 0,
      completedAt: 0,
      durationMs: 0,
      confidence: 0,
      keyInsight: "",
      data: null,
      error: "Azure Agent coming soon — connect your Azure API key to activate",
    },
  ];

  const masterSummary = buildMasterSummary(agents, botType);

  return {
    runId,
    itemId,
    botType,
    agents,
    masterSummary,
    startedAt,
    completedAt: Date.now(),
    status: "complete",
  };
}
