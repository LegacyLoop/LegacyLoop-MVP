import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { isDemoMode } from "@/lib/constants/pricing";
import { seedAddons } from "@/lib/data/seed-addons";

export async function POST() {
  try {
    const user = await authAdapter.getSession();
    if (!user && !isDemoMode()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const count = await seedAddons();
    return NextResponse.json({ success: true, seeded: count });
  } catch (err: any) {
    console.error("[addons/seed]", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
