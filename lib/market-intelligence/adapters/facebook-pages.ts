import { runApifyTask } from "./apify-client";

export interface FacebookPagesResult {
  success: boolean;
  pages: { name: string; followers: number; category: string; url: string; recentPosts: number }[];
  sellers: { name: string; url: string; followers: number }[];
}

export async function scrapeFacebookPages(query: string, _category?: string): Promise<FacebookPagesResult> {
  const taskId = process.env.APIFY_TASK_FACEBOOK_PAGES;
  const empty: FacebookPagesResult = { success: false, pages: [], sellers: [] };
  if (!taskId) return empty;

  try {
    const result = await runApifyTask(taskId, { search: query, maxItems: 10 }, 30000);
    if (!result.success) return empty;

    const pages = result.items.map((p: any) => ({
      name: (p.name || p.title || "Page").slice(0, 100),
      followers: p.followers || p.likes || p.fanCount || 0,
      category: p.category || p.type || "General",
      url: p.url || "",
      recentPosts: p.recentPostCount || p.postCount || 0,
    })).filter((p: any) => p.name !== "Page").slice(0, 10);

    const sellers = pages.filter((p: any) =>
      /shop|store|sell|dealer|antique|vintage|resale|consignment/i.test(p.name + " " + p.category)
    ).map((p: any) => ({ name: p.name, url: p.url, followers: p.followers }));

    console.log(`[market-intel] FB Pages: ${pages.length} pages, ${sellers.length} sellers for "${query.slice(0, 40)}"`);
    return { success: true, pages, sellers };
  } catch (e: any) {
    console.warn("[market-intel] FB Pages failed:", e.message);
    return empty;
  }
}
