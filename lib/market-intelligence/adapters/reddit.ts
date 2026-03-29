import { runApifyTask } from "./apify-client";

export interface RedditResult {
  success: boolean;
  wtbPosts: { subreddit: string; title: string; body: string; upvotes: number; url: string; date: string }[];
  discussionPosts: { subreddit: string; title: string; upvotes: number; commentCount: number; url: string }[];
}

export async function scrapeReddit(query: string, category?: string): Promise<RedditResult> {
  const taskId = process.env.APIFY_TASK_REDDIT;
  if (!taskId) return { success: false, wtbPosts: [], discussionPosts: [] };

  try {
    const searches = [
      `${query} WTB`,
      `${query} for sale`,
      `${category || query} value price`,
    ];

    const result = await runApifyTask(taskId, {
      searches,
      maxItems: 20,
      sort: "relevance",
    }, 30000);

    if (!result.success) return { success: false, wtbPosts: [], discussionPosts: [] };

    const wtbPosts = result.items
      .filter((p: any) => /wtb|want to buy|looking for|iso|in search of/i.test(p.title || p.body || ""))
      .map((p: any) => ({
        subreddit: p.subreddit || p.communityName || "",
        title: p.title || "",
        body: (p.body || p.selftext || "").slice(0, 300),
        upvotes: p.upvotes || p.score || 0,
        url: p.url || "",
        date: p.date || p.createdAt || "",
      }))
      .slice(0, 8);

    const discussionPosts = result.items
      .filter((p: any) => !/wtb|want to buy/i.test(p.title || ""))
      .map((p: any) => ({
        subreddit: p.subreddit || p.communityName || "",
        title: p.title || "",
        upvotes: p.upvotes || p.score || 0,
        commentCount: p.numComments || p.comments || 0,
        url: p.url || "",
      }))
      .slice(0, 8);

    console.log(`[market-intel] Reddit: ${wtbPosts.length} WTB posts, ${discussionPosts.length} discussions for "${query.slice(0, 40)}"`);
    return { success: true, wtbPosts, discussionPosts };
  } catch (e: any) {
    console.warn("[market-intel] Reddit failed:", e.message);
    return { success: false, wtbPosts: [], discussionPosts: [] };
  }
}
