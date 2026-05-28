import { prisma } from "@/lib/db";
import type { ProviderName, OperationName } from "./types";

// LAW #38 sustained: writes to app-side ScraperUsageLog · NEVER lib/sylvia/*.
// ScraperUsageLog chosen over EventLog (nullable itemId fits non-item-scoped
// proxy calls). Audit is best-effort: proxy MUST NOT fail on audit error.
export async function recordProxyCall(args: {
  provider: ProviderName | "unknown";
  operation: OperationName;
  request_id: string;
  ok: boolean;
  latency_ms: number;
  error_code?: string;
}): Promise<void> {
  try {
    await prisma.scraperUsageLog.create({
      data: {
        botName: `proxy-${args.provider}`,
        slug: args.operation,
        tier: 0,
        cost: 0,
        success: args.ok,
        blocked: false,
        blockReason: args.error_code ?? null,
        compsReturned: 0,
        durationMs: args.latency_ms,
        payloadJson: JSON.stringify({
          request_id: args.request_id,
          ts: new Date().toISOString(),
        }),
      },
    });
  } catch {
    // intentional: audit best-effort
  }
}
