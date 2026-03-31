const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2";

// ── Cost tracking + budget safeguard ──
let apifyCallCount = 0;
let apifyTotalCost = 0;
const APIFY_MAX_CALLS_PER_HOUR = 50;
const callTimestamps: number[] = [];

// Per-actor cost tiers (real estimates, not flat)
const ACTOR_COST_TIERS: Record<string, number> = {
  default: 0.01,
  // Subscription actors (amortized monthly cost)
  APIFY_TASK_AUTOTRADER: 0.05,
  APIFY_TASK_ETSY: 0.10,
  APIFY_TASK_TIKTOK_ADS: 0.10,
  // Expensive AI actors
  APIFY_TASK_AI_VIDEO_ADS: 0.50,
  APIFY_TASK_AI_VOICEOVER: 0.75,
  APIFY_TASK_AI_UGC_VIDEO: 0.50,
};

function getActorCost(taskId: string): number {
  for (const [envKey, cost] of Object.entries(ACTOR_COST_TIERS)) {
    if (envKey !== "default" && process.env[envKey] === taskId) return cost;
  }
  return ACTOR_COST_TIERS.default;
}

function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/** Get current Apify usage stats for this process. */
export function getApifyUsage() {
  return {
    calls: apifyCallCount,
    estimatedCost: Math.round(apifyTotalCost * 100) / 100,
    callsThisHour: callTimestamps.filter((t) => Date.now() - t < 3600000).length,
  };
}

export interface ApifyRunResult {
  success: boolean;
  items: any[];
  runId: string | null;
}

/**
 * Trigger an Apify task and wait for results.
 * Returns { success: false } gracefully when token is missing, task fails, or budget exceeded.
 */
export async function runApifyTask(
  taskId: string,
  inputOverride?: Record<string, any>,
  timeoutMs: number = 30000
): Promise<ApifyRunResult> {
  if (!APIFY_TOKEN) {
    return { success: false, items: [], runId: null };
  }

  // Budget safeguard — prune old timestamps
  const now = Date.now();
  while (callTimestamps.length > 0 && now - callTimestamps[0] > 3600000) {
    callTimestamps.shift();
  }
  const callsThisHour = callTimestamps.length;
  if (callsThisHour >= APIFY_MAX_CALLS_PER_HOUR) {
    console.warn(`[Apify] Budget safeguard: ${callsThisHour} calls this hour (max ${APIFY_MAX_CALLS_PER_HOUR}). Skipping.`);
    return { success: false, items: [], runId: null };
  }

  // Per-actor cost tracking
  const actualCost = getActorCost(taskId);

  // Block expensive actors in demo mode
  if (isDemoMode() && actualCost > 0.10) {
    console.log(`[Apify] Skipping expensive actor in demo mode (est. $${actualCost}/run)`);
    return { success: false, items: [], runId: null };
  }

  apifyCallCount++;
  apifyTotalCost += actualCost;
  callTimestamps.push(now);

  // Session cost warning
  if (apifyTotalCost > 1.0 && apifyCallCount % 10 === 0) {
    console.warn(`[Apify] ⚠️ Session cost: $${apifyTotalCost.toFixed(2)} across ${apifyCallCount} calls`);
  }

  try {
    console.log(`[Apify] Task ${taskId} triggered (call #${apifyCallCount}, ~$${apifyTotalCost.toFixed(2)} est. session total, ${callsThisHour + 1}/hr)`);

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
