const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2";

export interface ApifyRunResult {
  success: boolean;
  items: any[];
  runId: string | null;
}

/**
 * Trigger an Apify task and wait for results.
 * Returns { success: false } gracefully when token is missing or task fails.
 */
export async function runApifyTask(
  taskId: string,
  inputOverride?: Record<string, any>,
  timeoutMs: number = 30000
): Promise<ApifyRunResult> {
  if (!APIFY_TOKEN) {
    return { success: false, items: [], runId: null };
  }

  try {
    // 1. Trigger the task
    const runRes = await fetch(`${APIFY_BASE}/actor-tasks/${taskId}/runs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${APIFY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: inputOverride ? JSON.stringify(inputOverride) : "{}",
    });

    if (!runRes.ok) {
      console.warn(`[Apify] Task ${taskId} trigger failed: ${runRes.status}`);
      return { success: false, items: [], runId: null };
    }

    const runData = await runRes.json();
    const runId = runData.data?.id;
    if (!runId) return { success: false, items: [], runId: null };

    // 2. Poll for completion (check every 3s)
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));

      const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
        headers: { "Authorization": `Bearer ${APIFY_TOKEN}` },
      });
      const statusData = await statusRes.json();
      const status = statusData.data?.status;

      if (status === "SUCCEEDED") {
        // 3. Fetch dataset items
        const dataRes = await fetch(
          `${APIFY_BASE}/actor-runs/${runId}/dataset/items?format=json&limit=20`,
          { headers: { "Authorization": `Bearer ${APIFY_TOKEN}` } }
        );
        const items = await dataRes.json();
        console.log(`[Apify] Task ${taskId} completed: ${Array.isArray(items) ? items.length : 0} items`);
        return { success: true, items: Array.isArray(items) ? items : [], runId };
      }

      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
        console.warn(`[Apify] Task ${taskId} ended with status: ${status}`);
        return { success: false, items: [], runId };
      }
    }

    console.warn(`[Apify] Task ${taskId} timed out after ${timeoutMs}ms`);
    return { success: false, items: [], runId };
  } catch (e) {
    console.error(`[Apify] Error running task ${taskId}:`, (e as Error).message);
    return { success: false, items: [], runId: null };
  }
}
