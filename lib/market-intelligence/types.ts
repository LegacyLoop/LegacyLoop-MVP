export interface MarketComp {
  item: string;
  price: number;
  date: string;
  platform: string;
  condition: string;
  url?: string;
}

export interface MarketIntelligence {
  comps: MarketComp[];
  median: number;
  low: number;
  high: number;
  trend: "Rising" | "Stable" | "Declining" | "Unknown";
  confidence: number;
  sources: string[];
  queriedAt: string;
  compCount: number;
}

export interface ScraperResult {
  success: boolean;
  comps: MarketComp[];
  source: string;
  error?: string;
}

export type CollectibleCategory =
  | "Sports Cards" | "Trading Cards" | "Comics" | "Coins & Currency"
  | "Vinyl Records" | "Watches" | "Sneakers" | "Rare Books"
  | "Jewelry" | "Memorabilia" | "Vintage Toys" | "Minerals"
  | "Video Games" | "Funko" | "General";
