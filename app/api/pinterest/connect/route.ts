// Pinterest connect — status stub (structure only).
// W25-META-L4 · Track A · FIX 3 (P2).
//
// The Pinterest OAuth app credentials (client id/secret) are NOT yet provisioned
// and the token model is unconfirmed, so this route reports configuration status
// only. It does NOT wire a live OAuth redirect (no half-wired live call per §9).
// Full connect flow lives under app/api/pinterest/* and stays disjoint from L3's
// app/connected-accounts. Awaiting CEO Pinterest business token / app paste.

import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";

function isConfigured(): boolean {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  return typeof token === "string" && token.trim().length > 0;
}

export async function GET(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    platform: "pinterest",
    configured: isConfigured(),
    connectFlow: "pending",
    note: isConfigured()
      ? "Pinterest demand intel active."
      : "Pinterest not configured — awaiting CEO business token / OAuth app credentials.",
  });
}

export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // OAuth initiation intentionally not implemented until app credentials exist.
  return NextResponse.json(
    {
      error: "Pinterest OAuth not yet provisioned",
      detail: "Awaiting CEO Pinterest business token / app credentials.",
    },
    { status: 501 },
  );
}
