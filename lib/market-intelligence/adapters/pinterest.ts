import { runApifyTask } from "./apify-client";

export interface PinterestResult {
  success: boolean;
  pins: { title: string; saves: number; url: string; boardName: string }[];
  totalSaves: number;
  topBoards: string[];
  demandSignal: "high" | "moderate" | "low" | "none";
}

export async function scrapePinterest(query: string, _category?: string): Promise<PinterestResult> {
  const taskId = process.env.APIFY_TASK_PINTEREST;
  const empty: PinterestResult = { success: false, pins: [], totalSaves: 0, topBoards: [], demandSignal: "none" };
  if (!taskId) return empty;

  try {
    const result = await runApifyTask(taskId, { search: query, maxItems: 15 }, 30000);
    if (!result.success) return empty;

    const pins = result.items.map((p: any) => ({
      title: (p.title || p.name || "").slice(0, 120),
      saves: p.saves || p.repinCount || p.pinCount || 0,
      url: p.url || p.link || "",
      boardName: p.boardName || p.board || "",
    })).filter((p: any) => p.title).slice(0, 15);

    const totalSaves = pins.reduce((s: number, p: any) => s + p.saves, 0);
    const topBoards = [...new Set(pins.map((p: any) => p.boardName).filter(Boolean))].slice(0, 5);

    let demandSignal: PinterestResult["demandSignal"] = "none";
    if (totalSaves > 10000) demandSignal = "high";
    else if (totalSaves > 1000) demandSignal = "moderate";
    else if (totalSaves > 100) demandSignal = "low";

    console.log(`[market-intel] Pinterest: ${pins.length} pins, ${totalSaves.toLocaleString()} saves → ${demandSignal} for "${query.slice(0, 40)}"`);
    return { success: true, pins, totalSaves, topBoards, demandSignal };
  } catch (e: any) {
    console.warn("[market-intel] Pinterest failed:", e.message);
    return empty;
  }
}
