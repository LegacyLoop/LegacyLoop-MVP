const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2";

// ── Budget mode: "conservative" (demo/testing), "normal" (production), "full" (unlimited) ──
export type ApifyBudgetMode = "conservative" | "normal" | "full";
export function getApifyBudgetMode(): ApifyBudgetMode {
  const mode = process.env.APIFY_BUDGET_MODE;
  if (mode === "normal" || mode === "full") return mode;
  return "conservative"; // default = cheapest
}

// ── Cost tracking + budget safeguard ──
let apifyCallCount = 0;
let apifyTotalCost = 0;
const callTimestamps: number[] = [];

// Per-hour limits by budget mode
const BUDGET_MODE_LIMITS: Record<ApifyBudgetMode, number> = {
  conservative: 15,  // ~15 calls/hr max ($5-7)
  normal: 30,        // ~30 calls/hr ($10-15)
  full: 60,          // ~60 calls/hr
};

// Per-item call tracking (prevents one item from hogging the budget)
const itemCallCounts = new Map<string, { count: number; since: number }>();
const ITEM_BUDGET_LIMITS: Record<ApifyBudgetMode, number> = {
  conservative: 5,  // max 5 Apify calls per item per hour
  normal: 12,       // max 12 per item per hour
  full: 30,         // max 30 per item per hour
};

// Per-actor cost tiers (REAL Apify compute estimates — ~$0.25-0.50 per run)
const ACTOR_COST_TIERS: Record<string, number> = {
  default: 0.35,            // realistic avg for a 30s scraper on 1GB RAM
  // Cheap/fast scrapers
  APIFY_TASK_GOOGLE_SHOPPING: 0.20,
  APIFY_TASK_TIKTOK: 0.25,
  APIFY_TASK_PINTEREST: 0.20,
  // Medium scrapers
  APIFY_TASK_FACEBOOK: 0.35,
  APIFY_TASK_EBAY: 0.30,
  APIFY_TASK_AMAZON: 0.35,
  APIFY_TASK_INSTAGRAM: 0.40,
  APIFY_TASK_YOUTUBE: 0.30,
  APIFY_TASK_TWITTER_X: 0.35,
  APIFY_TASK_REDDIT: 0.30,
  APIFY_TASK_FB_GROUPS: 0.40,
  APIFY_TASK_FACEBOOK_PAGES: 0.35,
  // Subscription actors (amortized monthly cost + compute)
  APIFY_TASK_AUTOTRADER: 0.50,
  APIFY_TASK_ETSY: 0.40,
  APIFY_TASK_TIKTOK_ADS: 0.40,
  // Expensive AI actors
  APIFY_TASK_AI_VIDEO_ADS: 1.50,
  APIFY_TASK_AI_VOICEOVER: 2.00,
  APIFY_TASK_AI_UGC_VIDEO: 1.50,
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
  const mode = getApifyBudgetMode();
  return {
    calls: apifyCallCount,
    estimatedCost: Math.round(apifyTotalCost * 100) / 100,
    callsThisHour: callTimestamps.filter((t) => Date.now() - t < 3600000).length,
    budgetMode: mode,
    maxCallsPerHour: BUDGET_MODE_LIMITS[mode],
  };
}

/** Check if an item has exceeded its per-item Apify budget this hour. */
export function isItemBudgetExceeded(itemHint?: string): boolean {
  if (!itemHint) return false;
  const mode = getApifyBudgetMode();
  const limit = ITEM_BUDGET_LIMITS[mode];
  const entry = itemCallCounts.get(itemHint);
  if (!entry) return false;
  if (Date.now() - entry.since > 3600000) return false; // expired
  return entry.count >= limit;
}

/** Track an Apify call for a specific item (for per-item budget). */
export function trackItemCall(itemHint?: string): void {
  if (!itemHint) return;
  const now = Date.now();
  const entry = itemCallCounts.get(itemHint);
  if (!entry || now - entry.since > 3600000) {
    itemCallCounts.set(itemHint, { count: 1, since: now });
  } else {
    entry.count++;
  }
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
  timeoutMs: number = 30000,
  itemHint?: string
): Promise<ApifyRunResult> {
  if (!APIFY_TOKEN) {
    return { success: false, items: [], runId: null };
  }

  const mode = getApifyBudgetMode();
  const maxCallsPerHour = BUDGET_MODE_LIMITS[mode];

  // Budget safeguard — prune old timestamps
  const now = Date.now();
  while (callTimestamps.length > 0 && now - callTimestamps[0] > 3600000) {
    callTimestamps.shift();
  }
  const callsThisHour = callTimestamps.length;
  if (callsThisHour >= maxCallsPerHour) {
    console.warn(`[Apify] Budget safeguard: ${callsThisHour} calls this hour (max ${maxCallsPerHour} in ${mode} mode). Skipping.`);
    return { success: false, items: [], runId: null };
  }

  // Per-item budget check
  if (itemHint && isItemBudgetExceeded(itemHint)) {
    console.warn(`[Apify] Per-item budget exceeded for "${itemHint}" in ${mode} mode. Skipping.`);
    return { success: false, items: [], runId: null };
  }

  // Per-actor cost tracking
  const actualCost = getActorCost(taskId);

  // Block expensive actors in demo/conservative mode
  const costThreshold = mode === "conservative" ? 0.50 : mode === "normal" ? 1.00 : 5.00;
  if (isDemoMode() && actualCost > costThreshold) {
    console.log(`[Apify] Skipping expensive actor in ${mode} mode (est. $${actualCost}/run, threshold $${costThreshold})`);
    return { success: false, items: [], runId: null };
  }

  apifyCallCount++;
  apifyTotalCost += actualCost;
  callTimestamps.push(now);
  trackItemCall(itemHint);

  // Session cost warning (more aggressive in conservative mode)
  const warnThreshold = mode === "conservative" ? 0.50 : 1.00;
  if (apifyTotalCost > warnThreshold && apifyCallCount % 5 === 0) {
    console.warn(`[Apify] ⚠️ Session cost: $${apifyTotalCost.toFixed(2)} across ${apifyCallCount} calls (${mode} mode, ${callsThisHour + 1}/${maxCallsPerHour}/hr)`);
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
