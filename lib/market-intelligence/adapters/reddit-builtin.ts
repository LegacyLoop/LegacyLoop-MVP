import { fetchWithRetry } from "../scraper-base";

export interface RedditBuiltinResult {
  success: boolean;
  posts: { subreddit: string; title: string; body: string; score: number; url: string; date: string; isWTB: boolean }[];
  source: string;
}

export async function scrapeRedditBuiltin(query: string): Promise<RedditBuiltinResult> {
  const encoded = encodeURIComponent(query);
  const searches = [
    `https://old.reddit.com/search?q=${encoded}+WTB&sort=new&t=month`,
    `https://old.reddit.com/search?q=${encoded}+for+sale&sort=new&t=month`,
  ];

  const allPosts: RedditBuiltinResult["posts"] = [];

  for (const url of searches) {
    try {
      const html = await fetchWithRetry(url);
      if (!html || html.length < 500) continue;

      // old.reddit.com uses class="thing" with data attributes
      const postPattern = /data-subreddit="([^"]*)"[\s\S]*?class="[^"]*search-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?datetime="([^"]*)"[\s\S]*?data-score="(\d+)"/gi;
      let match;
      while ((match = postPattern.exec(html)) !== null && allPosts.length < 15) {
        const subreddit = match[1]?.trim() || "";
        const title = match[2]?.trim() || "";
        const date = match[3] || "";
        const score = parseInt(match[4]) || 0;

        if (title && title.length > 5) {
          const isWTB = /wtb|want to buy|looking for|iso|in search of/i.test(title);
          allPosts.push({ subreddit, title, body: "", score, url: `https://reddit.com/r/${subreddit}`, date, isWTB });
        }
      }

      // Fallback: simpler pattern matching search-result links
      if (allPosts.length === 0) {
        const simplePat = /data-subreddit="(\w+)"[\s\S]*?<a[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{10,200})<\/a>/gi;
        while ((match = simplePat.exec(html)) !== null && allPosts.length < 15) {
          const subreddit = match[1]?.trim() || "";
          const title = match[2]?.trim() || "";
          if (title) {
            const isWTB = /wtb|want to buy|looking for|iso/i.test(title);
            allPosts.push({ subreddit, title, body: "", score: 0, url: `https://reddit.com/r/${subreddit}`, date: "", isWTB });
          }
        }
      }

      // Last resort: extract any subreddit+title pairs
      if (allPosts.length === 0) {
        const linkPat = /r\/(\w{2,21})[\s\S]{0,200}?<a[^>]*>([^<]{10,150})<\/a>/gi;
        while ((match = linkPat.exec(html)) !== null && allPosts.length < 15) {
          const subreddit = match[1]?.trim() || "";
          const title = match[2]?.trim() || "";
          if (title && !/reddit|search|preferences|login/i.test(title)) {
            const isWTB = /wtb|want to buy|looking for|iso/i.test(title);
            allPosts.push({ subreddit, title, body: "", score: 0, url: `https://reddit.com/r/${subreddit}`, date: "", isWTB });
          }
        }
      }
    } catch { continue; }
  }

  console.log(`[market-intel] Reddit (built-in): ${allPosts.length} posts for "${query.slice(0, 40)}" (${allPosts.filter(p => p.isWTB).length} WTB)`);
  return { success: allPosts.length > 0, posts: allPosts, source: "Reddit (built-in)" };
}
