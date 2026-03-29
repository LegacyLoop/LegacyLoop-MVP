import { runApifyTask } from "./apify-client";

export interface InstagramResult {
  success: boolean;
  posts: { username: string; caption: string; likes: number; comments: number; url: string; hashtags: string[] }[];
  topHashtags: string[];
  totalEngagement: number;
  demandSignal: "high" | "moderate" | "low" | "none";
}

export async function scrapeInstagram(query: string, category?: string): Promise<InstagramResult> {
  const taskId = process.env.APIFY_TASK_INSTAGRAM;
  const empty: InstagramResult = { success: false, posts: [], topHashtags: [], totalEngagement: 0, demandSignal: "none" };
  if (!taskId) return empty;

  try {
    const searchTerms = [query.replace(/\s+/g, ""), category?.replace(/\s+/g, "") || ""].filter(Boolean);

    const result = await runApifyTask(taskId, {
      searchType: "hashtag",
      search: searchTerms,
      maxItems: 15,
    }, 30000);

    if (!result.success) return empty;

    const posts = result.items
      .map((p: any) => ({
        username: p.ownerUsername || p.username || "",
        caption: (p.caption || p.text || "").slice(0, 200),
        likes: p.likesCount || p.likes || 0,
        comments: p.commentsCount || p.comments || 0,
        url: p.url || (p.shortcode ? `https://instagram.com/p/${p.shortcode}` : ""),
        hashtags: (p.hashtags || []) as string[],
      }))
      .slice(0, 10);

    const totalEngagement = posts.reduce((sum, p) => sum + p.likes + p.comments, 0);
    const allHashtags = posts.flatMap((p) => p.hashtags);
    const topHashtags = [...new Set(allHashtags)].slice(0, 10);

    let demandSignal: InstagramResult["demandSignal"] = "none";
    if (totalEngagement > 50000) demandSignal = "high";
    else if (totalEngagement > 5000) demandSignal = "moderate";
    else if (posts.length > 3) demandSignal = "low";

    console.log(`[market-intel] Instagram: ${posts.length} posts, ${totalEngagement.toLocaleString()} engagement → ${demandSignal} for "${query.slice(0, 40)}"`);
    return { success: true, posts, topHashtags, totalEngagement, demandSignal };
  } catch (e: any) {
    console.warn("[market-intel] Instagram failed:", e.message);
    return empty;
  }
}
