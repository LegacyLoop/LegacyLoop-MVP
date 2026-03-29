import { runApifyTask } from "./apify-client";

export interface FBGroupResult {
  success: boolean;
  groups: { name: string; memberCount: number; url: string; recentPosts: number; category: string }[];
  relevantPosts: { groupName: string; text: string; engagement: number; date: string }[];
}

export async function scrapeFacebookGroups(query: string, category?: string): Promise<FBGroupResult> {
  const taskId = process.env.APIFY_TASK_FB_GROUPS;
  if (!taskId) return { success: false, groups: [], relevantPosts: [] };

  try {
    const result = await runApifyTask(taskId, {
      searchQueries: [`${query} buy sell`, `${category || query} marketplace`, `${query} collectors`],
      maxItems: 20,
    }, 45000);

    if (!result.success) return { success: false, groups: [], relevantPosts: [] };

    const groups = result.items
      .filter((i: any) => i.type === "group" || i.memberCount)
      .map((g: any) => ({
        name: g.name || g.groupName || "Group",
        memberCount: g.memberCount || g.members || 0,
        url: g.url || "",
        recentPosts: g.recentPostCount || g.postCount || 0,
        category: category || "general",
      }))
      .slice(0, 10);

    const relevantPosts = result.items
      .filter((i: any) => i.text || i.message)
      .map((p: any) => ({
        groupName: p.groupName || p.source || "Group",
        text: (p.text || p.message || "").slice(0, 200),
        engagement: (p.likes || 0) + (p.comments || 0) + (p.shares || 0),
        date: p.date || p.createdAt || "",
      }))
      .slice(0, 10);

    console.log(`[market-intel] FB Groups: ${groups.length} groups, ${relevantPosts.length} posts for "${query.slice(0, 40)}"`);
    return { success: true, groups, relevantPosts };
  } catch (e: any) {
    console.warn("[market-intel] FB Groups failed:", e.message);
    return { success: false, groups: [], relevantPosts: [] };
  }
}
