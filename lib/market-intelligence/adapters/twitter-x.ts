import { runApifyTask } from "./apify-client";

export interface TwitterResult {
  success: boolean;
  tweets: { text: string; likes: number; retweets: number; username: string; url: string }[];
  totalEngagement: number;
  wtbTweets: { text: string; username: string; url: string }[];
  demandSignal: "high" | "moderate" | "low" | "none";
}

export async function scrapeTwitter(query: string, _category?: string): Promise<TwitterResult> {
  const taskId = process.env.APIFY_TASK_TWITTER_X;
  const empty: TwitterResult = { success: false, tweets: [], totalEngagement: 0, wtbTweets: [], demandSignal: "none" };
  if (!taskId) return empty;

  try {
    console.log("[Twitter/X] Apify scraper called — $40/1K results, use sparingly");

    const result = await runApifyTask(taskId, {
      searchTerms: [`${query} for sale`, `${query} WTB`],
      maxItems: 10,
    }, 30000);
    if (!result.success) return empty;

    const tweets = result.items.map((t: any) => ({
      text: (t.text || t.fullText || t.content || "").slice(0, 200),
      likes: t.likeCount || t.likes || t.favoriteCount || 0,
      retweets: t.retweetCount || t.retweets || 0,
      username: t.username || t.user?.username || t.author || "",
      url: t.url || (t.id ? `https://x.com/i/status/${t.id}` : ""),
    })).slice(0, 10);

    const totalEngagement = tweets.reduce((s: number, t: any) => s + t.likes + t.retweets, 0);
    const wtbTweets = tweets.filter((t: any) => /wtb|want to buy|looking for|iso|in search of/i.test(t.text)).map((t: any) => ({
      text: t.text, username: t.username, url: t.url,
    }));

    let demandSignal: TwitterResult["demandSignal"] = "none";
    if (totalEngagement > 50000) demandSignal = "high";
    else if (totalEngagement > 5000) demandSignal = "moderate";
    else if (totalEngagement > 500) demandSignal = "low";

    console.log(`[market-intel] Twitter/X: ${tweets.length} tweets, ${totalEngagement.toLocaleString()} engagement, ${wtbTweets.length} WTB → ${demandSignal} for "${query.slice(0, 40)}"`);
    return { success: true, tweets, totalEngagement, wtbTweets, demandSignal };
  } catch (e: any) {
    console.warn("[market-intel] Twitter/X failed:", e.message);
    return empty;
  }
}
