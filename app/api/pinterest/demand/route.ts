// Pinterest demand-intel route — category → demand signal.
// W25-META-L4 · Track A · FREE · ZERO schema · disjoint from L1/L2/L3.
//
// GET /api/pinterest/demand?category=<str>&region=<US|CA|GB|AU|DE|FR>
// Returns a derived Pinterest demand signal, or a clean degrade envelope
// when no PINTEREST_ACCESS_TOKEN is configured (no half-wired live call).

import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { getDemandSignal } from "@/lib/pinterest/client";
import type { PinterestRegion } from "@/lib/pinterest/types";

const VALID_REGIONS: readonly PinterestRegion[] = ["US", "CA", "GB", "AU", "DE", "FR"];

function parseRegion(raw: string | null): PinterestRegion {
  if (raw && (VALID_REGIONS as readonly string[]).includes(raw.toUpperCase())) {
    return raw.toUpperCase() as PinterestRegion;
  }
  return "US";
}

export async function GET(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  if (!category || category.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query param: category" },
      { status: 400 },
    );
  }

  const region = parseRegion(searchParams.get("region"));
  const result = await getDemandSignal(category, region);

  // tokenMissing is an expected, non-error state (build-structure mode).
  const status = result.rateLimited ? 429 : 200;
  return NextResponse.json(result, { status });
}
