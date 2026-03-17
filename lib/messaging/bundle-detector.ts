export interface BundleResult {
  bundleDetected: boolean;
  mentionedItems: string[];
  suggestedBundle: {
    items: string[];
    individualTotal: number;
    bundlePrice: number;
    message: string;
  } | null;
}

interface ItemInfo { title: string; price: number; floorPrice?: number }

export function detectBundle(messages: string[], userItems: ItemInfo[]): BundleResult {
  const mentioned: Set<string> = new Set();
  const combined = messages.join(" ").toLowerCase();

  for (const item of userItems) {
    const titleWords = item.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matches = titleWords.filter(w => combined.includes(w));
    if (matches.length >= 2 || combined.includes(item.title.toLowerCase())) {
      mentioned.add(item.title);
    }
  }

  if (mentioned.size < 2) return { bundleDetected: false, mentionedItems: [], suggestedBundle: null };

  const bundleItems = userItems.filter(i => mentioned.has(i.title));
  const total = bundleItems.reduce((s, i) => s + i.price, 0);
  const minFloor = bundleItems.reduce((s, i) => s + (i.floorPrice ?? i.price * 0.7), 0);
  let bundlePrice = Math.round(total * 0.90);
  if (bundlePrice < minFloor) bundlePrice = Math.round(minFloor);

  return {
    bundleDetected: true,
    mentionedItems: Array.from(mentioned),
    suggestedBundle: {
      items: bundleItems.map(i => i.title),
      individualTotal: Math.round(total),
      bundlePrice,
      message: `Great news! I can bundle the ${bundleItems.map(i => i.title).join(" and ")} together for $${bundlePrice} (saving you $${Math.round(total - bundlePrice)}). Want me to set that up?`,
    },
  };
}
