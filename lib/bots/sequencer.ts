/**
 * Bot auto-sequencer — triggers the next bot in the cascade after one completes.
 * Non-blocking fire-and-forget. Uses internal fetch to POST to bot API routes.
 *
 * IMPORTANT: Disabled by default (AUTO_SEQUENCE_ENABLED=false) to prevent
 * cascade cost explosions with Apify. Each cascaded bot fires its own scrapers
 * independently, so PriceBot → ListBot + BuyerBot + AntiqueBot = 15-20 Apify calls.
 * Enable only when budget allows or when using cached data.
 */

const NEXT_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SequenceContext {
  itemId: string;
  completedBot: string;
  category: string;
  isAntique: boolean;
  isCollectible: boolean;
  isVehicle: boolean;
  cookie: string;
}

/**
 * Trigger the next bot(s) in the sequence after a bot completes.
 * Call with .catch(() => null) — non-blocking, non-fatal.
 *
 * Sequence (when enabled):
 * AnalyzeBot → PriceBot
 * PriceBot → ListBot + BuyerBot (parallel) + category-specific bots
 *
 * Gated by AUTO_SEQUENCE_ENABLED env var (default: "false").
 */
export async function triggerNextBots(ctx: SequenceContext): Promise<void> {
  // ── GATE: Auto-sequencing must be explicitly enabled ──
  if (process.env.AUTO_SEQUENCE_ENABLED !== "true") {
    console.log(`[BotSequencer] Auto-sequence disabled (set AUTO_SEQUENCE_ENABLED=true to enable). ${ctx.completedBot} completed for item ${ctx.itemId}`);
    return;
  }

  const nextBots: string[] = [];

  switch (ctx.completedBot) {
    case "analyze":
      nextBots.push("pricebot");
      break;
    case "pricebot":
      nextBots.push("listbot", "buyerbot");
      if (ctx.isAntique) nextBots.push("antiquebot");
      if (ctx.isCollectible) nextBots.push("collectiblesbot");
      if (ctx.isVehicle) nextBots.push("carbot");
      break;
    default:
      return;
  }

  if (nextBots.length === 0) return;

  console.log(`[BotSequencer] ${ctx.completedBot} completed → triggering: ${nextBots.join(", ")} for item ${ctx.itemId}`);

  const { prisma } = await import("@/lib/db");
  await prisma.eventLog.create({
    data: {
      itemId: ctx.itemId,
      eventType: "BOT_SEQUENCE",
      payload: JSON.stringify({
        trigger: ctx.completedBot,
        next: nextBots,
        category: ctx.category,
        timestamp: new Date().toISOString(),
      }),
    },
  }).catch(() => null);

  await Promise.allSettled(
    nextBots.map(bot =>
      fetch(`${NEXT_URL}/api/bots/${bot}/${ctx.itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: ctx.cookie },
        body: "{}",
      }).then(res => {
        if (res.ok) console.log(`[BotSequencer] ${bot} triggered successfully`);
        else console.warn(`[BotSequencer] ${bot} returned ${res.status}`);
      })
    )
  );
}
